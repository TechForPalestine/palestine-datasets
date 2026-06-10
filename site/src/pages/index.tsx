import clsx from "clsx";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import Link from "@docusaurus/Link";
import Translate from "@docusaurus/Translate";

import styles from "./index.module.css";
import { KilledHeaderMarquee } from "../components";
import { HomeDailyChart } from "../components/HomeDailyChart";
import { KilledName } from "../components/KilledName";
import { StoriesInData } from "../components/StoriesInData";
import { BuildFlags } from "../lib/build-flags";

/**
 * Editorial Masthead (hero direction "A").
 * Left-aligned mission mirroring the "Stories in the data" head beneath it.
 * The names marquee stays full-bleed behind, dimmed under the copy by a left
 * scrim so the band reads as a single editorial register.
 */

// Mission figures. Wire these to live counts when available
// (e.g. KilledListCountLabel) — kept as constants here so the hero renders
// statically during SSR.
const META = [
  { n: "61,709", l: "names recorded", accent: true },
  { n: "7", l: "open datasets" },
  { n: "Daily", l: "updates since Oct 2023" },
];

function HomepageHeader() {
  return (
    <header className={clsx("hero", styles.heroBanner)}>
      <KilledHeaderMarquee />
      <div className={styles.scrim} aria-hidden="true" />
      <div className={clsx("container", styles.heroInner)}>
        <span className={styles.eyebrow}>
          <Translate>An open-data initiative</Translate>
        </span>

        <Heading as="h1" className={styles.heroTitle}>
          <Translate>Helping you tell their story</Translate>
        </Heading>

        <p className={styles.lede}>
          <Translate>
            We maintain open datasets documenting the human toll of the genocide in Palestine — so
            that journalists, researchers, artists, and advocates can tell the story.
          </Translate>
        </p>

        {BuildFlags.headerStats && (
          <div className={styles.metaRow}>
            {META.map((m) => (
              <div className={styles.meta} key={m.l}>
                <span className={clsx(styles.metaNum, m.accent && styles.metaNumAccent)}>
                  {m.n}
                </span>
                <span className={styles.metaLabel}>{m.l}</span>
              </div>
            ))}
          </div>
        )}

        {BuildFlags.headerCTAs && (
          <div className={styles.ctaRow}>
            <Link className={clsx(styles.btn, styles.btnPrimary)} to="/docs/category/datasets">
              <Translate>Explore the datasets</Translate> →
            </Link>
            <Link className={clsx(styles.btn, styles.btnGhost)} to="/list">
              <Translate>Browse the names</Translate>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title="" description={siteConfig.tagline}>
      <HomepageHeader />
      <main>
        {BuildFlags.exploreStories && <StoriesInData />}
        <HomeDailyChart />
        <KilledName />
        <div style={{ height: 40 }} />
      </main>
    </Layout>
  );
}
