import styles from "./KilledHeaderMarquee.styles.module.css";
import type {
  KilledInGaza,
  MarqueePerson,
} from "../../../../types/killed-in-gaza.types";
import { PersonIcon, PersonIconType } from "./PersonIcon";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { useEffect, useRef, useState } from "react";
import { MarqueeRow, SplitNameRows, getMarqueeRowsFromPage } from "./page.util";

const cssAnimationDurationMs = 120 * 1_000;
const newPageDownloadInterval = cssAnimationDurationMs * 0.3;
const fadeDuration = 500;

const fetchPage = async (page: number) => {
  const response = await fetch(`/api/v2/killed-in-gaza/page-${page}.json`);
  return response.json() as Promise<KilledInGaza[]>;
};

const animationNames: string[] = [];
const stopMarquee = () => {
  const spans = document.querySelectorAll("header div > span");
  spans.forEach((span: HTMLSpanElement) => {
    animationNames.push(span.style.animationName);
    span.style.animationName = "none";
  });
};

const startMarquee = () => {
  const spans = document.querySelectorAll("header div > span");
  spans.forEach((span: HTMLSpanElement, i) => {
    animationNames.push(span.style.animationName);
    span.style.animationName = animationNames[i];
  });
  animationNames.length = 0;
};

const transitionMarquee = (handleTransition: () => any) => {
  const container: HTMLDivElement = document.querySelector(".marqueeContainer");
  container.style.opacity = "0.2";
  setTimeout(() => {
    stopMarquee();
    // delay required to reset animation translate
    setTimeout(() => {
      handleTransition();
      startMarquee();
      container.style.opacity = "1";
    }, 10);
  }, fadeDuration);
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

  useEffect(() => {
    setInterval(() => {
      const firstPage = pagesRef.current.shift();
      const secondPage = pagesRef.current.shift();
      if (firstPage && secondPage) {
        Promise.all([fetchPage(firstPage), fetchPage(secondPage)]).then(
          ([firstResult, secondResult]) => {
            const merged = getMarqueeRowsFromPage(
              firstResult.concat(secondResult)
            );
            transitionMarquee(() => setRows(merged));
          }
        );
      }
    }, newPageDownloadInterval);
  }, []);

  const mapRows =
    (idx: number) =>
    ({ people }: MarqueeRow, iteration: number) =>
      (
        <span key={`${idx}-${iteration}-row`} className={styles.namesRow}>
          {people.map((person) => (
            <span
              key={`${idx}-${iteration}-${person.id}`}
              className={styles.name}
              dir={person.rtl ? "rtl" : undefined}
            >
              <PersonIcon type={person.icon} />
              {person.name}
              {person.age}
            </span>
          ))}
        </span>
      );

  return (
    <div className={`marqueeContainer ${styles.container}`}>
      <div className={styles.leftRows}>{rows.odd.map(mapRows(0))}</div>
      <div className={styles.rightRows}>{rows.even.map(mapRows(1))}</div>
    </div>
  );
};
