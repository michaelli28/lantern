"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { AgentTrace } from "@/components/AgentTrace";
import { Hero } from "@/components/Hero";
import { LetterRender } from "@/components/LetterRender";
import { Badge } from "@/components/UI";
import { getFixture } from "@/lib/fixtures";
import { playFixture, runStream } from "@/lib/sse";
import type {
  AgentName,
  Entity,
  Fact,
  Fragment,
  Letter,
  RunRequest,
  Stage,
  StreamEvent,
} from "@/lib/types";

type AgentStatus = "idle" | "running" | "done";

type RunState = {
  runId: number;
  stage: Stage;
  stageMessage: string;
  title?: string;
  speaker?: string;
  transcript?: string;
  fragments: Fragment[];
  facts: Fact[];
  entities: Entity[];
  thinking: Array<{ agent: AgentName; text: string }>;
  agentStatus: Record<AgentName, AgentStatus>;
  letterChunks: string[];
  letter?: Letter;
  error?: string;
};

type Action =
  | StreamEvent
  | { type: "__reset"; title?: string; speaker?: string };

function freshState(runId: number, title?: string, speaker?: string): RunState {
  return {
    runId,
    stage: "idle",
    stageMessage: "Ready.",
    title,
    speaker,
    fragments: [],
    facts: [],
    entities: [],
    thinking: [],
    agentStatus: {
      excavator: "idle",
      fact_weaver: "idle",
      memory_graph: "idle",
      narrator: "idle",
    },
    letterChunks: [],
  };
}

function reducer(state: RunState, event: Action): RunState {
  switch (event.type) {
    case "__reset":
      return freshState(state.runId + 1, event.title, event.speaker);
    case "status":
      return { ...state, stage: event.stage, stageMessage: event.message };
    case "transcript":
      return {
        ...state,
        transcript: event.text,
        title: event.title ?? state.title,
        speaker: event.speaker ?? state.speaker,
      };
    case "fragment":
      return { ...state, fragments: [...state.fragments, event.fragment] };
    case "fact":
      return { ...state, facts: [...state.facts, event.fact] };
    case "entity":
      return { ...state, entities: [...state.entities, event.entity] };
    case "thinking":
      return {
        ...state,
        thinking: [...state.thinking, { agent: event.agent, text: event.text }],
      };
    case "agent_start":
      return {
        ...state,
        agentStatus: { ...state.agentStatus, [event.agent]: "running" },
      };
    case "agent_end":
      return {
        ...state,
        agentStatus: { ...state.agentStatus, [event.agent]: "done" },
      };
    case "letter_chunk":
      return { ...state, letterChunks: [...state.letterChunks, event.text] };
    case "letter_complete":
      return { ...state, letter: event.letter, stage: "complete" };
    case "error":
      return { ...state, error: event.message, stage: "error" };
    default:
      return state;
  }
}

const PRESETS = [
  {
    fixtureId: "norman-duncan",
    label: "Norman · D-Day · 101st Airborne",
    theater: "Europe",
  },
  {
    fixtureId: "hannah-rivera",
    label: "Hannah · USO · Home front",
    theater: "Home front",
    disabled: true,
  },
  {
    fixtureId: "tom-okada",
    label: "Tom · Pacific · 442nd",
    theater: "Pacific",
    disabled: true,
  },
];

export default function Home() {
  const [state, dispatch] = useReducer(reducer, freshState(0));
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function run(body: RunRequest) {
    if (busy) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setBusy(true);
    dispatch({ type: "__reset", title: body.title, speaker: body.speaker });

    try {
      const events = body.fixtureId ? getFixture(body.fixtureId) : null;
      if (events) {
        await playFixture(events, (e) => dispatch(e));
      } else if (body.youtubeUrl) {
        await runStream(body, (e) => dispatch(e), abortRef.current.signal);
      } else {
        throw new Error("Provide a YouTube URL or pick a preset.");
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      dispatch({
        type: "error",
        message: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setBusy(false);
    }
  }

  // Auto-play the default preset when ?fixture=1 is present.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    if (q.get("fixture") === "1") {
      const preset = PRESETS[0];
      void run({
        fixtureId: preset.fixtureId,
        title: preset.label,
        speaker: preset.label.split("·")[0].trim(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const letterCharCount = state.letterChunks.join("").length;
  const streamingLetter = !state.letter
    ? state.letterChunks.join("")
    : undefined;
  const anyActivity =
    state.stage !== "idle" ||
    state.fragments.length > 0 ||
    state.facts.length > 0 ||
    state.entities.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Nav ── */}
      <nav className="w-full border-b border-[var(--rule)] bg-[var(--nav-bg)] backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-[1240px] mx-auto px-6 md:px-14 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LanternMark />
            <span
              className="text-[17px] leading-none"
              style={{
                fontFamily: "var(--font-editorial)",
                letterSpacing: "0.04em",
                color: "var(--ink)",
              }}
            >
              Lantern
            </span>
            <span
              className="inline-block h-3 w-px bg-[var(--rule)] mx-1"
              aria-hidden
            />
            <span
              className="text-[11px] tracking-[0.22em] uppercase text-[var(--ink-ghost)]"
              style={{ fontFamily: "var(--font-typewriter)" }}
            >
              An archive of vanishing voices
            </span>
          </div>
          <div className="flex items-center gap-5">
            <span
              className="hidden md:inline text-[11px] tracking-[0.22em] uppercase text-[var(--ink-ghost)]"
              style={{ fontFamily: "var(--font-typewriter)" }}
            >
              Claude Hackathon · MMXXVI
            </span>
            <a
              href="https://github.com/justanothernoob4648/claudehacks-brotoato"
              target="_blank"
              rel="noreferrer noopener"
              className="text-[13px] text-[var(--ink-soft)] hover:text-[var(--ember-core)] underline underline-offset-[5px] decoration-[var(--rule)] hover:decoration-[var(--ember)] transition-colors"
              style={{ fontFamily: "var(--font-body)" }}
            >
              GitHub
            </a>
          </div>
        </div>
      </nav>

      <Hero
        url={url}
        onUrlChange={setUrl}
        onSubmit={() => {
          if (url.trim()) void run({ youtubeUrl: url.trim() });
        }}
        busy={busy}
        presets={PRESETS}
        onPresetClick={(p) => {
          if (p.disabled) return;
          void run({
            fixtureId: p.fixtureId,
            title: p.label,
            speaker: p.label.split("·")[0].trim(),
          });
        }}
        error={state.error}
      />

      {/* ── Agent trace (warm section) ── */}
      <section className="w-full bg-[var(--bg-warm)] border-y border-[rgba(0,0,0,0.06)]">
        <div className="max-w-[1200px] mx-auto px-6 py-14 flex flex-col gap-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="heading-md">Four agents at work</h2>
              <p className="caption-muted">
                {anyActivity
                  ? state.stageMessage
                  : "Pick a preset or paste a URL to see the agents run."}
              </p>
            </div>
            {state.title ? <Badge tone="neutral">{state.title}</Badge> : null}
          </div>
          <AgentTrace
            agentStatus={state.agentStatus}
            fragments={state.fragments}
            facts={state.facts}
            entities={state.entities}
            thinking={state.thinking}
            letterCharCount={letterCharCount}
          />
        </div>
      </section>

      {/* ── Letter ── */}
      <section className="w-full bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-20">
          <div className="flex flex-col items-center gap-3 mb-10">
            <Badge tone="ok">The heirloom</Badge>
            <h2 className="display-secondary text-center">The letter.</h2>
          </div>
          <LetterRender
            letter={state.letter}
            streamingText={streamingLetter}
            speaker={state.speaker}
          />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="w-full border-t border-[rgba(0,0,0,0.08)] bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <p className="caption-muted">
            Testimonies sourced from the Library of Congress Veterans History
            Project, the National WWII Museum, and the WWII Foundation. Imagery
            public-domain via NARA and Wikimedia Commons.
          </p>
          <p className="caption-muted">
            Built in 90 minutes · Claude Hackathon 2026
          </p>
        </div>
      </footer>
    </div>
  );
}

function LanternMark() {
  return (
    <span
      aria-hidden
      className="relative inline-flex items-center justify-center"
      style={{ width: 26, height: 30 }}
    >
      <span
        className="absolute inset-0 rounded-full blur-md"
        style={{
          background:
            "radial-gradient(circle at 50% 60%, oklch(0.76 0.17 58 / 0.5) 0%, transparent 70%)",
        }}
      />
      <svg
        viewBox="0 0 26 30"
        className="relative"
        style={{ color: "var(--ink)" }}
      >
        {/* Ring */}
        <circle
          cx="13"
          cy="3"
          r="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.9"
        />
        {/* Cap */}
        <path
          d="M 7 8 L 19 8 L 18 10 L 8 10 Z"
          fill="currentColor"
          opacity="0.85"
        />
        {/* Chamber */}
        <path
          d="M 7 10 L 19 10 L 19 22 L 7 22 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.9"
        />
        {/* Flame */}
        <ellipse cx="13" cy="17" rx="1.6" ry="3.2" fill="oklch(0.76 0.17 58)" />
        <ellipse
          cx="13"
          cy="16.5"
          rx="0.7"
          ry="1.8"
          fill="oklch(0.97 0.1 85)"
        />
        {/* Base */}
        <rect
          x="6"
          y="22"
          width="14"
          height="2"
          fill="currentColor"
          opacity="0.85"
        />
        <rect
          x="8"
          y="24"
          width="2"
          height="2"
          fill="currentColor"
          opacity="0.7"
        />
        <rect
          x="16"
          y="24"
          width="2"
          height="2"
          fill="currentColor"
          opacity="0.7"
        />
      </svg>
    </span>
  );
}
