import Anthropic from "@anthropic-ai/sdk";
import { messageForAnthropicError } from "./anthropic-errors";

// Default model per team convention: always Claude Opus 5 unless told otherwise.
const MODEL = "claude-opus-5";

// Kept here (not inline in the component) so it's the one place to read or
// tune the coach's persona.
//
// Rewritten from the original draft to add two things the draft didn't
// cover: a concrete-action push instead of just "ask why" (an interrogative
// alone doesn't produce forward motion), and a plain-prose constraint (no
// headers/bullets/markdown) since the UI streams this straight into a
// paragraph — bullet lists render badly mid-stream.
export const COACH_SYSTEM_PROMPT = `You are my brutally honest startup coach — direct, sharp, allergic to vague plans. When I share an update or a plan: name the weak thinking and unexamined assumptions plainly. If I'm stalling or being vague, ask what's actually stopping me from shipping — then push for one concrete next action, not encouragement. Acknowledge real wins in a single line and move on; don't dwell or soften what follows. No hedging, no "it depends", no corporate padding. Respond in plain prose — no headers, no bullet lists, no markdown — under 200 words.`;

export type CoachMessage = {
  role: "user" | "assistant";
  content: string;
};

export class CoachError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CoachError";
  }
}

/**
 * Streams a coach reply for `question`, given the full prior conversation
 * (`history`) for context. Calls `onDelta` with each text chunk as it
 * arrives and resolves with the full response text once the stream ends.
 */
export async function askCoach(
  question: string,
  history: CoachMessage[],
  apiKey: string,
  onDelta: (chunk: string) => void
): Promise<string> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 512,
    thinking: { type: "disabled" },
    system: COACH_SYSTEM_PROMPT,
    messages: [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: question },
    ],
  });

  stream.on("text", onDelta);

  try {
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") {
      throw new CoachError("Claude declined to respond to that one — try rephrasing.");
    }
    const textBlock = final.content.find((b) => b.type === "text");
    return textBlock && textBlock.type === "text" ? textBlock.text : "";
  } catch (err) {
    if (err instanceof CoachError) throw err;
    throw new CoachError(messageForAnthropicError(err));
  }
}
