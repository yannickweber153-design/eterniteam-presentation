import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";

/**
 * EterniTeam Hero Intro
 * 10s @ 30fps seamless loop (300 frames).
 *
 * Layers:
 *  1. Breathing wave gradient background (navy → emerald)
 *  2. Eterniteam infinity logo — stroke-dashoffset draw-in (0–2s) + glow
 *  3. Staggered headline reveal with golden shimmer on "Lebenswerk"
 *
 * Loop seamless: every layer at frame 0 exactly matches frame 300.
 */

// Palette
const NAVY_DEEP = "#0e2037";
const NAVY = "#1B3A5C";
const NAVY_MID = "#1e4770";
const EMERALD = "#2fd2a2";
const EMERALD_SOFT = "#6ee6c4";
const GOLD = "#e0b870";
const GOLD_HOT = "#fff1c8";
const CREAM = "#f6f2e8";

const TAU = Math.PI * 2;

// Seamless-loop helper: reveal value in [0..1] that returns to 0 at end of loop.
// enterEnd: frame when reveal reaches 1. exitStart: frame when fade-out begins.
const seamlessReveal = (
  frame: number,
  total: number,
  enterEnd: number,
  exitStart: number
) => {
  if (frame <= enterEnd) {
    return interpolate(frame, [0, enterEnd], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
  }
  if (frame < exitStart) return 1;
  return interpolate(frame, [exitStart, total], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
};

// =======================================================================
// BACKGROUND — breathing wave gradient
// =======================================================================
const WaveBackground: React.FC<{ frame: number; total: number; width: number; height: number }> = ({
  frame,
  total,
  width,
  height,
}) => {
  const t = frame / total; // 0..1

  // Breathing scale (1.0 → 1.02 → 1.0 across loop, seamless)
  const breath = 1.0 + 0.02 * (1 - Math.cos(t * TAU));

  // Wave definition: produce a smooth horizontal wave at a given baseline
  const buildWavePath = (
    baselineY: number,
    amplitude: number,
    freqMultiplier: number,
    phase: number
  ) => {
    const segments = 24;
    const pts: string[] = [];
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * width;
      // Seamless wave: sin arg includes t*TAU so the whole wave drifts a full cycle
      const y =
        baselineY +
        amplitude *
          Math.sin(
            (x / width) * TAU * freqMultiplier + t * TAU + phase
          );
      pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    // Close down to bottom
    pts.push(`L ${width} ${height}`);
    pts.push(`L 0 ${height}`);
    pts.push("Z");
    return pts.join(" ");
  };

  return (
    <AbsoluteFill style={{ background: NAVY_DEEP, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${breath})`,
          transformOrigin: "50% 50%",
        }}
      >
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ position: "absolute", inset: 0 }}
        >
          <defs>
            {/* Vertical navy-emerald gradient */}
            <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={EMERALD} />
              <stop offset="45%" stopColor={NAVY_MID} />
              <stop offset="100%" stopColor={NAVY_DEEP} />
            </linearGradient>
            <linearGradient id="waveA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={EMERALD_SOFT} stopOpacity="0.55" />
              <stop offset="100%" stopColor={EMERALD} stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="waveB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={EMERALD} stopOpacity="0.42" />
              <stop offset="100%" stopColor={NAVY} stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="waveC" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={NAVY_MID} stopOpacity="0.65" />
              <stop offset="100%" stopColor={NAVY_DEEP} stopOpacity="0.25" />
            </linearGradient>
            <linearGradient id="waveD" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={NAVY} stopOpacity="0.75" />
              <stop offset="100%" stopColor={NAVY_DEEP} stopOpacity="0.9" />
            </linearGradient>

            {/* Vignette */}
            <radialGradient id="vig" cx="50%" cy="50%" r="78%">
              <stop offset="55%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
            </radialGradient>

            {/* Fine grain */}
            <filter id="bgGrain">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.9"
                numOctaves="2"
                seed={Math.floor(t * 240) % 24}
                stitchTiles="stitch"
              />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0.06  0 0 0 0 0.15  0 0 0 0 0.13  0 0 0 0.32 0"
              />
            </filter>

            {/* Blur for deep wave layers */}
            <filter id="wBlur1"><feGaussianBlur stdDeviation="10" /></filter>
            <filter id="wBlur2"><feGaussianBlur stdDeviation="4" /></filter>
          </defs>

          {/* Base gradient */}
          <rect width={width} height={height} fill="url(#bgGrad)" />

          {/* Deep wave A (soft, blurred) */}
          <path
            d={buildWavePath(height * 0.35, 95, 1.1, 0)}
            fill="url(#waveA)"
            filter="url(#wBlur1)"
          />

          {/* Wave B */}
          <path
            d={buildWavePath(height * 0.55, 70, 1.3, Math.PI / 3)}
            fill="url(#waveB)"
            filter="url(#wBlur2)"
          />

          {/* Wave C */}
          <path
            d={buildWavePath(height * 0.72, 55, 1.6, Math.PI * 0.8)}
            fill="url(#waveC)"
          />

          {/* Foreground wave D (sharp) */}
          <path
            d={buildWavePath(height * 0.88, 40, 2.1, Math.PI * 1.35)}
            fill="url(#waveD)"
          />

          {/* Vignette + grain */}
          <rect width={width} height={height} fill="url(#vig)" />
          <rect width={width} height={height} filter="url(#bgGrain)" opacity="0.45" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// =======================================================================
// LOGO — infinity symbol with stroke-dashoffset draw-in + glow
// =======================================================================
const InfinityLogo: React.FC<{ frame: number; total: number }> = ({ frame, total }) => {
  // Draw-in: 0 → 60 frames (2s). Hold: 60 → 240. Fade out: 240 → 300.
  const DRAW_END = 60;
  const FADE_START = 240;

  // Path length of our infinity path — measured: ~600. Use ample overshoot to be safe.
  const PATH_LEN = 620;

  const drawProgress = interpolate(frame, [0, DRAW_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Fade out at end for seamless loop
  const fadeOut = interpolate(frame, [FADE_START, total], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });

  // Glow intensity pulses after draw-in completes
  const glowActive = frame > DRAW_END ? 1 : 0;
  const glowPulse = glowActive
    ? 0.6 + 0.4 * Math.sin((frame - DRAW_END) * 0.08)
    : 0;

  // Seamless: at frame 0 dashoffset = PATH_LEN (invisible). Same at frame 300 (after fade-out stroke opacity = 0).
  const dashOffset = PATH_LEN * (1 - drawProgress);

  // Infinity path — figure-8, precisely balanced
  const path =
    "M 60 80 C 60 40, 120 40, 160 80 C 200 120, 260 120, 260 80 C 260 40, 200 40, 160 80 C 120 120, 60 120, 60 80 Z";

  return (
    <div
      style={{
        position: "absolute",
        top: "28%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        opacity: fadeOut,
      }}
    >
      <svg width="320" height="160" viewBox="0 0 320 160">
        <defs>
          <linearGradient id="logoStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={EMERALD_SOFT} />
            <stop offset="50%" stopColor={CREAM} />
            <stop offset="100%" stopColor={EMERALD} />
          </linearGradient>
          <filter id="logoGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={4 + glowPulse * 6} />
          </filter>
        </defs>

        {/* Glow underlayer (visible only after draw completes) */}
        {glowActive > 0 && (
          <path
            d={path}
            fill="none"
            stroke={EMERALD_SOFT}
            strokeWidth="10"
            strokeLinecap="round"
            opacity={0.55 * glowPulse}
            filter="url(#logoGlow)"
          />
        )}

        {/* Draw-in stroke */}
        <path
          d={path}
          fill="none"
          stroke="url(#logoStroke)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={PATH_LEN}
          strokeDashoffset={dashOffset}
        />
      </svg>
    </div>
  );
};

// =======================================================================
// HEADLINE — staggered words, golden shimmer on "Lebenswerk"
// =======================================================================
const Headline: React.FC<{ frame: number; total: number }> = ({ frame, total }) => {
  // Words appear sequentially starting at frame 75 (2.5s) with 12-frame stagger
  const WORD_START = 75;
  const WORD_STAGGER = 12;
  const WORD_RISE = 18; // frames to complete rise
  const FADE_OUT_START = 255;

  const words = [
    { text: "Was", i: 0 },
    { text: "passiert", i: 1 },
    { text: "mit", i: 2 },
    { text: "Ihrem", i: 3 },
    { text: "Lebenswerk?", i: 4, shimmer: true },
  ];

  // Shimmer phase: golden highlight sweeps through "Lebenswerk" every ~3s
  // We want it to loop back to start state: use sin-based shimmer that
  // naturally returns. Range 0→300 → 2 shimmer passes.
  const shimmerX = ((frame * 1.6) % 200) - 50; // -50%..150%

  return (
    <div
      className="flex flex-col items-center justify-center w-full"
      style={{
        position: "absolute",
        top: "48%",
        left: 0,
        right: 0,
        transform: "translateY(-50%)",
      }}
    >
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 max-w-[1400px] px-12">
        {words.map((w) => {
          const appearAt = WORD_START + w.i * WORD_STAGGER;
          const enter = interpolate(
            frame,
            [appearAt, appearAt + WORD_RISE],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            }
          );
          const exit = interpolate(
            frame,
            [FADE_OUT_START, total],
            [1, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.in(Easing.cubic),
            }
          );
          const opacity = enter * exit;
          const translateY = (1 - enter) * 40;
          const blur = (1 - enter) * 8;

          if (w.shimmer) {
            return (
              <span
                key={w.i}
                className="text-white font-black tracking-tighter italic"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: "clamp(60px, 7vw, 110px)",
                  lineHeight: 0.96,
                  letterSpacing: "-0.04em",
                  opacity,
                  transform: `translateY(${translateY}px)`,
                  filter: `blur(${blur}px)`,
                  backgroundImage: `linear-gradient(110deg,
                    ${EMERALD_SOFT} 0%,
                    ${EMERALD_SOFT} ${shimmerX - 25}%,
                    ${GOLD_HOT} ${shimmerX - 3}%,
                    ${GOLD} ${shimmerX}%,
                    ${GOLD_HOT} ${shimmerX + 3}%,
                    ${EMERALD_SOFT} ${shimmerX + 25}%,
                    ${EMERALD_SOFT} 100%)`,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  WebkitTextFillColor: "transparent",
                  textShadow: "0 2px 24px rgba(46,210,162,0.35)",
                }}
              >
                {w.text}
              </span>
            );
          }

          return (
            <span
              key={w.i}
              className="text-white font-black tracking-tighter"
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "clamp(60px, 7vw, 110px)",
                lineHeight: 0.96,
                letterSpacing: "-0.04em",
                color: CREAM,
                opacity,
                transform: `translateY(${translateY}px)`,
                filter: `blur(${blur}px)`,
                textShadow: "0 2px 18px rgba(0,0,0,0.25)",
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>

      {/* Sub-label */}
      <div
        className="mt-10 text-[13px] tracking-[0.42em] font-semibold uppercase"
        style={{
          color: EMERALD_SOFT,
          fontFamily: "Inter, system-ui, sans-serif",
          opacity: seamlessReveal(frame, total, 150, 255),
        }}
      >
        — Unternehmensnachfolge · 2026 —
      </div>
    </div>
  );
};

// =======================================================================
// COMPOSITION ROOT
// =======================================================================
export const HeroIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  return (
    <AbsoluteFill>
      <WaveBackground
        frame={frame}
        total={durationInFrames}
        width={width}
        height={height}
      />
      <InfinityLogo frame={frame} total={durationInFrames} />
      <Headline frame={frame} total={durationInFrames} />
    </AbsoluteFill>
  );
};
