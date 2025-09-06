import Layout from "@theme/Layout";
import { KilledNamesListGrid } from "../components/KilledNamesListGrid/KilledNamesListGrid";

export default function NamesList(): JSX.Element {
  return (
    <Layout noFooter title="" description="">
      <KilledNamesListGrid />
    </Layout>
  );
}
