import { writeManifestCsv } from "../../../utils/fs";
import { ApiResource } from "../../../../types/api.types";
import { KilledInGazaV3 } from "../../../../types/killed-in-gaza.types";
import { invertedKig3ColMapping } from "../constants";

const killedPersons = require("../../../../killed-in-gaza-v3.json");

const writePath = "site/src/generated";

const killedRowOrder: (keyof KilledInGazaV3)[] = [
  "i",
  "ar",
  "en",
  "a",
  "b",
  "g",
  "u",
];

const headers = killedRowOrder
  .slice()
  .map((shortCol) => invertedKig3ColMapping[shortCol] || shortCol);

const killedRows = killedPersons.reduce(
  (rows: string[][], record: Record<string, string>) => {
    return rows.concat([killedRowOrder.map((key) => record[key])]);
  },
  [headers] as string[][]
);
writeManifestCsv(
  ApiResource.KilledInGazaV3,
  `${writePath}/killed-in-gaza-v3.csv`,
  killedRows
);
