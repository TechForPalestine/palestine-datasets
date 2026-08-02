import { useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import type { ChartSeries, BreakdownSlice } from "./types";
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
      const max = dualScale
        ? s.points[s.points.length - 1].value || 1
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
            const d = `${linePath(s.pts)} L${s.pts[s.pts.length - 1].x.toFixed(1)} ${base} L${s.pts[0].x.toFixed(1)} ${base} Z`;
            return <path key={`a${si}`} d={d} fill={s.color} fillOpacity={0.14} stroke="none" />;
          })}
        {plotted.map((s, si) => (
          <path
            key={si}
            d={linePath(s.pts)}
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
  date,
  rows,
}: {
  show: boolean;
  xFrac: number;
  date: string;
  rows: TooltipRow[];
}) {
  const tipRef = useRef<HTMLDivElement | null>(null);
  const [left, setLeft] = useState<number | null>(null);

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
  }, [show, xFrac, rows]);

  return (
    <div
      ref={tipRef}
      className={styles.tip}
      style={{
        opacity: show ? 1 : 0,
        left: left != null ? `${left}px` : `${xFrac * 100}%`,
      }}
      aria-hidden={!show}
    >
      {date && <span className={styles.tipDate}>{formatDate(date)}</span>}
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
