import { execSync } from "child_process";
import killedNames from "../../../../site/src/generated/killed-in-gaza/name-freq-en.json";
import summary from "../../../../site/src/generated/summary.json";
import { writeOffManifestJson } from "../../../utils/fs";

const listChildrenCount =
  summary.known_killed_in_gaza.female.child +
  summary.known_killed_in_gaza.male.child;
const totalChildrenKilled =
  summary.gaza.killed.children + summary.west_bank.killed.children;
const estimator = ([name, listCount]: (string | number)[]) => {
  const adjustedCount = (+listCount / listChildrenCount) * totalChildrenKilled;
  return [name, Math.round(adjustedCount)];
};
const boyCounts = killedNames.lists.boy.map(estimator);
const girlCounts = killedNames.lists.girl.map(estimator);

const writePath = "site/src/generated/killed-in-gaza";
execSync(`mkdir -p ${writePath}`);
writeOffManifestJson(`${writePath}/child-name-counts-en.json`, {
  boys: boyCounts,
  girls: girlCounts,
});
