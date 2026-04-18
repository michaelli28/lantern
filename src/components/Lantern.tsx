import type { CSSProperties } from "react";

interface LanternProps {
  size?: number;
  className?: string;
}

const EMBERS = [
  { delay: 0, dur: 4.2, x1: 0, x2: -6, x3: 4, left: 48, tint: "warm" },
  { delay: 0.9, dur: 5.1, x1: 2, x2: 8, x3: -2, left: 52, tint: "bright" },
  { delay: 1.8, dur: 4.6, x1: -1, x2: -10, x3: 6, left: 46, tint: "warm" },
  { delay: 2.4, dur: 5.6, x1: 3, x2: 10, x3: -4, left: 54, tint: "warm" },
  { delay: 3.1, dur: 4.4, x1: -2, x2: -4, x3: 8, left: 50, tint: "bright" },
  { delay: 3.8, dur: 5.0, x1: 1, x2: 6, x3: -3, left: 49, tint: "warm" },
];

const DUST = [
  { delay: 0, dur: 9, dx: 24, dy: -90, top: 70, left: 14 },
  { delay: 1.3, dur: 12, dx: -18, dy: -120, top: 78, left: 68 },
  { delay: 2.6, dur: 10, dx: 14, dy: -80, top: 62, left: 28 },
  { delay: 4.1, dur: 11, dx: -22, dy: -100, top: 84, left: 80 },
  { delay: 5.5, dur: 13, dx: 20, dy: -110, top: 66, left: 10 },
  { delay: 6.8, dur: 10, dx: -14, dy: -70, top: 74, left: 86 },
];

export function Lantern({ size = 420, className = "" }: LanternProps) {
  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size * 1.3 }}
      aria-hidden
    >
      {/* Outer radial glow */}
      <div
        className="glow absolute pointer-events-none"
        style={{
          inset: "-12% -18% -18% -18%",
          background:
            "radial-gradient(circle at 50% 56%, oklch(0.76 0.165 58 / 0.42) 0%, oklch(0.76 0.165 58 / 0.18) 28%, oklch(0.76 0.165 58 / 0.06) 46%, transparent 68%)",
          filter: "blur(22px)",
        }}
      />

      {/* Ambient dust specks */}
      <div className="absolute inset-0 pointer-events-none">
        {DUST.map((d, i) => (
          <span
            key={`dust-${i}`}
            className="dust absolute block rounded-full"
            style={
              {
                width: 2,
                height: 2,
                background: "oklch(0.76 0.12 58 / 0.6)",
                top: `${d.top}%`,
                left: `${d.left}%`,
                animation: `dust-drift ${d.dur}s linear ${d.delay}s infinite`,
                ["--dust-dx" as string]: `${d.dx}px`,
                ["--dust-dy" as string]: `${d.dy}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      {/* Rising embers (anchored to flame zone) */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: 0,
          right: 0,
          top: "42%",
          bottom: "30%",
        }}
      >
        {EMBERS.map((e, i) => (
          <span
            key={`ember-${i}`}
            className="ember absolute block rounded-full"
            style={
              {
                width: e.tint === "bright" ? 4 : 3,
                height: e.tint === "bright" ? 4 : 3,
                left: `${e.left}%`,
                bottom: 0,
                background:
                  e.tint === "bright"
                    ? "radial-gradient(circle, oklch(0.97 0.11 85) 0%, oklch(0.76 0.18 58) 55%, transparent 100%)"
                    : "radial-gradient(circle, oklch(0.9 0.12 65) 0%, oklch(0.68 0.2 45) 60%, transparent 100%)",
                filter: "blur(0.4px)",
                animation: `ember-rise ${e.dur}s ease-out ${e.delay}s infinite`,
                ["--ember-x-1" as string]: `${e.x1}px`,
                ["--ember-x-2" as string]: `${e.x2}px`,
                ["--ember-x-3" as string]: `${e.x3}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      {/* Lantern SVG */}
      <svg
        viewBox="0 0 240 340"
        className="relative block w-full h-full"
        style={{ color: "var(--ink)" }}
      >
        <defs>
          <radialGradient id="flame-outer" cx="50%" cy="78%" r="62%">
            <stop
              offset="0%"
              stopColor="oklch(0.94 0.12 85)"
              stopOpacity="0.95"
            />
            <stop
              offset="30%"
              stopColor="oklch(0.76 0.17 60)"
              stopOpacity="0.9"
            />
            <stop
              offset="70%"
              stopColor="oklch(0.62 0.2 42)"
              stopOpacity="0.55"
            />
            <stop
              offset="100%"
              stopColor="oklch(0.5 0.18 38)"
              stopOpacity="0"
            />
          </radialGradient>
          <radialGradient id="flame-inner" cx="50%" cy="72%" r="55%">
            <stop offset="0%" stopColor="oklch(0.99 0.05 92)" />
            <stop offset="40%" stopColor="oklch(0.9 0.14 80)" />
            <stop
              offset="100%"
              stopColor="oklch(0.7 0.19 55)"
              stopOpacity="0"
            />
          </radialGradient>
          <linearGradient id="glass-body" x1="0" y1="0" x2="1" y2="0">
            <stop
              offset="0%"
              stopColor="oklch(0.76 0.165 58)"
              stopOpacity="0.03"
            />
            <stop
              offset="40%"
              stopColor="oklch(0.76 0.165 58)"
              stopOpacity="0.1"
            />
            <stop
              offset="100%"
              stopColor="oklch(0.62 0.21 40)"
              stopOpacity="0.05"
            />
          </linearGradient>
          <linearGradient id="metal" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.48 0.03 58)" />
            <stop offset="50%" stopColor="oklch(0.32 0.024 55)" />
            <stop offset="100%" stopColor="oklch(0.48 0.03 58)" />
          </linearGradient>
          <filter id="flame-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>

        {/* ── Hanging wire ── */}
        <line
          x1="120"
          y1="0"
          x2="120"
          y2="14"
          stroke="var(--ink)"
          strokeWidth="0.8"
          opacity="0.4"
        />

        {/* ── Ring handle ── */}
        <circle
          cx="120"
          cy="26"
          r="13"
          fill="none"
          stroke="url(#metal)"
          strokeWidth="1.6"
        />
        <circle
          cx="120"
          cy="26"
          r="9"
          fill="none"
          stroke="var(--ink)"
          strokeWidth="0.6"
          opacity="0.35"
        />

        {/* Connector wires from ring to cap */}
        <path
          d="M112 38 Q 108 48 104 60 M128 38 Q 132 48 136 60"
          fill="none"
          stroke="url(#metal)"
          strokeWidth="1.3"
          strokeLinecap="round"
        />

        {/* ── Cap (dome) ── */}
        <path
          d="M 90 64 Q 120 46 150 64 L 152 70 L 88 70 Z"
          fill="oklch(0.38 0.028 55)"
          stroke="var(--ink)"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        <path
          d="M 90 64 Q 120 46 150 64"
          fill="none"
          stroke="oklch(0.72 0.04 60)"
          strokeWidth="0.6"
          opacity="0.6"
        />

        {/* Upper collar */}
        <path
          d="M 92 70 L 148 70 L 144 84 L 96 84 Z"
          fill="oklch(0.42 0.03 55)"
          stroke="var(--ink)"
          strokeWidth="1"
        />
        {/* Vent slits */}
        <line
          x1="102"
          y1="76"
          x2="138"
          y2="76"
          stroke="var(--ink)"
          strokeWidth="0.8"
          opacity="0.55"
        />
        <line
          x1="104"
          y1="79.5"
          x2="136"
          y2="79.5"
          stroke="var(--ink)"
          strokeWidth="0.6"
          opacity="0.4"
        />

        {/* ── Chamber frame wires (4) ── */}
        <path
          d="M 92 84 Q 80 98 78 118 L 78 252 Q 78 268 90 274"
          fill="none"
          stroke="url(#metal)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M 148 84 Q 160 98 162 118 L 162 252 Q 162 268 150 274"
          fill="none"
          stroke="url(#metal)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M 108 84 L 106 274"
          fill="none"
          stroke="var(--ink)"
          strokeWidth="0.8"
          opacity="0.35"
        />
        <path
          d="M 132 84 L 134 274"
          fill="none"
          stroke="var(--ink)"
          strokeWidth="0.8"
          opacity="0.35"
        />

        {/* ── Glass chamber body ── */}
        <path
          d="M 82 94 Q 80 108 80 118 L 80 256 Q 80 268 92 272 L 148 272 Q 160 268 160 256 L 160 118 Q 160 108 158 94 Z"
          fill="url(#glass-body)"
          stroke="var(--ink)"
          strokeWidth="0.8"
          opacity="0.95"
        />
        {/* Glass highlights (vertical streaks) */}
        <path
          d="M 92 120 L 92 250"
          stroke="oklch(0.99 0.05 92)"
          strokeWidth="2.4"
          strokeLinecap="round"
          opacity="0.2"
        />
        <path
          d="M 148 140 L 148 240"
          stroke="oklch(0.99 0.05 92)"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.14"
        />

        {/* ── Flame ── */}
        <g className="flame-group">
          {/* Outer halo */}
          <ellipse
            cx="120"
            cy="220"
            rx="36"
            ry="46"
            fill="url(#flame-outer)"
            filter="url(#flame-blur)"
            opacity="0.85"
          />
          {/* Flame body */}
          <path
            d="M 120 256
               C 102 238 102 212 112 190
               C 117 178 118 168 120 158
               C 122 168 123 178 128 190
               C 138 212 138 238 120 256 Z"
            fill="url(#flame-outer)"
            opacity="0.96"
          />
          {/* Flame inner bright */}
          <path
            className="flame-core"
            d="M 120 252
               C 110 236 110 216 116 202
               C 119 194 120 184 120 176
               C 120 184 121 194 124 202
               C 130 216 130 236 120 252 Z"
            fill="url(#flame-inner)"
          />
          {/* Bright core */}
          <ellipse
            className="flame-core"
            cx="120"
            cy="228"
            rx="4"
            ry="14"
            fill="oklch(0.99 0.05 92)"
            opacity="0.9"
          />
          {/* Wick */}
          <rect
            x="119"
            y="248"
            width="2"
            height="10"
            fill="oklch(0.18 0.01 55)"
          />
        </g>

        {/* Subtle wick base */}
        <circle
          cx="120"
          cy="262"
          r="4"
          fill="oklch(0.36 0.03 55)"
          opacity="0.6"
        />

        {/* ── Lower collar + base ── */}
        <path
          d="M 86 272 L 154 272 L 150 286 L 90 286 Z"
          fill="oklch(0.42 0.03 55)"
          stroke="var(--ink)"
          strokeWidth="1"
        />
        <line
          x1="96"
          y1="279"
          x2="144"
          y2="279"
          stroke="var(--ink)"
          strokeWidth="0.6"
          opacity="0.5"
        />

        {/* Fuel reservoir */}
        <path
          d="M 88 286 Q 86 300 94 308 L 146 308 Q 154 300 152 286 Z"
          fill="oklch(0.4 0.028 55)"
          stroke="var(--ink)"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <ellipse
          cx="120"
          cy="294"
          rx="20"
          ry="3"
          fill="none"
          stroke="oklch(0.72 0.04 60)"
          strokeWidth="0.6"
          opacity="0.5"
        />

        {/* Base plate */}
        <rect
          x="84"
          y="308"
          width="72"
          height="6"
          rx="1"
          fill="oklch(0.32 0.024 55)"
          stroke="var(--ink)"
          strokeWidth="0.8"
        />
        {/* Feet */}
        <rect x="92" y="314" width="8" height="6" fill="oklch(0.3 0.022 55)" />
        <rect x="140" y="314" width="8" height="6" fill="oklch(0.3 0.022 55)" />

        {/* Maker's mark — a tiny "L" engraved on the base */}
        <text
          x="120"
          y="313"
          textAnchor="middle"
          fontSize="5"
          fontFamily="var(--font-typewriter)"
          fill="oklch(0.72 0.08 60)"
          opacity="0.75"
          letterSpacing="1"
        >
          LANTERN · MMXXVI
        </text>
      </svg>

      {/* Ground reflection — a soft ellipse under the lantern */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: "15%",
          right: "15%",
          bottom: "-2%",
          height: 18,
          background:
            "radial-gradient(ellipse at center, oklch(0.76 0.16 58 / 0.35) 0%, transparent 70%)",
          filter: "blur(6px)",
        }}
      />
    </div>
  );
}
