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

export const KilledNamesListGrid = () => {
  const elementRef = useRef(null);
  const headerRef = useRef(null);
  const tableHeaderRef = useRef(null);
  const gridRef = useGridRef(null);
  const lastDimension = useRef({ width: 0, height: 0 });
  const visibleRecords = useRef(0);
  const recordsVisibleInWindowViewport = useRef(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const records = useRef<PersonRow[]>([]);
  const filteredRecords = useRef<PersonRow[]>([]);
  const [recordCount, setRecordCount] = useState(0);
  const [resized, setResized] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterState, setFilterState] = useState<{
    nameSearch: string;
    filters: PersonType[];
    filteredCount: number;
  }>({
    nameSearch: "",
    filteredCount: 0,
    filters: [
      "elderly-man",
      "elderly-woman",
      "man",
      "woman",
      "boy",
      "girl",
    ].sort() as PersonType[],
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

  useEffect(() => {
    let count = 0;
    const updateState = debounce(() => {
      setRecordCount(count);
    }, recordUpdateInterval);

    startWorker({
      onRecord: (row) => {
        records.current.push(row);
        count += 1;
        updateState();
      },
      onFinished: () => setLoading(false),
    });
  }, []);

  useEffect(() => {
    if (loading || csvDownloadParams.csvDataObjectURL) {
      return;
    }

    setCSVDownloadParams(
      createCSVDownload(records.current, records.current.length)
    );
  }, [loading]);

  const calcLayout = useCallback(() => {
    if (elementRef.current) {
      const mainWidth = elementRef.current.offsetWidth;
      const mainHeight = elementRef.current.offsetHeight;
      const navDisplacement = elementRef.current.getBoundingClientRect().y ?? 0;
      const tableHeaderHeight = tableHeaderRef?.current?.offsetHeight ?? 0;
      const headerRefHeight = headerRef?.current?.offsetHeight ?? 0;
      const gridHeight =
        mainHeight - navDisplacement - tableHeaderHeight - headerRefHeight;

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
      const headerRefHeight = headerRef?.current?.offsetHeight ?? 0;
      const gridHeight =
        mainHeight - navDisplacement - tableHeaderHeight - headerRefHeight;

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
    (filters: PersonType[], nameSearch: string) => {
      if (filters.length === 6 && !nameSearch.length) {
        filteredRecords.current = [];
        setCSVDownloadParams(
          createCSVDownload(records.current, records.current.length)
        );
        return;
      }

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

        let hasNameMatch = true;
        const nameSearches = nameSearch
          .trim()
          .split(/\s+/)
          .filter((s) => !!s)
          .map((s) => s.toLowerCase());

        if (nameSearch.length) {
          const arName = row[recordCols.ar_name];
          const enName = row[recordCols.en_name];
          if (typeof arName !== "string" || typeof enName !== "string") {
            return false;
          }
          hasNameMatch = nameSearches.some(
            (nameSearch) =>
              arName.toLowerCase().includes(nameSearch) ||
              enName.toLowerCase().includes(nameSearch)
          );
        }

        return hasNameMatch && filters.includes(iconTypeForPerson(age, sex));
      });

      setCSVDownloadParams(
        createCSVDownload(filteredRecords.current, records.current.length)
      );

      return filteredRecords.current.length;
    },
    []
  );

  const onToggleFilter = useCallback(
    (type: PersonType) => {
      setFilterState((prev) => {
        const newFilters = prev.filters.includes(type)
          ? prev.filters.filter((t) => t !== type)
          : [...prev.filters, type].sort();

        const filteredCount = applyFilters(newFilters, prev.nameSearch);

        return {
          nameSearch: prev.nameSearch,
          filters: newFilters,
          filteredCount,
        };
      });
    },
    [setFilterState, applyFilters]
  );

  const onSearchInputChange = useCallback(
    debounce((e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value.trim().toLowerCase();
      setFilterState((prev) => {
        const filteredCount = applyFilters(prev.filters, query);

        return {
          nameSearch: query,
          filters: prev.filters,
          filteredCount,
        };
      });
    }, searchInputUpdateInterval),
    [setFilterState]
  );

  const onPressCell = useCallback(
    (pressedRecord: PersonRow) => {
      setFocusedRecord(pressedRecord);
    },
    [setFocusedRecord]
  );

  const onPressHeader = useCallback(
    (col: (typeof kig3FieldIndex)[number]) => {
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

        applyFilters(filterState.filters, filterState.nameSearch);

        return { ...prevConfig, sort: newSort };
      });
    },
    [setColumnConfig, applyFilters, filterState]
  );

  const showGrid = dimensions.width > 0 && dimensions.height > 0;

  const windowRecords = filteredRecords.current.length
    ? filteredRecords.current
    : records.current;

  const windowRecordCount = filterState.filteredCount || recordCount;
  const noSearchMatches =
    filterState.nameSearch.trim().length > 0 &&
    windowRecordCount === recordCount;

  return (
    <main ref={elementRef} className={styles.main}>
      <div ref={headerRef} className={styles.headerColumns}>
        <div className={styles.headerColumn}>
          <TitleRow />
          <StatusRow
            loaded={recordCount}
            windowRecordCount={windowRecordCount}
            thresholdIndex={thresholdIndex}
            {...csvDownloadParams}
          />
        </div>
        <div className={styles.headerColumn}>
          <FilterRow
            selectedFilters={filterState.filters}
            onToggleFilter={onToggleFilter}
            onSearchInputChange={onSearchInputChange}
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
            <div>No matches found. Try adjusting your search or filters.</div>
            <div className={styles.noSearchMatchesHint}>
              (you may need to try alternate spellings when searching in
              English)
            </div>
          </div>
        )}
        {loading && <div className={styles.gridOverlay}>Loading names...</div>}
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
