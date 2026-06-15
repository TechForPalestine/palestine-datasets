import styles from "./KilledHeaderMarquee.styles.module.css";
import type { KilledInGaza } from "../../../../types/killed-in-gaza.types";
import { PersonIcon } from "./PersonIcon";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { useEffect, useRef, useState } from "react";
import { MarqueeRow, SplitNameRows, getMarqueeRowsFromPage } from "./page.util";

const cssAnimationDurationMs = 120 * 1_000;
const newPageDownloadInterval = cssAnimationDurationMs * 0.5;
const fadeDurationMs = 500;

const fetchPage = async (page: number) => {
  const response = await fetch(`/api/v2/killed-in-gaza/page-${page}.json`);
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("application/json")) {
    throw new Error(
      `marquee page ${page} returned ${response.status} ${contentType || "(no content-type)"}`,
    );
  }
  return response.json() as Promise<KilledInGaza[]>;
};

const useInitialPage = () => {
  const {
    siteConfig: {
      customFields: { marqueeInitialPage },
    },
  } = useDocusaurusContext();

  return marqueeInitialPage as {
    pages: number[];
    people: SplitNameRows;
  };
};

export const KilledHeaderMarquee = () => {
  const initialState = useInitialPage();
  const pagesRef = useRef(initialState.pages);
  const [rows, setRows] = useState(initialState.people);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const id = setInterval(async () => {
      const firstPage = pagesRef.current.shift();
      const secondPage = pagesRef.current.shift();
      if (!firstPage || !secondPage) return;

      let merged;
      try {
        const [firstResult, secondResult] = await Promise.all([
          fetchPage(firstPage),
          fetchPage(secondPage),
        ]);
        merged = getMarqueeRowsFromPage(firstResult.concat(secondResult));
      } catch (err) {
        console.warn("KilledHeaderMarquee: skipping page swap", err);
        return;
      }

      setFading(true);
      setTimeout(() => {
        setRows(merged);
        setFading(false);
      }, fadeDurationMs);
    }, newPageDownloadInterval);

    return () => clearInterval(id);
  }, []);

  const renderTrack = (people: MarqueeRow["people"], copy: "a" | "b") =>
    people.map((person) => (
      <span
        key={`${copy}-${person.rtl ? "ar" : "en"}-${person.id}`}
        className={styles.name}
        dir={person.rtl ? "rtl" : undefined}
      >
        <PersonIcon type={person.icon} />
        {person.name}
        {person.age}
      </span>
    ));

  const mapRows =
    (sideIdx: number) =>
    ({ people }: MarqueeRow, sideRowIdx: number) => (
      <div key={`${sideIdx}-${sideRowIdx}-row`} className={styles.namesRow}>
        <span className={styles.track}>{renderTrack(people, "a")}</span>
        <span className={styles.track} aria-hidden="true">
          {renderTrack(people, "b")}
        </span>
      </div>
    );

  return (
    <div className={`marqueeContainer ${styles.container} ${fading ? styles.fading : ""}`}>
      <div className={styles.leftRows}>{rows.odd.map(mapRows(0))}</div>
      <div className={styles.rightRows}>{rows.even.map(mapRows(1))}</div>
    </div>
  );
};
