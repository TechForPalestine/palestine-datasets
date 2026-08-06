import { ApiResource } from "../../../types/api.types";
import { writeJson } from "../../utils/fs";
import { validateDailiesJson } from "../common/casualties-daily";
import {
  lebanonContentDir,
  lebanonCumulativeFields,
  lebanonDiscrepancyAllowlist,
  lebanonDiscrepancyPairs,
  lebanonPhaseField,
  lebanonPhaseRebase,
} from "../common/casualties-daily/config";
import {
  derivePhaseCumulative,
  findCumulativeRegressions,
  findReportingDiscrepancies,
  readDailyReports,
  stripMetadata,
} from "../common/casualties-daily/content";

const jsonFileName = "lebanon_casualties_daily.json";

const generateJsonFromContent = () => {
  const records = readDailyReports(lebanonContentDir);
  // runs on the as-reported figures, before they are rebased across phases
  const discrepancies = findReportingDiscrepancies(
    records,
    lebanonDiscrepancyPairs,
    lebanonPhaseField,
  ).filter(
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
  derivePhaseCumulative(records, lebanonPhaseField, lebanonPhaseRebase);
  // the rebased series spans phases, so unlike the as-reported figures it must
  // rise monotonically end to end — a drop here means the phase offsets are wrong
  const rebaseRegressions = findCumulativeRegressions(records, lebanonCumulativeFields);
  if (rebaseRegressions.length > 0) {
    console.error("Continuous (rebased) cumulative regressions found:");
    for (const r of rebaseRegressions) {
      console.error(
        `  ${r.report_date} ${r.field}: ${r.value} < ${r.previous} (from ${r.previousDate})`,
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
