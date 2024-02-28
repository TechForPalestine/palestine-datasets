import { translate } from "@docusaurus/Translate";
import previewData from "@site/src/generated/summary.json";

const format = (count: number) => new Intl.NumberFormat().format(count);

export const DailyReportStatsLabel = ({
  area,
}: {
  area: "gaza" | "west_bank";
}) => {
  return (
    <div>
      {translate(
        { message: "daily-report-stats-label" },
        {
          count: format(previewData[area].reports),
          lastDate: previewData[area].last_update,
        }
      )}
    </div>
  );
};
