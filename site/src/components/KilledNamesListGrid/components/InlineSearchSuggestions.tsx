import { forwardRef, useEffect } from "react";

import styles from "../killedNamesListGrid.module.css";

interface Props {
  searchSuggestion?: {
    main: string;
    others: string[];
  };
  nameSearch: string;
  onInlineSearchSuggestionsShown: () => void;
  onAcceptSearchSuggestion: (_: string) => void;
}

export const InlineSearchSuggestions = forwardRef<HTMLDivElement, Props>(
  (
    {
      searchSuggestion,
      nameSearch,
      onInlineSearchSuggestionsShown,
      onAcceptSearchSuggestion,
    },
    ref
  ) => {
    useEffect(() => {
      onInlineSearchSuggestionsShown();
    }, []);

    const suggestions = [searchSuggestion.main, ...searchSuggestion.others]
      .filter((name) => !nameSearch.includes(name))
      .map((alt) => (
        <span
          key={alt}
          onClick={() => onAcceptSearchSuggestion(alt)}
          style={{ display: "inline-block", marginRight: 6 }}
        >
          {alt}
        </span>
      ));

    if (!suggestions.length) {
      return null;
    }

    return (
      <div ref={ref} className={styles.searchSuggestionsWithMatch}>
        🔍 You may need to use alternate transliterations when searching in
        english. {suggestions.length === 1 ? "Suggestion" : "Suggestions"}:{" "}
        {suggestions}
      </div>
    );
  }
);
