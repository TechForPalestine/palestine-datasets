import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { ApiResource, Manifest } from "../../../types/api.types";
import manifestJson from "../generated/manifest.json";

const manifest: Manifest = manifestJson;

export const useResourcePaths = (resource: ApiResource) => {
  const docCtx = useDocusaurusContext();
  const files = manifest[resource];
  if (!files) {
    throw new Error(
      `Missing manifest entry for resource: ${resource}, cannot render JSONFileLinks`
    );
  }

  return { ...files, siteUrl: docCtx.siteConfig.url };
};
