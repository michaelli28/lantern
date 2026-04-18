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
import { isTrustedImage, pickFallbackImage } from "@/lib/imageValidator";
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

  // Pass the full transcript for voice calibration — Sonnet 4.6 has 1M context
  // and voice capture is the whole point of the Narrator. Truncating was
  // producing generic "your great-great-grandfather" signoffs.
  const user = `Speaker (use this exact name in the signoff): ${speaker ?? "the veteran"}

Full transcript (study his cadence, diction, rhythm — mimic it):
${transcript}

Fragments:
${JSON.stringify(fragments, null, 2)}

Verified facts (with images — only use imageUrl values that appear verbatim here):
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
      const sections = sanitizeAndEnsureImage(
        i.sections,
        [transcript, JSON.stringify(fragments)].join(" "),
      );
      letter = {
        salutation: i.salutation,
        sections,
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

// Strip hallucinated image URLs (anything not on our trusted host list) and
// guarantee the letter has at least one visual anchor by injecting a thematic
// fallback on the first section when nothing survived sanitization.
function sanitizeAndEnsureImage(
  sections: LetterSection[],
  themeContext: string,
): LetterSection[] {
  const cleaned = sections.map((s) => {
    if (s.imageUrl && !isTrustedImage(s.imageUrl)) {
      return { ...s, imageUrl: undefined, imageCredit: undefined };
    }
    return s;
  });
  if (!cleaned.some((s) => s.imageUrl) && cleaned.length > 0) {
    const fb = pickFallbackImage(themeContext);
    cleaned[0] = {
      ...cleaned[0],
      imageUrl: fb.url,
      imageCredit: fb.credit,
    };
  }
  return cleaned;
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
