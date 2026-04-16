import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, random } from "remotion";

// Brand palette (sage-forward, matches presentation)
const SAGE_DEEP = "#3d5a4a";
const SAGE = "#6b8573";
const SAGE_SOFT = "#a8bfb0";
const BG = "#f5f2ec";
const INK = "#1a1f1c";

// Perfectly periodic loop helpers
const TAU = Math.PI * 2;
const sin = (t: number, phase = 0) => Math.sin(t * TAU + phase);
const cos = (t: number, phase = 0) => Math.cos(t * TAU + phase);

// Damped-oscillator "spring" that loops seamlessly: sum of two sines with
// matching periods so value & derivative are identical at t=0 and t=1.
const springLoop = (t: number, amp = 1, harmonic = 2) => {
  const primary = sin(t);
  const overshoot = sin(t, 0) * Math.exp(-3 * (1 - Math.cos(t * TAU))) * 0.0;
  // Simpler: two harmonics, both periodic — produces a gentle "settle" feel.
  return amp * (primary * 0.7 + sin(t * harmonic) * 0.3);
};

export const IntroBg: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const t = frame / durationInFrames; // 0..1 across the loop

  // ---------- Breathing base gradient ----------
  // Slow 1-cycle breath across the loop — warms & cools the canvas.
  const breath = 0.5 + 0.5 * sin(t); // 0..1
  const baseA = `hsl(40 22% ${93 + breath * 2}%)`;
  const baseB = `hsl(150 14% ${86 - breath * 3}%)`;

  // ---------- Layer 1 (deepest parallax) ----------
  // Huge soft sage orb drifting in a slow loop.
  const l1x = width * 0.5 + cos(t) * width * 0.06;
  const l1y = height * 0.55 + sin(t) * height * 0.04;
  const l1r = Math.max(width, height) * 0.75;

  // ---------- Layer 2 (mid parallax, opposite direction, faster) ----------
  const l2x = width * 0.62 + cos(t, Math.PI) * width * 0.11;
  const l2y = height * 0.38 + sin(t * 2) * height * 0.06;
  const l2r = Math.max(width, height) * 0.42;

  // ---------- Layer 3 (foreground drift dots) ----------
  const DOT_COUNT = 42;
  const dots = Array.from({ length: DOT_COUNT }, (_, i) => {
    const seed = i + 1;
    const baseX = random(`x${seed}`) * width;
    const baseY = random(`y${seed}`) * height;
    const driftX = sin(t, seed * 0.7) * width * 0.02;
    const driftY = cos(t, seed * 1.3) * height * 0.03;
    const r = 0.8 + random(`r${seed}`) * 2.4;
    const o = 0.04 + random(`o${seed}`) * 0.12;
    const tw = 0.5 + 0.5 * sin(t * 2, seed);
    return {
      x: baseX + driftX,
      y: baseY + driftY,
      r,
      o: o * (0.5 + tw * 0.8),
      key: i,
    };
  });

  // ---------- Light sweep with spring physics ----------
  // Sweep travels diagonally across the frame. Spring-like ease: it
  // accelerates, overshoots mid-screen, then settles off-frame. Because we
  // need a perfect loop, we use two offset sweeps so one is always active.
  const sweep = (phase: number) => {
    const tp = (t + phase) % 1;
    // Spring-ish s-curve: tanh-based with slight overshoot
    const eased = 0.5 + 0.5 * Math.tanh((tp - 0.5) * 4.5);
    // x-position of sweep center, extends past both edges
    const sx = -width * 0.4 + eased * width * 1.8;
    // vertical tilt for diagonal sweep (visual via gradient rotation)
    const intensity = Math.sin(tp * Math.PI); // 0→1→0 envelope
    return { sx, intensity };
  };
  const sweepA = sweep(0);
  const sweepB = sweep(0.5);

  // ---------- Film grain seed ----------
  const grainSeed = Math.floor(t * 60) % 8;

  return (
    <AbsoluteFill style={{ backgroundColor: BG, overflow: "hidden" }}>
      {/* Breathing base wash */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(${135 + sin(t) * 10}deg, ${baseA}, ${baseB})`,
        }}
      />

      {/* Layer 1: deepest parallax orb */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <radialGradient id="l1">
            <stop offset="0%" stopColor={SAGE_SOFT} stopOpacity="0.55" />
            <stop offset="55%" stopColor={SAGE} stopOpacity="0.18" />
            <stop offset="100%" stopColor={SAGE} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="l2">
            <stop offset="0%" stopColor={SAGE_DEEP} stopOpacity="0.38" />
            <stop offset="60%" stopColor={SAGE_DEEP} stopOpacity="0.10" />
            <stop offset="100%" stopColor={SAGE_DEEP} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.28" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <filter id="grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="2"
              seed={grainSeed}
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.18 0"
            />
          </filter>
        </defs>

        {/* Layer 1 */}
        <circle cx={l1x} cy={l1y} r={l1r} fill="url(#l1)" />

        {/* Layer 2 */}
        <circle cx={l2x} cy={l2y} r={l2r} fill="url(#l2)" />

        {/* Layer 3: drift dots */}
        {dots.map((d) => (
          <circle
            key={d.key}
            cx={d.x}
            cy={d.y}
            r={d.r}
            fill={SAGE_DEEP}
            opacity={d.o}
          />
        ))}

        {/* Light sweep A */}
        <g
          transform={`translate(${sweepA.sx} 0) rotate(-12 ${width / 2} ${height / 2})`}
          opacity={sweepA.intensity}
        >
          <rect
            x={-width * 0.25}
            y={-height * 0.2}
            width={width * 0.5}
            height={height * 1.4}
            fill="url(#sweep)"
          />
        </g>

        {/* Light sweep B (offset half-loop for seamless continuity) */}
        <g
          transform={`translate(${sweepB.sx} 0) rotate(-12 ${width / 2} ${height / 2})`}
          opacity={sweepB.intensity * 0.75}
        >
          <rect
            x={-width * 0.25}
            y={-height * 0.2}
            width={width * 0.5}
            height={height * 1.4}
            fill="url(#sweep)"
          />
        </g>

        {/* Vignette */}
        <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
          <stop offset="55%" stopColor={INK} stopOpacity="0" />
          <stop offset="100%" stopColor={INK} stopOpacity="0.22" />
        </radialGradient>
        <rect width={width} height={height} fill="url(#vignette)" />

        {/* Film grain */}
        <rect
          width={width}
          height={height}
          filter="url(#grain)"
          opacity="0.55"
        />
      </svg>
    </AbsoluteFill>
  );
};
