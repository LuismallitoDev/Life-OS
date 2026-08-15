import Anthropic from "@anthropic-ai/sdk";

/** Maps an error from an Anthropic SDK call to a plain-English UI message. */
export function messageForAnthropicError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) {
    return "Your API key was rejected. Check the key saved in Settings.";
  }
  if (err instanceof Anthropic.PermissionDeniedError) {
    return "That API key doesn't have permission to use this model.";
  }
  if (err instanceof Anthropic.RateLimitError) {
    return "Rate limited — wait a moment and try again.";
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return "Couldn't reach Claude — check your connection and try again.";
  }
  if (err instanceof Anthropic.APIError) {
    return `Claude API error (${err.status}): ${err.message}`;
  }
  return "Something went wrong talking to Claude. Try again.";
}
