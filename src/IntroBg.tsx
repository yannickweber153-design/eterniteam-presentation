import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, random } from "remotion";

// Brand palette
const NAVY = "#1b3a5c";
const NAVY_DEEP = "#0f2640";
const SAGE = "#6b8573";
const SAGE_DEEP = "#3d5a4a";
const SAND = "#d6c9a8";
const BG_WARM = "#f5f2ec";
const INK = "#0d1410";

const TAU = Math.PI * 2;
const sin = (t: number, phase = 0) => Math.sin(t * TAU + phase);
const cos = (t: number, phase = 0) => Math.cos(t * TAU + phase);

// Loop-safe periodic node positions
const nodePos = (seed: number, t: number, width: number, height: number) => {
  const baseX = 0.06 + random(`nx${seed}`) * 0.88;
  const baseY = 0.06 + random(`ny${seed}`) * 0.88;
  const freq1 = 1 + Math.floor(random(`f1${seed}`) * 2); // 1..2
  const freq2 = 1 + Math.floor(random(`f2${seed}`) * 2);
  const amp = 0.018 + random(`a${seed}`) * 0.035; // small, elegant drift
  const phase1 = random(`p1${seed}`) * TAU;
  const phase2 = random(`p2${seed}`) * TAU;
  const dx = Math.sin(t * TAU * freq1 + phase1) * amp;
  const dy = Math.cos(t * TAU * freq2 + phase2) * amp;
  return { x: (baseX + dx) * width, y: (baseY + dy) * height };
};

const NODE_COUNT = 34;
const CONNECT_DIST = 0.22; // fraction of diagonal

export const IntroBg: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const t = frame / durationInFrames; // 0..1

  const diag = Math.hypot(width, height);
  const maxDist = diag * CONNECT_DIST;

  // Compute node positions
  const nodes = Array.from({ length: NODE_COUNT }, (_, i) => {
    const { x, y } = nodePos(i, t, width, height);
    const size = 1.4 + random(`sz${i}`) * 2.2;
    // subtle twinkle
    const tw = 0.55 + 0.45 * sin(t * 2, i * 0.9);
    return { i, x, y, size, tw };
  });

  // Compute edges: pairs within threshold, dedup
  type Edge = { a: number; b: number; o: number; dx: number; dy: number; len: number };
  const edges: Edge[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[j].x - nodes[i].x;
      const dy = nodes[j].y - nodes[i].y;
      const len = Math.hypot(dx, dy);
      if (len < maxDist) {
        // opacity falls off quadratically with distance
        const o = Math.pow(1 - len / maxDist, 1.8) * 0.42;
        edges.push({ a: i, b: j, o, dx, dy, len });
      }
    }
  }

  // ---------- Mesh gradient base (3 blurred color blobs) ----------
  // Each blob orbits gently to create a morphing mesh-gradient feeling.
  const blob = (
    cxBase: number,
    cyBase: number,
    orbR: number,
    phase: number,
    color: string,
    opacity: number,
    radius: number,
    gradId: string
  ) => {
    const cx = cxBase + cos(t, phase) * orbR;
    const cy = cyBase + sin(t, phase + Math.PI / 3) * orbR * 0.75;
    return (
      <g key={gradId}>
        <defs>
          <radialGradient id={gradId}>
            <stop offset="0%" stopColor={color} stopOpacity={opacity} />
            <stop offset="55%" stopColor={color} stopOpacity={opacity * 0.35} />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={radius} fill={`url(#${gradId})`} />
      </g>
    );
  };

  // ---------- Scan beam (crisp diagonal) ----------
  // Travels left-to-right once per loop with ease-in-out. To keep a seamless
  // loop, we fade the beam in/out near the edges via a sin envelope.
  const beamProgress = t; // 0..1 linear
  const beamEase = 0.5 - 0.5 * Math.cos(beamProgress * Math.PI); // ease in/out, 0..1
  const beamX = -width * 0.3 + beamEase * width * 1.6;
  const beamEnvelope = Math.sin(t * Math.PI); // 0→1→0 over loop for fade

  // ---------- Energy pulses travelling along edges ----------
  // Pick a deterministic edge subset; animate a pulse along each.
  const PULSE_COUNT = 4;
  const pulses = Array.from({ length: PULSE_COUNT }, (_, k) => {
    if (edges.length === 0) return null;
    const edgeIdx =
      Math.floor(random(`pe${k}`) * edges.length + t * edges.length * (k + 1) * 0.3) %
      edges.length;
    const edge = edges[edgeIdx];
    const na = nodes[edge.a];
    const nb = nodes[edge.b];
    // Pulse travel: offset per pulse so they don't sync
    const localT = (t + k / PULSE_COUNT) % 1;
    // Ease with bias; multiple passes per loop feel livelier
    const passes = 2;
    const u = (localT * passes) % 1;
    // Bell envelope so the pulse brightens mid-edge and fades at ends
    const env = Math.sin(u * Math.PI);
    const x = na.x + (nb.x - na.x) * u;
    const y = na.y + (nb.y - na.y) * u;
    return { key: k, x, y, env };
  }).filter(Boolean) as { key: number; x: number; y: number; env: number }[];

  // Film grain seed
  const grainSeed = Math.floor(t * 90) % 12;

  return (
    <AbsoluteFill style={{ background: BG_WARM, overflow: "hidden" }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          {/* Sharp beam gradient — crisp edges, tight hot center */}
          <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="44%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="49%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="51%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="56%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Node ring (dot with halo) */}
          <radialGradient id="nodeDot">
            <stop offset="0%" stopColor={NAVY_DEEP} stopOpacity="1" />
            <stop offset="45%" stopColor={NAVY} stopOpacity="0.85" />
            <stop offset="100%" stopColor={NAVY} stopOpacity="0" />
          </radialGradient>

          {/* Pulse glow */}
          <radialGradient id="pulseGlow">
            <stop offset="0%" stopColor={SAGE} stopOpacity="1" />
            <stop offset="40%" stopColor={SAGE} stopOpacity="0.55" />
            <stop offset="100%" stopColor={SAGE} stopOpacity="0" />
          </radialGradient>

          {/* Grain */}
          <filter id="grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves="2"
              seed={grainSeed}
              stitchTiles="stitch"
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.07  0 0 0 0 0.09  0 0 0 0 0.08  0 0 0 0.35 0"
            />
          </filter>

          {/* Soft glow for pulses */}
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>

          {/* Mesh gradient blur (heavy blur for color blobs) */}
          <filter id="meshBlur">
            <feGaussianBlur stdDeviation="120" />
          </filter>
        </defs>

        {/* Mesh gradient layer: blurred color blobs drifting */}
        <g filter="url(#meshBlur)">
          {blob(
            width * 0.78,
            height * 0.22,
            width * 0.08,
            0,
            SAGE,
            0.55,
            Math.max(width, height) * 0.42,
            "b1"
          )}
          {blob(
            width * 0.18,
            height * 0.78,
            width * 0.09,
            Math.PI,
            NAVY,
            0.32,
            Math.max(width, height) * 0.48,
            "b2"
          )}
          {blob(
            width * 0.5,
            height * 0.55,
            width * 0.12,
            Math.PI / 2,
            SAND,
            0.38,
            Math.max(width, height) * 0.34,
            "b3"
          )}
          {blob(
            width * 0.3,
            height * 0.2,
            width * 0.07,
            Math.PI * 1.3,
            SAGE_DEEP,
            0.22,
            Math.max(width, height) * 0.3,
            "b4"
          )}
        </g>

        {/* Subtle grid: horizontal/vertical faint lines for tech feel */}
        <g stroke={NAVY_DEEP} strokeWidth="1" opacity="0.04">
          {Array.from({ length: 18 }, (_, i) => (
            <line
              key={`vg${i}`}
              x1={(width / 18) * i}
              y1="0"
              x2={(width / 18) * i}
              y2={height}
            />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <line
              key={`hg${i}`}
              x1="0"
              y1={(height / 10) * i}
              x2={width}
              y2={(height / 10) * i}
            />
          ))}
        </g>

        {/* Network edges */}
        <g>
          {edges.map((e, idx) => {
            const na = nodes[e.a];
            const nb = nodes[e.b];
            return (
              <line
                key={`e${idx}`}
                x1={na.x}
                y1={na.y}
                x2={nb.x}
                y2={nb.y}
                stroke={NAVY_DEEP}
                strokeWidth="1"
                opacity={e.o}
                strokeLinecap="round"
              />
            );
          })}
        </g>

        {/* Nodes */}
        <g>
          {nodes.map((n) => (
            <g key={`n${n.i}`}>
              {/* Halo */}
              <circle
                cx={n.x}
                cy={n.y}
                r={n.size * 4}
                fill="url(#nodeDot)"
                opacity={0.18 * n.tw}
              />
              {/* Core dot */}
              <circle
                cx={n.x}
                cy={n.y}
                r={n.size}
                fill={NAVY_DEEP}
                opacity={0.55 + 0.4 * n.tw}
              />
            </g>
          ))}
        </g>

        {/* Energy pulses along edges */}
        <g filter="url(#softGlow)">
          {pulses.map((p) => (
            <circle
              key={`p${p.key}`}
              cx={p.x}
              cy={p.y}
              r={6 + 8 * p.env}
              fill="url(#pulseGlow)"
              opacity={p.env}
            />
          ))}
        </g>
        {/* Pulse cores (sharp) */}
        <g>
          {pulses.map((p) => (
            <circle
              key={`pc${p.key}`}
              cx={p.x}
              cy={p.y}
              r={2.2 * p.env}
              fill={SAGE_DEEP}
              opacity={p.env * 0.95}
            />
          ))}
        </g>

        {/* Crisp diagonal scan beam */}
        <g
          transform={`translate(${beamX} 0) rotate(-18 ${width / 2} ${height / 2})`}
          opacity={beamEnvelope * 0.9}
        >
          <rect
            x={-width * 0.35}
            y={-height * 0.3}
            width={width * 0.7}
            height={height * 1.6}
            fill="url(#beam)"
          />
        </g>

        {/* Vignette */}
        <defs>
          <radialGradient id="vig" cx="50%" cy="50%" r="75%">
            <stop offset="55%" stopColor={INK} stopOpacity="0" />
            <stop offset="100%" stopColor={INK} stopOpacity="0.18" />
          </radialGradient>
        </defs>
        <rect width={width} height={height} fill="url(#vig)" />

        {/* Film grain */}
        <rect width={width} height={height} filter="url(#grain)" opacity="0.5" />
      </svg>
    </AbsoluteFill>
  );
};
