import React from "react";
import styles from "../killedNamesListGrid.module.css";

export const StatusRow = React.memo(
  ({ loaded, thresholdIndex }: { loaded: number; thresholdIndex: number }) => {
    return (
      <div className={styles.statusRow}>
        <div>Loaded {loaded.toLocaleString()} records</div>
        {typeof thresholdIndex === "number" && (
          <div>• Viewed {thresholdIndex.toLocaleString()}</div>
        )}
      </div>
    );
  }
);
