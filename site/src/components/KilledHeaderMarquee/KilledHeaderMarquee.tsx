import styles from "./KilledHeaderMarquee.styles.module.css";
import type { KilledInGaza } from "../../../../types/killed-in-gaza.types";
import { PersonIcon } from "./PersonIcon";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { useEffect, useRef, useState } from "react";
import { getMergedPages } from "./page.util";

const cssAnimationDurationMs = 60 * 1_000;
const newPageDownloadInterval = cssAnimationDurationMs * 0.6;
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
    handleTransition();
    startMarquee();
    container.style.opacity = "1";
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
    people: KilledInGaza[];
  };
};

export const KilledHeaderMarquee = () => {
  const initialState = useInitialPage();
  const pagesRef = useRef(initialState.pages);
  const [rows, setRows] = useState(getNameRows(initialState.people));

  useEffect(() => {
    setInterval(() => {
      const firstPage = pagesRef.current.shift();
      const secondPage = pagesRef.current.shift();
      if (firstPage && secondPage) {
        Promise.all([fetchPage(firstPage), fetchPage(secondPage)]).then(
          ([firstResult, secondResult]) => {
            const merged = getMergedPages(firstResult, secondResult);
            transitionMarquee(() => setRows(getNameRows(merged)));
          }
        );
      }
    }, newPageDownloadInterval);
  }, []);

  const mapRows =
    (idx: number) =>
    (
      {
        people,
      }: {
        people: Array<{
          id: string;
          icon: IconType;
          name: string;
          age: string;
        }>;
      },
      iteration: number
    ) =>
      (
        <span key={`${idx}-${iteration}-row`} className={styles.namesRow}>
          {people.map((person) => (
            <span
              key={`${idx}-${iteration}-${person.id}`}
              className={styles.name}
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

const rows = 10;
function getNameRows(page: KilledInGaza[]) {
  const peoplePerRow = Math.floor(page.length / rows);
  return Array.from(new Array(rows)).reduce(
    (acc, _, i) => {
      const offset = i * peoplePerRow;
      const rowPeople = page.slice(offset, peoplePerRow + offset);

      const side = i % 2 ? "even" : "odd";
      return {
        ...acc,
        [side]: acc[side].concat({
          people: rowPeople.map((person) => ({
            id: person.id,
            icon: iconType(person),
            name: person.en_name,
            age: formatAge(person),
          })),
        }),
      };
    },
    { even: [], odd: [] }
  );
}

type IconType = React.ComponentProps<typeof PersonIcon>["type"];

function iconType(person: KilledInGaza): IconType {
  if (person.age >= 65) {
    return person.sex === "f" ? "elderly-woman" : "elderly-man";
  }

  if (person.age <= 18) {
    return person.sex === "f" ? "girl" : "boy";
  }

  return person.sex === "f" ? "woman" : "man";
}

function formatAge(person: KilledInGaza) {
  if (person.age === -1) {
    return null;
  }

  if (person.age === 0) {
    return ", <1";
  }

  return `, ${person.age}`;
}
