# 03 — Frontend Plan

> Owner: the user building on their own machine. Branch: `frontend/*`. Work against fixtures until backend is ready.

## Your single deliverable

`src/app/page.tsx` — one page that looks like a warm archival artifact and that animates as agents do their work. Plus the components it imports.

## The screen, top to bottom

```
┌────────────────────────────────────────────────────────────┐
│  LANTERN                                    [GitHub] [?]   │
│  Turning vanishing voices into letters for the future.     │
├────────────────────────────────────────────────────────────┤
│  [ Paste a YouTube URL …                    ] [ Begin ]   │
│  or try:  [Norman · D-Day]  [Hannah · USO]  [Tom · Pacific]│
├────────────────────────────────────────────────────────────┤
│  ┌── Excavator ──┐ ┌── Fact-Weaver ─┐ ┌── Memory-Graph ─┐ │
│  │ •  Ste-Mère… │ │ ✓ 82nd Airborne │ │ Norman → 101st  │ │
│  │ •  Mother's… │ │ ✓ June 6, 1944  │ │ 101st → Carentan│ │
│  │ •  "It rained│ │ ✓ [photo: NARA] │ │ …              │ │
│  └──────────────┘ └─────────────────┘ └────────────────┘ │
│  ┌── Narrator (thinking) ────────────────────────────────┐│
│  │ …weighing whether he'd say 'fear' or 'a kind of numb'…││
│  └────────────────────────────────────────────────────────┘│
├────────────────────────────────────────────────────────────┤
│                    ┌─────────────────┐                     │
│                    │   THE LETTER    │  (sepia / parchment)│
│                    │  Dear child…    │                     │
│                    │  [period photo] │                     │
│                    │  …              │                     │
│                    │  — Norman       │                     │
│                    └─────────────────┘                     │
└────────────────────────────────────────────────────────────┘
```

## Component list

| Component         | Responsibility                                                         | Props                               |
| ----------------- | ---------------------------------------------------------------------- | ----------------------------------- |
| `UrlInput`        | URL text field + Begin button                                          | `onSubmit(url)`                     |
| `PresetButtons`   | Three hardcoded preset buttons                                          | `onPick(fixtureId, title, speaker)` |
| `AgentTrace`      | Grid container for the 4 agent panels                                  | `state: RunState`                   |
| `AgentPanel`      | One card per agent, shows stream of items + status dot                 | `agent, items, status`              |
| `MemoryGraphView` | Simple node/edge list (not a real graph lib — styled list with arrows) | `entities: Entity[]`                |
| `LetterRender`    | Renders the final `Letter` with markdown + images + footnotes          | `letter: Letter, streamingText?`    |
| `StatusBadge`     | Tiny stage indicator at top ("excavating…" etc.)                       | `stage: Stage`                      |

## State shape (in `page.tsx`)

```ts
type RunState = {
  stage: Stage;
  title?: string;
  speaker?: string;
  transcript?: string;
  fragments: Fragment[];
  facts: Fact[];
  entities: Entity[];
  thinking: Array<{ agent: AgentName; text: string }>;
  letterChunks: string[]; // streamed narrator text so far
  letter?: Letter; // set on letter_complete
  error?: string;
};
```

Use a single `useReducer` over the `StreamEvent` union — one case per event type. Clean + trivially testable.

## The SSE consumer (helper)

Put this in `src/lib/sse.ts`:

```ts
import type { StreamEvent } from "./types";

export async function runStream(
  body: {
    youtubeUrl?: string;
    fixtureId?: string;
    title?: string;
    speaker?: string;
  },
  onEvent: (e: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch("/api/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const dataLine = raw.split("\n").find((l) => l.startsWith("data:"));
      if (!dataLine) continue;
      try {
        onEvent(JSON.parse(dataLine.slice(5).trim()) as StreamEvent);
      } catch {
        /* ignore parse errors on keepalive */
      }
    }
  }
}
```

## Fixture mode (work offline)

While backend is unbuilt, in dev you can flag-switch to replay a fixture. Add a query param handler in `page.tsx`:

```ts
if (new URLSearchParams(window.location.search).get("fixture") === "1") {
  import("@/fixtures/sample-norman.json").then((mod) => {
    const events = mod.default as StreamEvent[];
    let i = 0;
    const tick = () => {
      if (i < events.length) {
        dispatch(events[i++]);
        setTimeout(tick, 280);
      }
    };
    tick();
  });
}
```

Open `http://localhost:3000/?fixture=1` to play back without hitting the backend. **Crucial for parallel dev.**

## Visual direction

- **Palette**: warm neutrals. Background `bg-stone-50`. Panels `bg-amber-50` with `border-amber-900/10`. Letter card `bg-[#f8f1e4]` with deckle-edge look (`shadow-xl`, slight rotation).
- **Type**: system serif for the letter (`font-serif`), sans for UI. Try `text-stone-900` on the letter.
- **Motion**: each agent panel fades in as its `agent_start` fires. Fragments/facts/entities stagger in with a tiny slide-up. Narrator "thinking" text has a subtle blink cursor.
- **Avoid**: glassmorphism, neon gradients, AI-slop purple. This is archival. Calm.

## Acceptance criteria — you're done when:

- [ ] Pasting a YouTube URL or clicking a preset triggers the run
- [ ] All 4 agent panels render and animate as events arrive
- [ ] `Letter` renders with sections, images, and footnote citations
- [ ] Page works end-to-end against `?fixture=1` with zero backend
- [ ] Page works end-to-end against a real backend run
- [ ] It looks like something you'd print and frame, not a dashboard
- [ ] Mobile: single column, letter still centered and legible
- [ ] Error banner appears on `error` events
- [ ] No console errors in production build

## Out of scope (for v1)

- Dark mode
- User accounts
- Saving letters
- Any settings / preferences UI
- Animations fancier than fade + slide
