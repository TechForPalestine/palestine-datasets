import React, { useEffect, useMemo, useRef } from "react";
import Fuse from "fuse.js";
import { Configure, Hits, InstantSearch, SearchBox } from "react-instantsearch";
import styles from "./styles.module.css";

type LangOption = "ar" | "en";

const createSearchClient = () => {
  let fuse = new Fuse([]);
  let initialQuery = "";
  return {
    search: ([
      {
        params: { query, hitsPerPage: limit },
      },
    ]) => {
      console.log({ query });
      const hits = fuse.search(query || initialQuery, { limit });

      return Promise.resolve({
        results: [
          {
            hits,
            page: 0,
            nbHits: hits.length,
            nbPages: 1,
          },
        ],
      });
    },

    loadList: (list: Person[], lang: LangOption) => {
      initialQuery = lang === "ar" ? "أ" : "al";
      fuse = new Fuse(list, { keys: ["name"] });
    },
  };
};

type Person = { name: string; ids: string[] };

const SearchHit = (props: { hit: { item: Person } }) => {
  return (
    <div className={styles.searchResultItem} key={props.hit.item.ids.join("m")}>
      {props.hit.item.name}
    </div>
  );
};

const buildNameList = (json: {
  index: string[];
  names: Record<string, string>;
}) => {
  return Object.entries(json.names).reduce((acc, [indexedName, ids]) => {
    const name = indexedName
      .split(" ")
      .map((index) => json.index[+index])
      .join(" ");
    return acc.concat({
      name,
      ids: ids.split(","),
    });
  }, [] as Array<Person>);
};

const escape = 27;
const SearchModal = ({ lang, searchClient, onClose }) => {
  const onKeyUp = (e) => {
    if (e.keyCode === escape) {
      onClose();
    }
  };

  return (
    <div className={styles.searchModalContainer} onClick={onClose}>
      <div className={styles.searchModal}>
        <InstantSearch searchClient={searchClient.current} indexName="killed">
          <div className={styles.searchBar}>
            <SearchBox
              dir={lang === "ar" ? "rtl" : undefined}
              onKeyUp={onKeyUp}
              autoFocus
            />
          </div>
          <Configure hitsPerPage={20} />
          <div className={styles.searchResults}>
            <Hits
              hitComponent={SearchHit}
              dir={lang === "ar" ? "rtl" : undefined}
            />
          </div>
        </InstantSearch>
      </div>
    </div>
  );
};

const preventPageScroll = () =>
  (document.querySelector("body").style.overflow = "hidden");
const allowPageScroll = () =>
  (document.querySelector("body").style.overflow = "auto");

export const KilledListExplorer = () => {
  const [open, setOpen] = React.useState<"ar" | "en" | "closed">("closed");

  const searchClient = useRef(createSearchClient());

  const fetchIndex = async (lang: LangOption) => {
    const response = await fetch(
      `/api/v2/killed-in-gaza/name-index-${lang}.json`
    );
    if (response.ok) {
      const json = await response.json();
      searchClient.current.loadList(buildNameList(json), lang);
    }
  };

  const onClickSearch = async (lang: LangOption) => {
    await fetchIndex(lang);
    preventPageScroll();
    setOpen(lang);
  };

  const onClose = (e) => {
    if (!e || e.target.className.includes("searchModalContainer")) {
      allowPageScroll();
      setOpen("closed");
    }
  };

  return (
    <div>
      <div className={styles.searchButtons}>
        <div
          onClick={() => onClickSearch("ar")}
          className="button button--secondary button--lg"
          style={{ marginBottom: 10 }}
        >
          Search Arabic Name
        </div>
        <div
          onClick={() => onClickSearch("en")}
          className="button button--secondary button--lg"
          style={{ marginBottom: 10 }}
        >
          Search English Name
        </div>
      </div>
      {open !== "closed" && (
        <SearchModal {...{ lang: open, searchClient, onClose }} />
      )}
    </div>
  );
};
