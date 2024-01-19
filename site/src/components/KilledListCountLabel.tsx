import { translate } from "@docusaurus/Translate";
import previewData from "@site/src/generated/summary.json";

const format = (count: number) => new Intl.NumberFormat().format(count);

export const KilledListCountLabel = () => {
  return (
    <div>
      {translate(
        { message: "killed-in-gaza-names-count" },
        { count: format(previewData.killedInGazaListCount) }
      )}
    </div>
  );
};
