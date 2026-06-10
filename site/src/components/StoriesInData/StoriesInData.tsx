import { useRef, useState } from "react";
import { STORIES } from "./stories";
import { StoryCard } from "./StoryCard";
import { StoryModal } from "./StoryModal";
import styles from "./StoriesInData.styles.module.css";

/**
 * "Stories in the data" — the home-page card carousel.
 *
 * Drop into site/src/pages/index.tsx inside <main>, e.g. after <HomeDailyChart/>.
 * Each card opens a modal with a large interactive chart; see stories.ts for the
 * typed, dataset-backed schema behind each one.
 */
export function StoriesInData() {
  const [openId, setOpenId] = useState<string | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const scrollBy = (dir: number) =>
    viewportRef.current?.scrollBy({ left: dir * 340, behavior: "smooth" });
  const openStory = STORIES.find((s) => s.id === openId) ?? null;

  return (
    <section className={styles.section} aria-label="Stories in the data">
      <div className={styles.head}>
        <span className={styles.eyebrow}>Explore the data</span>
        <div className={styles.mastRow}>
          <h2 className={styles.headTitle}>Stories in the data</h2>
          <span className={styles.mastLine} aria-hidden="true" />
          <div className={styles.tools}>
            <button className={styles.arrow} aria-label="Scroll left" onClick={() => scrollBy(-1)}>
              ‹
            </button>
            <button className={styles.arrow} aria-label="Scroll right" onClick={() => scrollBy(1)}>
              ›
            </button>
          </div>
        </div>
      </div>

      <div className={styles.viewport} ref={viewportRef}>
        <div className={styles.track}>
          {STORIES.map((story) => (
            <StoryCard key={story.id} story={story} onOpen={setOpenId} />
          ))}
        </div>
      </div>

      {openStory && <StoryModal story={openStory} onClose={() => setOpenId(null)} />}
    </section>
  );
}
