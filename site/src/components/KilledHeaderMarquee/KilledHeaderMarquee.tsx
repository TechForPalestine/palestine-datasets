import styles from "./KilledHeaderMarquee.styles.module.css";
import type { KilledInGaza } from "../../../../types/killed-in-gaza.types";
import { PersonIcon, PersonIconType } from "./PersonIcon";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { useEffect, useRef, useState } from "react";
import { MarqueeRow, SplitNameRows, getMarqueeRowsFromPage } from "./page.util";

const cssAnimationDurationMs = 120 * 1_000;
const newPageDownloadInterval = cssAnimationDurationMs * 0.5;
const fadeDuration = 500;

const fetchPage = async (page: number) => {
  const response = await fetch(`/api/v2/killed-in-gaza/page-${page}.json`);
  return response.json() as Promise<KilledInGaza[]>;
};

/**
 * the only reliable way to reset a CSS animation is to remove & reattach that part
 * of the DOM tree. by holding a reference to the removed nodes here in memory, we
 * can reattach them to restart the marquee after we've loaded a new page of names
 */
let marqueeLeftDiv: Element | void;
let marqueeRightDiv: Element | void;

const getMarqueeContainer = () => {
  return document.querySelector("#marquee");
};

const stopMarquee = () => {
  const parent = getMarqueeContainer();
  const leftChild = document.querySelector("#marqueeLeft");
  const rightChild = document.querySelector("#marqueeRight");
  try {
    marqueeLeftDiv = parent.removeChild(leftChild);
    marqueeRightDiv = parent.removeChild(rightChild);
  } catch (e) {
    console.warn(e);
  }
};

const startMarquee = () => {
  if (marqueeLeftDiv && marqueeRightDiv) {
    const parent = getMarqueeContainer();
    parent.appendChild(marqueeLeftDiv);
    parent.appendChild(marqueeRightDiv);
  }
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
    }, 50);
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

let fetchInterval: ReturnType<typeof setInterval>;

export const KilledHeaderMarquee = () => {
  const initialState = useInitialPage();
  const pagesRef = useRef(initialState.pages);
  const [rows, setRows] = useState(initialState.people);

  useEffect(() => {
    fetchInterval = setInterval(() => {
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

    return () => clearInterval(fetchInterval);
  }, []);

  const mapRows =
    (sideIdx: number) =>
    ({ people }: MarqueeRow, sideRowIdx: number) =>
      (
        <span key={`${sideIdx}-${sideRowIdx}-row`} className={styles.namesRow}>
          {people.map((person) => (
            <span
              key={`${person.rtl ? "ar" : "en"}-${sideIdx}-${sideRowIdx}-${
                person.id
              }`}
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
    <div id="marquee" className={`marqueeContainer ${styles.container}`}>
      <div id="marqueeLeft" className={styles.leftRows}>
        {rows.odd.map(mapRows(0))}
      </div>
      <div id="marqueeRight" className={styles.rightRows}>
        {rows.even.map(mapRows(1))}
      </div>
    </div>
  );
};
