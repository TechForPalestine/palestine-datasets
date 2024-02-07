import CodeBlock from "@theme/CodeBlock";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import styles from "./styles.module.css";
import { ExternalLinkButton } from "../ExternalLinkButton";
import { ApiResource, Manifest } from "../../../../types/api.types";
import manifestJson from "../../generated/manifest.json";

const manifest: Manifest = manifestJson;

export const JSONFileLinks = ({ resource }: { resource: ApiResource }) => {
  const docCtx = useDocusaurusContext();
  const files = manifest[resource];
  if (!files) {
    throw new Error(
      `Missing manifest entry for resource: ${resource}, cannot render JSONFileLinks`
    );
  }

  const { unminified, minified, csv } = files;

  return (
    <div>
      {unminified && (
        <ExternalLinkButton
          to={`/${unminified.apiPath}/${unminified.name}`}
          style={csv ? { marginRight: 20 } : undefined}
        >
          {unminified.name}
        </ExternalLinkButton>
      )}
      {csv && (
        <ExternalLinkButton to={`/${csv.apiPath}/${csv.name}`}>
          {csv.name}
        </ExternalLinkButton>
      )}
      <div className={styles.codeBlocks}>
        {minified && (
          <>
            <h3>Minified </h3>
            <CodeBlock>{`${docCtx.siteConfig.url}/${minified.apiPath}/${minified.name}`}</CodeBlock>
          </>
        )}
        {unminified && (
          <>
            <h3>Unminified </h3>
            <CodeBlock>{`${docCtx.siteConfig.url}/${unminified.apiPath}/${unminified.name}`}</CodeBlock>
          </>
        )}
      </div>
    </div>
  );
};
