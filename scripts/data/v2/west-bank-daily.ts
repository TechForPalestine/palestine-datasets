import { ApiResource } from "../../../types/api.types";
import { writeJson } from "../../utils/fs";
import { validateDailiesJson } from "../common/casualties-daily";
import { westBankContentDir, westBankDerivedCumulatives } from "../common/casualties-daily/config";
import { deriveCumulatives, readDailyReports } from "../common/casualties-daily/content";

const jsonFileName = "west_bank_daily.json";

const generateJsonFromContent = () => {
  const records = readDailyReports(westBankContentDir);
  deriveCumulatives(records, westBankDerivedCumulatives);
  validateDailiesJson(records);
  writeJson(ApiResource.WestBankDailyV2, jsonFileName, records);
  console.log(`generated JSON file: ${jsonFileName} from ${records.length} daily reports`);
};

generateJsonFromContent();
