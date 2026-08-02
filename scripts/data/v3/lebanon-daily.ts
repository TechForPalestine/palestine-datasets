import { ApiResource } from "../../../types/api.types";
import { writeJson } from "../../utils/fs";
import { validateDailiesJson } from "../common/casualties-daily";
import {
  lebanonContentDir,
  lebanonDiscrepancyAllowlist,
  lebanonDiscrepancyPairs,
} from "../common/casualties-daily/config";
import {
  findReportingDiscrepancies,
  readDailyReports,
  stripMetadata,
} from "../common/casualties-daily/content";

const jsonFileName = "lebanon_casualties_daily.json";

const generateJsonFromContent = () => {
  const records = readDailyReports(lebanonContentDir);
  const discrepancies = findReportingDiscrepancies(records, lebanonDiscrepancyPairs).filter(
    ({ report_date, field }) => !lebanonDiscrepancyAllowlist.includes(`${report_date}:${field}`),
  );
  if (discrepancies.length > 0) {
    console.error("Reporting discrepancies found:");
    for (const d of discrepancies) {
      console.error(
        `  ${d.report_date} ${d.field}: reported=${d.reported}, expectedFromCum=${d.expectedFromCum}`,
      );
    }
    process.exit(1);
  }
  const dataset = stripMetadata(records);
  validateDailiesJson(dataset);
  writeJson(ApiResource.LebanonDailyV3, jsonFileName, dataset);
  console.log(`generated JSON file: ${jsonFileName} from ${records.length} daily reports`);
};

generateJsonFromContent();
