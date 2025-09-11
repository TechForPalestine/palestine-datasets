import { getColumnConfig } from "../getColumnConfig";
import styles from "../killedNamesListGrid.module.css";
import React from "react";

export const Header = React.memo(
  ({
    parentWidth,
    columnConfig,
  }: {
    parentWidth: number;
    columnConfig: ReturnType<typeof getColumnConfig>;
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
            >
              {remappedContent}&nbsp;
            </div>
          );
        })}
      </>
    );
  }
);
