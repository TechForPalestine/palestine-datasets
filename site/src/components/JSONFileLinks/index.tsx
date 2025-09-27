import CodeBlock from "@theme/CodeBlock";
import styles from "./styles.module.css";
import { ExternalLinkButton } from "../ExternalLinkButton";
import { ApiResource } from "../../../../types/api.types";
import { useResourcePaths } from "@site/src/lib/resource-paths";

export const JSONFileLinks = ({
  resource,
  minifiedOnly,
}: {
  resource: ApiResource;
  minifiedOnly?: boolean;
}) => {
  const { unminified, minified, csv, siteUrl } = useResourcePaths(resource);

  const showUnminified = !minifiedOnly && unminified;

  return (
    <div>
      {showUnminified && (
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
          buttonType={showUnminified ? "secondary" : "primary"}
          style={minifiedOnly ? { marginRight: 20 } : undefined}
        >
          {csv.name}
        </ExternalLinkButton>
      )}
      {minifiedOnly && (
        <ExternalLinkButton
          to={`/${minified.apiPath}/${minified.name}`}
          buttonType="secondary"
        >
          {minified.name}
        </ExternalLinkButton>
      )}
      <div className={styles.codeBlocks}>
        {minified && (
          <>
            <h3>Minified JSON </h3>
            <CodeBlock>{`${siteUrl}/${minified.apiPath}/${minified.name}`}</CodeBlock>
          </>
        )}
        {showUnminified && (
          <>
            <h3>Unminified JSON </h3>
            <CodeBlock>{`${siteUrl}/${unminified.apiPath}/${unminified.name}`}</CodeBlock>
          </>
        )}
        {csv && (
          <>
            <h3>CSV </h3>
            <CodeBlock>{`${siteUrl}/${csv.apiPath}/${csv.name}`}</CodeBlock>
            <a
              href={`${siteUrl}/${csv.apiPath}/${csv.name}`}
              download
              style={{ marginBottom: 20, display: "block" }}
            >
              Download CSV
            </a>
          </>
        )}
      </div>
    </div>
  );
};
