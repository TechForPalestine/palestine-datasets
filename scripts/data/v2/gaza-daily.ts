import { ApiResource } from "../../../types/api.types";
import { writeJson } from "../../utils/fs";
import { SheetTab, fetchGoogleSheet } from "../../utils/gsheets";
import {
  formatDailiesJson,
  validateDailiesJson,
} from "../common/casualties-daily";

const jsonFileName = "casualties_daily.json";

const fieldKeyRemap = {
  martyred: "killed",
  martyred_cum: "killed_cum",
  killed_recovered: "killed_recovered",
  killed_succumbed: "killed_succumbed",
  killed_truce_new: "killed_truce_new",
  killed_committee: "killed_committee",
  martyred_children_cum: "killed_children_cum",
  martyred_women_cum: "killed_women_cum",
  ext_martyred: "ext_killed",
  ext_martyred_cum: "ext_killed_cum",
  ext_martyred_children_cum: "ext_killed_children_cum",
  ext_martyred_women_cum: "ext_killed_women_cum",
  civdef_martyred_cum: "civdef_killed_cum",
  ext_civdef_martyred_cum: "ext_civdef_killed_cum",
  med_martyred_cum: "med_killed_cum",
  ext_med_martyred_cum: "ext_med_killed_cum",
  press_martyred_cum: "press_killed_cum",
  ext_press_martyred_cum: "ext_press_killed_cum",
};

const generateJsonFromGSheet = async () => {
  const sheetJson = await fetchGoogleSheet(SheetTab.CasualtiesDaily);
  // drop the first two rows which are for sheet admin only
  const [_, __, headerKeys, ...rows] = sheetJson.values;
  const renamedKeys = headerKeys.map(
    (key) => fieldKeyRemap[key as keyof typeof fieldKeyRemap] ?? key
  );
  const jsonArray = formatDailiesJson(renamedKeys, rows);
  validateDailiesJson(jsonArray);
  writeJson(ApiResource.CasualtiesDailyV2, jsonFileName, jsonArray);
  console.log(`generated JSON file: ${jsonFileName}`);
};

generateJsonFromGSheet();
