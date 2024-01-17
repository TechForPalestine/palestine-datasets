import { ApiResource } from "../../types/api.types";
import { addToManifest } from "./manifest";

const jsonTabWidth = 2;

export const minifiedResourceName = (fileName: string) =>
  fileName.replace(/json$/, "min.json");

export const writeJson = (
  resource: ApiResource,
  unminified: string,
  json: any,
  minifiedOnly = false
) => {
  const fs = require("fs");
  const minified = minifiedResourceName(unminified);

  if (!minifiedOnly) {
    fs.writeFileSync(unminified, JSON.stringify(json, null, jsonTabWidth));
  }
  fs.writeFileSync(minified, JSON.stringify(json));

  addToManifest(resource, { minified, unminified });
};
