import React from "react";
import styles from "../killedNamesListGrid.module.css";

export const StatusRow = React.memo(
  ({
    loaded,
    thresholdIndex,
    windowRecordCount,
  }: {
    loaded: number;
    thresholdIndex: number;
    windowRecordCount: number;
  }) => {
    return (
      <div className={styles.statusRow}>
        <div>
          {loaded !== windowRecordCount
            ? `Showing ${windowRecordCount.toLocaleString()} of ${loaded.toLocaleString()}`
            : `Loaded ${loaded.toLocaleString()} records`}
        </div>
        {typeof thresholdIndex === "number" && (
          <div>• Viewed {thresholdIndex.toLocaleString()}</div>
        )}
      </div>
    );
  }
);
