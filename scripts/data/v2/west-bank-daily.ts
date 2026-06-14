import { ApiResource } from "../../../types/api.types";
import { writeJson } from "../../utils/fs";
import { validateDailiesJson } from "../common/casualties-daily";
import {
  westBankCarryForward,
  westBankContentDir,
  westBankExtDeltas,
} from "../common/casualties-daily/config";
import {
  deriveExtendedSeries,
  readDailyReports,
  stripMetadata,
} from "../common/casualties-daily/content";

const jsonFileName = "west_bank_daily.json";

const generateJsonFromContent = () => {
  const records = readDailyReports(westBankContentDir);
  deriveExtendedSeries(records, westBankCarryForward, westBankExtDeltas);
  const dataset = stripMetadata(records);
  validateDailiesJson(dataset);
  writeJson(ApiResource.WestBankDailyV2, jsonFileName, dataset);
  console.log(`generated JSON file: ${jsonFileName} from ${records.length} daily reports`);
};

generateJsonFromContent();
