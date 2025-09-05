import fs, { writeFileSync } from "fs";
import { ApiResource, Manifest, ResourceFormat } from "../../types/api.types";

const publicBasePath = "api";
const manifestPath = "site/src/generated/manifest.json";

// strip any file path prefix
const baseFileName = (filePath: string) => filePath.split("/").pop();

const getManifestAndPath = (resource: ApiResource) => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath).toString());
  const version = resource.split("_").pop()?.toLowerCase();
  if (!version) {
    throw new Error(`Could parse version from resource: ${resource}`);
  }

  const apiPath = `${publicBasePath}/${version}`;
  return { manifest, apiPath };
};

/**
 * register the json file in the manifest so that the doc site can reference
 * it by the name we're using
 *
 * @param filePath ie: casualties-daily.json (expects only json)
 */
export const addToManifest = (
  resource: ApiResource,
  files: Partial<Record<ResourceFormat, string | { from: string; to: string }>>
) => {
  const { manifest, apiPath } = getManifestAndPath(resource);
  const types = Object.keys(files) as ResourceFormat[];
  types.forEach((resourceType) => {
    const file = files[resourceType];
    if (!file) {
      return;
    }
    const name = typeof file === "string" ? baseFileName(file) : file.to;
    const source = typeof file === "string" ? file : file.from;
    manifest[resource] = {
      ...manifest[resource],
      [resourceType]: {
        file: source,
        name,
        apiPath,
      },
    };
  });

  writeManifest(manifest);
};

export const addFolderToManifest = (
  resource: ApiResource,
  folderPath: string
) => {
  const { manifest, apiPath } = getManifestAndPath(resource);
  manifest[resource] = {
    ...manifest[resource],
    raw: {
      folder: folderPath,
      apiPath,
    },
  };
  writeManifest(manifest);
};

export const writeManifest = (manifest: Manifest) =>
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
