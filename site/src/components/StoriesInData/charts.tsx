import { useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import type { ChartSeries, BreakdownSlice, PyramidBand, AgeRateBand, BatchColumn } from "./types";
import { fmt, fmtShort, formatDate } from "./data";
import styles from "./StoriesInData.styles.module.css";

type Pad = { t: number; r: number; b: number; l: number };
const DEF_PAD: Pad = { t: 10, r: 8, b: 10, l: 8 };

/* ------------------------------------------------------------------ helpers */

function scaleX(i: number, n: number, W: number, pad: Pad) {
  return pad.l + (n <= 1 ? 0 : i / (n - 1)) * (W - pad.l - pad.r);
}
function scaleY(v: number, max: number, H: number, pad: Pad) {
  return H - pad.b - (max <= 0 ? 0 : v / max) * (H - pad.t - pad.b);
}
function linePath(pts: { x: number; y: number }[]) {
  return pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
}

/**
 * Step-after path: hold at the previous value across to the next point's x,
 * then jump vertically. For a series like `identified_cum` that only truly
 * changes on a handful of batch dates, a straight `linePath` between two
 * known points would draw a slope implying identification arrived
 * continuously in between — it didn't; every point between two batches was
 * flat, and the whole batch landed at once on its coverage date.
 */
function stepPath(pts: { x: number; y: number }[]) {
  let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` H${pts[i].x.toFixed(1)} V${pts[i].y.toFixed(1)}`;
  }
  return d;
}

/**
 * Shared hover layer: tracks nearest index from pointer x.
 * Responds to pointerdown too (not just move) so a tap registers on touch —
 * touch only emits pointermove while actively dragging, not on a plain tap.
 */
function useHoverIndex(n: number) {
  const [idx, setIdx] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement | null>(null);
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    setIdx(Math.round(frac * (n - 1)));
  };
  const onLeave = () => setIdx(null);
  return { idx, ref, onMove, onLeave };
}

/* ------------------------------------------------------------ Line / Area */

interface LineProps {
  series: ChartSeries[];
  area?: boolean;
  dualScale?: boolean;
  width?: number;
  height?: number;
  pad?: Pad;
  interactive?: boolean;
  grid?: number;
}

export function LineAreaChart({
  series,
  area = false,
  dualScale = false,
  width = 320,
  height = 130,
  pad = DEF_PAD,
  interactive = false,
  grid = 0,
}: LineProps) {
  const n = series[0]?.points.length ?? 0;
  const { idx, ref, onMove, onLeave } = useHoverIndex(n);

  const plotted = useMemo(() => {
    return series.map((s) => {
      // dualScale gives each series its own axis so a small one stays legible
      // next to a large one. It has to be the series' own *max*, not its last
      // value: that shortcut holds only for cumulative columns, and a rolling
      // rate peaks mid-window, so the peak would plot above the chart.
      const max = dualScale
        ? Math.max(...s.points.map((p) => p.value)) * 1.08 || 1
        : Math.max(...series.flatMap((q) => q.points.map((p) => p.value))) * 1.08 || 1;
      const pts = s.points.map((p, i) => ({
        x: scaleX(i, n, width, pad),
        y: scaleY(p.value, max, height, pad),
      }));
      return { ...s, pts };
    });
  }, [series, dualScale, width, height, pad, n]);

  return (
    <div className={styles.chartWrap}>
      <svg
        ref={ref}
        className={styles.svg}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        style={interactive ? { touchAction: "none" } : undefined}
        onPointerDown={interactive ? onMove : undefined}
        onPointerMove={interactive ? onMove : undefined}
        onPointerLeave={interactive ? onLeave : undefined}
      >
        {grid > 0 &&
          Array.from({ length: grid }, (_, i) => {
            const y = pad.t + ((i + 1) / (grid + 1)) * (height - pad.t - pad.b);
            return (
              <line key={i} className={styles.grid} x1={pad.l} x2={width - pad.r} y1={y} y2={y} />
            );
          })}
        {area &&
          plotted.map((s, si) => {
            const base = height - pad.b;
            const line = s.step ? stepPath(s.pts) : linePath(s.pts);
            const d = `${line} L${s.pts[s.pts.length - 1].x.toFixed(1)} ${base} L${s.pts[0].x.toFixed(1)} ${base} Z`;
            return <path key={`a${si}`} d={d} fill={s.color} fillOpacity={0.14} stroke="none" />;
          })}
        {plotted.map((s, si) => (
          <path
            key={si}
            d={s.step ? stepPath(s.pts) : linePath(s.pts)}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {interactive && idx != null && (
          <>
            <line
              className={styles.cross}
              x1={plotted[0].pts[idx].x}
              x2={plotted[0].pts[idx].x}
              y1={pad.t}
              y2={height - pad.b}
            />
            {plotted.map((s, si) => (
              <circle
                key={si}
                cx={s.pts[idx].x}
                cy={s.pts[idx].y}
                r={3.2}
                fill={s.color}
                stroke="var(--story-surface)"
                strokeWidth={1.5}
              />
            ))}
          </>
        )}
      </svg>
      {interactive && (
        <Tooltip
          show={idx != null}
          xFrac={idx != null && n > 1 ? idx / (n - 1) : 0}
          date={idx != null ? series[0].points[idx].date : ""}
          rows={series.map((s) => ({
            color: s.color,
            label: s.label,
            value: idx != null ? s.points[idx].value : s.points[s.points.length - 1].value,
          }))}
        />
      )}
    </div>
  );
}

/* --------------------------------------------------------- Stacked area */

export function StackedAreaChart({
  series,
  percent = false,
  width = 320,
  height = 130,
  pad = DEF_PAD,
  interactive = false,
  grid = 0,
}: Omit<LineProps, "area" | "dualScale"> & {
  /** stack to a constant 100% so the bands read as share, not absolute size */
  percent?: boolean;
}) {
  const n = series[0]?.points.length ?? 0;
  const { idx, ref, onMove, onLeave } = useHoverIndex(n);

  const { bands, totals, shares } = useMemo(() => {
    // `tops` are the running cumulative sums that form each band's upper edge,
    // in plot units — absolute values, or 0-100 shares when `percent`.
    const tops: number[][] = series.map(() => new Array(n).fill(0));
    const shares: number[][] = series.map(() => new Array(n).fill(0));
    const totals = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      const total = series.reduce((sum, s) => sum + s.points[i].value, 0);
      totals[i] = total;
      let acc = 0;
      for (let s = 0; s < series.length; s++) {
        const v = series[s].points[i].value;
        // A zero total (no reports in the window) has no meaningful share;
        // leave the column empty rather than dividing by zero.
        shares[s][i] = total > 0 ? (v / total) * 100 : 0;
        acc += percent ? shares[s][i] : v;
        tops[s][i] = acc;
      }
    }
    const max = percent ? 100 : Math.max(...totals) * 1.08 || 1;
    const bands = series.map((s, si) => {
      const upper = tops[si];
      const lower = si === 0 ? null : tops[si - 1];
      let d = "";
      for (let i = 0; i < n; i++)
        d += `${i ? "L" : "M"}${scaleX(i, n, width, pad).toFixed(1)} ${scaleY(upper[i], max, height, pad).toFixed(1)} `;
      for (let i = n - 1; i >= 0; i--)
        d += `L${scaleX(i, n, width, pad).toFixed(1)} ${scaleY(lower ? lower[i] : 0, max, height, pad).toFixed(1)} `;
      return { color: s.color, d: d + "Z" };
    });
    return { bands, totals, shares };
  }, [series, percent, width, height, pad, n]);

  return (
    <div className={styles.chartWrap}>
      <svg
        ref={ref}
        className={styles.svg}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        style={interactive ? { touchAction: "none" } : undefined}
        onPointerDown={interactive ? onMove : undefined}
        onPointerMove={interactive ? onMove : undefined}
        onPointerLeave={interactive ? onLeave : undefined}
      >
        {grid > 0 &&
          Array.from({ length: grid }, (_, i) => {
            const y = pad.t + ((i + 1) / (grid + 1)) * (height - pad.t - pad.b);
            return (
              <line key={i} className={styles.grid} x1={pad.l} x2={width - pad.r} y1={y} y2={y} />
            );
          })}
        {bands.map((b, i) => (
          <path
            key={i}
            d={b.d}
            fill={b.color}
            fillOpacity={0.92}
            stroke="var(--story-surface)"
            strokeWidth={0.7}
            strokeLinejoin="round"
          />
        ))}
        {interactive && idx != null && (
          <line
            className={styles.cross}
            x1={scaleX(idx, n, width, pad)}
            x2={scaleX(idx, n, width, pad)}
            y1={pad.t}
            y2={height - pad.b}
          />
        )}
      </svg>
      {interactive && (
        <Tooltip
          show={idx != null}
          xFrac={idx != null && n > 1 ? idx / (n - 1) : 0}
          date={idx != null ? series[0].points[idx].date : ""}
          rows={[
            ...series.map((s, si) => {
              const at = idx ?? n - 1;
              const value = s.points[at].value;
              return {
                color: s.color,
                label: s.label,
                value,
                // In percent mode the share is the point, with the count behind it.
                text: percent
                  ? `${shares[si][at].toFixed(shares[si][at] < 10 ? 1 : 0)}%`
                  : undefined,
                sub: percent ? fmt(value) : undefined,
              };
            }),
            {
              color: "var(--story-ink)",
              label: "Total",
              value: totals[idx ?? n - 1],
              strong: true,
            },
          ]}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------ Stacked columns */

interface ColumnProps {
  columns: BatchColumn[];
  /** stack each column to a constant 100% so it reads as composition, not size */
  percent?: boolean;
  width?: number;
  height?: number;
  pad?: Pad;
  /** show per-column batch number + coverage date; suppressed at card size. */
  showLabels?: boolean;
  interactive?: boolean;
  grid?: number;
}

/**
 * One stacked column per republish batch of the identified-record list.
 *
 * Columns, not an area, and evenly spaced rather than placed on a date scale:
 * the x axis is a batch ordinal. Ten batches landed at irregular coverage
 * dates and nothing was measured between any two of them, so an area would
 * interpolate a demographic drift that was never observed and date-spacing
 * would imply a continuous axis the data doesn't sit on. Discrete columns
 * claim exactly what's known — this batch, this mix — and nothing about the
 * gaps, the same reasoning behind `identified_cum`'s step line.
 *
 * Hover highlights a whole column rather than one segment: the question a
 * reader brings here is "what was this batch made of," which is a comparison
 * among the segments of one column, so the tooltip shows all of them at once.
 */
export function StackedColumnChart({
  columns,
  percent = false,
  width = 320,
  height = 130,
  pad = DEF_PAD,
  showLabels = false,
  interactive = false,
  grid = 0,
}: ColumnProps) {
  const [hover, setHover] = useState<number | null>(null);
  const n = columns.length;
  // Two label lines (batch number, coverage date) live below the plot, so the
  // stack has to end above them rather than run to the padded bottom edge.
  const labelH = showLabels ? 30 : 0;
  const plotBottom = height - pad.b - labelH;
  const plotH = plotBottom - pad.t;
  const slot = (width - pad.l - pad.r) / n;
  const barW = slot * 0.74;

  const max = useMemo(
    () => (percent ? 100 : Math.max(...columns.map((c) => c.records)) * 1.08 || 1),
    [columns, percent],
  );
  const clear = () => interactive && setHover(null);
  const hovered = hover != null ? columns[hover] : null;

  return (
    <div className={styles.chartWrap}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        onPointerLeave={clear}
      >
        {grid > 0 &&
          Array.from({ length: grid }, (_, i) => {
            const y = pad.t + ((i + 1) / (grid + 1)) * plotH;
            return (
              <line key={i} className={styles.grid} x1={pad.l} x2={width - pad.r} y1={y} y2={y} />
            );
          })}
        {columns.map((col, ci) => {
          const x = pad.l + ci * slot + (slot - barW) / 2;
          const dim = hover != null && hover !== ci;
          let acc = 0;
          return (
            <g
              key={col.number}
              onPointerEnter={interactive ? () => setHover(ci) : undefined}
              onPointerDown={interactive ? () => setHover(ci) : undefined}
            >
              {/* full-slot hit target: segments alone leave dead gaps between columns */}
              <rect
                x={pad.l + ci * slot}
                y={pad.t}
                width={slot}
                height={plotH}
                fill="transparent"
              />
              {col.segments.map((seg, si) => {
                const v = percent ? seg.share : seg.value;
                const y0 = plotBottom - (acc / max) * plotH;
                acc += v;
                const y1 = plotBottom - (acc / max) * plotH;
                const h = y0 - y1;
                if (h <= 0) return null;
                // 1px shaved off the top of every segment but the last gives a
                // surface-colored seam between neighbours, so two adjacent
                // bands never read as one block. Never below 0.5px, or a thin
                // segment would vanish into its own separator.
                const gap = si === col.segments.length - 1 ? 0 : Math.min(1, h - 0.5);
                return (
                  <rect
                    key={seg.label}
                    x={x}
                    y={y1 + gap}
                    width={barW}
                    height={Math.max(0.5, h - gap)}
                    fill={seg.color}
                    opacity={dim ? 0.4 : 0.92}
                  />
                );
              })}
              {showLabels && (
                <>
                  <text
                    x={x + barW / 2}
                    y={plotBottom + 13}
                    textAnchor="middle"
                    className={styles.colBatch}
                  >
                    {col.number}
                  </text>
                  <text
                    x={x + barW / 2}
                    y={plotBottom + 25}
                    textAnchor="middle"
                    className={styles.colDate}
                  >
                    {shortMonth(col.includesUntil)}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
      {interactive && hovered && (
        <Tooltip
          show
          xFrac={(pad.l + (hover! + 0.5) * slot) / width}
          header={`Batch ${hovered.number} · through ${formatDate(hovered.includesUntil)}`}
          rows={[
            ...hovered.segments
              .filter((s) => s.value > 0)
              .map((s) => ({
                color: s.color,
                label: s.label,
                value: s.value,
                text: `${s.share.toFixed(s.share < 10 ? 1 : 0)}%`,
                sub: fmt(s.value),
              })),
            {
              color: "var(--story-ink)",
              label: "Added by this batch",
              value: hovered.records,
              strong: true,
            },
          ]}
        />
      )}
    </div>
  );
}

/** "Jan ’24" — compact enough to sit under a column without colliding. */
function shortMonth(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return (
    d.toLocaleDateString(undefined, { month: "short", timeZone: "UTC" }) + " ’" + iso.slice(2, 4)
  );
}

/* ------------------------------------------------------------------ Donut */

interface DonutProps {
  slices: BreakdownSlice[];
  total: number;
  centerLabel: string;
  size?: number;
  donut?: number;
  active: number | null;
  onActive?: (i: number | null) => void;
}

function polar(cx: number, cy: number, r: number, a: number): [number, number] {
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

export function DonutChart({
  slices,
  total,
  centerLabel,
  size = 130,
  donut = 0.62,
  active,
  onActive,
}: DonutProps) {
  const r = size / 2;
  const ro = r * 0.97;
  const ri = donut * r;
  const sum = slices.reduce((a, s) => a + s.value, 0) || 1;

  let ang = -Math.PI / 2;
  const arcs = slices.map((s) => {
    const a0 = ang;
    const a1 = ang + (s.value / sum) * Math.PI * 2;
    ang = a1;
    const [xo0, yo0] = polar(r, r, ro, a0);
    const [xo1, yo1] = polar(r, r, ro, a1);
    const [xi1, yi1] = polar(r, r, ri, a1);
    const [xi0, yi0] = polar(r, r, ri, a0);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const d = `M${xo0.toFixed(2)} ${yo0.toFixed(2)} A${ro} ${ro} 0 ${large} 1 ${xo1.toFixed(2)} ${yo1.toFixed(2)} L${xi1.toFixed(2)} ${yi1.toFixed(2)} A${ri} ${ri} 0 ${large} 0 ${xi0.toFixed(2)} ${yi0.toFixed(2)} Z`;
    return { d, color: s.color };
  });

  const shown = active != null ? slices[active] : null;

  return (
    <svg
      className={styles.pie}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      onPointerLeave={() => onActive?.(null)}
    >
      {arcs.map((a, i) => (
        <path
          key={i}
          d={a.d}
          fill={a.color}
          stroke="var(--story-surface)"
          strokeWidth={2}
          className={styles.slice}
          style={{
            opacity: active == null || active === i ? 1 : 0.32,
            transform: active === i ? "scale(1.045)" : undefined,
          }}
          onPointerEnter={() => onActive?.(i)}
        />
      ))}
      <text
        className={styles.pieNum}
        x={r}
        y={r - 2}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {shown ? fmtShort(shown.value) : fmtShort(total)}
      </text>
      <text
        className={styles.pieLabel}
        x={r}
        y={r + size * 0.085}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {shown ? shown.label : centerLabel}
      </text>
    </svg>
  );
}

/* ----------------------------------------------------------------- Pyramid */

interface PyramidProps {
  bands: PyramidBand[];
  maxValue: number;
  leftLabel: string;
  rightLabel: string;
  leftColor: string;
  rightColor: string;
  width?: number;
  height?: number;
  /** show side labels + per-band age labels; suppressed at card size. */
  showLabels?: boolean;
  interactive?: boolean;
}

/**
 * Age/sex pyramid. Both sides are scaled off one shared `maxValue` (the max
 * across every band on either side) — a per-side scale would make bar length
 * incomparable across the centerline and misrepresent the sex ratio within
 * a band, which is exactly the thing this chart exists to show honestly.
 */
export function PyramidChart({
  bands,
  maxValue,
  leftLabel,
  rightLabel,
  leftColor,
  rightColor,
  width = 320,
  height = 130,
  showLabels = false,
  interactive = false,
}: PyramidProps) {
  const [hover, setHover] = useState<{ i: number; side: "left" | "right" } | null>(null);
  const n = bands.length;
  const pad = { t: showLabels ? 18 : 4, r: 6, b: 4, l: 6 };
  const rowH = (height - pad.t - pad.b) / n;
  const barH = Math.max(1, rowH - Math.min(rowH * 0.16, 2));
  const cx = width / 2;
  const half = width / 2 - pad.r - (showLabels ? 20 : 0);
  const scale = (v: number) => (maxValue <= 0 ? 0 : (v / maxValue) * (half - 2));

  const clear = () => interactive && setHover(null);
  const hovered = hover ? bands[hover.i] : null;

  return (
    <div className={styles.chartWrap}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        style={interactive ? { touchAction: "none" } : undefined}
        onPointerLeave={clear}
      >
        {showLabels && (
          <>
            <text x={cx - half / 2} y={11} textAnchor="middle" className={styles.pyramidSide}>
              {leftLabel}
            </text>
            <text x={cx + half / 2} y={11} textAnchor="middle" className={styles.pyramidSide}>
              {rightLabel}
            </text>
          </>
        )}
        <line className={styles.grid} x1={cx} x2={cx} y1={pad.t} y2={height - pad.b} />
        {bands.map((b, i) => {
          // ages run bottom (0-4) to top (85+); rows are stored oldest-first.
          const row = n - 1 - i;
          const y = pad.t + row * rowH + (rowH - barH) / 2;
          const lw = scale(b.left);
          const rw = scale(b.right);
          const dim = hover != null;
          return (
            <g key={i}>
              <rect
                x={cx - lw}
                y={y}
                width={lw}
                height={barH}
                fill={leftColor}
                opacity={dim && !(hover?.i === i && hover.side === "left") ? 0.45 : 1}
                onPointerEnter={interactive ? () => setHover({ i, side: "left" }) : undefined}
                onPointerDown={interactive ? () => setHover({ i, side: "left" }) : undefined}
              />
              <rect
                x={cx}
                y={y}
                width={rw}
                height={barH}
                fill={rightColor}
                opacity={dim && !(hover?.i === i && hover.side === "right") ? 0.45 : 1}
                onPointerEnter={interactive ? () => setHover({ i, side: "right" }) : undefined}
                onPointerDown={interactive ? () => setHover({ i, side: "right" }) : undefined}
              />
              {showLabels && (
                <text
                  x={cx}
                  y={y + barH / 2}
                  dy={3}
                  textAnchor="middle"
                  className={styles.pyramidBand}
                >
                  {b.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {interactive && hover && hovered && (
        <Tooltip
          show
          xFrac={hover.side === "left" ? 0.25 : 0.75}
          yFrac={(n - 1 - hover.i + 0.5) / n}
          header={`${hover.side === "left" ? leftLabel : rightLabel} · ${hovered.label}`}
          rows={[
            {
              color: hover.side === "left" ? leftColor : rightColor,
              value: hover.side === "left" ? hovered.left : hovered.right,
            },
          ]}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------- Rate/age */

interface RateByAgeProps {
  bands: AgeRateBand[];
  maxValue: number;
  maleLabel: string;
  femaleLabel: string;
  maleColor: string;
  femaleColor: string;
  width?: number;
  height?: number;
  showLabels?: boolean;
  interactive?: boolean;
  grid?: number;
}

/**
 * Two lines — male, female — across categorical 5-year age bands, on one
 * shared y scale (deaths per 1,000). Unlike `LineAreaChart`'s `dualScale`
 * option, there is no own-max mode here: the entire point of this chart is
 * that the female line stays flat while the male line rises and falls, and
 * that contrast only reads honestly when both are plotted against the same
 * axis. Own-max scaling would stretch the flat female line to fill its own
 * range and erase the difference this chart exists to show.
 */
export function RateByAgeChart({
  bands,
  maxValue,
  maleLabel,
  femaleLabel,
  maleColor,
  femaleColor,
  width = 320,
  height = 130,
  showLabels = false,
  interactive = false,
  grid = 0,
}: RateByAgeProps) {
  const n = bands.length;
  const { idx, ref, onMove, onLeave } = useHoverIndex(n);
  const pad: Pad = { t: 10, r: 10, b: showLabels ? 22 : 14, l: 10 };

  // Card size can't fit all 15 band labels legibly, so it shows every third
  // one (plus the last) rather than every one — sparse but still anchors the
  // reader to real ages instead of an unlabeled axis. The modal shows all 15.
  const labelStride = showLabels ? 1 : 3;

  const { malePts, femalePts } = useMemo(() => {
    const toPts = (values: number[]) =>
      values.map((v, i) => ({ x: scaleX(i, n, width, pad), y: scaleY(v, maxValue, height, pad) }));
    return {
      malePts: toPts(bands.map((b) => b.male)),
      femalePts: toPts(bands.map((b) => b.female)),
    };
  }, [bands, maxValue, width, height, pad, n]);

  const hovered = idx != null ? bands[idx] : null;

  return (
    <div className={styles.chartWrap}>
      <svg
        ref={ref}
        className={styles.svg}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        style={interactive ? { touchAction: "none" } : undefined}
        onPointerDown={interactive ? onMove : undefined}
        onPointerMove={interactive ? onMove : undefined}
        onPointerLeave={interactive ? onLeave : undefined}
      >
        {grid > 0 &&
          Array.from({ length: grid }, (_, i) => {
            const y = pad.t + ((i + 1) / (grid + 1)) * (height - pad.t - pad.b);
            return (
              <line key={i} className={styles.grid} x1={pad.l} x2={width - pad.r} y1={y} y2={y} />
            );
          })}
        <path d={linePath(femalePts)} fill="none" stroke={femaleColor} strokeWidth={2} />
        <path d={linePath(malePts)} fill="none" stroke={maleColor} strokeWidth={2} />
        {bands.map((b, i) => (
          <g key={i}>
            <circle
              cx={femalePts[i].x}
              cy={femalePts[i].y}
              r={2.4}
              fill={femaleColor}
              opacity={idx != null && idx !== i ? 0.4 : 1}
            />
            <circle
              cx={malePts[i].x}
              cy={malePts[i].y}
              r={2.4}
              fill={maleColor}
              opacity={idx != null && idx !== i ? 0.4 : 1}
            />
            {(i % labelStride === 0 || i === n - 1) && (
              <text
                x={scaleX(i, n, width, pad)}
                y={height - (showLabels ? 6 : 3)}
                textAnchor="middle"
                className={styles.pyramidBand}
              >
                {b.label}
              </text>
            )}
          </g>
        ))}
        {interactive && idx != null && (
          <line
            className={styles.cross}
            x1={malePts[idx].x}
            x2={malePts[idx].x}
            y1={pad.t}
            y2={height - pad.b}
          />
        )}
      </svg>
      {interactive && hovered && (
        <Tooltip
          show
          xFrac={n > 1 ? (idx as number) / (n - 1) : 0}
          header={hovered.label}
          rows={[
            {
              color: maleColor,
              label: maleLabel,
              value: hovered.male,
              text: `${hovered.male.toFixed(1)}/1,000`,
              sub: `${fmt(hovered.maleKilled)} of ~${fmt(hovered.malePop)}`,
            },
            {
              color: femaleColor,
              label: femaleLabel,
              value: hovered.female,
              text: `${hovered.female.toFixed(1)}/1,000`,
              sub: `${fmt(hovered.femaleKilled)} of ~${fmt(hovered.femalePop)}`,
            },
          ]}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Tooltip */

interface TooltipRow {
  color: string;
  label?: string;
  value: number;
  /** shown in place of the formatted `value` (e.g. "62%") */
  text?: string;
  /** dimmed detail after `text` (e.g. the raw count behind a share) */
  sub?: string;
  strong?: boolean;
}

/**
 * Positioned in pixels (clamped to the chart's own bounds) rather than a
 * plain `left: xFrac%` + translateX(-50%). Near the axis ends that centered
 * percentage pushes the tooltip's box past the chart edge, where the modal's
 * scroll container (overflow-y: auto implicitly forces overflow-x: auto too)
 * clips it. Clamping in pixels keeps the whole box inside the chart, so it
 * never depends on an ancestor's overflow behavior.
 */
function Tooltip({
  show,
  xFrac,
  yFrac,
  date,
  header,
  rows,
}: {
  show: boolean;
  xFrac: number;
  /** vertical position as a 0-1 fraction of the chart height; omit to pin to the top, as line/area charts do. */
  yFrac?: number;
  date?: string;
  /** pre-formatted header text, used instead of running `date` through formatDate. */
  header?: string;
  rows: TooltipRow[];
}) {
  const tipRef = useRef<HTMLDivElement | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const [top, setTop] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!show) return;
    const el = tipRef.current;
    const container = el?.parentElement;
    if (!el || !container) return;
    const containerW = container.clientWidth;
    const half = el.offsetWidth / 2;
    const margin = 4;
    const raw = xFrac * containerW;
    setLeft(Math.min(Math.max(raw, half + margin), containerW - half - margin));
    if (yFrac != null) {
      const containerH = container.clientHeight;
      const rawTop = yFrac * containerH;
      setTop(Math.min(Math.max(rawTop, margin), containerH - el.offsetHeight - margin));
    }
  }, [show, xFrac, yFrac, rows]);

  return (
    <div
      ref={tipRef}
      className={styles.tip}
      style={{
        opacity: show ? 1 : 0,
        left: left != null ? `${left}px` : `${xFrac * 100}%`,
        top: yFrac != null ? (top != null ? `${top}px` : `${yFrac * 100}%`) : undefined,
      }}
      aria-hidden={!show}
    >
      {header ? (
        <span className={styles.tipDate}>{header}</span>
      ) : (
        date && <span className={styles.tipDate}>{formatDate(date)}</span>
      )}
      {rows.map((row, i) => (
        <span key={i} className={styles.tipRow}>
          <i style={{ background: row.color }} />
          {row.label && <span className={styles.tipLbl}>{row.label}</span>}
          <b>{row.text ?? fmt(row.value)}</b>
          {row.sub && <span className={styles.tipSub}>{row.sub}</span>}
        </span>
      ))}
    </div>
  );
}
