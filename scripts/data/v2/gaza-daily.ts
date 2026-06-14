import { ApiResource } from "../../../types/api.types";
import { writeJson } from "../../utils/fs";
import { validateDailiesJson } from "../common/casualties-daily";
import {
  gazaCarryForward,
  gazaContentDir,
  gazaDiscrepancyPairs,
  gazaExtDeltas,
} from "../common/casualties-daily/config";
import {
  deriveExtendedSeries,
  findReportingDiscrepancies,
  readDailyReports,
  stripMetadata,
} from "../common/casualties-daily/content";

const jsonFileName = "casualties_daily.json";

const reportDiscrepancies = (records: ReturnType<typeof readDailyReports>) => {
  const all = findReportingDiscrepancies(records, gazaDiscrepancyPairs);
  // discrepancies an editor has documented (editorial_notes) are acknowledged
  // and stay quiet; only unreviewed ones are surfaced for a decision.
  const unreviewed = all.filter((d) => !d.hasNote);
  const acknowledged = all.length - unreviewed.length;
  if (unreviewed.length === 0) {
    if (acknowledged > 0) {
      console.log(`reporting discrepancies: ${acknowledged} acknowledged via editorial_notes`);
    }
    return;
  }
  console.warn(
    `\n⚠ ${unreviewed.length} unreviewed reporting discrepancy(ies) (${acknowledged} acknowledged):` +
      ` reported daily differs from the change in the reported cumulative, which is treated as` +
      ` authoritative. Reconcile the daily or document the decision in editorial_notes.`,
  );
  for (const d of unreviewed) {
    console.warn(
      `  ${d.report_date} ${d.field}: reported ${d.reported}, cumulative implies ${d.expectedFromCum}`,
    );
  }
};

const generateJsonFromContent = () => {
  const records = readDailyReports(gazaContentDir);
  reportDiscrepancies(records);
  deriveExtendedSeries(records, gazaCarryForward, gazaExtDeltas);
  const dataset = stripMetadata(records);
  validateDailiesJson(dataset);
  writeJson(ApiResource.CasualtiesDailyV2, jsonFileName, dataset);
  console.log(`generated JSON file: ${jsonFileName} from ${records.length} daily reports`);
};

generateJsonFromContent();
