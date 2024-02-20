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
<<<<<<< HEAD
  "killed",
  "killed_cum",
  "injured",
  "injured_cum",
  "killed_children",
  "killed_children_cum",
  "injured_children",
  "injured_children_cum",
=======
  "verified.killed",
  "verified.killed_cum",
  "verified.injured",
  "verified.injured_cum",
  "verified.killed_children",
  "verified.killed_children_cum",
  "verified.injured_children",
  "verified.injured_children_cum",
  "killed_cum",
  "injured_cum",
  "killed_children_cum",
  "injured_children_cum",
  "settler_attacks_cum",
>>>>>>> a9d43482ec773855321758d5983974694a27aa26
]);

const generateJsonFromGSheet = async () => {
  const sheetJson = await fetchGoogleSheet(SheetTab.WestBankDaily);
<<<<<<< HEAD
  // drop the first two rows which are for sheet admin only
  const [headerKeys, ...rows] = sheetJson.values;
=======
  const [, headerKeys, ...rows] = sheetJson.values;
>>>>>>> a9d43482ec773855321758d5983974694a27aa26
  const completedIdx = headerKeys.findIndex((col) => col === "completed");
  const filteredRows = rows.filter((row) => row[completedIdx] === "TRUE");
  const jsonArray = formatDailiesJson(headerKeys, filteredRows, columnFilter);
  validateDailiesJson(jsonArray);
  writeJson(ApiResource.WestBankDailyV2, jsonFileName, jsonArray);
  console.log(`generated JSON file: ${jsonFileName}`);
};

<<<<<<< HEAD
generateJsonFromGSheet();
=======
generateJsonFromGSheet();
>>>>>>> a9d43482ec773855321758d5983974694a27aa26
