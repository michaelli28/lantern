import Anthropic from "@anthropic-ai/sdk";
import type { Fact, Fragment, StreamEvent } from "@/lib/types";
import { FACT_WEAVER_SYSTEM, SAVE_FACT_TOOL } from "@/lib/prompts";
import { consumeStream } from "./streamHelper";

export async function runFactWeaver(
  fragments: Fragment[],
  emit: (e: StreamEvent) => void,
): Promise<Fact[]> {
  const client = new Anthropic();
  const facts: Fact[] = [];
  let nextId = 1;

  const stream = client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: FACT_WEAVER_SYSTEM,
    tools: [
      SAVE_FACT_TOOL,
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 3,
      } as unknown as Anthropic.Tool,
    ],
    messages: [
      {
        role: "user",
        content: `Fragments to verify:\n\n${JSON.stringify(fragments, null, 2)}`,
      },
    ],
  });

  await consumeStream(stream, {
    onToolCall: (name, input) => {
      if (name !== "save_fact") return;
      const i = input as {
        claim?: string;
        verdict?: string;
        sources?: Array<{ title: string; url: string }>;
        imageUrl?: string;
        imageCredit?: string;
      };
      if (!i.claim || !i.verdict) return;
      const fact: Fact = {
        id: `fact${nextId++}`,
        claim: i.claim,
        verdict: i.verdict as Fact["verdict"],
        sources: i.sources ?? [],
        imageUrl: i.imageUrl,
        imageCredit: i.imageCredit,
      };
      facts.push(fact);
      emit({ type: "fact", fact });
    },
  });

  return facts;
}
