import { ApiResource } from "../../../types/api.types";
import { writeJson } from "../../utils/fs";
import { SheetTab, fetchGoogleSheet } from "../../utils/gsheets";

const jsonFileName = "casualties_daily.json";

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

/**
 * our docs claim fields prefixed with ext_ are non-optional, so we should assert that
 */
const validateJson = (json: Array<Record<string, number | string>>) => {
  const uniqueFieldNames = new Set<string>();
  json.forEach((record) =>
    Object.keys(record).forEach((key) => uniqueFieldNames.add(key))
  );
  const extKeys = Array.from(uniqueFieldNames).filter((key) =>
    key.startsWith("ext_")
  );
  json.forEach((record) => {
    extKeys.forEach((expectedKey) => {
      const value = record[expectedKey];
      if (typeof value !== "string" && typeof value !== "number") {
        throw new Error(
          `Record for ${record.report_date} is missing expected key: ${expectedKey}`
        );
      }
    });
  });
};

const generateJsonFromGSheet = async () => {
  const sheetJson = await fetchGoogleSheet(SheetTab.CasualtiesDaily);
  // drop the first two rows which are for sheet admin only
  const [_, __, headerKeys, ...rows] = sheetJson.values;
  const jsonArray = formatToJson(headerKeys, rows);
  validateJson(jsonArray);
  writeJson(ApiResource.CasualtiesDailyV1, jsonFileName, jsonArray);
  console.log(`generated JSON file: ${jsonFileName}`);
};

generateJsonFromGSheet();
