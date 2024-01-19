import toEnName from "arabic-name-to-en";
import { writeJson } from "../../utils/fs";
import { ApiResource } from "../../../types/api.types";
import { SheetTab, fetchGoogleSheet } from "../../utils/gsheets";

const jsonFileName = "killed-in-gaza.json";

const formatAge = (colValue: string) => {
  let numericValue = -1;

  if (colValue) {
    numericValue = Number(colValue);
  }

  if (numericValue > 120) {
    numericValue = -1;
  }

  return numericValue;
};

const expectedFields = ["name", "id", "dob", "sex", "age"];

const sexMapping = {
  ذكر: "m",
  انثى: "f",
};

const addRecordField = (fieldKey: string, fieldValue: string) => {
  if (expectedFields.includes(fieldKey) === false) {
    return; // omit unexpected field
  }

  let value: string | number = fieldValue;

  switch (fieldKey) {
    case "age":
      value = formatAge(fieldValue);
      break;
    case "sex":
      value = sexMapping[fieldValue] ?? "";
      break;
  }

  return {
    [fieldKey]: value,
    ...(fieldKey === "name" ? { en_name: toEnName(fieldValue) } : {}),
  };
};

/**
 * turns spreadsheet row / col arrays into an array of objects for each report date
 * @param headerKeys the row with valid json object keys in the spreadsheet header
 * @param rows spreadsheet rows for each report date with column values to reduce into a report object
 * @returns array of daily report objects
 */
const formatToJson = (headerKeys: string[], rows: string[][]) => {
  return rows.map((rowColumns) =>
    rowColumns.reduce(
      (dayRecord, colValue, colIndex) => ({
        ...dayRecord,
        ...addRecordField(headerKeys[colIndex], colValue),
      }),
      {}
    )
  );
};

const generateJsonFromGSheet = async () => {
  const sheetJson = await fetchGoogleSheet(SheetTab.KilledInGaza);
  // first row: english keys, second row: arabic keys, third row: first martyr
  const [__, headerKeys, ...rows] = sheetJson.values;
  const jsonArray = formatToJson(headerKeys, rows);
  writeJson(ApiResource.KilledInGazaV2, jsonFileName, jsonArray);
  console.log(`generated JSON file: ${jsonFileName}`);
};

generateJsonFromGSheet();
