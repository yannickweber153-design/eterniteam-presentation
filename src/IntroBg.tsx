import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Liquid Mesh — Apple/Stripe-grade flowing gradient hero background.
 *
 * Technique:
 *  1. Huge soft color blobs (sage, gold, sand, navy-tinted) orbit on
 *     sinusoidal paths — classic mesh gradient foundation.
 *  2. feTurbulence + feDisplacementMap distorts the whole composite every
 *     frame → produces genuinely flowing, organic edges (looks like silk /
 *     liquid light, not like static SVG circles).
 *  3. A second displacement layer carries caustic-like highlights that
 *     drift across the surface.
 *  4. Slow camera push-in adds cinematic motion.
 *  5. Subtle film grain + vignette.
 *
 * 6s seamless loop @ 30fps @ 1920×1080.
 */

const BG_WARM = "#f2ece0"; // warm cream
const BG_DEEP = "#e4d9c0"; // deeper sunlit cream
const SAGE = "#8aa593";
const SAGE_DEEP = "#5d7a68";
const GOLD = "#d4a86a";
const GOLD_HOT = "#ffd89a";
const NAVY_SOFT = "#5a6b7e";
const INK = "#1a1610";

const TAU = Math.PI * 2;

export const IntroBg: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const t = frame / durationInFrames; // 0..1

  // Camera push-in — very slight, imperceptible but adds weight
  const camScale = 1.0 + 0.02 * (1 - Math.cos(t * TAU));
  const tx = (width * (1 - camScale)) / 2;
  const ty = (height * (1 - camScale)) / 2;

  // Blob positions (loop-safe orbital)
  const blobPos = (cx: number, cy: number, orbR: number, phase: number) => ({
    x: cx + Math.cos(t * TAU + phase) * orbR,
    y: cy + Math.sin(t * TAU + phase + Math.PI / 3) * orbR * 0.7,
  });

  const sage = blobPos(width * 0.72, height * 0.28, width * 0.09, 0);
  const gold = blobPos(width * 0.85, height * 0.15, width * 0.06, Math.PI / 2);
  const sand = blobPos(width * 0.55, height * 0.7, width * 0.12, Math.PI);
  const navy = blobPos(width * 0.18, height * 0.82, width * 0.1, Math.PI * 1.4);
  const sageDeep = blobPos(width * 0.4, height * 0.3, width * 0.08, Math.PI * 0.7);

  // Displacement seed — advances each frame but loops over 6s for seamless cycle
  const dispSeed = Math.floor((t * 180) % 180);

  // Caustic sweep: a brighter, distorted band that drifts across the surface
  const causticOffset = t; // 0..1 across loop
  const causticEnv = Math.sin(t * Math.PI); // fade in/out for loop continuity

  // Grain seed
  const grainSeed = Math.floor(t * 240) % 40;

  return (
    <AbsoluteFill style={{ background: BG_WARM, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${tx}px, ${ty}px) scale(${camScale})`,
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
            {/* Mesh gradient blob definitions */}
            <radialGradient id="gSage">
              <stop offset="0%" stopColor={SAGE} stopOpacity="0.95" />
              <stop offset="50%" stopColor={SAGE} stopOpacity="0.5" />
              <stop offset="100%" stopColor={SAGE} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="gSageDeep">
              <stop offset="0%" stopColor={SAGE_DEEP} stopOpacity="0.55" />
              <stop offset="55%" stopColor={SAGE_DEEP} stopOpacity="0.18" />
              <stop offset="100%" stopColor={SAGE_DEEP} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="gGold">
              <stop offset="0%" stopColor={GOLD_HOT} stopOpacity="0.85" />
              <stop offset="40%" stopColor={GOLD} stopOpacity="0.55" />
              <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="gSand">
              <stop offset="0%" stopColor={BG_DEEP} stopOpacity="0.9" />
              <stop offset="60%" stopColor={BG_DEEP} stopOpacity="0.35" />
              <stop offset="100%" stopColor={BG_DEEP} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="gNavy">
              <stop offset="0%" stopColor={NAVY_SOFT} stopOpacity="0.28" />
              <stop offset="55%" stopColor={NAVY_SOFT} stopOpacity="0.1" />
              <stop offset="100%" stopColor={NAVY_SOFT} stopOpacity="0" />
            </radialGradient>

            {/* Caustic light gradient — linear band */}
            <linearGradient id="caustic" x1="0" y1="0" x2="1" y2="0.3">
              <stop offset="0%" stopColor={GOLD_HOT} stopOpacity="0" />
              <stop offset="30%" stopColor={GOLD_HOT} stopOpacity="0" />
              <stop offset="45%" stopColor={GOLD_HOT} stopOpacity="0.45" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.62" />
              <stop offset="55%" stopColor={GOLD_HOT} stopOpacity="0.45" />
              <stop offset="70%" stopColor={GOLD_HOT} stopOpacity="0" />
              <stop offset="100%" stopColor={GOLD_HOT} stopOpacity="0" />
            </linearGradient>

            {/* PREMIUM SAUCE: feTurbulence + feDisplacementMap for flowing edges */}
            <filter id="liquidDisplace" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.0045 0.008"
                numOctaves="2"
                seed={dispSeed}
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="180"
                xChannelSelector="R"
                yChannelSelector="G"
              />
              <feGaussianBlur stdDeviation="26" />
            </filter>

            {/* Secondary displacement for caustic — different frequency */}
            <filter id="causticDisplace" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence
                type="turbulence"
                baseFrequency="0.012 0.02"
                numOctaves="2"
                seed={dispSeed * 2}
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="80"
                xChannelSelector="R"
                yChannelSelector="G"
              />
              <feGaussianBlur stdDeviation="8" />
            </filter>

            {/* Fine film grain */}
            <filter id="grain">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.9"
                numOctaves="2"
                seed={grainSeed}
                stitchTiles="stitch"
              />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0.1  0 0 0 0 0.09  0 0 0 0 0.06  0 0 0 0.4 0"
              />
            </filter>
          </defs>

          {/* --- LIQUID MESH LAYER --- */}
          {/* Applied via filter: turbulence distorts the union of all blobs,
              producing silk-like flowing edges rather than clean circles. */}
          <g filter="url(#liquidDisplace)">
            <circle
              cx={sand.x}
              cy={sand.y}
              r={Math.max(width, height) * 0.55}
              fill="url(#gSand)"
            />
            <circle
              cx={sage.x}
              cy={sage.y}
              r={Math.max(width, height) * 0.45}
              fill="url(#gSage)"
            />
            <circle
              cx={sageDeep.x}
              cy={sageDeep.y}
              r={Math.max(width, height) * 0.3}
              fill="url(#gSageDeep)"
            />
            <circle
              cx={gold.x}
              cy={gold.y}
              r={Math.max(width, height) * 0.35}
              fill="url(#gGold)"
            />
            <circle
              cx={navy.x}
              cy={navy.y}
              r={Math.max(width, height) * 0.4}
              fill="url(#gNavy)"
            />
          </g>

          {/* --- CAUSTIC LIGHT SWEEP --- */}
          {/* Light band crossing at a slight angle, distorted by turbulence
              for an iridescent caustic ripple. */}
          <g
            opacity={causticEnv * 0.9}
            transform={`translate(${-width * 0.4 + causticOffset * width * 1.8} 0) rotate(-14 ${width / 2} ${height / 2})`}
            filter="url(#causticDisplace)"
          >
            <rect
              x={-width * 0.15}
              y={-height * 0.3}
              width={width * 0.3}
              height={height * 1.6}
              fill="url(#caustic)"
            />
          </g>

          {/* --- SECONDARY CAUSTIC (offset half-loop for continuity) --- */}
          <g
            opacity={Math.sin(((t + 0.5) % 1) * Math.PI) * 0.55}
            transform={`translate(${-width * 0.4 + ((t + 0.5) % 1) * width * 1.8} 0) rotate(-14 ${width / 2} ${height / 2})`}
            filter="url(#causticDisplace)"
          >
            <rect
              x={-width * 0.1}
              y={-height * 0.3}
              width={width * 0.2}
              height={height * 1.6}
              fill="url(#caustic)"
            />
          </g>

          {/* --- DEPTH / VIGNETTE --- */}
          <defs>
            <radialGradient id="hotspot" cx="82%" cy="18%" r="48%">
              <stop offset="0%" stopColor={GOLD_HOT} stopOpacity="0.28" />
              <stop offset="100%" stopColor={GOLD_HOT} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="vig" cx="50%" cy="50%" r="78%">
              <stop offset="55%" stopColor={INK} stopOpacity="0" />
              <stop offset="100%" stopColor={INK} stopOpacity="0.18" />
            </radialGradient>
            {/* Left-side text protection — very subtle */}
            <linearGradient id="textProtect" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={BG_WARM} stopOpacity="0.2" />
              <stop offset="40%" stopColor={BG_WARM} stopOpacity="0.05" />
              <stop offset="100%" stopColor={BG_WARM} stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width={width} height={height} fill="url(#hotspot)" />
          <rect width={width} height={height} fill="url(#textProtect)" />
          <rect width={width} height={height} fill="url(#vig)" />

          {/* --- FILM GRAIN --- */}
          <rect
            width={width}
            height={height}
            filter="url(#grain)"
            opacity="0.55"
          />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
