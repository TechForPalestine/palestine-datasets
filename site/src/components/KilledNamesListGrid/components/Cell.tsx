import { CellComponentProps } from "react-window";
import { kig3FieldIndex, PersonRow } from "../types";

import styles from "../killedNamesListGrid.module.css";
import { PersonIcon } from "../../KilledHeaderMarquee/PersonIcon";
import { iconTypeForPerson, sexIsValid } from "@site/src/lib/age-icon";
import { getColumnConfig } from "../getColumnConfig";

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

export const Cell = ({
  onPressCellSmallFormat,
  columnIndex,
  rowIndex,
  style,
  records,
  columnConfig,
}: CellComponentProps<{
  onPressCellSmallFormat: (record: PersonRow) => void;
  records: PersonRow[];
  recordCount: number;
  columnConfig: ReturnType<typeof getColumnConfig>;
}>) => {
  const record = records[rowIndex];
  const column = columnConfig.columns[columnIndex];
  const indexForCol = columnConfig.recordCols[column];
  const cellContent = record?.[indexForCol];
  if (!record || typeof cellContent == null) {
    return null;
  }

  // Conditional styling for the Arabic name column
  const cellStyle: React.CSSProperties =
    columnIndex === columnConfig.indices.ar_name
      ? { textAlign: "right" as const, direction: "rtl" as const }
      : {};

  let styleClass = styles.cell;

  if (columnIndex === columnConfig.indices.en_name) {
    styleClass += ` ${styles.englishNameCell}`;
  }

  const onPressCell = () => {
    // only allow click for smaller formats
    if (columnConfig.colWeightShare.length > 3) return;

    onPressCellSmallFormat(record);
  };

  return (
    <div
      onClick={onPressCell}
      className={styleClass}
      style={{ ...style, ...cellStyle }}
    >
      <Icon
        record={record}
        hide={columnIndex !== columnConfig.indices.en_name}
      />
      <div className={styles.cellText}>{cellContent}</div>
    </div>
  );
};
