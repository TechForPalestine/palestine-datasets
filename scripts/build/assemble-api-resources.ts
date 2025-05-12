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

const execSyncLogged = (cmd: string) => {
  console.log(`execSync(${cmd})`);
  execSync(cmd);
};

resources.forEach((resource) => {
  console.log("assembling API resources for deployment...");
  const { minified, unminified, csv, raw } = manifest[resource] ?? {};

  if (minified && unminified) {
    let destPath = `${staticFilePath}/${minified.apiPath}`;
    execSyncLogged(`mkdir -p ${destPath}`);
    execSyncLogged(`cp ${minified.file} ${destPath}/${minified.name}`);
    if (csv) {
      execSyncLogged(`cp ${csv.file} ${destPath}/${csv.name}`);
    }
    if (minified.apiPath !== unminified.apiPath) {
      destPath = `${staticFilePath}/${unminified.apiPath}`;
      execSyncLogged(`mkdir -p ${destPath}`);
    }
    execSyncLogged(`cp ${unminified.file} ${destPath}/${unminified.name}`);
  }

  if (raw) {
    let destPath = `${staticFilePath}/${raw.apiPath}`;
    execSyncLogged(`mkdir -p ${destPath}`);
    try {
      execSyncLogged(`mv ${raw.folder} ${destPath}`);
    } catch (e) {
      if (e instanceof Error && e.message.includes("Directory not empty")) {
        execSyncLogged(`cp -r ${raw.folder}/* ${destPath}`);
        return;
      }
      throw e;
    }
  }
});

writeManifest(manifest);
