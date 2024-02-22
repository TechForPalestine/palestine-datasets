import CodeBlock from "@theme/CodeBlock";
import styles from "./styles.module.css";
import { ExternalLinkButton } from "../ExternalLinkButton";
import { ApiResource } from "../../../../types/api.types";
import { useResourcePaths } from "@site/src/lib/resource-paths";

export const JSONFileLinks = ({ resource }: { resource: ApiResource }) => {
  const { unminified, minified, csv, siteUrl } = useResourcePaths(resource);

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
        <ExternalLinkButton
          to={`/${csv.apiPath}/${csv.name}`}
          buttonType="secondary"
        >
          {csv.name}
        </ExternalLinkButton>
      )}
      <div className={styles.codeBlocks}>
        {minified && (
          <>
            <h3>Minified </h3>
            <CodeBlock>{`${siteUrl}/${minified.apiPath}/${minified.name}`}</CodeBlock>
          </>
        )}
        {unminified && (
          <>
            <h3>Unminified </h3>
            <CodeBlock>{`${siteUrl}/${unminified.apiPath}/${unminified.name}`}</CodeBlock>
          </>
        )}
      </div>
    </div>
  );
};
