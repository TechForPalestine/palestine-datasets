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
    value: previewData.massacres,
    label: <Translate>Massacres</Translate>,
  },
  {
    value: previewData.killed.total,
    label: <Translate>Total Killed</Translate>,
  },
  {
    value: previewData.killed.children,
    label: <Translate>Children Killed</Translate>,
  },
  {
    value: previewData.killed.women,
    label: <Translate>Women Killed</Translate>,
  },
  {
    value: previewData.killed.medical,
    label: <Translate>Medical Personnel Killed</Translate>,
  },
  {
    value: previewData.killed.press,
    label: <Translate>Journalists Killed</Translate>,
  },
  {
    value: previewData.killed.civilDefence,
    label: <Translate>Emergency Personnel Killed</Translate>,
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
