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
  }: {
    loaded: number;
    thresholdIndex: number;
    windowRecordCount: number;
    csvDataObjectURL?: string;
    csvDataFileName?: string;
    csvDataFileHint?: string;
  }) => {
    return (
      <div className={styles.statusRow}>
        <div>
          {loaded !== windowRecordCount
            ? `Showing ${windowRecordCount.toLocaleString()} of ${loaded.toLocaleString()}`
            : `Loaded ${loaded.toLocaleString()} records`}{" "}
          {csvDataFileHint && csvDataFileName && csvDataObjectURL && (
            <>
              •{" "}
              <a
                href={csvDataObjectURL}
                download={csvDataFileName}
                title={csvDataFileHint}
              >
                CSV
              </a>
            </>
          )}{" "}
          • <a href="/docs/killed-in-gaza/">About</a>
        </div>
        {!!loaded && typeof thresholdIndex === "number" && !!thresholdIndex && (
          <div className={styles.statusRowViewedLabel}>
            • Viewed {thresholdIndex.toLocaleString()}
          </div>
        )}
      </div>
    );
  }
);
