import { useEffect, useState } from "react";
import type { Story } from "./types";
import { getBreakdown, fmt } from "./data";
import { StoryChart } from "./StoryCard";
import styles from "./StoriesInData.styles.module.css";

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
          <div className={styles.sources}>
            Built from:
            {story.schema.sources.map((src) => (
              <span key={src} className={styles.sourcePill}>
                {src}.json
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function legendForSeries(story: Story) {
  if (story.schema.type === "breakdown") return null;
  return story.schema.fields.map((f, i) => (
    <span key={i} className={styles.lg}>
      <i style={{ background: f.color }} />
      {f.label}
    </span>
  ));
}
