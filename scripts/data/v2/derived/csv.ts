import { writeManifestCsv } from "../../../utils/fs";
import { ApiResource } from "../../../../types/api.types";
import { KilledInGaza } from "../../../../types/killed-in-gaza.types";

const killedPersons = require("../../../../killed-in-gaza.json");
const dailies = require("../../../../casualties_daily.json");

const writePath = "site/src/generated";

const killedRowOrder: (keyof KilledInGaza)[] = [
  "id",
  "name",
  "en_name",
  "age",
  "sex",
];
const killedRows = killedPersons.reduce(
  (rows: string[][], record: Record<string, string>) => {
    return rows.concat([killedRowOrder.map((key) => record[key])]);
  },
  [killedRowOrder.slice()] as string[][]
);
writeManifestCsv(
  ApiResource.KilledInGazaV2,
  `${writePath}/killed-in-gaza.csv`,
  killedRows
);

const dailyRowOrder = Object.keys(dailies[0]);
const dailyRows = dailies.reduce(
  (rows: string[][], record: Record<string, string>) => {
    return rows.concat([dailyRowOrder.map((key) => record[key])]);
  },
  [dailyRowOrder.slice()] as string[][]
);
writeManifestCsv(
  ApiResource.CasualtiesDailyV2,
  `${writePath}/casualties_daily.csv`,
  dailyRows
);
