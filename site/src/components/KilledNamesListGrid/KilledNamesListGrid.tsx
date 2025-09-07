import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Grid } from "react-window";
import debounce from "lodash.debounce";
import { PersonRow } from "./types";
import { startWorker } from "./startWorker";
import { Cell } from "./components/Cell";
import { Header } from "./components/Header";
import { StatusRow } from "./components/StatusRow";

import { TitleRow } from "./components/TitleRow";
import { ScrollProgress } from "./components/ScrollProgress";

const recordUpdateInterval = 100;
const frameRangeUpdateInterval = 0;
const resizeUpdateInterval = 200;
const overscanRecordCount = 40;
const rowHeight = 40;

import styles from "./killedNamesListGrid.module.css";
import { getColumnConfig } from "./getColumnConfig";
import { FilterRow } from "./components/FilterRow";

export const KilledNamesListGrid = () => {
  const elementRef = useRef(null);
  const visibleRecords = useRef(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const records = useRef<PersonRow[]>([]);
  const [recordCount, setRecordCount] = useState(0);
  const [loading, setLoading] = useState(true);
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
      setDimensions({
        width: elementRef.current.offsetWidth,
        height: elementRef.current.offsetHeight,
      });

      setColumnConfig(getColumnConfig(elementRef.current.offsetWidth));
    }
  }, [setDimensions, elementRef]);

  useEffect(() => {
    if (typeof window !== "object") return;
    window.onresize = debounce(() => {
      calcLayout();
    }, resizeUpdateInterval);
  }, [calcLayout]);

  useLayoutEffect(() => {
    if (elementRef.current) {
      calcLayout();

      if (!thresholdIndex) {
        const recordsVisibleInWindowViewport = Math.ceil(
          elementRef.current.offsetHeight / rowHeight
        );
        visibleRecords.current = recordsVisibleInWindowViewport;
        setThresholdIndex(recordsVisibleInWindowViewport);
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

  const showGrid = dimensions.width > 0 && dimensions.height > 0;

  return (
    <main ref={elementRef} style={{ flex: 1, minHeight: "80vh" }}>
      <div className={styles.headerColumns}>
        <div className={styles.headerColumn}>
          <TitleRow loading={loading} />
          <StatusRow loaded={recordCount} thresholdIndex={thresholdIndex} />
        </div>
        <div className={styles.headerColumn}>
          <FilterRow />
        </div>
      </div>
      <ScrollProgress
        pct={`${Math.min(
          100,
          Math.round((thresholdIndex / recordCount) * 1000) / 10
        )}%`}
      />
      {showGrid && (
        <>
          <Header parentWidth={dimensions.width} columnConfig={columnConfig} />
          <Grid
            className={styles.gridContainer}
            onCellsRendered={onCellsRendered}
            style={{ width: dimensions.width, height: dimensions.height }}
            columnCount={columnConfig.columns.length}
            columnWidth={(index) =>
              dimensions.width * (columnConfig.colWeightShare[index] ?? 0)
            }
            rowCount={recordCount + 1} // +1 for the header row
            rowHeight={rowHeight}
            overscanCount={overscanRecordCount}
            cellComponent={Cell}
            cellProps={{ records: records.current, recordCount, columnConfig }}
          />
        </>
      )}
    </main>
  );
};
