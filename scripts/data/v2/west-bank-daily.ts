import { ApiResource } from "../../../types/api.types";
import { writeJson } from "../../utils/fs";
import { SheetTab, fetchGoogleSheet } from "../../utils/gsheets";
import {
  formatDailiesJson,
  validateDailiesJson,
} from "../common/casualties-daily";

const jsonFileName = "west_bank_daily.json";

const columnFilter = new Set([
  "report_date",
  "verified.killed",
  "verified.killed_cum",
  "verified.injured",
  "verified.injured_cum",
  "verified.killed_children",
  "verified.killed_children_cum",
  "verified.injured_children",
  "verified.injured_children_cum",
  "killed",
  "killed_cum",
  "injured",
  "injured_cum",
  "killed_children",
  "killed_children_cum",
  "injured_children",
  "injured_children_cum",
]);

const generateJsonFromGSheet = async () => {
  const sheetJson = await fetchGoogleSheet(SheetTab.WestBankDaily);
  const [, headerKeys, ...rows] = sheetJson.values;
  const completedIdx = headerKeys.findIndex((col) => col === "completed");
  const filteredRows = rows.filter((row) => row[completedIdx] === "TRUE");
  const jsonArray = formatDailiesJson(headerKeys, filteredRows, columnFilter);
  validateDailiesJson(jsonArray);
  writeJson(ApiResource.WestBankDailyV2, jsonFileName, jsonArray);
  console.log(`generated JSON file: ${jsonFileName}`);
};

generateJsonFromGSheet();
