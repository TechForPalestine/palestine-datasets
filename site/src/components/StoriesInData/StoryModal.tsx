import { useEffect, useState } from "react";
import type { Story, StorySource } from "./types";
import {
  getBreakdown,
  getHistogram,
  getRateByAge,
  getBatchStack,
  getSeries,
  getCoverageThrough,
  fmt,
  formatDate,
} from "./data";
import { StoryChart } from "./StoryCard";
import styles from "./StoriesInData.styles.module.css";

/**
 * Dataset name + docs-page link per source id, for the "Built from:" pills.
 * `href` is omitted for sources with no published docs page (the PCBS
 * reference table isn't one of this project's datasets; Lebanon daily
 * casualties doesn't have a docs page yet) — those render as plain text.
 */
const SOURCE_INFO: Record<StorySource, { name: string; href?: string }> = {
  killed_in_gaza: { name: "Killed in Gaza", href: "/docs/killed-in-gaza" },
  summary: { name: "Summary Data", href: "/docs/summary" },
  casualties_daily: { name: "Daily Casualties – Gaza", href: "/docs/casualties-daily" },
  west_bank_daily: {
    name: "Daily Casualties – West Bank",
    href: "/docs/casualties-daily-west-bank",
  },
  lebanon_casualties_daily: { name: "Daily Casualties – Lebanon" },
  gaza_population_pcbs_2017: { name: "PCBS 2017 Census (Gaza)" },
};

/** Expanded story view. Large interactive chart, caption, and dataset sources. */
export function StoryModal({ story, onClose }: { story: Story; onClose: () => void }) {
  const [activeSlice, setActiveSlice] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const isPie = story.schema.type === "breakdown";
  const breakdown = isPie ? getBreakdown(story.schema) : null;
  const coverageThrough = getCoverageThrough(story.schema);

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={story.title}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.close} aria-label="Close" onClick={onClose}>
          ×
        </button>
        <span className={styles.kicker}>{story.kicker}</span>
        <h3 className={styles.modalTitle}>{story.title}</h3>
        <p className={styles.modalInsight}>{story.insight}</p>

        <div className={`${styles.modalChart} ${isPie ? styles.modalChartPie : ""}`}>
          <StoryChart
            story={story}
            variant="modal"
            activeSlice={activeSlice}
            onActiveSlice={setActiveSlice}
          />
        </div>

        <div className={styles.legend}>
          {breakdown
            ? breakdown.slices.map((s, i) => {
                const pct = ((s.value / breakdown.total) * 100).toFixed(
                  s.value / breakdown.total < 0.02 ? 1 : 0,
                );
                return (
                  <span
                    key={i}
                    className={`${styles.lg} ${styles.lgClick} ${activeSlice === i ? styles.lgOn : ""}`}
                    onPointerEnter={() => setActiveSlice(i)}
                    onPointerLeave={() => setActiveSlice(null)}
                  >
                    <i style={{ background: s.color }} />
                    {s.label} <b>{fmt(s.value)}</b> <span className={styles.lgPct}>{pct}%</span>
                  </span>
                );
              })
            : legendForSeries(story)}
        </div>

        <p className={styles.caption}>{story.caption}</p>

        <div className={styles.foot}>
          {coverageThrough && (
            <p className={styles.coverage}>
              Covers deaths recorded through {formatDate(coverageThrough)}.
            </p>
          )}
          <div className={styles.sources}>
            Built from:
            {story.schema.sources.map((src) => {
              const info = SOURCE_INFO[src];
              return info.href ? (
                <a key={src} href={info.href} className={styles.sourcePill}>
                  {info.name}
                </a>
              ) : (
                <span key={src} className={styles.sourcePill}>
                  {info.name}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function legendForSeries(story: Story) {
  const schema = story.schema;
  if (schema.type === "breakdown") return null;

  if (schema.type === "histogram") {
    const { bands } = getHistogram(schema);
    const left = bands.reduce((a, b) => a + b.left, 0);
    const right = bands.reduce((a, b) => a + b.right, 0);
    return (
      <>
        <span className={styles.lg}>
          <i style={{ background: schema.left.color }} />
          {schema.left.label} <b>{fmt(left)}</b>
        </span>
        <span className={styles.lg}>
          <i style={{ background: schema.right.color }} />
          {schema.right.label} <b>{fmt(right)}</b>
        </span>
      </>
    );
  }

  if (schema.type === "rate-by-age") {
    // The legend surfaces the killed counts behind the lines (what actually
    // happened), not the rates — the rates are on the chart itself, and the
    // counts are what a reader needs to judge how much weight one band
    // should carry versus another.
    const { bands } = getRateByAge(schema);
    const male = bands.reduce((a, b) => a + b.maleKilled, 0);
    const female = bands.reduce((a, b) => a + b.femaleKilled, 0);
    return (
      <>
        <span className={styles.lg}>
          <i style={{ background: schema.male.color }} />
          {schema.male.label} <b>{fmt(male)}</b>{" "}
          <span className={styles.lgPct}>killed, ages 5–79</span>
        </span>
        <span className={styles.lg}>
          <i style={{ background: schema.female.color }} />
          {schema.female.label} <b>{fmt(female)}</b>{" "}
          <span className={styles.lgPct}>killed, ages 5–79</span>
        </span>
      </>
    );
  }

  if (schema.type === "batch-stack") {
    // The chart is about a *change* in composition, so the legend carries both
    // ends of it rather than one share: what a group was in the first batch
    // and what it is in the latest. A single number here (the latest share, as
    // the stacked-area legend shows) would name the destination and leave the
    // movement — the actual finding — readable only off the columns.
    const { columns } = getBatchStack(schema);
    const first = columns[0];
    const last = columns[columns.length - 1];
    const pct = (v: number) => `${v.toFixed(v < 10 ? 1 : 0)}%`;
    return schema.groups.map((g, i) => {
      const a = first.segments[i].share;
      const b = last.segments[i].share;
      // A group absent at both ends (today: no_age) would be "0% → 0%", a
      // legend entry for a category the chart never draws.
      if (a === 0 && b === 0) return null;
      return (
        <span key={g.key} className={styles.lg}>
          <i style={{ background: g.color }} />
          {g.label}{" "}
          <b>
            {pct(a)} → {pct(b)}
          </b>
        </span>
      );
    });
  }

  // A percent-stacked chart's legend is far more useful with the latest share
  // attached — that's the number the chart is actually about.
  const shares = schema.type === "stacked-area" && schema.normalize === "percent" ? latest() : null;
  function latest() {
    const ends = getSeries(schema).map((s) => s.points[s.points.length - 1].value);
    const total = ends.reduce((a, b) => a + b, 0);
    return total > 0 ? ends.map((v) => (v / total) * 100) : null;
  }

  return schema.fields.map((f, i) => (
    <span key={i} className={styles.lg}>
      <i style={{ background: f.color }} />
      {f.label}
      {shares && <span className={styles.lgPct}>{shares[i].toFixed(shares[i] < 10 ? 1 : 0)}%</span>}
    </span>
  ));
}
