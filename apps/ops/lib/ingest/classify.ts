import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const client = new Anthropic();

const CLASSIFY_TOOL: Anthropic.Tool = {
  name: "classify_signal",
  description:
    "Classify a demand/pain-point signal against the region's existing themes, and judge whether it's demand or supply. Either attach it to a matching existing theme, or propose a new theme.",
  input_schema: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["attach", "new"] },
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
          "Always required. 'demand' = someone asking a question, complaining, or looking for something (a real need). 'supply' = a business/listing/ad describing what it offers — including SEO landing-page copy phrased as a question ('Are you looking for a reliable plumber?') to target search queries; that is still supply, not demand, regardless of phrasing. 'unclear' if genuinely ambiguous — don't guess.",
      },
    },
    required: ["action", "signal_type"],
  },
};

// Classify a new signal against the region's existing theme pool — attach it
// to a matching theme, or create a new one. Themes persist and accumulate
// across periods and sources; this is what makes trend-finding possible
// (see EYESPY.md's Processing section).
export type ClassifyResult = {
  themeId: string;
  signalType: "demand" | "supply" | "unclear";
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

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    tools: [CLASSIFY_TOOL],
    tool_choice: { type: "tool", name: "classify_signal" },
    messages: [
      {
        role: "user",
        content: `Signal text:\n"""${rawText}"""\n\nExisting themes for this region:\n${themeList}\n\nDoes this signal match one of the existing themes? If yes, attach it (action "attach", theme_id set). If it's genuinely new, propose a new theme (action "new", with label/description/category). Also judge signal_type per the tool's instructions — this is required every time.`,
      },
    ],
  });

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
  );
  if (!toolUse) throw new Error("classifySignal: model did not return a tool call");

  const input = toolUse.input as {
    action: "attach" | "new";
    theme_id?: string;
    label?: string;
    description?: string;
    category?: string;
    signal_type: "demand" | "supply" | "unclear";
  };
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
