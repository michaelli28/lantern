# 01 — Architecture

## System diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER (React 19)                       │
│  ┌───────────┐   ┌──────────────┐   ┌────────────────────────┐  │
│  │ URL input │ → │ Agent traces │ → │  Illustrated letter    │  │
│  │ + presets │   │ (live panels)│   │  (final render)        │  │
│  └───────────┘   └──────────────┘   └────────────────────────┘  │
│         │                  ▲                        ▲            │
│         │ POST /api/run    │ SSE events             │            │
└─────────┼──────────────────┼────────────────────────┼────────────┘
          ▼                  │                        │
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS SERVER (Node)                        │
│                                                                  │
│   /api/run  ──►  orchestrator.ts                                 │
│                     │                                            │
│   ┌─────────────────┴─────────────────┐                         │
│   │ 1. youtube-transcript → text      │                         │
│   │ 2. Story-Excavator  (Sonnet 4.6)  │──► fragments[]          │
│   │ 3. PARALLEL:                      │                         │
│   │    ├─ Fact-Weaver   (Sonnet+web)  │──► facts[]              │
│   │    └─ Memory-Graph  (Haiku 4.5)   │──► entities[]           │
│   │ 4. Narrator         (Sonnet+think)│──► letter (markdown)    │
│   └───────────────────────────────────┘                         │
│                     │                                            │
│              emits SSE events at every step                      │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ANTHROPIC API (via SDK)                       │
│  Sonnet 4.6 · Haiku 4.5 · tool use · web_search · thinking       │
└─────────────────────────────────────────────────────────────────┘
```

## File structure (target)

```
lantern/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    ← FRONTEND main UI
│   │   ├── globals.css
│   │   └── api/
│   │       └── run/
│   │           └── route.ts            ← BACKEND SSE endpoint
│   ├── components/                     ← FRONTEND
│   │   ├── UrlInput.tsx
│   │   ├── PresetButtons.tsx
│   │   ├── AgentTrace.tsx
│   │   ├── AgentPanel.tsx
│   │   ├── MemoryGraphView.tsx
│   │   └── LetterRender.tsx
│   ├── lib/
│   │   ├── types.ts                    ← SHARED — do NOT change without both owners
│   │   ├── sse.ts                      ← SSE client helper (frontend)
│   │   ├── agents/                     ← BACKEND
│   │   │   ├── excavator.ts
│   │   │   ├── factWeaver.ts
│   │   │   ├── memoryGraph.ts
│   │   │   └── narrator.ts
│   │   ├── orchestrator.ts             ← BACKEND
│   │   ├── transcript.ts               ← BACKEND (youtube-transcript wrapper)
│   │   └── prompts.ts                  ← BACKEND
│   └── fixtures/
│       └── sample-norman.json          ← shared fixture for offline dev
├── docs/
└── .env.local                          ← ANTHROPIC_API_KEY
```

## Data flow (per request)

1. **Frontend** POSTs `/api/run` with `{ youtubeUrl, title?, speaker? }`
2. **Backend** opens SSE stream. Emits `status` event immediately.
3. **Backend** fetches transcript via `youtube-transcript`. Emits `transcript` event.
4. **Backend** calls Story-Excavator with full transcript. Streams `fragment` events as tool calls return.
5. **Backend** fires Fact-Weaver + Memory-Graph **in parallel**. Emits `fact` and `entity` events as they arrive.
6. **Backend** calls Narrator with everything assembled + extended thinking enabled. Streams `thinking` events (if user hasn't opted out), then `letter_chunk` events, then final `letter_complete`.
7. **Frontend** renders each event live. Final letter is the money shot.

## Parallelism rationale

- Stage 2 (Excavator) must complete before 3 (Weaver/Graph) because they need fragments as input.
- Stages 3a and 3b are independent — fire them with `Promise.all`.
- Stage 4 (Narrator) depends on all three prior outputs.
- Net wall-clock: ~3 Claude turns instead of 4. Perceptibly snappier.

## State machine (stage enum)

```
idle → fetching_transcript → excavating → { fact_checking ∥ graphing } → narrating → complete
```

(Any stage can transition to `error`.)

## What we're deliberately NOT doing

- **No database**. All state in-memory per request.
- **No auth**. One page.
- **No image generation**. Fact-Weaver returns public-domain image URLs; frontend `<img>` tags load them directly.
- **No persistence of letters**. Page refresh = new story.
- **No retry/queue**. If a request fails, the demo does it again.

## Risk register

| Risk                                | Likelihood      | Mitigation                                                                      |
| ----------------------------------- | --------------- | ------------------------------------------------------------------------------- |
| YouTube transcript fetch fails live | Medium          | Pre-cache 3 transcripts as JSON fixtures; presets bypass fetch                  |
| Web search rate-limited or slow     | Low             | Cap at 3 searches; have Fact-Weaver time-bound                                  |
| Narrator output too long / slow     | Medium          | Explicit token cap in prompt; render chunks as they stream                      |
| Next.js 16 breaking changes on SSE  | Medium          | Read `node_modules/next/dist/docs/` before wiring route handler |
| API key missing at demo             | High if ignored | Hardcode a fallback message; test the deploy end-to-end _before_ minute 85      |
