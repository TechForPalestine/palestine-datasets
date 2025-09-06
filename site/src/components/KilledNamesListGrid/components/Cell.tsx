import { CellComponentProps } from "react-window";
import { kig3FieldIndex, PersonRow } from "../types";

import styles from "../killedNamesListGrid.module.css";
import { PersonIcon } from "../../KilledHeaderMarquee/PersonIcon";
import { iconTypeForPerson } from "@site/src/lib/age-icon";

const ageIndex = kig3FieldIndex.findIndex((f) => f === "age");
const sexIndex = kig3FieldIndex.findIndex((f) => f === "sex");

const sexIsValid = (sex: string): sex is "m" | "f" => {
  return ["f", "m"].includes(sex as any);
};

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

const Icon = ({
  record,
  columnIndex,
}: {
  record: PersonRow;
  columnIndex: number;
}) => {
  if (columnIndex !== 1) {
    return null; // icon starts english name column only
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

export const Cell = ({
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

  const record = records[rowIndex];
  const cellContent = record?.[idx];
  if (!record || typeof cellContent == null) {
    return null;
  }

  // Conditional styling for the Arabic name column
  const cellStyle: React.CSSProperties =
    idx === 2 ? { textAlign: "right" as const, direction: "rtl" as const } : {};

  let styleClass = styles.cell;

  if (idx === 1) {
    styleClass += ` ${styles.englishNameCell}`;
  }

  return (
    <div className={styleClass} style={{ ...style, ...cellStyle }}>
      <Icon record={record} columnIndex={idx} />
      {cellContent}
    </div>
  );
};
