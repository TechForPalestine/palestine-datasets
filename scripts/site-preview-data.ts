import fs from "fs";
import type { PreviewData } from "../types/site-preview-data.types";
import type { CasualtyDailyReport } from "../types/casualties-daily.types";

/**
 * script loads just what's required to provide a summary of the datasets
 * on the homepage, without loading all of the JSON
 */

const martyrs = require("../martyrs.json");
const dailies = require("../casualties_daily.json");

const martyrListCount = martyrs.length;
const [lastDailyReport]: CasualtyDailyReport[] = dailies.slice().reverse();

const previewData: PreviewData = {
  martyrListCount,
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

const tabSize = 2;
fs.writeFileSync(
  "site/src/generated/preview-data.json",
  JSON.stringify(previewData, null, tabSize)
);
