import type { PreviewDataV2 } from "../../../types/summary.types";
import type { CasualtyDailyReportV2 } from "../../../types/casualties-daily.types";
import { writeJson } from "../../utils/fs";
import { ApiResource } from "../../../types/api.types";

/**
 * script loads just what's required to provide a summary of the datasets
 * on the homepage, without loading all of the JSON
 */

const killedPersons = require("../../../killed-in-gaza.json");
const dailies = require("../../../casualties_daily.json");

const killedInGazaListCount = killedPersons.length;
const [lastDailyReport]: CasualtyDailyReportV2[] = dailies.slice().reverse();

const previewData: PreviewDataV2 = {
  killedInGazaListCount,
  massacres: lastDailyReport.ext_massacres_cum,
  killed: {
    total: lastDailyReport.ext_killed_cum,
    children: lastDailyReport.ext_killed_children_cum,
    women: lastDailyReport.ext_killed_women_cum,
    civilDefence: lastDailyReport.ext_civdef_killed_cum,
    press: lastDailyReport.ext_press_killed_cum,
    medical: lastDailyReport.ext_med_killed_cum,
  },
  injured: {
    total: lastDailyReport.ext_injured_cum,
  },
  lastDailyUpdate: lastDailyReport.report_date,
};

writeJson(
  ApiResource.SummaryV2,
  "site/src/generated/summary.json",
  previewData
);
