import { ApiResource } from "../../types/api.types";
import { addToManifest } from "./manifest";

const jsonTabWidth = 2;

export const minifiedResourceName = (fileName: string) =>
  fileName.replace(/json$/, "min.json");

export const writeJson = (
  resource: ApiResource,
  unminifiedFileName: string,
  json: any,
  minifiedOnly = false
) => {
  const fs = require("fs");
  const minified = minifiedResourceName(unminifiedFileName);

  if (!minifiedOnly) {
    fs.writeFileSync(
      unminifiedFileName,
      JSON.stringify(json, null, jsonTabWidth)
    );
  }
  fs.writeFileSync(minified, JSON.stringify(json));

  addToManifest(resource, { minified, unminified: unminifiedFileName });
};

export const writeCsv = (
  resource: ApiResource,
  filePath: string,
  rows: any[][]
) => {
  const fs = require("fs");
  const csvString = rows.map((columns) => columns.join(",")).join("\n");
  fs.writeFileSync(filePath, csvString);
  addToManifest(resource, { csv: filePath });
};
