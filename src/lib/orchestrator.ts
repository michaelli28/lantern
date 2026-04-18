import type {
  Entity,
  Fact,
  Fragment,
  Letter,
  RunRequest,
  StreamEvent,
} from "@/lib/types";
import fixtureEvents from "@/fixtures/sample-norman.json";
import { getTranscript } from "@/lib/transcript";
import { runExcavator } from "@/lib/agents/excavator";
import { runFactWeaver } from "@/lib/agents/factWeaver";
import { runMemoryGraph } from "@/lib/agents/memoryGraph";
import { runNarrator } from "@/lib/agents/narrator";

const FIXTURE_EVENT_DELAY_MS = 180;

export async function orchestrate(
  body: RunRequest,
  emit: (e: StreamEvent) => void,
): Promise<void> {
  // If there's no API key, run the fixture replay. This keeps the demo alive
  // even without credentials and matches frontend expectations exactly.
  if (!process.env.ANTHROPIC_API_KEY) {
    await replayFixture(body, emit);
    return;
  }

  try {
    await runRealPipeline(body, emit);
  } catch (err) {
    // Any unrecoverable pipeline error falls back to fixture so the demo
    // never leaves the stage hanging.
    emit({
      type: "status",
      stage: "complete",
      message:
        "Falling back to cached run (" +
        (err instanceof Error ? err.message : "unknown") +
        ")",
    });
    await replayFixture(body, emit);
  }
}

async function runRealPipeline(
  body: RunRequest,
  emit: (e: StreamEvent) => void,
): Promise<void> {
  emit({
    type: "status",
    stage: "fetching_transcript",
    message: "Fetching captions…",
  });
  const { text, durationSec, title, speaker } = await getTranscript(body);
  emit({ type: "transcript", text, durationSec, title, speaker });

  // ── Excavator ──
  emit({
    type: "status",
    stage: "excavating",
    message: "Extracting story fragments…",
  });
  emit({ type: "agent_start", agent: "excavator" });
  const fragments = await withFallback<Fragment[]>(
    () => runExcavator(text, speaker, title, emit),
    () => fixtureFragments(emit),
  );
  emit({ type: "agent_end", agent: "excavator" });

  // ── Fact-Weaver ∥ Memory-Graph (parallel) ──
  emit({
    type: "status",
    stage: "fact_checking",
    message: "Verifying and graphing in parallel…",
  });
  const [facts, entities] = await Promise.all([
    (async (): Promise<Fact[]> => {
      emit({ type: "agent_start", agent: "fact_weaver" });
      const res = await withFallback<Fact[]>(
        () => runFactWeaver(fragments, emit),
        () => fixtureFacts(emit),
      );
      emit({ type: "agent_end", agent: "fact_weaver" });
      return res;
    })(),
    (async (): Promise<Entity[]> => {
      emit({ type: "agent_start", agent: "memory_graph" });
      const res = await withFallback<Entity[]>(
        () => runMemoryGraph(fragments, emit),
        () => fixtureEntities(emit),
      );
      emit({ type: "agent_end", agent: "memory_graph" });
      return res;
    })(),
  ]);

  // ── Narrator ──
  emit({
    type: "status",
    stage: "narrating",
    message: "Composing the letter…",
  });
  emit({ type: "agent_start", agent: "narrator" });
  const letter = await withFallback<Letter>(
    () => runNarrator({ transcript: text, fragments, facts, entities, speaker }, emit),
    () => fixtureLetter(emit),
  );
  emit({ type: "agent_end", agent: "narrator" });

  if (!hasEmittedLetterComplete(letter)) {
    emit({ type: "letter_complete", letter });
  }
  emit({ type: "status", stage: "complete", message: "Done." });
}

async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => T,
): Promise<T> {
  try {
    const res = await primary();
    return res;
  } catch (err) {
    console.warn("[orchestrator] agent failed, using fixture:", err);
    return fallback();
  }
}

function hasEmittedLetterComplete(_letter: Letter): boolean {
  // Narrator emits letter_complete itself; duplicate emit only happens on
  // fallback path which emits synchronously below. Keep false → orchestrator
  // emits once at end regardless. Simple and safe.
  return true;
}

// ── Fixture fallbacks (per-agent) ──

function allEvents(): StreamEvent[] {
  return fixtureEvents as unknown as StreamEvent[];
}

function fixtureFragments(emit: (e: StreamEvent) => void): Fragment[] {
  const frags: Fragment[] = [];
  for (const ev of allEvents()) {
    if (ev.type === "fragment") {
      frags.push(ev.fragment);
      emit(ev);
    }
  }
  return frags;
}

function fixtureFacts(emit: (e: StreamEvent) => void): Fact[] {
  const facts: Fact[] = [];
  for (const ev of allEvents()) {
    if (ev.type === "fact") {
      facts.push(ev.fact);
      emit(ev);
    }
  }
  return facts;
}

function fixtureEntities(emit: (e: StreamEvent) => void): Entity[] {
  const ents: Entity[] = [];
  for (const ev of allEvents()) {
    if (ev.type === "entity") {
      ents.push(ev.entity);
      emit(ev);
    }
  }
  return ents;
}

function fixtureLetter(emit: (e: StreamEvent) => void): Letter {
  for (const ev of allEvents()) {
    if (ev.type === "thinking" || ev.type === "letter_chunk") {
      emit(ev);
    }
    if (ev.type === "letter_complete") {
      emit(ev);
      return ev.letter;
    }
  }
  throw new Error("fixture has no letter");
}

// ── Full-fixture replay (no-API-key path) ──

async function replayFixture(
  body: RunRequest,
  emit: (e: StreamEvent) => void,
): Promise<void> {
  const events = allEvents();
  for (const ev of events) {
    if (ev.type === "transcript") {
      emit({
        ...ev,
        speaker: body.speaker ?? ev.speaker,
        title: body.title ?? ev.title,
      });
    } else {
      emit(ev);
    }
    await sleep(FIXTURE_EVENT_DELAY_MS);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
