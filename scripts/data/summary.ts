import type { PreviewData } from "../../types/summary.types";
import type { CasualtyDailyReport } from "../../types/casualties-daily.types";
import { writeJson } from "../utils/fs";
import { ApiResource } from "../../types/api.types";

/**
 * script loads just what's required to provide a summary of the datasets
 * on the homepage, without loading all of the JSON
 */

const martyrs = require("../../martyrs.json");
const dailies = require("../../casualties_daily.json");

const martyrListCount = martyrs.length;
const [lastDailyReport]: CasualtyDailyReport[] = dailies.slice().reverse();

const previewData: PreviewData = {
  martyrListCount,
  massacres: lastDailyReport.ext_massacres_cum,
  martyred: {
    total: lastDailyReport.ext_martyred_cum,
    children: lastDailyReport.ext_martyred_children_cum,
    women: lastDailyReport.ext_martyred_women_cum,
    civilDefence: lastDailyReport.ext_civdef_martyred_cum,
    press: lastDailyReport.ext_press_martyred_cum,
    medical: lastDailyReport.ext_med_martyred_cum,
  },
  injured: {
    total: lastDailyReport.ext_injured_cum,
  },
  lastDailyUpdate: lastDailyReport.report_date,
};

writeJson(
  ApiResource.SummaryV1,
  "site/src/generated/summary.json",
  previewData
);
