import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { getOfficialSuburbs } from "@/lib/ingest/seed";

const client = new Anthropic();

// Built per-call from the region's actual Area rows rather than a hardcoded
// "Durbanville-area" string, so the relevance gate stays accurate as
// suburbs get added (or a second region gets built) — see seed.ts's
// geographic-model comment. Falls back to the region name alone if no
// suburbs are seeded yet (shouldn't happen post-ensureSeed, but classify
// is called independently of the seed step).
function buildClassifyTool(areaPhrase: string): Anthropic.Tool {
  return {
    name: "classify_signal",
    description: `First judge whether a signal is actually about a local need specifically in ${areaPhrase} — if not, mark it irrelevant and stop there. Otherwise classify it against the region's existing themes (attach or propose new) and judge whether it's demand or supply.`,
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["attach", "new", "irrelevant"],
          description: `'irrelevant' = general news, national/international politics, or anything not specifically about ${areaPhrase} — e.g. an article about immigration law, climate policy, or a crime/news story set in some other Cape Town suburb not listed above. Sharing a broad topic that residents of ${areaPhrase} might also happen to care about (crime, cost of living, load-shedding, etc.) is NOT enough on its own — the signal must actually be about this specific local market: it names one of the suburbs listed above, or is otherwise unambiguously specific to this area, not just Cape Town or South Africa in general. This distinction matters most for the broad RSS news sources, which pull an entire regional feed with no geographic filtering upstream — don't let topical relevance substitute for geographic relevance. Use 'irrelevant' whenever a signal doesn't represent someone specifically in ${areaPhrase} needing, wanting, or struggling to find something. Otherwise 'attach' to a matching existing theme or propose a 'new' one.`,
        },
        theme_id: {
          type: "string",
          description: "Required when action is 'attach' — the id of the matching existing theme.",
        },
        label: {
          type: "string",
          description: "Required when action is 'new' — a short (3-8 word) label for the theme.",
        },
        description: {
          type: "string",
          description: "Required when action is 'new' — one sentence describing the underlying need.",
        },
        category: {
          type: "string",
          description: "Required when action is 'new' — a short category tag, e.g. 'home services', 'food', 'transport'.",
        },
        signal_type: {
          type: "string",
          enum: ["demand", "supply", "unclear"],
          description:
            "Required when action is 'attach' or 'new' (omit when action is 'irrelevant'). 'demand' = someone asking a question, complaining, or looking for something (a real need). 'supply' = a business/listing/ad describing what it offers — including SEO landing-page copy phrased as a question ('Are you looking for a reliable plumber?') to target search queries; that is still supply, not demand, regardless of phrasing. 'unclear' if genuinely ambiguous — don't guess.",
        },
      },
      required: ["action"],
    },
  };
}

// Builds the phrase used in the classifier's relevance-gate prompt from the
// region's actual official suburbs, e.g. "the Durbanville local market area
// (Durbanville, Durbanville Hills, Sonstraal Heights, Eversdal, Stellenberg,
// Stellenridge, Stellenryk — Cape Town, South Africa)" — never a hardcoded
// "Durbanville-area" string, so this stays correct as suburbs are added.
async function buildAreaPhrase(regionId: string): Promise<string> {
  const region = await prisma.region.findUnique({ where: { id: regionId } });
  const suburbs = await getOfficialSuburbs(regionId);
  const place = region?.name.split(",")[0] ?? "the region";
  if (suburbs.length === 0) return `${region?.name ?? place} (Cape Town, South Africa)`;
  const suburbList = suburbs.map((s) => s.name).join(", ");
  return `the ${place} local market area (${suburbList} — Cape Town, South Africa)`;
}

// Classify a new signal against the region's existing theme pool — attach it
// to a matching theme, or create a new one. Themes persist and accumulate
// across periods and sources; this is what makes trend-finding possible
// (see EYESPY.md's Processing section).
export type ClassifyResult = {
  themeId: string | null;
  signalType: "demand" | "supply" | "unclear" | "irrelevant";
};

export async function classifySignal(
  regionId: string,
  rawText: string
): Promise<ClassifyResult> {
  // No recency cap here (was `take: 100`, found 2026-08-03 as the cause of
  // runaway theme fragmentation) — with hundreds of themes now existing,
  // capping to the 100 most-recently-seen made older themes invisible to
  // new classification calls, so instead of attaching to an existing
  // theme, Claude kept creating duplicates. EYESPY.md's explicit design is
  // "Claude's theme classification... is enough at this scale, no ML
  // clustering pipeline" — that only holds if it can actually see every
  // theme. A high ceiling (not fully unbounded) guards against a truly
  // pathological case without reintroducing the bug at realistic scale.
  const existingThemes = await prisma.theme.findMany({
    where: { regionId, status: "active" },
    select: { id: true, label: true, description: true, category: true },
    orderBy: { lastSeenAt: "desc" },
    take: 2000,
  });

  const themeList =
    existingThemes.length === 0
      ? "(no existing themes yet — this will be the first)"
      : existingThemes
          .map((t) => `- ${t.id}: ${t.label} (${t.category ?? "uncategorized"}) — ${t.description ?? ""}`)
          .join("\n");

  const areaPhrase = await buildAreaPhrase(regionId);

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    tools: [buildClassifyTool(areaPhrase)],
    tool_choice: { type: "tool", name: "classify_signal" },
    messages: [
      {
        role: "user",
        content: `Signal text:\n"""${rawText}"""\n\nExisting themes for this region:\n${themeList}\n\nFirst judge relevance per the tool's instructions — if this isn't about a genuine local need in ${areaPhrase}, use action "irrelevant" and stop there. Otherwise: does it match one of the existing themes? If yes, attach it (action "attach", theme_id set). If it's genuinely new, propose a new theme (action "new", with label/description/category). Also judge signal_type when attaching or creating.`,
      },
    ],
  });

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
  );
  if (!toolUse) throw new Error("classifySignal: model did not return a tool call");

  const input = toolUse.input as {
    action: "attach" | "new" | "irrelevant";
    theme_id?: string;
    label?: string;
    description?: string;
    category?: string;
    signal_type?: "demand" | "supply" | "unclear";
  };

  if (input.action === "irrelevant") {
    return { themeId: null, signalType: "irrelevant" };
  }

  const signalType = input.signal_type ?? "unclear";

  if (input.action === "attach" && input.theme_id) {
    const matched = existingThemes.find((t) => t.id === input.theme_id);
    if (matched) {
      await prisma.theme.update({
        where: { id: matched.id },
        data: { lastSeenAt: new Date() },
      });
      return { themeId: matched.id, signalType };
    }
    // Model hallucinated a theme_id — fall through to creating a new theme
    // rather than silently dropping the signal.
  }

  const created = await prisma.theme.create({
    data: {
      regionId,
      label: input.label || "Uncategorized signal",
      description: input.description,
      category: input.category,
    },
  });
  return { themeId: created.id, signalType };
}
