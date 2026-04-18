import type Anthropic from "@anthropic-ai/sdk";

// Helper: run a streaming Claude request and fire callbacks as tool-use blocks
// complete (after their input JSON has fully streamed). Also forwards thinking
// deltas. Returns the final Message.
export async function consumeStream(
  stream: ReturnType<Anthropic["messages"]["stream"]>,
  handlers: {
    onToolCall?: (name: string, input: unknown) => void | Promise<void>;
    onThinkingDelta?: (text: string) => void;
    onTextDelta?: (text: string) => void;
  },
): Promise<Anthropic.Message> {
  const partial = new Map<number, { name: string; json: string }>();

  for await (const event of stream) {
    if (event.type === "content_block_start") {
      const block = event.content_block;
      if (block.type === "tool_use") {
        partial.set(event.index, { name: block.name, json: "" });
      }
    } else if (event.type === "content_block_delta") {
      const d = event.delta;
      if (d.type === "input_json_delta") {
        const p = partial.get(event.index);
        if (p) p.json += d.partial_json;
      } else if (d.type === "thinking_delta" && handlers.onThinkingDelta) {
        handlers.onThinkingDelta(d.thinking);
      } else if (d.type === "text_delta" && handlers.onTextDelta) {
        handlers.onTextDelta(d.text);
      }
    } else if (event.type === "content_block_stop") {
      const p = partial.get(event.index);
      if (p && handlers.onToolCall) {
        try {
          const input = p.json.length > 0 ? JSON.parse(p.json) : {};
          await handlers.onToolCall(p.name, input);
        } catch {
          // malformed tool json — skip
        }
        partial.delete(event.index);
      }
    }
  }

  return await stream.finalMessage();
}
