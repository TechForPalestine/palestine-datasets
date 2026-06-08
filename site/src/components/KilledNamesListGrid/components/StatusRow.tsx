import React from "react";
import styles from "../killedNamesListGrid.module.css";

export const StatusRow = React.memo(
  ({
    loaded,
    thresholdIndex,
    windowRecordCount,
    csvDataObjectURL,
    csvDataFileName,
    csvDataFileHint,
    onPrint,
  }: {
    loaded: number;
    thresholdIndex: number;
    windowRecordCount: number;
    csvDataObjectURL?: string;
    csvDataFileName?: string;
    csvDataFileHint?: string;
    onPrint?: () => void;
  }) => {
    const filtered = loaded !== windowRecordCount;
    return (
      <div className={styles.statusRow}>
        <div>
          {filtered
            ? `Showing ${windowRecordCount.toLocaleString()} of ${loaded.toLocaleString()}`
            : `Loaded ${loaded.toLocaleString()} records`}{" "}
          {csvDataFileHint && csvDataFileName && csvDataObjectURL && (
            <>
              •{" "}
              <a href={csvDataObjectURL} download={csvDataFileName} title={csvDataFileHint}>
                CSV
              </a>
            </>
          )}{" "}
          {onPrint && !!loaded && (
            <>
              •{" "}
              <button
                type="button"
                onClick={onPrint}
                className={styles.statusRowAction}
                title={`Print the ${
                  filtered ? "filtered" : "full"
                } list (${windowRecordCount.toLocaleString()} records)`}
              >
                Print
              </button>{" "}
            </>
          )}
          • <a href="/docs/killed-in-gaza/">About</a>
        </div>
        {!!loaded && typeof thresholdIndex === "number" && !!thresholdIndex && (
          <div className={styles.statusRowViewedLabel}>
            • Viewed {thresholdIndex.toLocaleString()}
          </div>
        )}
      </div>
    );
  },
);
