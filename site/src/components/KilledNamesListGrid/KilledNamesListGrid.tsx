import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Grid, useGridRef } from "react-window";
import debounce from "lodash.debounce";
import { PersonRow, PersonType } from "./types";
import { startWorker } from "./startWorker";
import { Cell } from "./components/Cell";
import { Header } from "./components/Header";
import { StatusRow } from "./components/StatusRow";

import { TitleRow } from "./components/TitleRow";
import { ScrollProgress } from "./components/ScrollProgress";

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

export const KilledNamesListGrid = () => {
  const elementRef = useRef(null);
  const headerRef = useRef(null);
  const tableHeaderRef = useRef(null);
  const gridRef = useGridRef(null);
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
  const [columnConfig, setColumnConfig] = useState(getColumnConfig(1600));
  const [thresholdIndex, setThresholdIndex] = useState<number>(0);

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

  const calcLayout = useCallback(() => {
    if (elementRef.current) {
      const mainHeight = elementRef.current.offsetHeight;
      const navDisplacement = elementRef.current.getBoundingClientRect().y ?? 0;
      const tableHeaderHeight = tableHeaderRef?.current?.offsetHeight ?? 0;
      const headerRefHeight = headerRef?.current?.offsetHeight ?? 0;
      const gridHeight =
        mainHeight - navDisplacement - tableHeaderHeight - headerRefHeight;

      setDimensions({
        width: elementRef.current.offsetWidth,
        height: gridHeight,
      });

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
    setThresholdIndex(recordsVisibleInWindowViewport.current);
    gridRef.current?.scrollToRow({ index: 0 });
  }, [resized]);

  useEffect(() => {
    if (typeof window !== "object") return;
    window.onresize = debounce(() => {
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

        if (nameSearch.length) {
          const arName = row[recordCols.ar_name];
          const enName = row[recordCols.en_name];
          if (typeof arName !== "string" || typeof enName !== "string") {
            return false;
          }
          hasNameMatch =
            arName.toLowerCase().includes(nameSearch) ||
            enName.toLowerCase().includes(nameSearch);
        }

        return hasNameMatch && filters.includes(iconTypeForPerson(age, sex));
      });

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

  const onButtonScrolled = () => {
    setThresholdIndex(0);
  };

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
          <TitleRow loading={loading} />
          <StatusRow
            loaded={recordCount}
            windowRecordCount={windowRecordCount}
            thresholdIndex={thresholdIndex}
          />
        </div>
        <div className={styles.headerColumn}>
          <FilterRow
            selectedFilters={filterState.filters}
            onToggleFilter={onToggleFilter}
            onSearchInputChange={onSearchInputChange}
          />
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
              onButtonScrolled={onButtonScrolled}
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
      </div>
    </main>
  );
};
