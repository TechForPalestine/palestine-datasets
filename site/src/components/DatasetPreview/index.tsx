import clsx from "clsx";
import styles from "./styles.module.css";
import Translate from "@docusaurus/Translate";
import previewData from "../../generated/summary.json";

type DataSummaryCardProps = {
  value: string | number;
  label: string | JSX.Element;
};

const DataSummaries: DataSummaryCardProps[] = [
  {
    value: previewData.martyrListCount,
    label: <Translate>Martyr Names</Translate>,
  },
  {
    value: previewData.martyred.total,
    label: <Translate>Total Martyred</Translate>,
  },
  {
    value: previewData.martyred.children,
    label: <Translate>Children Martyred</Translate>,
  },
  {
    value: previewData.martyred.women,
    label: <Translate>Women Martyred</Translate>,
  },
  {
    value: previewData.martyred.medical,
    label: <Translate>Medical Personnel Martyred</Translate>,
  },
  {
    value: previewData.martyred.press,
    label: <Translate>Journalists Martyred</Translate>,
  },
  {
    value: previewData.martyred.civilDefence,
    label: <Translate>Emergency Personnel Martyred</Translate>,
  },
  {
    value: previewData.injured.total,
    label: <Translate>Total Injured</Translate>,
  },
  {
    value: previewData.lastDailyUpdate,
    label: <Translate>Last Daily Update</Translate>,
  },
];

const formatValue = (value: number | string) => {
  if (typeof value === "string") {
    return value;
  }

  return new Intl.NumberFormat().format(value);
};

function DataSummaryCard({ value, label }: DataSummaryCardProps) {
  return (
    <div className={clsx("col col--4")}>
      <div className={styles.cardContainer}>
        <div className="card">
          <div className={styles.cardContentWrapper}>
            <div className="card__body">
              <div className={styles.previewDataValue}>
                {formatValue(value)}
              </div>
              <div className={styles.previewDataLabel}>{label}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DatasetPreview(): JSX.Element {
  return (
    <section className={styles.previewContainer}>
      <div className="container">
        <div className="row">
          {DataSummaries.map((props, idx) => (
            <DataSummaryCard key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
