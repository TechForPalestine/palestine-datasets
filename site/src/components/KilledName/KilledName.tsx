import * as html2Img from "html-to-image";
import shuffle from "lodash/shuffle";
import { format } from "date-fns/format";
import { parseISO } from "date-fns/parseISO";
import useIsBrowser from "@docusaurus/useIsBrowser";
import names from "../../generated/killed-in-gaza/name-freq-en.json";
import summary from "../../generated/summary.min.json";
import styles from "./KilledName.styles.module.css";
import { useEffect, useState } from "react";
import { Button } from "..";

let boyList = shuffle(names.lists.boy);
let girlList = shuffle(names.lists.girl);
const latestChildrenKilledTotal = summary.killed.children;
const latestDailyUpdate = format(
  parseISO(summary.lastDailyUpdate),
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

const firstBoy: [string, number] = boyList.shift();
const firstGirl: [string, number] = girlList.shift();

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

  const shareCardImage = async (id: string, tryShare: boolean) => {
    if (sharing) {
      return;
    }

    const filename = "tfp-names-behind-numbers.png";
    setSharing(true);
    const card = document.getElementById(id);
    if (!card) {
      return;
    }
    const blob = await html2Img.toBlob(card);
    if (tryShare) {
      const file = new File([blob], filename);
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
            onClick={() => shareCardImage(id, shareState.shareable)}
          >
            Share <ShareIcon />
          </div>
        )}
        <div className={styles.count}>{count}</div>
        <div
          className={[
            styles.label,
            name.length > 9 ? styles.labelSmall : "",
          ].join(" ")}
        >
          children <span>under 18</span> named {name} have been{" "}
          <span>killed</span>.
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

    const nextBoy = boyList.shift();
    const nextGirl = girlList.shift();

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
        <Button inline type="secondary" to="/docs/killed-in-gaza">
          Learn more about this dataset
        </Button>
        <div style={{ width: 10, height: 10 }} />
        <Button inline type="primary" onClick={loadMore}>
          See more names
        </Button>
      </div>
      <div className={styles.explanation}>
        Source: Our <a href="/docs/killed-in-gaza">Killed in Gaza dataset</a> as
        a first name population sample, with name counts derived from the latest
        number of children killed as of {latestDailyUpdate} from our{" "}
        <a href="/docs/summary">Summary dataset</a> based on the sample weight.
      </div>
    </div>
  );
};
