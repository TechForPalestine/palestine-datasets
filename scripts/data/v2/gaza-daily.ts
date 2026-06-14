import { ApiResource } from "../../../types/api.types";
import { writeJson } from "../../utils/fs";
import { validateDailiesJson } from "../common/casualties-daily";
import { gazaContentDir, gazaDerivedCumulatives } from "../common/casualties-daily/config";
import { deriveCumulatives, readDailyReports } from "../common/casualties-daily/content";

const jsonFileName = "casualties_daily.json";

const generateJsonFromContent = () => {
  const records = readDailyReports(gazaContentDir);
  deriveCumulatives(records, gazaDerivedCumulatives);
  validateDailiesJson(records);
  writeJson(ApiResource.CasualtiesDailyV2, jsonFileName, records);
  console.log(`generated JSON file: ${jsonFileName} from ${records.length} daily reports`);
};

generateJsonFromContent();
