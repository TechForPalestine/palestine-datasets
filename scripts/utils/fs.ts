import { ApiResource } from "../../types/api.types";
import { addToManifest } from "./manifest";

const jsonTabWidth = 2;

type AliasedFile = { from: string; to: string };

export const minifiedResourceName = (fileName: string | AliasedFile) => {
  if (typeof fileName === "string") {
    return fileName.replace(/json$/, "min.json");
  }

  return {
    from: fileName.from.replace(/json$/, "min.json"),
    to: fileName.to.replace(/json$/, "min.json"),
  };
};

export const writeJson = (
  resource: ApiResource,
  unminifiedFileName: string | AliasedFile,
  json: any,
  minifiedOnly = false
) => {
  const fs = require("fs");
  const minified = minifiedResourceName(unminifiedFileName);

  if (!minifiedOnly) {
    fs.writeFileSync(
      typeof unminifiedFileName === "string"
        ? unminifiedFileName
        : unminifiedFileName.from,
      JSON.stringify(json, null, jsonTabWidth)
    );
  }
  fs.writeFileSync(
    typeof minified === "string" ? minified : minified.from,
    JSON.stringify(json)
  );

  addToManifest(resource, { minified, unminified: unminifiedFileName });
};

export const writeOffManifestJson = (
  filePath: string | AliasedFile,
  json: any
) => {
  const fs = require("fs");
  fs.writeFileSync(
    typeof filePath === "string" ? filePath : filePath.from,
    JSON.stringify(json)
  );
};

export const writeManifestCsv = (
  resource: ApiResource,
  filePath: string | AliasedFile,
  rows: any[][]
) => {
  const fs = require("fs");
  const csvString = rows.map((columns) => columns.join(",")).join("\n");
  fs.writeFileSync(
    typeof filePath === "string" ? filePath : filePath.from,
    csvString
  );
  addToManifest(resource, { csv: filePath });
};
