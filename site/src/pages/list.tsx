import Layout from "@theme/Layout";
import { KilledNamesListGrid } from "../components/KilledNamesListGrid/KilledNamesListGrid";

export default function NamesList(): JSX.Element {
  return (
    <div style={{ height: "100vh", width: "100vw", overflow: "hidden" }}>
      <Layout noFooter title="" description="">
        <KilledNamesListGrid />
      </Layout>
    </div>
  );
}
