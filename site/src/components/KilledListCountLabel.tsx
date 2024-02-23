import { translate } from "@docusaurus/Translate";
import previewData from "@site/src/generated/summary.json";

const format = (count: number) => new Intl.NumberFormat().format(count);

export const KilledListCountLabel = () => {
  return (
    <div style={{ marginBottom: 20 }}>
      {translate(
        { message: "killed-in-gaza-names-count" },
        {
          count: format(previewData.known_killed_in_gaza.records),
          femaleSenior: format(previewData.known_killed_in_gaza.female.senior),
          femaleAdult: format(previewData.known_killed_in_gaza.female.adult),
          femaleChild: format(previewData.known_killed_in_gaza.female.child),
          maleSenior: format(previewData.known_killed_in_gaza.male.senior),
          maleAdult: format(previewData.known_killed_in_gaza.male.adult),
          maleChild: format(previewData.known_killed_in_gaza.male.child),
        }
      )}
    </div>
  );
};
