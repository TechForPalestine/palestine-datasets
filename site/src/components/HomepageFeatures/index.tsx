import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";
import Link from "@docusaurus/Link";
import Translate from "@docusaurus/Translate";

type FeatureItem = {
  title: string | JSX.Element;
  Svg: React.ComponentType<React.ComponentProps<"svg">>;
  svgClassName: string;
  description: JSX.Element;
  buttonLabel: string | JSX.Element;
  buttonPath: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: <Translate>Martyr Names</Translate>,
    Svg: require("@site/static/img/undraw_family_vg76.svg").default,
    svgClassName: styles.featureSvgMartyr,
    description: (
      <Translate>JSON list of Martyrs with some identifying details</Translate>
    ),
    buttonLabel: <Translate>View Martyrs List</Translate>,
    buttonPath: "/docs/martyrs",
  },
  {
    title: <Translate>Daily Casualty Reports</Translate>,
    Svg: require("@site/static/img/undraw_data_reports_706v.svg").default,
    svgClassName: styles.featureSvg,
    description: (
      <Translate>JSON list of official martyr & injury numbers</Translate>
    ),
    buttonLabel: <Translate>View Casualties Reports</Translate>,
    buttonPath: "/docs/casualties-daily",
  },
];

function Feature({
  title,
  Svg,
  description,
  svgClassName,
  buttonLabel,
  buttonPath,
}: FeatureItem) {
  return (
    <div className={clsx("col col--6")}>
      <div className="text--center">
        <Link to={buttonPath}>
          <Svg className={svgClassName} role="img" />
        </Link>
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
        <div className={styles.buttons}>
          <Link className="button button--primary button--lg" to={buttonPath}>
            {buttonLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
