import { colWeightShare, kig3FieldIndex } from "../types";

import styles from "../killedNamesListGrid.module.css";
import React from "react";

export const Header = React.memo(({ parentWidth }: { parentWidth: number }) => {
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

        if (col === "dob") {
          remappedContent = "birth date";
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
});
