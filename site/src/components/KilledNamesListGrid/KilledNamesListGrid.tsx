import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Grid, useGridRef } from "react-window";
import debounce from "lodash.debounce";
import { kig3FieldIndex, PersonRow, PersonType } from "./types";
import { startWorker } from "./startWorker";
import { Cell } from "./components/Cell";
import { Header } from "./components/Header";
import { StatusRow } from "./components/StatusRow";

import { TitleRow } from "./components/TitleRow";
import { ScrollProgress } from "./components/ScrollProgress";
import { Spinner } from "../../components/Spinner";

const recordUpdateInterval = 100;
const frameRangeUpdateInterval = 0;
const searchInputUpdateInterval = 300;
const searchUniqueNameHitFactor = 3;
const resizeUpdateInterval = 200;
const overscanRecordCount = 40;
const rowHeight = 40;

import styles from "./killedNamesListGrid.module.css";
import { getColumnConfig, recordCols } from "./getColumnConfig";
import { FilterRow } from "./components/FilterRow";
import { iconTypeForPerson, sexIsValid } from "../../lib/age-icon";
import clsx from "clsx";
import { ScrollButtonBar } from "./components/ScrollButtonBar";
import { hasMobileToolbarDimensionChange } from "./dimension.utils";
import { CancelCircleIcon } from "../CancelCircleIcon";
import {
  updateDates,
  updateLinks,
} from "../../../../scripts/data/common/killed-in-gaza/constants";
import { createCSVDownload } from "./csvDownload";
import { minimumSearchTermLength, suggestSearch } from "./searchSuggestion";
import { InlineSearchSuggestions } from "./components/InlineSearchSuggestions";
import {
  buildPrintDocument,
  PRINT_TRANCHE_SIZE,
} from "./buildPrintDocument";
import { PrintModal } from "./components/PrintModal";
import {
  ALL_PERSON_TYPES,
  AgeRange,
  buildFilterQueryString,
  parseUrlFilterParams,
} from "./urlParams";

export const KilledNamesListGrid = () => {
  const elementRef = useRef(null);
  const headerRef = useRef(null);
  const tableHeaderRef = useRef(null);
  const inlineSearchSuggestionsRef = useRef(null);
  const acceptedSearchSuggestions = useRef(new Set<string>());
  const gridRef = useGridRef(null);
  const filterRowRef = useRef({ setSearchValue: (_: string) => {} });
  const lastDimension = useRef({ width: 0, height: 0 });
  const visibleRecords = useRef(0);
  const recordsVisibleInWindowViewport = useRef(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const records = useRef<PersonRow[]>([]);
  const filteredRecords = useRef<PersonRow[]>([]);
  const filteredSearchMatches = useRef<
    Record<
      string /* record id */,
      [number[], number[], number] /* match indices 0,1 and sort factor 2 */
    >
  >({});
  const searchHasSortPriority = useRef(false);
  const uniqueEnglishNames = useRef(new Set<string>());
  const [recordCount, setRecordCount] = useState(0);
  const [resized, setResized] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterState, setFilterState] = useState<{
    nameSearch: string;
    filters: PersonType[];
    filteredCount: number;
    ageRange: AgeRange;
  }>({
    nameSearch: "",
    filteredCount: 0,
    ageRange: null,
    filters: [...ALL_PERSON_TYPES].sort() as PersonType[],
  });
  const [columnConfig, setColumnConfig] = useState<
    ReturnType<typeof getColumnConfig> & {
      sort?: [(typeof kig3FieldIndex)[number], "asc" | "desc"] | null;
    }
  >(getColumnConfig(1600));
  const [thresholdIndex, setThresholdIndex] = useState<number>(0);
  const [focusedRecord, setFocusedRecord] = useState<PersonRow | null>(null);
  const [csvDownloadParams, setCSVDownloadParams] = useState(
    createCSVDownload([], 0)
  );
  const [printModalTotal, setPrintModalTotal] = useState<number | null>(null);

  useEffect(() => {
    let count = 0;
    const updateState = debounce(() => {
      setRecordCount(count);
    }, recordUpdateInterval);

    startWorker({
      onRecord: (row) => {
        records.current.push(row);
        (row[recordCols.en_name] || "")
          .toString()
          .split(/\s+/)
          .forEach((part) =>
            uniqueEnglishNames.current.add(part.toLowerCase())
          );
        count += 1;
        updateState();
      },
      onFinished: () => setLoading(false),
    });
  }, []);

  useEffect(() => {
    if (loading) return;

    setFilterState((prev) => {
      const filteredCount = applyFilters(
        prev.filters,
        prev.nameSearch,
        prev.ageRange
      );
      return { ...prev, filteredCount: filteredCount ?? 0 };
    });
  }, [loading]);

  useEffect(() => {
    if (typeof window !== "object") return;
    const params = parseUrlFilterParams(window.location.search);
    const hasParams =
      params.excluded.length > 0 || !!params.search || !!params.ageRange;
    if (!hasParams) return;

    const newFilters = ALL_PERSON_TYPES.filter(
      (t) => !params.excluded.includes(t)
    ).sort() as PersonType[];

    setFilterState((prev) => ({
      ...prev,
      filters: newFilters,
      nameSearch: params.search,
      ageRange: params.ageRange,
    }));

    if (params.search && filterRowRef.current) {
      filterRowRef.current.setSearchValue(params.search);
    }
  }, []);

  const calcLayout = useCallback(() => {
    if (elementRef.current) {
      const mainWidth = elementRef.current.offsetWidth;
      const mainHeight = elementRef.current.offsetHeight;
      const navDisplacement = elementRef.current.getBoundingClientRect().y ?? 0;
      const tableHeaderHeight = tableHeaderRef?.current?.offsetHeight ?? 0;
      const inlineSearchSuggestionsHeight =
        inlineSearchSuggestionsRef?.current?.offsetHeight ?? 0;
      const headerRefHeight = headerRef?.current?.offsetHeight ?? 0;
      const gridHeight =
        mainHeight -
        navDisplacement -
        tableHeaderHeight -
        headerRefHeight -
        inlineSearchSuggestionsHeight;

      const newDims = {
        width: mainWidth,
        height: gridHeight,
      };
      setDimensions(newDims);
      lastDimension.current = newDims;

      recordsVisibleInWindowViewport.current = Math.floor(
        gridHeight / rowHeight
      );

      setColumnConfig(getColumnConfig(elementRef.current.offsetWidth));
    }
  }, [setDimensions, elementRef]);

  useEffect(() => {
    // run layout calcs after resize event resets dimensions state
    // to ensure our calculations are the same as on fresh mount
    calcLayout();
    visibleRecords.current = recordsVisibleInWindowViewport.current;
  }, [resized]);

  useEffect(() => {
    if (typeof window !== "object") return;
    window.onresize = debounce(() => {
      const main = document.querySelector("main");
      const mainWidth = main.offsetWidth;
      const mainHeight = main.offsetHeight;
      const navDisplacement = main.getBoundingClientRect().y ?? 0;
      const tableHeaderHeight = tableHeaderRef?.current?.offsetHeight ?? 0;
      const inlineSearchSuggestionsHeight =
        inlineSearchSuggestionsRef?.current?.offsetHeight ?? 0;
      const headerRefHeight = headerRef?.current?.offsetHeight ?? 0;
      const gridHeight =
        mainHeight -
        navDisplacement -
        tableHeaderHeight -
        headerRefHeight -
        inlineSearchSuggestionsHeight;

      if (
        hasMobileToolbarDimensionChange({
          before: lastDimension.current,
          after: { width: mainWidth, height: gridHeight },
        })
      ) {
        // instead of this try to keep the last scroll position?
        return;
      }

      setDimensions({ width: 0, height: 0 });
      setResized((r) => r + 1);
    }, resizeUpdateInterval);
  }, [calcLayout]);

  useLayoutEffect(() => {
    if (elementRef.current) {
      calcLayout();

      if (!thresholdIndex) {
        visibleRecords.current = recordsVisibleInWindowViewport.current;
        setThresholdIndex(recordsVisibleInWindowViewport.current);
      }
    }
  }, []);

  const onCellsRendered = useCallback(
    debounce(
      ({ rowStopIndex }) => {
        const thresholdRecordIndex = rowStopIndex - overscanRecordCount;
        if (
          thresholdRecordIndex < 0 ||
          thresholdRecordIndex <= visibleRecords.current + 1
        ) {
          return;
        }
        setThresholdIndex(thresholdRecordIndex);
      },
      frameRangeUpdateInterval,
      { leading: true, trailing: true }
    ),
    [setThresholdIndex, visibleRecords]
  );

  const applyFilters = useCallback(
    (filters: PersonType[], nameSearch: string, ageRange: AgeRange) => {
      if (
        filters.length === 6 &&
        !nameSearch.trim().length &&
        !ageRange
      ) {
        filteredRecords.current = [];
        filteredSearchMatches.current = {};
        setCSVDownloadParams(
          createCSVDownload(records.current, records.current.length)
        );
        return;
      }

      const nameSearches = nameSearch
        .trim()
        .split(/\s+/)
        .filter((s) => !!s && s.length >= minimumSearchTermLength)
        .map((s) => s.toLowerCase());

      filteredRecords.current = records.current.filter((row) => {
        const age = row[recordCols.age];
        const sex = row[recordCols.sex];
        if (
          typeof age !== "number" ||
          typeof sex === "number" ||
          (typeof sex === "string" && !sexIsValid(sex))
        ) {
          return false;
        }

        if (ageRange && (age < ageRange[0] || age > ageRange[1])) {
          return false;
        }

        let hasNameMatch = true;
        let partialMatchHitFactor = 0;
        const arNameSearchMatches = new Set<number>();
        const enNameSearchMatches = new Set<number>();
        const uniqueNameMatches = new Set<string>();

        if (nameSearch.length) {
          const arName = row[recordCols.ar_name];
          const enName = row[recordCols.en_name];
          if (typeof arName !== "string" || typeof enName !== "string") {
            return false;
          }
          const arNameParts = arName.toLowerCase().split(/\s+/);
          const enNameParts = enName.toLowerCase().split(/\s+/);
          const partialArMatches = arNameParts.filter((namePart, idx) => {
            let nameMatchIndex = -1;
            const nameMatch = nameSearches.find((searchPart) => {
              if (namePart.includes(searchPart)) {
                nameMatchIndex = idx;
                return true;
              }
            });
            if (nameMatch) {
              arNameSearchMatches.add(nameMatchIndex);
              uniqueNameMatches.add(namePart);
              return true;
            }
          });
          const partialEnMatches = enNameParts.filter((namePart, idx) => {
            let nameMatchIndex = -1;
            const nameMatch = nameSearches.find((searchPart) => {
              if (namePart.includes(searchPart)) {
                nameMatchIndex = idx;
                return true;
              }
            });
            if (nameMatch) {
              enNameSearchMatches.add(nameMatchIndex);
              uniqueNameMatches.add(namePart);
              return true;
            }
          });
          const partialMatches =
            partialArMatches.length + partialEnMatches.length;
          partialMatchHitFactor =
            partialMatches + uniqueNameMatches.size * searchUniqueNameHitFactor;
          hasNameMatch = partialMatches > 0;
        }

        const filtersMatched =
          hasNameMatch && filters.includes(iconTypeForPerson(age, sex));
        if (filtersMatched) {
          filteredSearchMatches.current[row[recordCols.id]] = [
            Array.from(arNameSearchMatches),
            Array.from(enNameSearchMatches),
            partialMatchHitFactor,
          ];
        }

        return filtersMatched;
      });

      const applySearchMatchPrioritySort =
        searchHasSortPriority.current && nameSearch.trim();

      if (applySearchMatchPrioritySort) {
        filteredRecords.current.sort((a, b) => {
          const aId = a[recordCols.id];
          const bId = b[recordCols.id];
          const aSize = filteredSearchMatches.current[aId][2];
          const bSize = filteredSearchMatches.current[bId][2];
          return (bSize ?? 0) - (aSize ?? 0);
        });
      }

      setCSVDownloadParams(
        createCSVDownload(filteredRecords.current, records.current.length)
      );

      return filteredRecords.current.length;
    },
    []
  );

  const writeUrl = useCallback(
    (filters: PersonType[], nameSearch: string, ageRange: AgeRange) => {
      if (typeof window !== "object") return;
      const qs = buildFilterQueryString({
        filters,
        search: nameSearch,
        ageRange,
      });
      const url = `${window.location.pathname}${qs}${window.location.hash}`;
      window.history.replaceState(null, "", url);
    },
    []
  );

  const onToggleFilter = useCallback(
    (type: PersonType) => {
      searchHasSortPriority.current = false;

      setFilterState((prev) => {
        const exitingAgesMode = !!prev.ageRange;
        const baseFilters = exitingAgesMode ? [] : prev.filters;
        const newFilters = baseFilters.includes(type)
          ? baseFilters.filter((t) => t !== type)
          : [...baseFilters, type].sort();
        const newAgeRange = exitingAgesMode ? null : prev.ageRange;

        const filteredCount = applyFilters(
          newFilters,
          prev.nameSearch,
          newAgeRange
        );

        writeUrl(newFilters, prev.nameSearch, newAgeRange);

        return {
          ...prev,
          filters: newFilters,
          ageRange: newAgeRange,
          filteredCount,
        };
      });
    },
    [setFilterState, applyFilters, writeUrl]
  );

  const onSearchInputChange = useCallback(
    debounce((query: string) => {
      if (!query) {
        searchHasSortPriority.current = false;
        acceptedSearchSuggestions.current.clear();
      }

      setFilterState((prev) => {
        if (query) {
          searchHasSortPriority.current = true;
        }

        const filteredCount = applyFilters(prev.filters, query, prev.ageRange);

        writeUrl(prev.filters, query, prev.ageRange);

        return {
          ...prev,
          nameSearch: query,
          filteredCount,
        };
      });
    }, searchInputUpdateInterval),
    [setFilterState, writeUrl]
  );

  const onPressCell = useCallback(
    (pressedRecord: PersonRow) => {
      setFocusedRecord(pressedRecord);
    },
    [setFocusedRecord]
  );

  const onAcceptSearchSuggestion = useCallback((value: string) => {
    acceptedSearchSuggestions.current.add(value);
    searchHasSortPriority.current = true;
    filterRowRef.current.setSearchValue(value);
  }, []);

  const onPressHeader = useCallback(
    (col: (typeof kig3FieldIndex)[number]) => {
      searchHasSortPriority.current = false;

      setColumnConfig((prevConfig) => {
        const prev = prevConfig.sort;
        let newSort: [(typeof kig3FieldIndex)[number], "asc" | "desc"];
        if (prev?.[0] === col) {
          newSort = [col, prev[1] === "asc" ? "desc" : "asc"];
        } else {
          newSort = [col, "asc"];
        }

        const colIndex = kig3FieldIndex.indexOf(col);
        if (colIndex === -1) {
          return null;
        }

        records.current.sort((a, b) => {
          const aVal = a[colIndex];
          const bVal = b[colIndex];

          if (aVal === bVal) {
            return 0;
          }

          if (aVal === null || aVal === undefined) {
            return 1;
          }

          if (bVal === null || bVal === undefined) {
            return -1;
          }

          if (typeof aVal === "number" && typeof bVal === "number") {
            return newSort[1] === "asc" ? aVal - bVal : bVal - aVal;
          }

          return newSort[1] === "asc"
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal));
        });

        applyFilters(
          filterState.filters,
          filterState.nameSearch,
          filterState.ageRange
        );

        return { ...prevConfig, sort: newSort };
      });
    },
    [setColumnConfig, applyFilters, filterState]
  );

  const onInlineSearchSuggestionsShown = useCallback(() => {
    calcLayout();
  }, [calcLayout]);

  const printRange = useCallback(
    (startIdx: number, endIdx: number, detailed: boolean) => {
      if (typeof window !== "object") return;
      const filteredRows = filteredRecords.current;
      const allRows = records.current;
      const sourceRows = filteredRows.length ? filteredRows : allRows;
      const slice = sourceRows.slice(startIdx, endIdx);
      const lastUpdate =
        updateDates[updateDates.length - 1]?.includesUntil ?? "";

      const html = buildPrintDocument({
        records: slice,
        filtered: filteredRows.length > 0,
        totalLoaded: allRows.length,
        lastUpdate,
        startNumber: startIdx + 1,
        totalInSet: sourceRows.length,
        detailed,
      });

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const popup = window.open(url, "_blank");
      if (!popup) {
        URL.revokeObjectURL(url);
        alert(
          "Couldn't open the print window — please allow popups for this site and try again."
        );
        return;
      }
      // give the popup time to parse the HTML and grab the URL before revoking
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    },
    []
  );

  const onPrint = useCallback(() => {
    const filteredRows = filteredRecords.current;
    const allRows = records.current;
    const total = filteredRows.length ? filteredRows.length : allRows.length;
    if (!total) return;
    setPrintModalTotal(total);
  }, []);

  const onDismissPrintModal = useCallback(() => {
    setPrintModalTotal(null);
  }, []);

  const showGrid = dimensions.width > 0 && dimensions.height > 0;

  const windowRecords = filteredRecords.current.length
    ? filteredRecords.current
    : records.current;

  const windowRecordCount = filterState.filteredCount || recordCount;
  const noSearchMatches =
    filterState.nameSearch.trim().length > 0 &&
    windowRecordCount === recordCount;

  const englishSearch = /^[a-zA-Z\s-]+$/.test(filterState.nameSearch.trim());
  const searchSuggestion =
    filterState.nameSearch.trim().length > 3 && englishSearch
      ? suggestSearch(
          uniqueEnglishNames.current,
          filterState.nameSearch,
          acceptedSearchSuggestions.current
        )
      : undefined;
  const mobileViewport =
    typeof window === "undefined"
      ? false
      : window.innerWidth / window.innerHeight < 0.7;
  const showInlineSearchSuggestions =
    !noSearchMatches && !mobileViewport && searchSuggestion?.others;

  return (
    <main ref={elementRef} className={styles.main}>
      <div ref={headerRef} className={styles.headerColumns}>
        <div className={styles.headerColumn}>
          <TitleRow />
          <StatusRow
            loaded={recordCount}
            windowRecordCount={windowRecordCount}
            thresholdIndex={thresholdIndex}
            onPrint={onPrint}
            {...csvDownloadParams}
          />
        </div>
        <div className={styles.headerColumn}>
          <FilterRow
            ref={filterRowRef}
            selectedFilters={filterState.filters}
            onToggleFilter={onToggleFilter}
            onSearchInputChange={onSearchInputChange}
            agesActive={!!filterState.ageRange}
          />
          {loading && (
            <div className={styles.statusRowSpinner}>
              <Spinner colorMode="dark" />
            </div>
          )}
        </div>
      </div>
      <ScrollProgress
        pct={`${Math.min(
          100,
          Math.round((thresholdIndex / windowRecordCount) * 1000) / 10
        )}%`}
      />
      <div className={styles.gridConstraint}>
        {showInlineSearchSuggestions && (
          <InlineSearchSuggestions
            ref={inlineSearchSuggestionsRef}
            searchSuggestion={searchSuggestion}
            nameSearch={filterState.nameSearch}
            onInlineSearchSuggestionsShown={onInlineSearchSuggestionsShown}
            onAcceptSearchSuggestion={onAcceptSearchSuggestion}
          />
        )}
        {showGrid && (
          <>
            <div ref={tableHeaderRef}>
              <Header
                sort={columnConfig.sort}
                onPress={onPressHeader}
                parentWidth={dimensions.width}
                columnConfig={columnConfig}
              />
            </div>
            <Grid
              gridRef={gridRef}
              className={styles.gridContainer}
              onCellsRendered={onCellsRendered}
              style={{ width: dimensions.width, height: dimensions.height }}
              columnCount={columnConfig.columns.length}
              columnWidth={(index) =>
                dimensions.width * (columnConfig.colWeightShare[index] ?? 0)
              }
              rowCount={windowRecordCount + 1} // +1 for the header row
              rowHeight={rowHeight}
              overscanCount={overscanRecordCount}
              cellComponent={Cell}
              cellProps={{
                onPressCell,
                records: windowRecords,
                recordCount: windowRecordCount,
                columnConfig,
                filteredSearchMatches,
              }}
            />
            <ScrollButtonBar
              gridRef={gridRef}
              thresholdIndex={thresholdIndex}
              maxRowIndex={windowRecordCount}
              recordsVisibleInWindowViewport={
                recordsVisibleInWindowViewport.current
              }
            />
          </>
        )}
        {noSearchMatches && (
          <div className={clsx(styles.gridOverlay, styles.noSearchMatches)}>
            {filterState.nameSearch.trim().length < minimumSearchTermLength && (
              <div>
                <strong>Enter at least 3 characters to see results.</strong>
              </div>
            )}
            <div>No matches found. Try adjusting your search or filters.</div>
            {searchSuggestion?.main && (
              <>
                <div className={styles.searchSuggestion}>
                  Did you mean{" "}
                  <span
                    onClick={() =>
                      onAcceptSearchSuggestion(searchSuggestion.main)
                    }
                  >
                    {searchSuggestion.main}
                  </span>
                  ?
                </div>
                {!!searchSuggestion.others?.length && (
                  <div className={styles.searchSuggestionAlternates}>
                    Alternate transliterations:{" "}
                    {searchSuggestion.others.map((alt) => (
                      <span
                        key={alt}
                        onClick={() => onAcceptSearchSuggestion(alt)}
                        style={{ display: "inline-block", marginRight: 6 }}
                      >
                        {alt}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
            <div className={styles.noSearchMatchesHint}>
              (you may need to try alternate spellings when searching in
              English)
            </div>
          </div>
        )}
        {loading && <div className={styles.gridOverlay}>Loading names...</div>}
        {printModalTotal !== null && (
          <PrintModal
            total={printModalTotal}
            trancheSize={PRINT_TRANCHE_SIZE}
            onPrintRange={printRange}
            onDismiss={onDismissPrintModal}
          />
        )}
        {focusedRecord && (
          <div className={clsx(styles.gridOverlay, styles.focusedRecord)}>
            <div className={styles.focusedRecordContainer}>
              {focusedRecord.map((col, i) => {
                if (kig3FieldIndex[i] === "update") {
                  return (
                    <div
                      className={styles.focusedRecordRow}
                      style={{ marginTop: 10 }}
                      key={i}
                    >
                      <a
                        href={updateLinks[+focusedRecord[i] - 1]}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Added during list update #{focusedRecord[i]} on{" "}
                        {updateDates[+focusedRecord[i] - 1]?.on}
                      </a>
                    </div>
                  );
                }

                return (
                  <div className={styles.focusedRecordRow} key={i}>
                    <span>{kig3FieldIndex[i]}</span>
                    {col}
                  </div>
                );
              })}
              <div
                className={styles.dismissFocusedRecord}
                onClick={() => setFocusedRecord(null)}
              >
                <CancelCircleIcon size={34} />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
