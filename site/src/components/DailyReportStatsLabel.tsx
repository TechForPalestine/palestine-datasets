import { translate } from "@docusaurus/Translate";
import previewData from "@site/src/generated/summary.json";

const format = (count: number) => new Intl.NumberFormat().format(count);

export const DailyReportStatsLabel = () => {
  return (
    <div>
      {translate(
        { message: "daily-report-stats-label" },
        {
          count: format(previewData.dailyReportCount),
          lastDate: previewData.lastDailyUpdate,
        }
      )}
    </div>
  );
};
