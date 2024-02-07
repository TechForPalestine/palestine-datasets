import { execSync } from "child_process";
import { ApiResource } from "../../../../types/api.types";
import { KilledInGaza } from "../../../../types/killed-in-gaza.types";
import { writeJson } from "../../../utils/fs";

const killedPersons: KilledInGaza[] = require("../../../../killed-in-gaza.json");

/**
 * TODO:
 * - investigate indexing based on name parts to shrink further
 *    (how would that work with a search lib?)
 * - only produce minified output
 * - figure out how to "cache" output so that it doesn't run on each deploy job
 */

const indices = killedPersons.reduce(
  (acc, record) => {
    const existingAr = acc.arabic[record.name];
    const existingEn = acc.english[record.en_name];
    return {
      ...acc,
      english: {
        ...acc.english,
        [record.en_name]: existingEn ? `${existingEn},${record.id}` : record.id,
      },
      arabic: {
        ...acc.arabic,
        [record.name]: existingAr ? `${existingAr},${record.id}` : record.id,
      },
    };
  },
  {
    english: {} as Record<string, string>,
    arabic: {} as Record<string, string>,
  }
);

const writePath = "site/src/generated/killed-in-gaza";
execSync(`mkdir -p ${writePath}`);

writeJson(
  ApiResource.KilledInGazaIndexArV2,
  `${writePath}/name-index-ar.json`,
  indices.arabic
);

writeJson(
  ApiResource.KilledInGazaIndexEnV2,
  `${writePath}/name-index-en.json`,
  indices.english
);
