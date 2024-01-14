import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";
import Link from "@docusaurus/Link";

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<"svg">>;
  svgClassName: string;
  description: JSX.Element;
  buttonLabel: string;
  buttonPath: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: "Martyr Names",
    Svg: require("@site/static/img/undraw_family_vg76.svg").default,
    svgClassName: styles.featureSvgMartyr,
    description: <>JSON list of Martyrs with some identifying details</>,
    buttonLabel: "Get martyrs.json",
    buttonPath: "/docs/martyrs",
  },
  {
    title: "Daily Casualty Reports",
    Svg: require("@site/static/img/undraw_data_reports_706v.svg").default,
    svgClassName: styles.featureSvg,
    description: <>JSON list of official martyr & injury numbers</>,
    buttonLabel: "Get casualties_daily.json",
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
