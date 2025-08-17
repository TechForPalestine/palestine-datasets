import { translate } from "@docusaurus/Translate";
import previewData from "@site/src/generated/summary.json";

const format = (count: number) => new Intl.NumberFormat().format(count);

export const KilledListPagingLabel = () => {
  return (
    <div style={{ marginBottom: 20 }}>
      {translate(
        { message: "killed-in-gaza-names-paging" },
        {
          page_size: format(previewData.known_killed_in_gaza.page_size),
          page_count: format(previewData.known_killed_in_gaza.pages),
        }
      )}
    </div>
  );
};
