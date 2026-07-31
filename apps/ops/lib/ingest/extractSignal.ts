import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const EXTRACT_TOOL: Anthropic.Tool = {
  name: "extract_signal",
  description:
    "Extract the underlying need, complaint, question, or request from a screenshot of a social media post, with no identifying details about the poster.",
  input_schema: {
    type: "object",
    properties: {
      signal_text: {
        type: "string",
        description:
          "The underlying need/complaint/question in plain text, de-identified — no names, usernames, profile photos, or other identifying details about who posted it. Just the substance, e.g. 'someone in Durbanville can't find a reliable electrician'.",
      },
      category: {
        type: "string",
        description: "A short category tag, e.g. 'home services', 'food', 'transport'.",
      },
      relevant: {
        type: "boolean",
        description:
          "False if the screenshot doesn't actually contain a complaint, question, recommendation request, or attempt to buy/find something — e.g. it's just chit-chat or an ad.",
      },
    },
    required: ["signal_text", "relevant"],
  },
};

export type ExtractedSignal = {
  signalText: string;
  category: string | null;
  relevant: boolean;
};

// Vision extraction for the weekly manual-capture workflow (EYESPY.md).
// Runs on Opus rather than Haiku — de-identification quality matters here
// for POPIA-minded handling of what's ultimately other people's social posts.
export async function extractSignalFromScreenshot(
  imageBase64: string,
  mediaType: "image/png" | "image/jpeg" | "image/webp"
): Promise<ExtractedSignal> {
  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 512,
    tools: [EXTRACT_TOOL],
    tool_choice: { type: "tool", name: "extract_signal" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 },
          },
          {
            type: "text",
            text: "This is a screenshot from a Facebook group. Extract the underlying signal per the tool's instructions. Do not carry through the poster's name, profile photo, or other identifying details — only the substance of what they're asking, complaining about, or looking for.",
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
  );
  if (!toolUse) throw new Error("extractSignalFromScreenshot: model did not return a tool call");

  const input = toolUse.input as {
    signal_text: string;
    category?: string;
    relevant: boolean;
  };

  return {
    signalText: input.signal_text,
    category: input.category ?? null,
    relevant: input.relevant,
  };
}
