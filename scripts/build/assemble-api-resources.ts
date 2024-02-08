/**
 * copies all the api data files from our manifest locations to the "api" build
 * folder for the doc site
 */
import { execSync } from "child_process";
import { Manifest } from "../../types/api.types";
import { writeManifest } from "../utils/manifest";

const staticFilePath = "site/build";

const manifest: Manifest = require("../../site/src/generated/manifest.json");
const resources = Object.keys(manifest) as Array<keyof Manifest>;

resources.forEach((resource) => {
  const { minified, unminified, csv } = manifest[resource] ?? {};
  if (!minified || !unminified) {
    throw new Error(`Resource ${resource} has no minified or unminified path`);
  }
  let destPath = `${staticFilePath}/${minified.apiPath}`;
  execSync(`mkdir -p ${destPath}`);
  execSync(`cp ${minified.file} ${destPath}/${minified.name}`);
  if (csv) {
    execSync(`cp ${csv.file} ${destPath}/${csv.name}`);
  }
  if (minified.apiPath !== unminified.apiPath) {
    destPath = `${staticFilePath}/${unminified.apiPath}`;
    execSync(`mkdir -p ${destPath}`);
  }
  execSync(`cp ${unminified.file} ${destPath}/${unminified.name}`);
});

writeManifest(manifest);
