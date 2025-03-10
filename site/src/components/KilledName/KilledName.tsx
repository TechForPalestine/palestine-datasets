import * as html2Img from "html-to-image";
import shuffle from "lodash/shuffle";
import { format } from "date-fns/format";
import { parseISO } from "date-fns/parseISO";
import names from "../../generated/killed-in-gaza/name-freq-en.json";
import summary from "../../generated/summary.min.json";
import styles from "./KilledName.styles.module.css";
import { useEffect, useState } from "react";
import { Button } from "..";

let boyList = shuffle(names.lists.boy);
let girlList = shuffle(names.lists.girl);
const latestChildrenKilledTotal =
  summary.gaza.killed.children + summary.west_bank.killed.children;
const latestDailyUpdate = format(
  parseISO(summary.gaza.last_update),
  "MMMM do, yyyy"
);
const childrenInKilledNamesList =
  names.totalPeople.boy + names.totalPeople.girl;

// our list of names is a significant percentage of the reported number of those killed
// in terms of sample size, so we can size-up the count for a given name to approximate
// the number of people with that name killed assuming this list is representative of
// the wider population
const adjust = (count: number) =>
  Math.round((count / childrenInKilledNamesList) * latestChildrenKilledTotal);

const firstBoy = boyList.shift() as [string, number];
const firstGirl = girlList.shift() as [string, number];

const formatter = new Intl.NumberFormat("en-US");

const ShareIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 1000 1004.1441"
      style={{ position: "relative", top: 5 }}
    >
      <path
        fill="#eee"
        d="m946 383.144-279-250c-25-21-63-4-63 29v130c-366 4-533 345-562 520 196-225 321-291 562-295v141c0 34 38 50 63 29l279-245c17-17 17-42 0-59z"
      />
    </svg>
  );
};

const KilledNameCard = ({
  id,
  name,
  count,
  shareState,
}: {
  id: string;
  name: string;
  count: number;
  shareState: { shareable: boolean; saveable: boolean };
}) => {
  const [sharing, setSharing] = useState(false);

  const shareCardImage = async (
    id: string,
    name: string,
    tryShare: boolean
  ) => {
    if (sharing) {
      return;
    }

    const filename = "tfp-names-behind-numbers.png";
    setSharing(true);
    const card = document.getElementById(id);
    if (!card) {
      return;
    }
    card.classList.add("capturing");
    const blob = await html2Img.toBlob(card);
    card.classList.remove("capturing");

    if (tryShare) {
      const file = new File([blob], filename, { type: "image/png" });
      const shareData = { files: [file] };
      const canShare = await navigator.canShare(shareData);
      if (canShare) {
        await navigator.share(shareData);
        setSharing(false);
        return;
      }
    }

    const a: HTMLAnchorElement = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";

    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    setSharing(false);
  };

  return (
    <div id={id} className={styles.card}>
      <div className={styles.cardOpacity} />
      <div style={{ position: "relative" }}>
        <div className={styles.question}>
          Do you know {name[0] === "A" ? "an" : "a"} {name}?
        </div>
        {!sharing && (shareState.shareable || shareState.saveable) && (
          <div
            className={styles.shareButton}
            onClick={() => shareCardImage(id, name, shareState.shareable)}
          >
            Share <ShareIcon />
          </div>
        )}
        <svg
          width="100%"
          height="140"
          viewBox="0 0 500 75"
          className="count"
          preserveAspectRatio="xMinYMid meet"
        >
          <text
            x="50%"
            y={count > 999 ? 105 : 120}
            textAnchor="middle"
            fontSize={count > 999 ? 170 : 200}
            fontWeight="bold"
            fill="#ca3a32"
          >
            {formatter.format(count)}
          </text>
        </svg>
        <div
          className={[
            styles.label,
            name.length > 9 ? styles.labelSmall : "",
          ].join(" ")}
        >
          <span>children</span> named {name} have been <span>killed</span>.
        </div>
        <div className={styles.footnotes}>data.techforpalestine.org</div>
      </div>
    </div>
  );
};

export const KilledName = () => {
  const [shareState, setShareState] = useState({
    shareable: false,
    saveable: false,
  });
  useEffect(() => {
    const shareable =
      typeof navigator.canShare === "function" &&
      typeof navigator.share === "function";
    const saveable = true;
    setShareState({ shareable, saveable });
  }, []);

  const [cards, setCards] = useState([
    { name: firstBoy[0], count: adjust(firstBoy[1]) },
    { name: firstGirl[0], count: adjust(firstGirl[1]) },
  ]);

  const loadMore = () => {
    if (!boyList.length || !girlList.length) {
      boyList = shuffle(names.lists.boy);
      girlList = shuffle(names.lists.girl);
    }

    const nextBoy = boyList.shift() as [string, number];
    const nextGirl = girlList.shift() as [string, number];

    setCards([
      { name: nextBoy[0], count: adjust(nextBoy[1]) },
      { name: nextGirl[0], count: adjust(nextGirl[1]) },
    ]);
  };

  return (
    <div>
      <div className={styles.title}>
        Names Behind Numbers <span>Killed in Gaza Dataset</span>
      </div>
      <div className={styles.cardRow}>
        <KilledNameCard
          id="leftNameCard"
          {...cards[0]}
          shareState={shareState}
        />
        <KilledNameCard
          id="rightNameCard"
          {...cards[1]}
          shareState={shareState}
        />
      </div>
      <div className={styles.buttonRow}>
        <Button
          inline
          type="secondary"
          to="/docs/summary/#killed-children-by-name-usage"
        >
          Learn more about this dataset
        </Button>
        <div style={{ width: 10, height: 10 }} />
        <Button inline type="primary" onClick={loadMore}>
          See more names
        </Button>
      </div>
      <div className={styles.explanation}>
        Source: Our{" "}
        <a href="/docs/killed-in-gaza/#child-name-counts">
          Killed in Gaza dataset
        </a>{" "}
        as an under 18 population sample to arrive at first name weights, with
        name counts derived (using the name weighting) from the latest number of
        children killed from our{" "}
        <a href="/docs/summary/#killed-children-by-name-usage">
          Summary dataset
        </a>{" "}
        as of {latestDailyUpdate}.
      </div>
    </div>
  );
};
