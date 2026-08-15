import Anthropic from "@anthropic-ai/sdk";
import { messageForAnthropicError } from "./anthropic-errors";

const MODEL = "claude-opus-5";

export const CONTENT_SYSTEM_PROMPT = `You are a multi-platform content strategist and scriptwriter for a founder building in public. Given a topic and optional research notes, produce a genuinely platform-native draft for each of five platforms — do not repeat the same text five times. YouTube gets a short attention-grabbing hook (1-2 sentences) plus a beat-by-beat outline for a video. Instagram gets a caption written for the feed, hook-first, with natural line breaks. Facebook gets a post suited to a slower, more conversational feed. X gets a single punchy post under 280 characters. TikTok gets a short beat-by-beat script for a 30-60 second video, written for speaking out loud. Keep the founder's voice direct and specific — no generic marketing language, no filler hashtag blocks.`;

export type ContentDrafts = {
  youtube: { hook: string; outline: string };
  instagram: { caption: string };
  facebook: { post: string };
  x: { post: string };
  tiktok: { script: string };
};

export class ContentDraftError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContentDraftError";
  }
}

const DRAFTS_SCHEMA = {
  type: "object",
  properties: {
    youtube: {
      type: "object",
      properties: {
        hook: { type: "string" },
        outline: { type: "string" },
      },
      required: ["hook", "outline"],
      additionalProperties: false,
    },
    instagram: {
      type: "object",
      properties: { caption: { type: "string" } },
      required: ["caption"],
      additionalProperties: false,
    },
    facebook: {
      type: "object",
      properties: { post: { type: "string" } },
      required: ["post"],
      additionalProperties: false,
    },
    x: {
      type: "object",
      properties: { post: { type: "string" } },
      required: ["post"],
      additionalProperties: false,
    },
    tiktok: {
      type: "object",
      properties: { script: { type: "string" } },
      required: ["script"],
      additionalProperties: false,
    },
  },
  required: ["youtube", "instagram", "facebook", "x", "tiktok"],
  additionalProperties: false,
} as const;

/**
 * Drafts platform-native content for `topic` across YouTube, Instagram,
 * Facebook, X, and TikTok in a single structured-output call.
 */
export async function draftContent(
  topic: string,
  researchNotes: string,
  apiKey: string
): Promise<ContentDrafts> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const userContent = researchNotes.trim()
    ? `Topic: ${topic}\n\nResearch notes:\n${researchNotes}`
    : `Topic: ${topic}`;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1536,
      thinking: { type: "disabled" },
      system: CONTENT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
      output_config: {
        format: { type: "json_schema", schema: DRAFTS_SCHEMA },
      },
    });

    if (response.stop_reason === "refusal") {
      throw new ContentDraftError("Claude declined to draft that topic — try rephrasing it.");
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new ContentDraftError("No draft came back — try again.");
    }

    return JSON.parse(textBlock.text) as ContentDrafts;
  } catch (err) {
    if (err instanceof ContentDraftError) throw err;
    throw new ContentDraftError(messageForAnthropicError(err));
  }
}
