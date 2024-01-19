import { ApiResource } from "../../../types/api.types";
import { writeJson } from "../../utils/fs";
import { SheetTab, fetchGoogleSheet } from "../../utils/gsheets";
import {
  formatDailiesJson,
  validateDailiesJson,
} from "../common/casualties-daily";

const jsonFileName = "old/casualties_daily.json";

const generateJsonFromGSheet = async () => {
  const sheetJson = await fetchGoogleSheet(SheetTab.CasualtiesDaily);
  // drop the first two rows which are for sheet admin only
  const [_, __, headerKeys, ...rows] = sheetJson.values;
  const jsonArray = formatDailiesJson(headerKeys, rows);
  validateDailiesJson(jsonArray);
  writeJson(ApiResource.CasualtiesDailyV1, jsonFileName, jsonArray);
  console.log(`generated JSON file: ${jsonFileName}`);
};

generateJsonFromGSheet();
