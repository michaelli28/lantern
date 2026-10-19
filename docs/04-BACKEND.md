# 04 — Backend Plan

> Owner: the partner building on their own machine. Branch: `backend/*`. Work against the contract in `docs/02-API-CONTRACT.md`.

## Your single deliverable

`src/app/api/run/route.ts` — one Next.js 16 App Router route that returns an SSE stream, plus the agents and orchestrator it calls.

## Starting read

- [`docs/02-API-CONTRACT.md`](./02-API-CONTRACT.md) — types and event shapes (don't deviate)
- [`docs/05-AGENT-PROMPTS.md`](./05-AGENT-PROMPTS.md) — the 4 system prompts, ready to paste
- **Before writing the route handler**, read Next.js 16's App Router route-handler docs in `node_modules/next/dist/docs/` — APIs have changed.

## Files you own

```
src/app/api/run/route.ts           ← POST handler, SSE response
src/lib/types.ts                   ← copy from the contract doc, verbatim
src/lib/transcript.ts              ← youtube-transcript wrapper + caching
src/lib/prompts.ts                 ← 4 system prompts + tool JSON schemas
src/lib/orchestrator.ts            ← sequencing + parallel Promise.all
src/lib/agents/excavator.ts        ← Story-Excavator
src/lib/agents/factWeaver.ts       ← Fact-Weaver (web_search tool)
src/lib/agents/memoryGraph.ts      ← Memory-Graph (Haiku + tool use)
src/lib/agents/narrator.ts         ← Narrator (Sonnet + extended thinking)
src/fixtures/sample-norman.json    ← write one real run to disk for the frontend
```

## Route handler skeleton

```ts
// src/app/api/run/route.ts
import { NextRequest } from "next/server";
import { orchestrate } from "@/lib/orchestrator";
import type { StreamEvent } from "@/lib/types";

export const runtime = "nodejs"; // Fluid Compute; we need Node APIs
export const maxDuration = 90; // seconds

export async function POST(req: NextRequest) {
  const body = await req.json();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const emit = (e: StreamEvent) => {
        controller.enqueue(
          encoder.encode(`event: message\ndata: ${JSON.stringify(e)}\n\n`),
        );
      };
      try {
        await orchestrate(body, emit);
      } catch (err) {
        emit({
          type: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
```

## Orchestrator

```ts
// src/lib/orchestrator.ts — pseudocode
export async function orchestrate(
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

  emit({
    type: "status",
    stage: "excavating",
    message: "Extracting story fragments…",
  });
  emit({ type: "agent_start", agent: "excavator" });
  const fragments = await runExcavator(text, (e) => emit(e));
  emit({ type: "agent_end", agent: "excavator" });

  emit({
    type: "status",
    stage: "fact_checking",
    message: "Verifying and graphing in parallel…",
  });
  const [facts, entities] = await Promise.all([
    (async () => {
      emit({ type: "agent_start", agent: "fact_weaver" });
      const res = await runFactWeaver(fragments, (e) => emit(e));
      emit({ type: "agent_end", agent: "fact_weaver" });
      return res;
    })(),
    (async () => {
      emit({ type: "agent_start", agent: "memory_graph" });
      const res = await runMemoryGraph(fragments, (e) => emit(e));
      emit({ type: "agent_end", agent: "memory_graph" });
      return res;
    })(),
  ]);

  emit({
    type: "status",
    stage: "narrating",
    message: "Composing the letter…",
  });
  emit({ type: "agent_start", agent: "narrator" });
  const letter = await runNarrator(
    { transcript: text, fragments, facts, entities, speaker },
    (e) => emit(e),
  );
  emit({ type: "agent_end", agent: "narrator" });

  emit({ type: "letter_complete", letter });
  emit({ type: "status", stage: "complete", message: "Done." });
}
```

## Agent patterns

All agents use `@anthropic-ai/sdk`. Pattern:

```ts
import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

const res = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 4096,
  system: EXCAVATOR_SYSTEM_PROMPT,
  tools: [SAVE_FRAGMENT_TOOL],
  messages: [{ role: "user", content: `Transcript:\n\n${transcript}` }],
});
```

For streaming:

```ts
const stream = client.messages.stream({ ... });
for await (const event of stream) {
  if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
    emit({ type: "letter_chunk", text: event.delta.text });
  }
}
```

For tool use: loop over `content_block_start` with `input_json_delta` to stream tool args, and when a `tool_use` block completes, emit the corresponding domain event (`fragment`, `fact`, `entity`).

For **extended thinking** on Narrator: pass `thinking: { type: "enabled", budget_tokens: 5000 }`. Forward thinking deltas as `{ type: "thinking", agent: "narrator", text: ... }`.

For **web search**: use Anthropic's hosted tool `{ type: "web_search_20250305", name: "web_search", max_uses: 3 }` on the Fact-Weaver. Each tool_result comes back as a web search results block — extract URLs + titles into `Fact.sources`.

## Transcript layer

```ts
// src/lib/transcript.ts
import { YoutubeTranscript } from "youtube-transcript";
import fixturesIndex from "@/fixtures/index.json";

export async function getTranscript(body: RunRequest): Promise<{
  text: string;
  durationSec: number;
  title?: string;
  speaker?: string;
}> {
  if (body.fixtureId) {
    const f = fixturesIndex[body.fixtureId];
    if (!f) throw new Error(`Unknown fixture: ${body.fixtureId}`);
    return f;
  }
  if (!body.youtubeUrl) throw new Error("Provide youtubeUrl or fixtureId");

  const entries = await YoutubeTranscript.fetchTranscript(body.youtubeUrl);
  const text = entries.map((e) => e.text).join(" ");
  const durationSec = entries.at(-1)
    ? (entries.at(-1)!.offset + entries.at(-1)!.duration) / 1000
    : 0;
  return { text, durationSec, title: body.title, speaker: body.speaker };
}
```

Cache fixture transcripts on disk once, load them synchronously after that.

## Model choices (defaults)

| Agent        | Model                          | Why                                                     |
| ------------ | ------------------------------ | ------------------------------------------------------- |
| Excavator    | `claude-sonnet-4-6`            | Needs to structure messy transcripts; tool use at scale |
| Fact-Weaver  | `claude-sonnet-4-6`            | Web search reasoning is non-trivial                     |
| Memory-Graph | `claude-haiku-4-5-20251001`    | Schema-bound, fast, cheap                               |
| Narrator     | `claude-sonnet-4-6` + thinking | Best prose quality; thinking is demo-visible            |

If time is short, collapse all 4 onto Sonnet 4.6 — perf hit is tolerable for the hackathon.

## Acceptance criteria

- [ ] `POST /api/run` returns a `text/event-stream` that respects the ordering guarantees
- [ ] All 4 agents run, at least 2 of them use tool use (Excavator + FactWeaver)
- [ ] `Fact.sources` contain real URLs pulled from web search (not fabricated)
- [ ] `letter_complete` arrives within 60s on a 5-min transcript
- [ ] Errors emit an `error` event before stream close
- [ ] `src/fixtures/sample-norman.json` exists with a full run's events for the frontend
- [ ] Parallel Promise.all for FactWeaver + MemoryGraph (grep your code for `Promise.all`)

## Out of scope (v1)

- Request queueing
- Caching full runs
- Authentication
- Anything saved to a database
- Retry logic beyond "throw and let the stream emit error"
