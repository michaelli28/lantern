# Lantern
Doc: https://docs.google.com/document/d/1eGMtJliPdv-jnidLdj7FCbWfi9-zogdM00nmMzmgYfc/edit?usp=sharing
**Turning vanishing voices into letters for the future.**

Hackathon submission — Claude Hackathon 2026, theme _"Creative Flourishing"_ (inspired by Dario Amodei's _Machines of Loving Grace_).

## What it does

Paste a YouTube URL of a WW2 veteran's testimony. Lantern runs a 4-agent Claude pipeline that:

1. **Fetches** the transcript
2. **Excavates** structured story fragments (people, places, battles, emotions)
3. **Verifies** facts via web search, pulls period imagery
4. **Builds** a memory graph of entities
5. **Narrates** a historically-grounded, illustrated letter — written in the veteran's own voice, addressed to their future descendant

The 16 million Americans who served in WW2 are down to ~100,000. ~300 die every day. Their stories are on YouTube, in oral histories, in family archives — but they're not _reachable_ by the people who should hear them. Lantern turns a voice into an heirloom.

## Why it's more than a chatbot

- **4 coordinated Claude agents** (Story-Excavator, Fact-Weaver, Memory-Graph, Narrator)
- **Tool use**: hosted web search, structured fragment extraction, entity graph upserts
- **Extended thinking** on the Narrator — judges see the model _reason about the veteran's voice_
- **Parallel agent execution** (Fact-Weaver + Memory-Graph run concurrently)

## Stack

- Next.js 16 (App Router) + React 19 + Tailwind 4
- `@anthropic-ai/sdk` (Sonnet 4.6 + Haiku 4.5)
- `youtube-transcript` for caption ingestion
- Server-Sent Events for live agent trace
- Deployed on Vercel

## Team & ways of working

- **Frontend builder** → see [`docs/03-FRONTEND.md`](./docs/03-FRONTEND.md)
- **Backend builder** → see [`docs/04-BACKEND.md`](./docs/04-BACKEND.md)
- **Shared contract (read first)** → [`docs/02-API-CONTRACT.md`](./docs/02-API-CONTRACT.md)

## Doc index

| #   | Doc                                         | Read if…                              |
| --- | ------------------------------------------- | ------------------------------------- |
| 00  | [Project Brief](./docs/00-BRIEF.md)         | you want the pitch + rubric strategy  |
| 01  | [Architecture](./docs/01-ARCHITECTURE.md)   | you want the system diagram           |
| 02  | [API Contract](./docs/02-API-CONTRACT.md)   | **both of you — this is the handoff** |
| 03  | [Frontend Plan](./docs/03-FRONTEND.md)      | you're building the UI                |
| 04  | [Backend Plan](./docs/04-BACKEND.md)        | you're building the agents            |
| 05  | [Agent Prompts](./docs/05-AGENT-PROMPTS.md) | you're writing the Claude prompts     |
| 06  | [Demo Clips](./docs/06-DEMO-CLIPS.md)       | you're picking the YouTube URLs       |
| 07  | [Demo Script](./docs/07-DEMO-SCRIPT.md)     | you're the one presenting             |
| 08  | [Devpost Template](./docs/08-DEVPOST.md)    | you're submitting                     |
| 09  | [Future Plans](./docs/09-FUTURE.md)         | you want the post-hackathon roadmap   |

## Run locally

```bash
pnpm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
pnpm dev
```

## Demo time budget (90 min total)

| Minutes | Task                                        | Owner |
| ------- | ------------------------------------------- | ----- |
| 0–10    | Read docs 00–02 together, agree on contract | Both  |
| 10–65   | Build in parallel against the contract      | Split |
| 65–75   | Integrate, fix edges                        | Both  |
| 75–85   | Deploy + record 60-sec demo                 | Both  |
| 85–90   | Devpost submission                          | One   |
