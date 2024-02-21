import shuffle from "lodash/shuffle";
import names from "../../generated/killed-in-gaza/name-freq-en.json";
import summary from "../../generated/summary.min.json";
import styles from "./KilledName.styles.module.css";
import { useState } from "react";
import { Button } from "..";

let boyList = shuffle(names.lists.boy);
let girlList = shuffle(names.lists.girl);
const latestChildrenKilledTotal = summary.killed.children;
const childrenInKilledNamesList =
  names.totalPeople.boy + names.totalPeople.girl;

// our list of names is a significant percentage of the reported number of those killed
// in terms of sample size, so we can size-up the count for a given name to approximate
// the number of people with that name killed assuming this list is representative of
// the wider population
const countAdjustRate =
  latestChildrenKilledTotal / childrenInKilledNamesList - 1;

const firstBoy: [string, number] = boyList.shift();
const firstGirl: [string, number] = girlList.shift();

const KilledNameCard = ({ name, count }: { name: string; count: number }) => {
  return (
    <div className={styles.card}>
      <div className={styles.cardOpacity} />
      <div style={{ position: "relative" }}>
        <div className={styles.question}>
          Do you know {name[0] === "A" ? "an" : "a"} {name}?
        </div>
        <div className={styles.count}>{count}</div>
        <div className={styles.label}>
          children <span>under 18</span> named {name} were killed.
        </div>
        <div className={styles.footnotes}>data.techforpalestine.org</div>
      </div>
    </div>
  );
};

const adjust = (count: number) => Math.round(count * countAdjustRate);

export const KilledName = () => {
  const [cards, setCards] = useState([
    { name: firstBoy[0], count: adjust(firstBoy[1]) },
    { name: firstGirl[0], count: adjust(firstGirl[1]) },
  ]);

  const loadMore = () => {
    if (!boyList.length || !girlList.length) {
      boyList = shuffle(names.lists.boy);
      girlList = shuffle(names.lists.girl);
    }

    const nextBoy = boyList.shift();
    const nextGirl = girlList.shift();

    setCards([
      { name: nextBoy[0], count: nextBoy[1] },
      { name: nextGirl[0], count: nextGirl[1] },
    ]);
  };

  return (
    <div>
      <div className={styles.cardRow}>
        <KilledNameCard {...cards[0]} />
        <KilledNameCard {...cards[1]} />
      </div>
      <div className={styles.buttonRow}>
        <Button type="primary" onClick={loadMore} inline>
          Load More
        </Button>
      </div>
    </div>
  );
};
