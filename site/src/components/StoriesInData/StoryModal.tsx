import { useEffect, useState } from "react";
import type { Story, StorySource } from "./types";
import {
  getBreakdown,
  getHistogram,
  getRateByAge,
  getSeries,
  getCoverageThrough,
  fmt,
  formatDate,
} from "./data";
import { StoryChart } from "./StoryCard";
import styles from "./StoriesInData.styles.module.css";

/**
 * Published filename per source id, for the "Built from:" pills. Most ids match
 * their file, but not all — `killed_in_gaza` reads the v3 list — so the mapping
 * is explicit rather than `${src}.json`, which would name a file that isn't
 * what the chart was built from.
 */
const SOURCE_FILES: Partial<Record<StorySource, string>> = {
  killed_in_gaza: "killed-in-gaza-v3.json",
  gaza_population_pcbs_2017: "gaza-population-pcbs-2017.json",
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
            {story.schema.sources.map((src) => (
              <span key={src} className={styles.sourcePill}>
                {SOURCE_FILES[src] ?? `${src}.json`}
              </span>
            ))}
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
