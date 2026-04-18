"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Lantern } from "@/components/Lantern";

interface Preset {
  fixtureId: string;
  label: string;
  theater: string;
  disabled?: boolean;
}

interface HeroProps {
  url: string;
  onUrlChange: (value: string) => void;
  onSubmit: () => void;
  busy: boolean;
  presets: ReadonlyArray<Preset>;
  onPresetClick: (preset: Preset) => void;
  error?: string;
}

const HEADLINE_LINES: ReadonlyArray<ReadonlyArray<string>> = [
  ["Before", "the", "last", "voice"],
  ["goes", "quiet."],
];

export function Hero({
  url,
  onUrlChange,
  onSubmit,
  busy,
  presets,
  onPresetClick,
  error,
}: HeroProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (url.trim().length > 0 && !busy) onSubmit();
  }

  return (
    <section className="hero-surface relative overflow-hidden border-b border-[var(--rule)]">
      <div className="paper-grain absolute inset-0" aria-hidden />

      <div className="hero-corner hero-corner-tl" aria-hidden />
      <div className="hero-corner hero-corner-tr" aria-hidden />
      <div className="hero-corner hero-corner-bl" aria-hidden />
      <div className="hero-corner hero-corner-br" aria-hidden />

      <WaxStamp className="hidden md:block absolute top-12 right-14 w-[116px] h-[116px] text-[var(--ink-soft)] z-[1]" />

      <div className="relative max-w-[1240px] mx-auto px-6 md:px-14 pt-16 pb-20 md:pt-20 md:pb-28">
        {/* Masthead */}
        <div
          className="reveal flex items-center gap-4 mb-10 md:mb-14"
          style={{ animationDelay: "200ms" }}
        >
          <span className="eyebrow text-[var(--ink-soft)]">Lantern</span>
          <span className="inline-block h-[1px] w-10 bg-[var(--rule)]" />
          <span className="eyebrow text-[var(--ink-ghost)]">
            Vol.&nbsp;I · No.&nbsp;001
          </span>
          <span className="inline-block h-[1px] w-10 bg-[var(--rule)]" />
          <span className="eyebrow text-[var(--ink-ghost)]">
            Claude Hackathon MMXXVI
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-start">
          {/* ── LEFT: headline + data + form ── */}
          <div className="lg:col-span-7 flex flex-col gap-10">
            <div className="flex flex-col gap-6">
              <div
                className="reveal flex items-baseline gap-3"
                style={{ animationDelay: "340ms" }}
              >
                <span className="eyebrow text-[var(--ink-soft)]">
                  As of 18 April 2026
                </span>
                <span className="flex-1 inline-block h-[1px] bg-[var(--rule)] max-w-[120px]" />
              </div>

              <h1 className="display-hero">
                {HEADLINE_LINES.map((line, lineIdx) => (
                  <span key={lineIdx} className="block">
                    {line.map((word, wordIdx) => {
                      const order = lineIdx * 4 + wordIdx;
                      const delay = 620 + order * 85;
                      const isEmphasis = lineIdx === 1 && word === "quiet.";
                      return (
                        <span key={wordIdx} className="inline-block">
                          <span className="hero-word">
                            <span
                              className="hero-word-inner"
                              style={{
                                animationDelay: `${delay}ms`,
                                color: isEmphasis
                                  ? "var(--ember-core)"
                                  : undefined,
                              }}
                            >
                              {word}
                            </span>
                          </span>
                          {wordIdx < line.length - 1 ? (
                            <span className="inline-block w-[0.25em]" />
                          ) : null}
                        </span>
                      );
                    })}
                  </span>
                ))}
              </h1>

              {/* Live counter — reinforces urgency without melodrama */}
              <div
                className="reveal flex flex-wrap items-baseline gap-x-4 gap-y-2 pt-2"
                style={{ animationDelay: "1280ms" }}
              >
                <span className="dateline text-[var(--ink)]">
                  <CountUp target={100413} duration={1600} startDelay={1300} />
                </span>
                <span className="body-italic text-[var(--ink-soft)] text-[17px]">
                  voices still among us.
                </span>
                <span className="eyebrow text-[var(--ember-core)]">
                  ≈ 300 fall silent each day
                </span>
              </div>
            </div>

            <p
              className="reveal body-lg max-w-[58ch] text-[var(--ink-soft)]"
              style={{ animationDelay: "1460ms" }}
            >
              Paste a veteran&rsquo;s YouTube testimony. Four Claude agents
              listen, verify with public archives, map every person, place, and
              date — then a narrator writes{" "}
              <em className="text-[var(--ink)]">an illustrated letter</em> to a
              descendant they will never meet.
            </p>

            {/* CTA form */}
            <form
              onSubmit={handleSubmit}
              className="reveal flex flex-col gap-4"
              style={{ animationDelay: "1620ms" }}
            >
              <label
                htmlFor="hero-url"
                className="eyebrow text-[var(--ink-soft)]"
              >
                Paste a testimony URL
              </label>
              <div className="relative flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 group">
                  <span className="absolute inset-y-0 left-4 flex items-center text-[var(--ember-core)] pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle
                        cx="8"
                        cy="8"
                        r="7"
                        stroke="currentColor"
                        strokeWidth="1"
                        opacity="0.4"
                      />
                      <circle cx="8" cy="8" r="2.2" fill="currentColor" />
                    </svg>
                  </span>
                  <input
                    id="hero-url"
                    type="url"
                    value={url}
                    onChange={(e) => onUrlChange(e.target.value)}
                    placeholder="https://youtube.com/watch?v=…"
                    inputMode="url"
                    spellCheck={false}
                    className="w-full pl-11 pr-4 py-[14px] rounded-[var(--radius-btn)] bg-[var(--input-bg)] border border-[var(--rule)] text-[16px] text-[var(--ink)] placeholder:text-[var(--ink-ghost)] focus:border-[var(--ember)] focus:bg-white focus:outline-none transition-all duration-200 font-serif"
                    style={{ fontFamily: "var(--font-body)" }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy || url.trim().length === 0}
                  className="group relative inline-flex items-center justify-center gap-2 px-6 py-[14px] rounded-[var(--radius-btn)] bg-[var(--ink)] text-[var(--parchment)] font-semibold tracking-wide transition-all duration-200 hover:bg-[var(--ember-core)] hover:ember-glow active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--ink)] disabled:hover:shadow-none"
                  style={{
                    fontFamily: "var(--font-typewriter)",
                    fontSize: 13,
                    letterSpacing: "0.18em",
                  }}
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-[var(--ember)] group-hover:bg-[var(--ember-bright)] transition-colors" />
                  <span>{busy ? "LISTENING…" : "LIGHT THE LANTERN"}</span>
                </button>
              </div>

              {/* Preset buttons as a ledger row */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center gap-3">
                  <span className="eyebrow text-[var(--ink-ghost)]">
                    Or witness
                  </span>
                  <span className="flex-1 ink-rule-dotted" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {presets.map((p) => (
                    <button
                      key={p.fixtureId}
                      type="button"
                      onClick={() => !p.disabled && onPresetClick(p)}
                      disabled={p.disabled}
                      className="group relative inline-flex items-center gap-2 px-3 py-[7px] rounded-[var(--radius-btn)] border border-[var(--rule)] bg-[var(--input-bg)] hover:bg-white hover:border-[var(--ember)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <span className="inline-block w-[6px] h-[6px] rounded-full bg-[var(--ember)] opacity-50 group-hover:opacity-100 group-hover:shadow-[0_0_8px_oklch(0.76_0.16_58)] transition-all" />
                      <span
                        className="text-[13px] text-[var(--ink)]"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        {p.label}
                        {p.disabled ? (
                          <span className="ml-1 text-[var(--ink-ghost)] italic">
                            · soon
                          </span>
                        ) : null}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </form>

            {error ? (
              <div
                className="whisper-in flex items-start gap-3 max-w-[60ch] px-4 py-3 bg-[var(--error-bg)] border border-[var(--error-border)] rounded-[var(--radius-btn)]"
                role="alert"
              >
                <span
                  className="text-[var(--ember-core)] text-[14px] mt-[2px]"
                  aria-hidden
                >
                  ✕
                </span>
                <p className="caption text-[var(--ink)]">{error}</p>
              </div>
            ) : null}
          </div>

          {/* ── RIGHT: animated lantern scene ── */}
          <div className="lg:col-span-5 flex items-center justify-center relative min-h-[420px] lg:min-h-[620px]">
            {/* Faint frame around the lantern — like a photo plate */}
            <div
              className="absolute inset-x-[5%] top-[4%] bottom-[4%] border border-[var(--rule-soft)] pointer-events-none hidden lg:block"
              aria-hidden
            />
            <div
              className="relative reveal"
              style={{ animationDelay: "520ms" }}
            >
              <Lantern size={360} />
            </div>

            {/* Annotation under the lantern */}
            <div
              className="reveal absolute left-1/2 -translate-x-1/2 bottom-2 flex flex-col items-center gap-1 text-center hidden md:flex"
              style={{ animationDelay: "1800ms" }}
            >
              <span className="eyebrow text-[var(--ink-ghost)]">
                Fig.&nbsp;01 — A kept flame
              </span>
              <span className="body-italic text-[var(--ink-ghost)] text-[13px] max-w-[240px]">
                carried by four agents, handed to one future reader.
              </span>
            </div>
          </div>
        </div>

        {/* Bottom ledger: the four agents, previewed as a running footer */}
        <div
          className="reveal mt-14 md:mt-20 flex items-center gap-5 flex-wrap"
          style={{ animationDelay: "1980ms" }}
        >
          <span className="eyebrow text-[var(--ink-soft)]">The process</span>
          <span className="h-[1px] w-10 bg-[var(--rule)]" />
          <AgentChip
            index="01"
            name="Excavator"
            detail="hears what's said between the lines"
          />
          <Arrow />
          <AgentChip
            index="02"
            name="Fact-Weaver"
            detail="verifies against the archives"
          />
          <Arrow />
          <AgentChip
            index="03"
            name="Memory-Graph"
            detail="maps every person, place, date"
          />
          <Arrow />
          <AgentChip
            index="04"
            name="Narrator"
            detail="writes to a descendant not yet born"
            emphasis
          />
        </div>
      </div>
    </section>
  );
}

function AgentChip({
  index,
  name,
  detail,
  emphasis,
}: {
  index: string;
  name: string;
  detail: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2 max-w-[240px]">
      <span className="eyebrow text-[var(--ink-ghost)]">{index}</span>
      <div className="flex flex-col">
        <span
          className="text-[15px] leading-tight"
          style={{
            fontFamily: "var(--font-editorial)",
            color: emphasis ? "var(--ember-core)" : "var(--ink)",
          }}
        >
          {name}
        </span>
        <span className="caption-muted text-[12px] italic">{detail}</span>
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <svg
      width="18"
      height="10"
      viewBox="0 0 18 10"
      aria-hidden
      className="text-[var(--ink-ghost)] shrink-0"
    >
      <path
        d="M1 5 H16 M12 1 L16 5 L12 9"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WaxStamp({ className }: { className?: string }) {
  return (
    <div className={`stamp ${className ?? ""}`}>
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <defs>
          <path
            id="stamp-circle"
            d="M 60 60 m -42 0 a 42 42 0 1 1 84 0 a 42 42 0 1 1 -84 0"
          />
        </defs>
        <g className="stamp-ring">
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.6"
            strokeDasharray="1.5 3"
            opacity="0.55"
          />
          <circle
            cx="60"
            cy="60"
            r="47"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.9"
            opacity="0.9"
          />
          <text
            fontSize="7"
            fontFamily="var(--font-typewriter)"
            letterSpacing="2.4"
            fill="currentColor"
            opacity="0.9"
          >
            <textPath href="#stamp-circle" startOffset="0">
              LANTERN · ARCHIVE · CLAUDE · MMXXVI ·
            </textPath>
          </text>
        </g>
        <g transform="translate(60 60)">
          <circle
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.4"
          />
          {/* Mini lantern silhouette */}
          <g opacity="0.85">
            <circle
              cx="0"
              cy="-12"
              r="3"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.7"
            />
            <path
              d="M -5 -8 L 5 -8 L 6 -4 L -6 -4 Z"
              fill="currentColor"
              opacity="0.8"
            />
            <path
              d="M -7 -3 L 7 -3 L 7 9 L -7 9 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
            />
            <ellipse
              cx="0"
              cy="4"
              rx="2"
              ry="4"
              fill="var(--ember)"
              opacity="0.9"
            />
            <path
              d="M -8 9 L 8 9 L 7 12 L -7 12 Z"
              fill="currentColor"
              opacity="0.7"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}

interface CountUpProps {
  target: number;
  duration: number;
  startDelay?: number;
}

function CountUp({ target, duration, startDelay = 0 }: CountUpProps) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      setValue(target);
      return;
    }

    timerRef.current = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 4);
        setValue(Math.round(target * eased));
        if (t < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }, startDelay);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (timerRef.current != null) clearTimeout(timerRef.current);
    };
  }, [target, duration, startDelay]);

  return (
    <span
      className="tabular-nums"
      aria-label={`${target.toLocaleString()} remaining`}
    >
      {value.toLocaleString()}
    </span>
  );
}
