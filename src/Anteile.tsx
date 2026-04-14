import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ─── Palette ──────────────────────────────────────────────────────────────────
const BG       = "#f5f6f4";
const NAVY     = "#1B3A5C";
const SAGE     = "#7A9E7E";
const BLUE     = "#4A8DB8";
const GOLD     = "#C9A84C";
const GRAY     = "#6B7280";
const GRAY_SUB = "#9CA3AF";
const GRAY_TRK = "#E5E7EB";
const WHITE    = "#ffffff";

// ─── Stages ──────────────────────────────────────────────────────────────────
const STAGES = [
  { year: "Jahr 0",  tag: "ERWERB",     et: 100, gf:  0, tm:  0,
    headline: "EterniTeam erwirbt 100 % der Anteile",
    sub: "Vollständiger Kauf — kein Fremdkapital, kein Private Equity" },
  { year: "Jahr 0",  tag: "SOFORT",     et:  80, gf: 10, tm: 10,
    headline: "20–25 % werden sofort verwässert",
    sub: "7,5–12,5 % an Mitarbeitende · 10–12,5 % an neue Geschäftsführung" },
  { year: "Jahr 5",  tag: "RÜCKKÄUFE",  et:  66, gf: 17, tm: 17,
    headline: "Sukzessiver Anteilsrückkauf ab Jahr 1",
    sub: "Team und GF kaufen EterniTeam-Anteile aus dem laufenden Cashflow" },
  { year: "Jahr 15+",tag: "MEHRHEIT",   et:  20, gf: 40, tm: 40,
    headline: "80 %+ Eigentum beim Team",
    sub: "EterniTeam zieht sich zurück — Unternehmen gehört dem Team" },
];

// Stage timing (frames @ 30fps)
const STAGE_IN  = [0,   90,  168, 248];
const TOTAL     = 330;

// ─── Geometry ─────────────────────────────────────────────────────────────────
const CX = 960;
const CY = 530;
const R_OUTER = 200;
const R_INNER = 128;
const STROKE   = R_OUTER - R_INNER;
const R_MID    = (R_OUTER + R_INNER) / 2;
const CIRC     = 2 * Math.PI * R_MID;

// Mini-donut geometry (timeline row)
const MR_OUTER = 38;
const MR_INNER = 22;
const MR_MID   = (MR_OUTER + MR_INNER) / 2;
const MR_CIRC  = 2 * Math.PI * MR_MID;
const MR_STK   = MR_OUTER - MR_INNER;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function useStageProgress(stageIdx: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inAt = STAGE_IN[stageIdx];
  const s = spring({ fps, frame: frame - inAt, config: { damping: 22, stiffness: 90, mass: 1.1 } });
  return Math.min(1, Math.max(0, s));
}

function useFade(d: number, dur = 18) {
  const f = useCurrentFrame();
  return interpolate(f, [d, d + dur], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// Which stage are we in, and how far into it?
function useActiveStage(): { idx: number; progress: number } {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  let idx = 0;
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (frame >= STAGE_IN[i]) { idx = i; break; }
  }

  const nextIn = STAGE_IN[idx + 1] ?? TOTAL;
  const raw = (frame - STAGE_IN[idx]) / (nextIn - STAGE_IN[idx]);
  const progress = Math.min(1, Math.max(0, raw));

  return { idx, progress };
}

// Interpolate segment values between two stages
function useSegmentValues() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // For each stage transition, use a spring
  let et = STAGES[0].et;
  let gf = STAGES[0].gf;
  let tm = STAGES[0].tm;

  for (let i = 1; i < STAGES.length; i++) {
    const s = spring({ fps, frame: frame - STAGE_IN[i], config: { damping: 28, stiffness: 70, mass: 1.2 } });
    const t = Math.min(1, Math.max(0, s));
    et = lerp(et, STAGES[i].et, t);
    gf = lerp(gf, STAGES[i].gf, t);
    tm = lerp(tm, STAGES[i].tm, t);
  }

  return { et, gf, tm };
}

// ─── Main Donut ───────────────────────────────────────────────────────────────
function MainDonut() {
  const { et, gf, tm } = useSegmentValues();

  // Build arcs: ET starts at -90deg, then GF, then TM
  const etArc = (et / 100) * CIRC;
  const gfArc = (gf / 100) * CIRC;
  const tmArc = (tm / 100) * CIRC;

  const etDash  = `${etArc} ${CIRC - etArc}`;
  const gfDash  = `${gfArc} ${CIRC - gfArc}`;
  const tmDash  = `${tmArc} ${CIRC - tmArc}`;

  const etRot = -90;
  const gfRot = -90 + (et / 100) * 360;
  const tmRot = -90 + ((et + gf) / 100) * 360;

  const size = (R_OUTER + 8) * 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ position: "absolute",
        left: CX - (R_OUTER + 8),
        top:  CY - (R_OUTER + 8),
        overflow: "visible" }}>

      {/* Track */}
      <circle cx={R_OUTER + 8} cy={R_OUTER + 8} r={R_MID}
        fill="none" stroke={GRAY_TRK} strokeWidth={STROKE} />

      {/* EterniTeam */}
      <circle cx={R_OUTER + 8} cy={R_OUTER + 8} r={R_MID}
        fill="none" stroke={NAVY} strokeWidth={STROKE - 1}
        strokeDasharray={etDash}
        strokeLinecap="butt"
        transform={`rotate(${etRot} ${R_OUTER + 8} ${R_OUTER + 8})`}
        style={{ transition: "none" }}
      />

      {/* Geschäftsführung */}
      <circle cx={R_OUTER + 8} cy={R_OUTER + 8} r={R_MID}
        fill="none" stroke={BLUE} strokeWidth={STROKE - 1}
        strokeDasharray={gfDash}
        strokeLinecap="butt"
        transform={`rotate(${gfRot} ${R_OUTER + 8} ${R_OUTER + 8})`}
        style={{ transition: "none" }}
      />

      {/* Team */}
      <circle cx={R_OUTER + 8} cy={R_OUTER + 8} r={R_MID}
        fill="none" stroke={GOLD} strokeWidth={STROKE - 1}
        strokeDasharray={tmDash}
        strokeLinecap="butt"
        transform={`rotate(${tmRot} ${R_OUTER + 8} ${R_OUTER + 8})`}
        style={{ transition: "none" }}
      />

      {/* White inner disc */}
      <circle cx={R_OUTER + 8} cy={R_OUTER + 8} r={R_INNER - 4}
        fill={WHITE}
        style={{ filter: "drop-shadow(0 4px 20px rgba(27,58,92,0.07))" }}
      />
    </svg>
  );
}

// ─── Center Numbers ───────────────────────────────────────────────────────────
function CenterNumbers() {
  const { et, gf, tm } = useSegmentValues();
  const { idx } = useActiveStage();
  const frame = useCurrentFrame();

  const stageOp = useFade(STAGE_IN[idx], 12);

  return (
    <div style={{
      position: "absolute",
      left: CX - R_INNER + 4,
      top:  CY - R_INNER + 4,
      width: (R_INNER - 4) * 2,
      height: (R_INNER - 4) * 2,
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "none",
    }}>
      {/* ET big number */}
      <div style={{
        fontSize: 52, fontWeight: 900, color: NAVY,
        letterSpacing: -2, lineHeight: 1,
        fontFamily: "-apple-system, sans-serif",
      }}>
        {Math.round(et)}%
      </div>
      <div style={{
        fontSize: 11, fontWeight: 700, color: NAVY, opacity: 0.45,
        letterSpacing: "0.14em", textTransform: "uppercase" as const,
        marginTop: 4, fontFamily: "-apple-system, sans-serif",
      }}>
        EterniTeam
      </div>

      {/* GF + TM small */}
      {gf > 0 && (
        <div style={{
          marginTop: 10,
          display: "flex", gap: 10, alignItems: "center",
          opacity: interpolate(frame, [STAGE_IN[1], STAGE_IN[1] + 20], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          }),
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: BLUE, fontFamily: "-apple-system, sans-serif" }}>
              {Math.round(gf)}%
            </div>
            <div style={{ fontSize: 9, color: GRAY_SUB, fontFamily: "-apple-system, sans-serif" }}>GF</div>
          </div>
          <div style={{ width: 1, height: 24, background: GRAY_TRK }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: GOLD, fontFamily: "-apple-system, sans-serif" }}>
              {Math.round(tm)}%
            </div>
            <div style={{ fontSize: 9, color: GRAY_SUB, fontFamily: "-apple-system, sans-serif" }}>Team</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stage Label (right of donut) ─────────────────────────────────────────────
function StageLabel() {
  const { idx } = useActiveStage();
  const stage = STAGES[idx];
  const frame = useCurrentFrame();

  const op = useFade(STAGE_IN[idx] + 8, 16);
  const slideY = interpolate(frame, [STAGE_IN[idx] + 8, STAGE_IN[idx] + 24], [16, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <div style={{
      position: "absolute",
      left: CX + R_OUTER + 56,
      top: CY - 80,
      width: 420,
      opacity: op,
      transform: `translateY(${slideY}px)`,
    }}>
      {/* Year badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        marginBottom: 16,
      }}>
        <div style={{
          padding: "4px 14px", borderRadius: 50,
          background: NAVY, color: WHITE,
          fontSize: 13, fontWeight: 700,
          fontFamily: "-apple-system, sans-serif",
          letterSpacing: 0.2,
        }}>
          {stage.year}
        </div>
        <div style={{
          fontSize: 10.5, fontWeight: 700, color: SAGE,
          letterSpacing: "0.22em", textTransform: "uppercase" as const,
          fontFamily: "-apple-system, sans-serif",
        }}>
          {stage.tag}
        </div>
      </div>

      {/* Headline */}
      <div style={{
        fontSize: 26, fontWeight: 800, color: NAVY,
        letterSpacing: -0.8, lineHeight: 1.2,
        fontFamily: "-apple-system, sans-serif",
        marginBottom: 12,
      }}>
        {stage.headline}
      </div>

      {/* Sub */}
      <div style={{
        fontSize: 15, fontWeight: 400, color: GRAY,
        lineHeight: 1.65, fontFamily: "-apple-system, sans-serif",
        maxWidth: 360,
      }}>
        {stage.sub}
      </div>

      {/* Segment breakdown bars */}
      <div style={{ marginTop: 28, display: "flex", flexDirection: "column" as const, gap: 10 }}>
        {[
          { color: NAVY, pct: STAGES[idx].et, label: "EterniTeam" },
          { color: BLUE, pct: STAGES[idx].gf, label: "Neue Geschäftsführung" },
          { color: GOLD, pct: STAGES[idx].tm, label: "Team (Mitarbeitende)" },
        ].map((row, i) => {
          const barProgress = interpolate(frame,
            [STAGE_IN[idx] + 14, STAGE_IN[idx] + 44],
            [0, row.pct / 100],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: row.color, flexShrink: 0 }} />
              <div style={{ width: 120, fontSize: 12, color: GRAY, fontFamily: "-apple-system, sans-serif" }}>
                {row.label}
              </div>
              {/* Bar track */}
              <div style={{ flex: 1, height: 4, background: GRAY_TRK, borderRadius: 2 }}>
                <div style={{
                  width: `${barProgress * 100}%`,
                  height: "100%", background: row.color,
                  borderRadius: 2,
                  opacity: row.pct === 0 ? 0 : 1,
                }} />
              </div>
              <div style={{
                width: 38, textAlign: "right",
                fontSize: 13, fontWeight: 700, color: row.color,
                fontFamily: "-apple-system, sans-serif",
              }}>
                {row.pct}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Timeline (bottom) ────────────────────────────────────────────────────────
function Timeline() {
  const { idx } = useActiveStage();
  const frame = useCurrentFrame();
  const lineOp = useFade(STAGE_IN[0] + 10, 20);

  return (
    <div style={{
      position: "absolute",
      bottom: 56, left: 80, right: 80,
      opacity: lineOp,
    }}>
      {/* Connector line */}
      <div style={{
        position: "absolute",
        top: MR_OUTER - 1,
        left: MR_OUTER + 20,
        right: MR_OUTER + 20,
        height: 1.5,
        background: GRAY_TRK,
      }} />

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}>
        {STAGES.map((stage, i) => {
          const isActive = i === idx;
          const isPast = i < idx;
          const miniOp = useFade(STAGE_IN[i] + 6, 14);

          const mSize = (MR_OUTER + 4) * 2;
          const mET  = (stage.et / 100) * MR_CIRC;
          const mGF  = (stage.gf / 100) * MR_CIRC;
          const mTM  = (stage.tm / 100) * MR_CIRC;

          return (
            <div key={i} style={{
              display: "flex", flexDirection: "column" as const, alignItems: "center",
              opacity: interpolate(frame, [STAGE_IN[i], STAGE_IN[i] + 14], [0, 1], {
                extrapolateLeft: "clamp", extrapolateRight: "clamp",
              }),
              transform: `scale(${isActive ? 1.08 : 1})`,
              transition: "transform 0.3s ease",
            }}>
              {/* Mini donut */}
              <svg width={mSize} height={mSize} viewBox={`0 0 ${mSize} ${mSize}`}>
                <circle cx={MR_OUTER + 4} cy={MR_OUTER + 4} r={MR_MID}
                  fill="none" stroke={GRAY_TRK} strokeWidth={MR_STK} />
                <circle cx={MR_OUTER + 4} cy={MR_OUTER + 4} r={MR_MID}
                  fill="none" stroke={NAVY} strokeWidth={MR_STK - 1}
                  strokeDasharray={`${mET} ${MR_CIRC}`}
                  transform={`rotate(-90 ${MR_OUTER + 4} ${MR_OUTER + 4})`} />
                <circle cx={MR_OUTER + 4} cy={MR_OUTER + 4} r={MR_MID}
                  fill="none" stroke={BLUE} strokeWidth={MR_STK - 1}
                  strokeDasharray={`${mGF} ${MR_CIRC}`}
                  transform={`rotate(${-90 + (stage.et / 100) * 360} ${MR_OUTER + 4} ${MR_OUTER + 4})`} />
                <circle cx={MR_OUTER + 4} cy={MR_OUTER + 4} r={MR_MID}
                  fill="none" stroke={GOLD} strokeWidth={MR_STK - 1}
                  strokeDasharray={`${mTM} ${MR_CIRC}`}
                  transform={`rotate(${-90 + ((stage.et + stage.gf) / 100) * 360} ${MR_OUTER + 4} ${MR_OUTER + 4})`} />
                {/* Active indicator */}
                {isActive && (
                  <circle cx={MR_OUTER + 4} cy={MR_OUTER + 4} r={MR_OUTER + 2}
                    fill="none" stroke={NAVY} strokeWidth={1.5} opacity={0.25} />
                )}
                <circle cx={MR_OUTER + 4} cy={MR_OUTER + 4} r={MR_INNER - 3}
                  fill={WHITE} />
                <text x={MR_OUTER + 4} y={MR_OUTER + 5}
                  textAnchor="middle" dominantBaseline="central"
                  fontFamily="-apple-system, sans-serif"
                  fontSize={9} fontWeight={800} fill={NAVY}>
                  {stage.et}%
                </text>
              </svg>

              {/* Label */}
              <div style={{
                marginTop: 6, textAlign: "center",
              }}>
                <div style={{
                  fontSize: 12, fontWeight: isActive ? 700 : 500,
                  color: isActive ? NAVY : GRAY_SUB,
                  fontFamily: "-apple-system, sans-serif",
                  letterSpacing: -0.2,
                }}>
                  {stage.year}
                </div>
                <div style={{
                  fontSize: 9.5, fontWeight: 600,
                  color: isActive ? SAGE : GRAY_TRK,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase" as const,
                  fontFamily: "-apple-system, sans-serif",
                  marginTop: 1,
                }}>
                  {stage.tag}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Grid ─────────────────────────────────────────────────────────────────────
function Grid() {
  return (
    <svg width={1920} height={1080}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <pattern id="g" width="64" height="64" patternUnits="userSpaceOnUse">
          <path d="M 64 0 L 0 0 0 64" fill="none" stroke="rgba(27,58,92,0.035)" strokeWidth={0.5} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)" />
    </svg>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export const Anteile: React.FC = () => {
  const frame = useCurrentFrame();

  const headOp = useFade(0, 22);
  const headY = interpolate(frame, [0, 22], [14, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: BG }}>
      <Grid />

      {/* Headline top-left */}
      <div style={{
        position: "absolute", top: 52, left: 80, right: 80,
        opacity: headOp, transform: `translateY(${headY}px)`,
      }}>
        <div style={{
          fontSize: 10.5, fontWeight: 700, letterSpacing: "0.26em",
          textTransform: "uppercase" as const, color: SAGE, marginBottom: 10,
          fontFamily: "-apple-system, sans-serif",
        }}>
          Beteiligungsmodell
        </div>
        <div style={{
          fontSize: 32, fontWeight: 800, color: NAVY,
          letterSpacing: -1, lineHeight: 1.12,
          fontFamily: "-apple-system, sans-serif",
        }}>
          Durch Anteilsrückkäufe wird das Team
          <br />sukzessive zur{" "}
          <span style={{
            background: `linear-gradient(135deg, ${NAVY}, ${SAGE})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Mehrheit.
          </span>
        </div>
      </div>

      {/* Big donut */}
      <MainDonut />

      {/* Center numbers */}
      <CenterNumbers />

      {/* Stage info right side */}
      <StageLabel />

      {/* Timeline bottom */}
      <Timeline />
    </AbsoluteFill>
  );
};
