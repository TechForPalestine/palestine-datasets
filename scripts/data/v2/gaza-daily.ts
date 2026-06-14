import { ApiResource } from "../../../types/api.types";
import { writeJson } from "../../utils/fs";
import { validateDailiesJson } from "../common/casualties-daily";
import { gazaCarryForward, gazaContentDir, gazaExtDeltas } from "../common/casualties-daily/config";
import {
  deriveExtendedSeries,
  readDailyReports,
  stripMetadata,
} from "../common/casualties-daily/content";

const jsonFileName = "casualties_daily.json";

const generateJsonFromContent = () => {
  const records = readDailyReports(gazaContentDir);
  deriveExtendedSeries(records, gazaCarryForward, gazaExtDeltas);
  const dataset = stripMetadata(records);
  validateDailiesJson(dataset);
  writeJson(ApiResource.CasualtiesDailyV2, jsonFileName, dataset);
  console.log(`generated JSON file: ${jsonFileName} from ${records.length} daily reports`);
};

generateJsonFromContent();
