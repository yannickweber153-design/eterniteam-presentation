import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const BG = "#f5f6f4";
const NAVY = "#1B3A5C";
const SAGE = "#7A9E7E";
const SAGE_D = "#5C8A64";
const GOLD = "#C9A84C";
const GRAY = "#8B919A";
const WHITE = "#ffffff";

const T = {
  HEAD: 0,
  N0: 20,
  N1: 44,
  L01_S: 56,
  L01_E: 98,
  N2: 106,
  L02_S: 118,
  L02_E: 158,
  L12_S: 166,
  L12_E: 206,
  LABELS: 212,
  FINAL: 240,
};

// Triangle geometry — centered
const CX = 960;
const CY = 560;
const SPREAD_X = 280;
const TOP_OFF = -190;
const BOT_OFF = 160;

const NODE = [
  { x: CX, y: CY + TOP_OFF, r: 80, title: "Unternehmer", sub: "Gesicherter Exit", color: NAVY },
  { x: CX + SPREAD_X, y: CY + BOT_OFF + 20, r: 66, title: "EterniTeam", sub: "Langfristiger Eigentümer", color: SAGE_D },
  { x: CX - SPREAD_X, y: CY + BOT_OFF + 20, r: 66, title: "Team", sub: "Wird Mitgesellschafter", color: GOLD },
];

const CONN = [
  {
    from: 0, to: 1, color: NAVY, curve: -32,
    s: T.L01_S, e: T.L01_E,
    labels: ["Sichere Transaktion", "Langfristige Kontinuität"],
    lx: 0.55, ly: -18, anchor: "start" as const, offX: 52,
  },
  {
    from: 0, to: 2, color: SAGE_D, curve: 32,
    s: T.L02_S, e: T.L02_E,
    labels: ["Kultur & Arbeitsplätze", "bleiben erhalten"],
    lx: 0.45, ly: -18, anchor: "end" as const, offX: -52,
  },
  {
    from: 2, to: 1, color: GOLD, curve: -18,
    s: T.L12_S, e: T.L12_E,
    labels: ["Sukzessiver Anteilsübergang", "Beteiligung ab Tag 1"],
    lx: 0.5, ly: 42, anchor: "middle" as const, offX: 0,
  },
];

// Icons
const ICON_SELLER = (c: string) => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
    stroke={c} strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="6" width="16" height="15" rx="1.5" />
    <line x1="4" y1="11" x2="20" y2="11" />
    <line x1="9" y1="6" x2="9" y2="21" />
    <line x1="15" y1="6" x2="15" y2="21" />
    <line x1="12" y1="3" x2="12" y2="6" />
  </svg>
);

const ICON_ETERNI = (c: string) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
    stroke={c} strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4z" transform="translate(-3.5,0)" />
    <path d="M12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4z" transform="translate(3.5,0)" />
  </svg>
);

const ICON_TEAM = (c: string) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
    stroke={c} strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="7.5" r="3" />
    <path d="M5.5 20c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6" />
    <circle cx="5.5" cy="9.5" r="2" opacity=".45" />
    <circle cx="18.5" cy="9.5" r="2" opacity=".45" />
  </svg>
);

const ICONS = [ICON_SELLER, ICON_ETERNI, ICON_TEAM];

// Hooks
function useSpr(delay: number) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ fps, frame: f - delay, config: { damping: 18, stiffness: 110, mass: 0.9 } });
}

function useFade(d: number, dur = 18) {
  const f = useCurrentFrame();
  return interpolate(f, [d, d + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

function useDraw(s: number, e: number) {
  const f = useCurrentFrame();
  return interpolate(f, [s, e], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

function usePulse(phase: number) {
  const f = useCurrentFrame();
  if (f < T.LABELS) return 1;
  return 1 + Math.sin((f - T.LABELS) * 0.05 + phase) * 0.008;
}

// Grid background
function Grid() {
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <pattern id="g" width="64" height="64" patternUnits="userSpaceOnUse">
          <path d="M 64 0 L 0 0 0 64" fill="none" stroke="rgba(27,58,92,0.04)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)" />
    </svg>
  );
}

// Node
function CircleNode({ idx, delay, phase }: { idx: number; delay: number; phase: number }) {
  const n = NODE[idx];
  const scale = useSpr(delay);
  const opacity = useFade(delay, 14);
  const pulse = usePulse(phase);
  const s = scale * pulse;

  return (
    <g transform={`translate(${n.x},${n.y})`} style={{ opacity }}>
      {/* Soft halo */}
      <circle r={n.r + 12} fill={n.color} opacity={0.035} transform={`scale(${s})`} />

      {/* Card */}
      <circle
        r={n.r}
        fill={WHITE}
        stroke="rgba(0,0,0,0.06)"
        strokeWidth={1}
        transform={`scale(${s})`}
        style={{ filter: "drop-shadow(0 12px 40px rgba(0,0,0,0.08)) drop-shadow(0 2px 6px rgba(0,0,0,0.03))" }}
      />

      {/* Top accent */}
      <clipPath id={`cn${idx}`}><circle r={n.r} /></clipPath>
      <rect
        x={-n.r} y={-n.r} width={n.r * 2} height={3}
        fill={n.color} opacity={0.5}
        clipPath={`url(#cn${idx})`}
        transform={`scale(${s})`}
      />

      {/* Icon */}
      <g transform={`translate(-${idx === 0 ? 15 : 13},-${idx === 0 ? 16 : 13}) scale(${scale})`}>
        {ICONS[idx](n.color)}
      </g>

      {/* Title */}
      <text
        y={n.r + 28}
        textAnchor="middle"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"
        fontWeight={700}
        fontSize={idx === 0 ? 17 : 15.5}
        fill={NAVY}
        letterSpacing={-0.3}
        transform={`scale(${scale})`}
      >
        {n.title}
      </text>
      <text
        y={n.r + 47}
        textAnchor="middle"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"
        fontWeight={400}
        fontSize={12.5}
        fill={GRAY}
        transform={`scale(${scale})`}
      >
        {n.sub}
      </text>
    </g>
  );
}

// Connection
function Connection({ c }: { c: (typeof CONN)[0] }) {
  const progress = useDraw(c.s, c.e);
  const opacity = useFade(c.s, 12);

  const p0 = NODE[c.from];
  const p1 = NODE[c.to];
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;

  const sx = p0.x + ux * (p0.r + 16);
  const sy = p0.y + uy * (p0.r + 16);
  const ex = p1.x - ux * (p1.r + 16);
  const ey = p1.y - uy * (p1.r + 16);

  const mx = (sx + ex) / 2 - uy * c.curve;
  const my = (sy + ey) / 2 + ux * c.curve;

  const d = `M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`;
  const pl = len * 1.12;

  const aa = (Math.atan2(ey - my, ex - mx) * 180) / Math.PI;
  const ao = progress > 0.9 ? (progress - 0.9) * 10 : 0;

  return (
    <g style={{ opacity }}>
      <path d={d} fill="none" stroke={c.color} strokeWidth={3}
        strokeLinecap="round" strokeDasharray={pl}
        strokeDashoffset={pl * (1 - progress)} opacity={0.22} />
      <g transform={`translate(${ex},${ey}) rotate(${aa})`} style={{ opacity: ao }}>
        <polygon points="-8,-3.5 0,0 -8,3.5" fill={c.color} opacity={0.3} />
      </g>
    </g>
  );
}

// Edge label
function EdgeLabel({ c }: { c: (typeof CONN)[0] }) {
  const opacity = useFade(T.LABELS, 22);
  const f = useCurrentFrame();
  const slideY = interpolate(f, [T.LABELS, T.LABELS + 22], [8, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const p0 = NODE[c.from];
  const p1 = NODE[c.to];
  const bx = p0.x + (p1.x - p0.x) * c.lx + c.offX;
  const by = p0.y + (p1.y - p0.y) * c.lx + c.ly;

  return (
    <g transform={`translate(${bx},${by + slideY})`} style={{ opacity }}>
      {c.labels.map((txt, i) => (
        <text
          key={i}
          y={i * 20}
          textAnchor={c.anchor}
          fontFamily="-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif"
          fontWeight={i === 0 ? 600 : 400}
          fontSize={i === 0 ? 14 : 12.5}
          fill={i === 0 ? NAVY : GRAY}
          letterSpacing={-0.15}
        >
          {txt}
        </text>
      ))}
    </g>
  );
}

// Main
export const WinWin: React.FC = () => {
  const f = useCurrentFrame();

  const hOp = useFade(T.HEAD, 22);
  const hY = interpolate(f, [T.HEAD, T.HEAD + 22], [14, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const fOp = useFade(T.FINAL, 26);
  const fY = interpolate(f, [T.FINAL, T.FINAL + 26], [10, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: BG }}>
      <Grid />

      {/* Headline */}
      <div
        style={{
          position: "absolute",
          top: 64,
          left: 80,
          right: 80,
          opacity: hOp,
          transform: `translateY(${hY}px)`,
        }}
      >
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: "0.26em",
            textTransform: "uppercase" as const,
            color: SAGE,
            marginBottom: 14,
            fontFamily: "-apple-system, sans-serif",
          }}
        >
          Unser Modell
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 800,
            color: NAVY,
            letterSpacing: -1.2,
            lineHeight: 1.12,
            fontFamily: "-apple-system, sans-serif",
          }}
        >
          Alle Parteien gewinnen — das Unternehmen
          <br />
          wechselt in{" "}
          <span
            style={{
              background: `linear-gradient(135deg, ${NAVY}, ${SAGE})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            vertraute Hände.
          </span>
        </div>
      </div>

      {/* System */}
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0 }}
      >
        {CONN.map((c, i) => (
          <Connection key={i} c={c} />
        ))}
        {CONN.map((c, i) => (
          <EdgeLabel key={`l${i}`} c={c} />
        ))}

        <CircleNode idx={0} delay={T.N0} phase={0} />
        <CircleNode idx={1} delay={T.N1} phase={2.1} />
        <CircleNode idx={2} delay={T.N2} phase={4.2} />
      </svg>

      {/* Final statement */}
      <div
        style={{
          position: "absolute",
          bottom: 48,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: fOp,
          transform: `translateY(${fY}px)`,
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: NAVY,
            letterSpacing: -0.4,
            fontFamily: "-apple-system, sans-serif",
          }}
        >
          Ein echtes, langfristiges Win–Win–Win-Modell.
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 400,
            color: GRAY,
            marginTop: 6,
            letterSpacing: 0.1,
            fontFamily: "-apple-system, sans-serif",
          }}
        >
          Strukturell verankert — nicht verhandelbar
        </div>
      </div>
    </AbsoluteFill>
  );
};
