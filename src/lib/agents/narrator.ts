import Anthropic from "@anthropic-ai/sdk";
import type {
  Entity,
  Fact,
  Fragment,
  Letter,
  LetterSection,
  StreamEvent,
} from "@/lib/types";
import { NARRATOR_SYSTEM, RENDER_LETTER_TOOL } from "@/lib/prompts";
import { consumeStream } from "./streamHelper";

export async function runNarrator(
  args: {
    transcript: string;
    fragments: Fragment[];
    facts: Fact[];
    entities: Entity[];
    speaker?: string;
  },
  emit: (e: StreamEvent) => void,
): Promise<Letter> {
  const client = new Anthropic();
  const { transcript, fragments, facts, entities, speaker } = args;

  const user = `Speaker: ${speaker ?? "Unknown"}

Transcript excerpt (trimmed for style calibration):
${transcript.slice(0, 2000)}

Fragments:
${JSON.stringify(fragments, null, 2)}

Verified facts (with images):
${JSON.stringify(facts, null, 2)}

Entities:
${JSON.stringify(entities, null, 2)}

Now write the letter.`;

  let letter: Letter | null = null;

  const stream = client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 6000,
    thinking: { type: "adaptive" },
    // Cap thinking depth so the demo stays under 60s wall-clock. `effort: "low"`
    // keeps the thinking trace demo-visible without letting it run unbounded.
    output_config: { effort: "low" },
    system: NARRATOR_SYSTEM,
    tools: [RENDER_LETTER_TOOL],
    messages: [{ role: "user", content: user }],
  } as unknown as Parameters<typeof client.messages.stream>[0]);

  await consumeStream(stream, {
    onThinkingDelta: (text) => {
      if (text.trim()) emit({ type: "thinking", agent: "narrator", text });
    },
    onToolCall: async (name, input) => {
      if (name !== "render_letter") return;
      const i = input as {
        salutation?: string;
        sections?: LetterSection[];
        signoff?: string;
        speaker?: string;
      };
      if (!i.salutation || !i.sections || !i.signoff) return;
      letter = {
        salutation: i.salutation,
        sections: i.sections,
        signoff: i.signoff,
        speaker: i.speaker ?? speaker ?? "Unknown",
        generatedAt: new Date().toISOString(),
      };
      await dripLetter(letter, emit);
    },
  });

  if (!letter) {
    throw new Error("Narrator did not produce a letter");
  }
  return letter;
}

async function dripLetter(
  letter: Letter,
  emit: (e: StreamEvent) => void,
): Promise<void> {
  const first = letter.sections[0]?.body ?? "";
  const opening = `${letter.salutation} `;
  emit({ type: "letter_chunk", text: opening });
  const words = first.split(/(\s+)/).slice(0, 60);
  for (const w of words) {
    emit({ type: "letter_chunk", text: w });
    await new Promise((r) => setTimeout(r, 25));
  }
  emit({ type: "letter_complete", letter });
}
