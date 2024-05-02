import { translate } from "@docusaurus/Translate";
import previewData from "@site/src/generated/summary.json";

const format = (count: number) => new Intl.NumberFormat().format(count);

export const PressKilledListCountLabel = () => {
  return (
    <div style={{ marginBottom: 20 }}>
      {translate(
        { message: "press-killed-in-gaza-names-count" },
        {
          count: format(previewData.known_press_killed_in_gaza.records),
        }
      )}
    </div>
  );
};
