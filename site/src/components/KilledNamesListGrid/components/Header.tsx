import { getColumnConfig } from "../getColumnConfig";
import styles from "../killedNamesListGrid.module.css";
import React from "react";
import { kig3FieldIndex } from "../types";

export const Header = React.memo(
  ({
    sort,
    parentWidth,
    columnConfig,
    onPress,
  }: {
    sort: [(typeof kig3FieldIndex)[number], "asc" | "desc"] | null;
    parentWidth: number;
    columnConfig: ReturnType<typeof getColumnConfig>;
    onPress: (col: (typeof kig3FieldIndex)[number]) => void;
  }) => {
    return (
      <>
        {columnConfig.columns.map((col, index) => {
          let remappedContent: string = col;
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
            index === columnConfig.indices.ar_name
              ? { textAlign: "right" as const, direction: "rtl" as const }
              : {};

          cellStyle = {
            ...cellStyle,
            width: parentWidth * (columnConfig.colWeightShare[index] ?? 0),
          };

          if (columnConfig.colWeightShare.length === 1) {
            return (
              <div
                key={col}
                className={`${styles.cell} ${styles.headerCell}`}
                style={cellStyle}
              />
            );
          }

          return (
            <div
              key={col}
              className={`${styles.cell} ${styles.headerCell}`}
              style={cellStyle}
              onClick={() => onPress(col)}
            >
              {remappedContent}&nbsp;
              {sort?.[0] === col ? (sort[1] === "asc" ? "▲" : "▼") : ""}
            </div>
          );
        })}
      </>
    );
  }
);
