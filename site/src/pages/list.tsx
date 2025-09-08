import Layout from "@theme/Layout";
import { KilledNamesListGrid } from "../components/KilledNamesListGrid/KilledNamesListGrid";
import styles from "./list.module.css";

export default function NamesList(): JSX.Element {
  return (
    <div className={styles.container}>
      <Layout noFooter title="" description="">
        <KilledNamesListGrid />
      </Layout>
    </div>
  );
}
