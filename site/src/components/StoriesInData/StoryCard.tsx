import type { Story } from "./types";
import { getSeries, getBreakdown } from "./data";
import { LineAreaChart, StackedAreaChart, DonutChart } from "./charts";
import styles from "./StoriesInData.styles.module.css";

/** The chart shown for a story, sized for either a card (mini) or the modal. */
export function StoryChart({
  story,
  variant,
  activeSlice,
  onActiveSlice,
}: {
  story: Story;
  variant: "card" | "modal";
  activeSlice?: number | null;
  onActiveSlice?: (i: number | null) => void;
}) {
  const s = story.schema;
  const isModal = variant === "modal";
  const W = isModal ? 920 : 320;
  const H = isModal ? 360 : 120;
  const grid = isModal ? 3 : 0;
  const pad = isModal ? { t: 18, r: 16, b: 18, l: 16 } : { t: 10, r: 8, b: 10, l: 8 };

  if (s.type === "breakdown") {
    const { slices, total } = getBreakdown(s);
    return (
      <DonutChart
        slices={slices}
        total={total}
        centerLabel={isModal ? s.centerLabel : ""}
        size={isModal ? 300 : 108}
        active={activeSlice ?? null}
        onActive={onActiveSlice}
      />
    );
  }

  const series = getSeries(s);
  if (s.type === "stacked-area") {
    return <StackedAreaChart series={series} width={W} height={H} pad={pad} grid={grid} interactive={isModal} />;
  }
  return (
    <LineAreaChart
      series={series}
      area={s.type === "timeseries-area"}
      dualScale={s.type === "timeseries-multi" && !!s.dualScale}
      width={W}
      height={H}
      pad={pad}
      grid={grid}
      interactive={isModal}
    />
  );
}

/** A single carousel card. No badge, no dataset tags — chart, kicker, title, insight. */
export function StoryCard({ story, onOpen }: { story: Story; onOpen: (id: string) => void }) {
  const isPie = story.schema.type === "breakdown";
  return (
    <article
      className={styles.card}
      role="button"
      tabIndex={0}
      aria-label={`Explore: ${story.title}`}
      onClick={() => onOpen(story.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(story.id);
        }
      }}
    >
      <div className={`${styles.cardChart} ${isPie ? styles.cardChartPie : ""}`}>
        <StoryChart story={story} variant="card" />
      </div>
      <span className={styles.kicker}>{story.kicker}</span>
      <h3 className={styles.cardTitle}>{story.title}</h3>
      <p className={styles.cardInsight}>{story.insight}</p>
    </article>
  );
}
