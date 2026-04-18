# 09 — Future Plans

> Post-hackathon roadmap. The v1 we shipped is a single-speaker letter generator. The thing worth building next is a **family-scoped archive** — because a descendant has more than one ancestor, and the letter is only the first cell of a much bigger mosaic.

## The arc

```
v1  (shipped)   one YouTube URL  → one letter
v2  profiles    many sources     → one veteran profile
v3  family      many veterans    → one family graph
v4  reasoning   one question     → many profiles queried together
v5  community   one family       → opt-in public memorial
```

Each phase deepens Claude's role. v1 has 4 agents in a pipeline. v5 has a persistent Claude service reasoning across thousands of profiles.

## The descendant's problem

A great-grandchild born in 2030 typically descends from **8 great-grandparents**. In the WW2 generation, it's realistic that 2–4 of them served. Today's version of Lantern produces one letter from one testimony. That's a start, but it's not the heirloom a family actually inherits.

What the family actually inherits is **a collection of voices**. Some served in Europe, some in the Pacific, some on the home front. Some have YouTube interviews, some only have a cassette tape in a shoebox, some only have secondhand stories the descendant remembers from a parent. The real artifact is the family's composite memory — not one letter, but a living archive.

## Phase 2 — Veteran profiles

Upgrade the data model from `one run → one letter` to `one veteran → many sources → one profile`.

### Profile shape

```ts
type VeteranProfile = {
  id: string;
  name: string;
  yearsOfService?: { from?: number; to?: number };
  branch?: "army" | "navy" | "marines" | "airforce" | "coast_guard" | "merchant_marine" | "civilian";
  unit?: string;
  theater?: "european" | "pacific" | "home_front" | "north_africa" | "china_burma_india";
  bornAt?: string; // "Ohio, 1924"
  diedAt?: string;
  relationToOwner?: string; // "great-grandfather on mother's side"

  sources: Array<
    | { kind: "youtube"; url: string; title?: string }
    | { kind: "upload"; fileId: string; mime: string }
    | { kind: "text"; provenance: string; text: string }
    | { kind: "photo"; fileId: string; caption?: string }
  >;

  // Accumulated across all sources
  fragments: Fragment[];
  facts: Fact[];
  entities: Entity[];
  letters: Letter[]; // more than one — different angles, different descendants

  createdAt: string;
  updatedAt: string;
};
```

### What changes in the backend

- **Persistence.** Postgres for profile metadata + a blob store (S3 / Vercel Blob) for uploaded audio, photos, and generated assets. The current in-memory run stays for the one-shot demo; a new `/api/profile/*` surface handles CRUD.
- **Ingest pipeline.** The existing 4-agent pipeline becomes a **callable** step invoked per source, not per letter. A new source (YouTube URL, audio upload, pasted text) enqueues an ingest job that appends fragments/facts/entities to the profile.
- **Deduplication.** When the same entity shows up in two sources (same unit, same battle), merge rather than duplicate.
- **Transcription for non-YouTube sources.** Uploaded audio goes through a transcription step before the pipeline. Whisper is cheap and local; not a Claude dependency.

### What changes in the frontend

- A `/profiles` page with a list of veterans the user has added.
- A `/profile/:id` page: sources on the left, fragments/facts/letters in the middle, photos on the right.
- The hero page becomes "start a new profile" rather than "produce one letter."

## Phase 3 — The family mind-map

This is where it stops being a writing tool and becomes a **memory space**.

### The graph

Every profile contributes entities to a shared graph. The graph has typed nodes and typed edges.

```
Nodes:     veteran · person · place · event · unit · object · battle · ship
Edges:     kin_of · served_in · fought_at · trained_with · mentioned_by
           → the veteran-to-veteran edges are the ones descendants care about
```

The Memory-Graph agent we shipped already emits this shape per-run. Phase 3 elevates the graph from a per-run artifact to a **persistent, cross-profile resource**.

### The visual

Not a D3 force-directed blob of incomprehensible dots. Closer to a **timeline-first layout**:

- X-axis: years 1939–1945
- Y-axis: profiles (one row per veteran)
- Each event is a dot on a row; shared events (same battle, same date) connect across rows
- Clicking a dot opens the relevant fragment and its source letter

A separate "lineage view" shows kinship edges between veterans (who is descended from whom).

### Claude's job here

- **Cross-profile entity resolution.** "Was Sergeant Williams in Grandpa's testimony the same Williams from Uncle Ray's unit roster?" A small Claude agent with read-only access to both profiles resolves the question and emits a `link_entities` tool call that updates the shared graph.
- **Coincidence surfacing.** Periodically, a background Claude agent scans the graph for non-obvious overlaps — "These two veterans were at the same rail depot in Naples two days apart" — and surfaces them as a "Did you know?" card for the user.

## Phase 4 — Cross-veteran reasoning

Once profiles are persistent and linked, the product becomes something no search engine can replicate: **a Q&A interface over a specific family's wartime memory**.

Example queries:
- *"Which of my ancestors ever mentioned the word 'home'? What did they mean each time?"*
- *"Walk me through my family's December 1944. Where was each of them?"*
- *"Both Grandpa and Great-Uncle Tom were in the Pacific — did their paths ever cross?"*

### Architecture

A **Family Archivist** agent with:
- **Tool use**: `list_profiles`, `get_profile`, `query_fragments` (semantic search), `query_graph` (structured traversal)
- **Extended thinking**: these are reflective questions, not lookups
- **Memory tool**: the Archivist remembers prior conversations with the same user so follow-ups don't restart from zero
- **Sub-agents**: the Archivist can spawn the v1 Narrator as a sub-agent to compose new letters answering a specific question ("write a letter from Grandpa to me about the week he got frostbite")

### Why this is a Claude-shaped problem

Every other system can match keywords. Only a language model can hold the tone difference between "Grandpa never talked about the war" and "Grandpa talked about the war all the time but never about the people." The Archivist is where depth of character — not just depth of integration — becomes the product.

## Phase 5 — Community memorial

Opt-in, privacy-first. Families can choose to publish individual profiles to a shared public archive — the descendants of someone else in the same unit can find them.

- Default: everything is private to the owner account.
- Per-profile flag: make this veteran's profile discoverable in the public index.
- Contact is brokered — no direct messaging until both parties opt in.
- All public imagery stays public-domain; no publishing of private family photos without explicit consent.

This is where Lantern becomes a tool for historians too. The WW2 museum archives are vast but fragmented; a crowdsourced family layer on top of them is genuinely new.

## Claude integration deepening

| Phase | New Claude surface                                                                 |
| ----- | ---------------------------------------------------------------------------------- |
| v1    | 4-agent pipeline, tool use, extended thinking, hosted web_search                   |
| v2    | Ingest pipeline reused per-source; prompt caching on stable system prompts        |
| v3    | Cross-profile entity-resolution agent; background coincidence-surfacing agent      |
| v4    | Family Archivist with memory tool, semantic search tool, sub-agent delegation      |
| v5    | **Custom MCP server** exposing a family vault to any MCP-capable LLM client       |
| v5    | **Published Claude Skill**: "heirloom-writing" skill other builders can import    |

The MCP server in v5 is the piece that makes the project interesting beyond its own UI — a Notion plugin, a Claude Desktop integration, even a custom agent in Claude Code could all read a family's vault through the same interface.

## Technical requirements by phase

| Phase | Storage          | Auth              | Compute                       | New deps                    |
| ----- | ---------------- | ----------------- | ----------------------------- | --------------------------- |
| v1    | in-memory        | none              | Vercel Fluid                  | —                           |
| v2    | Postgres + blob  | magic-link email  | Vercel Fluid + queue (Inngest) | drizzle, resend, inngest    |
| v3    | + pgvector       | same              | same                          | graph-viz lib (cytoscape)   |
| v4    | + long-term memory store | same      | Anthropic Managed Agents?     | @anthropic-ai/managed-agents |
| v5    | + CDN for public assets | OAuth (Google) | same + MCP host            | @modelcontextprotocol/sdk   |

## Privacy posture

Family memory is sensitive. The posture compounds with scale:

- **v2**: private-by-default. One owner per profile. No analytics that read content.
- **v3**: graph is per-account; cross-family links only exist if both accounts opt in.
- **v4**: the Archivist agent runs in the user's session, not a shared pool; no training on user content.
- **v5**: public archive is opt-in per-profile, not per-account. Granular — a descendant can publish the D-Day veteran but keep the domestic-abuse survivor grandmother private.

## What we are NOT building

(Keeping the discipline of the brief.)

- **No AI-generated imagery of the actual veteran.** Period photos and real archival images only. We will never synthesize a "photo of Grandpa at Normandy."
- **No synthesized voices.** The testimonies stay in their original recordings.
- **No chat-with-the-dead "talk to your grandpa" UX.** The Archivist reasons about the veteran from sources. It does not impersonate.
- **No ads, ever.** The moment a third party is paying for access to family memory, the product becomes something else.

## Open questions

Things to figure out before writing a line of Phase 2 code:

1. **Where does the profile live when the account is closed?** Forever, as an heirloom? Inherited to a named next-of-kin? Deleted? This is a product question, not an engineering one.
2. **How do we handle conflicting testimony?** If two veterans remember the same event differently, we should show both, not pick a winner — but the UX for that has to be careful.
3. **What's the right granularity for kinship?** "Great-grandfather on mother's side" is enough to render; a full genealogy tree is probably overkill.
4. **Is there a bridge to Ancestry / FamilySearch?** They have the family tree; we have the voice. A read-only import could save users hours.
5. **What does "done" look like for a profile?** A completed profile has how many sources? How many letters? Or is it explicitly never done, like a living document?

## First-order next steps

If Phase 2 starts Monday, the first week is:

- [ ] Decide the storage provider (Postgres via Neon/Supabase; blob via Vercel Blob)
- [ ] Scaffold schema + migrations for `veteran_profiles`, `sources`, `fragments`, `letters`
- [ ] Move the current pipeline into an Inngest function triggered per source
- [ ] Build `/profiles` list + `/profile/:id` detail page
- [ ] Magic-link auth (resend.dev is trivial to wire)
- [ ] Port the fixture into a seeded profile so the demo still works end-to-end

That's roughly a week of focused work, not a quarter. The scope is deliberately small — ship v2 as something real families can use before trying to build the graph.
