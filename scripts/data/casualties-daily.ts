import { ApiResource } from "../../types/api.types";
import { writeJson } from "../utils/fs";

const gsheetsKey = process.env.GSHEETS_KEY;
const sheetTab = "casualties_daily";
const jsonFileName = `${sheetTab}.json`;
const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/1UuWRD602kUFyYbw-e6eJ3PaOGlyfMvwMBJW9zdGOO8g/values/${sheetTab}?alt=json&key=${gsheetsKey}`;

const formatValue = (colValue: string) => {
  // not empty string, coerce into int
  if (colValue) {
    return Number(colValue);
  }

  return undefined;
};

const rawValueFields = ["report_date", "report_source"];
const addRecordField = (fieldKey: string, fieldValue: string) => {
  const rawValue = rawValueFields.includes(fieldKey);
  return {
    [fieldKey]: rawValue ? fieldValue : formatValue(fieldValue),
  };
};

/**
 * turns spreadsheet row / col arrays into an array of objects for each report date
 * @param headerKeys the row with valid json object keys in the spreadsheet header
 * @param rows spreadsheet rows for each report date with column values to reduce into a report object
 * @returns array of daily report objects
 */
const formatToJson = (headerKeys: string[], rows: string[][]) => {
  return rows.reverse().map((rowColumns) =>
    rowColumns.reduce(
      (dayRecord, colValue, colIndex) => ({
        ...dayRecord,
        ...addRecordField(headerKeys[colIndex], colValue),
      }),
      {}
    )
  );
};

type GSheetsResponse = {
  values: string[][]; // array of rows with array of column values
};

const generateJsonFromGSheet = async () => {
  const sheetResponse = await fetch(sheetUrl);
  const sheetJson: GSheetsResponse = await sheetResponse.json();
  // drop the first two rows which are for sheet admin only
  const [_, __, headerKeys, ...rows] = sheetJson.values;
  const jsonArray = formatToJson(headerKeys, rows);
  writeJson(ApiResource.CasualtiesDailyV1, jsonFileName, jsonArray);
  console.log(`generated JSON file: ${jsonFileName}`);
};

generateJsonFromGSheet();
