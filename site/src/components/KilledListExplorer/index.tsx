import React, { useRef } from "react";
import Fuse from "fuse.js";
import { Configure, Hits, InstantSearch, SearchBox } from "react-instantsearch";
import styles from "./styles.module.css";
import { LangOption, SearchPerson, fetchIndex } from "../../lib/search-index";

const createSearchClient = () => {
  let fuse = new Fuse([]);
  let initialQuery = "";
  return {
    search: async ([
      {
        params: { query, hitsPerPage: limit },
      },
    ]) => {
      const hits = fuse
        .search(query || initialQuery, { limit })
        .filter((hit) => hit.item.name.includes("?") === false);
      return Promise.resolve({
        results: [
          {
            // Hits component gets list item key prop from objectID field
            hits: hits.map((hit) => ({ ...hit, objectID: hit.item.key })),
            page: 0,
            nbHits: hits.length,
            nbPages: 1,
          },
        ],
      });
    },

    loadList: (list: SearchPerson[], lang: LangOption) => {
      initialQuery = lang === "ar" ? "أ" : "al";
      fuse = new Fuse(list, { keys: ["name"] });
    },
  };
};

const SearchHit = (props: { hit: { item: SearchPerson } }) => {
  const recordCount = props.hit.item.count;
  return (
    <div className={styles.searchResultItem}>
      <a href={`/docs/killed-in-gaza/person?ids=${props.hit.item.key}`}>
        {props.hit.item.name}{" "}
        <span className={styles.searchResultItemOccurrence}>
          ({recordCount})
        </span>
      </a>
    </div>
  );
};

const escapeKey = 27;
const SearchModal = ({ lang, searchClient, onClose }) => {
  const onKeyUp = (e) => {
    if (e.keyCode === escapeKey) {
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
              placeholder={lang === "ar" ? "البحث بالاسم" : "Search Name"}
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
  const [loading, setLoading] = React.useState<LangOption | "idle">("idle");
  const [open, setOpen] = React.useState<"ar" | "en" | "closed">("closed");

  const searchClient = useRef(createSearchClient());

  const onClickSearch = async (lang: LangOption) => {
    if (loading !== "idle") {
      return;
    }

    try {
      setLoading(lang);
      const personList = await fetchIndex(lang);
      searchClient.current.loadList(personList, lang);
      preventPageScroll();
      setOpen(lang);
    } finally {
      setLoading("idle");
    }
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
          {loading === "ar" ? "Loading..." : "Search Arabic Name"}
        </div>
        <div
          onClick={() => onClickSearch("en")}
          className="button button--secondary button--lg"
          style={{ marginBottom: 10 }}
        >
          {loading === "en" ? "Loading..." : "Search English Name"}
        </div>
      </div>
      {open !== "closed" && (
        <SearchModal {...{ lang: open, searchClient, onClose }} />
      )}
    </div>
  );
};
