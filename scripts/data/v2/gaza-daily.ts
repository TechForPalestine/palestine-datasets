import { ApiResource } from "../../../types/api.types";
import { writeJson } from "../../utils/fs";
import { validateDailiesJson } from "../common/casualties-daily";
import {
  gazaCarryForward,
  gazaContentDir,
  gazaExtDeltas,
  gazaFillSource,
} from "../common/casualties-daily/config";
import {
  deriveExtendedSeries,
  fillDailyGaps,
  readDailyReports,
  stripMetadata,
} from "../common/casualties-daily/content";

const jsonFileName = "casualties_daily.json";

const generateJsonFromContent = () => {
  const records = readDailyReports(gazaContentDir);
  deriveExtendedSeries(records, gazaCarryForward, gazaExtDeltas);
  const dataset = stripMetadata(records);
  // fill any calendar gaps so the published series has a row for every date
  const series = fillDailyGaps(dataset, {
    cumulativeFields: gazaCarryForward.map((rule) => rule.ext),
    dailyFields: gazaExtDeltas.map((delta) => delta.daily),
    fillSource: gazaFillSource,
  });
  validateDailiesJson(series);
  writeJson(ApiResource.CasualtiesDailyV2, jsonFileName, series);
  console.log(
    `generated JSON file: ${jsonFileName} from ${records.length} daily reports` +
      ` (${series.length} continuous days, ${series.length - records.length} gap-filled)`,
  );
};

generateJsonFromContent();
