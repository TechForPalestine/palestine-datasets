import Layout from "@theme/Layout";
import { useColorMode } from "@docusaurus/theme-common";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Grid, type CellComponentProps } from "react-window";
import debounce from "lodash/debounce";

import styles from "./list.module.css";
import { Spinner } from "../components/Spinner";

type PersonRow = [string, string, string, number, string, string, number];

type WorkerInputs = {
  onRecord: (data: PersonRow) => void;
  onFinished: () => void;
};

let kig3FieldIndex = [
  "id",
  "en_name",
  "ar_name",
  "age",
  "dob",
  "sex",
  "update",
];

const colWeights = [1, 2, 3, 0.5, 1, 0.5, 0.5];
const colWeightSum = colWeights.reduce((a, b) => a + b, 0);
const colWeightShare = colWeights.map((w) => w / colWeightSum);

const startWorker = ({ onRecord, onFinished }: WorkerInputs) => {
  if (typeof Worker === "undefined" || typeof window === "undefined") {
    console.log("workers are not supported in this environment");
  }
  const worker = new Worker(new URL("../lib/list-worker.ts", import.meta.url));
  worker.onmessage = (event) => {
    if (event.data === "done") {
      onFinished();
      return;
    }

    if (
      !event.data ||
      typeof event.data !== "object" ||
      event.data.length !== kig3FieldIndex.length
    ) {
      return;
    }

    if (event.data.every((val) => typeof val === "string")) {
      kig3FieldIndex = event.data;
      return;
    }

    onRecord(event.data);
  };
  worker.postMessage("start");
};

const Cell = ({
  columnIndex,
  rowIndex,
  style,
  records,
}: CellComponentProps<{ records: PersonRow[]; recordCount: number }>) => {
  let idx = columnIndex;
  if (columnIndex === 1) {
    // render arabic instead
    idx = 2;
  }
  if (columnIndex === 2) {
    // render english instead
    idx = 1;
  }

  const cellContent = records[rowIndex]?.[idx];
  if (!cellContent) {
    return null;
  }

  // Conditional styling for the Arabic name column
  const cellStyle: React.CSSProperties =
    idx === 2 ? { textAlign: "right" as const, direction: "rtl" as const } : {};

  return (
    <div className={styles.cell} style={{ ...style, ...cellStyle }}>
      {cellContent}
    </div>
  );
};

const Header = ({ parentWidth }: { parentWidth: number }) => {
  return (
    <>
      {kig3FieldIndex.map((col, index) => {
        let remappedContent = col;
        if (col === "en_name") {
          remappedContent = "name";
        }

        if (col === "ar_name") {
          remappedContent = "";
        }

        if (col === "update") {
          remappedContent = "list";
        }

        // Conditional styling for the Arabic name column
        let cellStyle: React.CSSProperties =
          col === "en_name"
            ? { textAlign: "right" as const, direction: "rtl" as const }
            : {};

        cellStyle = {
          ...cellStyle,
          width: parentWidth * (colWeightShare[index] ?? 0),
        };

        return (
          <div
            key={col}
            className={`${styles.cell} ${styles.headerCell}`}
            style={cellStyle}
          >
            {remappedContent}&nbsp;
          </div>
        );
      })}
    </>
  );
};

const StatusRow = ({
  loaded,
  loading,
  frame,
}: {
  loaded: number;
  loading: boolean;
  frame: [number, number];
}) => {
  const { colorMode } = useColorMode();

  return (
    <div className={styles.statusRow}>
      <div className={styles.statusRowSpinner}>
        {loading && <Spinner colorMode={colorMode} />}
      </div>
      <div>Loaded {loaded.toLocaleString()} records</div>
      {!!frame[0] && !!frame[1] && (
        <div>
          • Viewing {frame[0].toLocaleString()} to {frame[1].toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default function NamesList(): JSX.Element {
  const elementRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const records = useRef<PersonRow[]>([]);
  const [recordCount, setRecordCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [frame, setFrame] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    let count = 0;
    const updateState = debounce(() => setRecordCount(count), 10);

    startWorker({
      onRecord: (row) => {
        records.current.push(row);
        count += 1;
        updateState();
      },
      onFinished: () => setLoading(false),
    });
  }, []);

  useLayoutEffect(() => {
    if (elementRef.current) {
      setDimensions({
        width: elementRef.current.offsetWidth,
        height: elementRef.current.offsetHeight,
      });
    }
  }, []);

  const showGrid = dimensions.width > 0 && dimensions.height > 0;

  return (
    <Layout title="" description="">
      <main ref={elementRef} style={{ flex: 1, minHeight: "80vh" }}>
        <StatusRow loaded={recordCount} loading={loading} frame={frame} />
        {showGrid && <Header parentWidth={dimensions.width} />}
        {showGrid && (
          <Grid
            onCellsRendered={debounce(
              ({ rowStartIndex, rowStopIndex }) => {
                setFrame([rowStartIndex, rowStopIndex]);
              },
              10,
              { leading: true, trailing: false }
            )}
            style={{ width: dimensions.width, height: dimensions.height }}
            columnCount={kig3FieldIndex.length}
            columnWidth={(index) =>
              dimensions.width * (colWeightShare[index] ?? 0)
            }
            rowCount={recordCount + 1} // +1 for the header row
            rowHeight={40}
            overscanCount={40}
            cellComponent={Cell}
            cellProps={{ records: records.current, recordCount }}
          />
        )}
      </main>
    </Layout>
  );
}
