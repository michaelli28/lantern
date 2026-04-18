import Anthropic from "@anthropic-ai/sdk";
import type { Fragment, FragmentKind, StreamEvent } from "@/lib/types";
import { EXCAVATOR_SYSTEM, SAVE_FRAGMENT_TOOL } from "@/lib/prompts";
import { consumeStream } from "./streamHelper";

export async function runExcavator(
  transcript: string,
  speaker: string | undefined,
  title: string | undefined,
  emit: (e: StreamEvent) => void,
): Promise<Fragment[]> {
  const client = new Anthropic();
  const fragments: Fragment[] = [];
  let nextId = 1;

  const stream = client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: EXCAVATOR_SYSTEM,
    tools: [SAVE_FRAGMENT_TOOL],
    messages: [
      {
        role: "user",
        content: `Speaker: ${speaker ?? "Unknown"}\nTitle: ${title ?? ""}\n\nTranscript:\n\n${transcript}`,
      },
    ],
  });

  await consumeStream(stream, {
    onToolCall: (name, input) => {
      if (name !== "save_fragment") return;
      const i = input as { kind?: string; text?: string };
      if (!i.kind || !i.text) return;
      if (!isFragmentKind(i.kind)) return;
      const frag: Fragment = {
        id: `f${nextId++}`,
        kind: i.kind,
        text: i.text,
      };
      fragments.push(frag);
      emit({ type: "fragment", fragment: frag });
    },
  });

  return fragments;
}

function isFragmentKind(s: string): s is FragmentKind {
  return ["memory", "place", "person", "date", "emotion", "quote", "unit"].includes(s);
}
