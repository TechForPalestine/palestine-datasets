import { CellComponentProps } from "react-window";
import { kig3FieldIndex, PersonRow } from "../types";

import styles from "../killedNamesListGrid.module.css";
import { PersonIcon } from "../../KilledHeaderMarquee/PersonIcon";
import { iconTypeForPerson, sexIsValid } from "@site/src/lib/age-icon";
import { getColumnConfig, recordCols } from "../getColumnConfig";
import { ReactNode } from "react";
import clsx from "clsx";

// these are stable regardless of how many columns are shown since the record is the same
const ageIndex = kig3FieldIndex.findIndex((f) => f === "age");
const sexIndex = kig3FieldIndex.findIndex((f) => f === "sex");

const getAgeAndGenderFromRecord = (record: PersonRow) => {
  const age = record[ageIndex];
  const sex = record[sexIndex];

  if (typeof age !== "number" || typeof sex !== "string") {
    return {};
  }

  if (sexIsValid(sex) === false) {
    return {};
  }

  return {
    age,
    sex,
  };
};

const Icon = ({ record, hide }: { record: PersonRow; hide: boolean }) => {
  if (hide) {
    return null;
  }

  const demo = getAgeAndGenderFromRecord(record);

  if (typeof demo.age !== "number" || !demo.sex) return null;

  return (
    <PersonIcon
      size={30}
      className={styles.personIcon}
      type={iconTypeForPerson(demo.age, demo.sex)}
    />
  );
};

const debugSearchSort = false;

export const Cell = ({
  onPressCell,
  columnIndex,
  rowIndex,
  style,
  records,
  columnConfig,
  filteredSearchMatches,
}: CellComponentProps<{
  onPressCell: (record: PersonRow) => void;
  records: PersonRow[];
  recordCount: number;
  columnConfig: ReturnType<typeof getColumnConfig>;
  filteredSearchMatches: {
    current: Record<string /* record id */, [number[], number[], number]>;
  };
}>) => {
  const record = records[rowIndex];
  const column = columnConfig.columns[columnIndex];
  const indexForCol = columnConfig.recordCols[column];
  let cellContent: ReactNode = record?.[indexForCol];
  if (!record || typeof cellContent == null) {
    return null;
  }

  // Conditional styling for the Arabic name column
  const cellStyle: React.CSSProperties =
    columnIndex === columnConfig.indices.ar_name
      ? { textAlign: "right" as const, direction: "rtl" as const }
      : {};

  let styleClass = styles.cell;

  const searchMatches = filteredSearchMatches.current[record[recordCols.id]];
  const arNameCol = columnIndex === columnConfig.indices.ar_name;
  const enNameCol = columnIndex === columnConfig.indices.en_name;
  if (enNameCol) {
    styleClass += ` ${styles.englishNameCell}`;
  }

  if ((arNameCol || enNameCol) && searchMatches) {
    const indices = searchMatches[enNameCol ? 1 : 0];
    cellContent = (cellContent ?? "")
      .toString()
      .split(/\s+/)
      .map((val, idx) => (
        <span
          key={idx}
          className={clsx(
            indices.includes(idx) && styles.cellNameSearchHit,
            styles.cellName
          )}
        >
          {val}
        </span>
      ));
  }

  const sortDebug =
    debugSearchSort && enNameCol && searchMatches?.[2]
      ? ` (${searchMatches[2]})`
      : "";

  return (
    <div
      onClick={() => onPressCell(record)}
      className={styleClass}
      style={{ ...style, ...cellStyle }}
    >
      <Icon record={record} hide={!enNameCol} />
      <div className={styles.cellText}>
        {cellContent}
        {sortDebug}
      </div>
    </div>
  );
};
