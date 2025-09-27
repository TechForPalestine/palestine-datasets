import { updateDates } from "../../../../scripts/data/common/killed-in-gaza/constants";
import { kig3FieldIndex, PersonRow } from "./types";

const lastUpdate = updateDates[updateDates.length - 1];

export const createCSVDownload = (
  records: PersonRow[],
  totalRecords: number
) => {
  if (!records.length) {
    return {};
  }

  const csvContent = records.map((row) =>
    row
      .map((col) => {
        if (typeof col === "string") {
          return `"${col.replace(/"/g, '""')}"`;
        }
        if (col === null || col === undefined) {
          return "";
        }
        return col;
      })
      .join(",")
  );
  const headerRow = kig3FieldIndex
    .map((col) => `"${col.replace(/"/g, '""')}"`)
    .join(",");
  csvContent.unshift(headerRow);
  const csvBlob = new Blob([csvContent.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const csvDataObjectURL = URL.createObjectURL(csvBlob);

  const filtered = records.length !== totalRecords;
  const csvDataFileName = `T4P-KiG-Names-${lastUpdate.includesUntil}${
    filtered ? "-partial" : "-full"
  }.csv`;
  const csvDataFileHint = `Download the ${
    filtered ? "filtered" : "full"
  } dataset (${records.length.toLocaleString()} records) as a CSV file`;

  return { csvDataObjectURL, csvDataFileName, csvDataFileHint };
};
