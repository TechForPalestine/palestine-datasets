import { writeManifestCsv } from "../../../utils/fs";
import { ApiResource } from "../../../../types/api.types";
import { KilledInGaza } from "../../../../types/killed-in-gaza.types";

const killedPersons = require("../../../../killed-in-gaza.json");
const dailies = require("../../../../casualties_daily.json");
const wbDailies = require("../../../../west_bank_daily.json");
const pressKilled = require("../../../../press_killed_in_gaza.json");

const writePath = "site/src/generated";

const killedRowOrder: (keyof KilledInGaza)[] = [
  "id",
  "name",
  "en_name",
  "age",
  "dob",
  "sex",
  "source",
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

const wbDailyRowOrder = Object.keys(wbDailies[0]).reduce(
  (headerCols, header) => {
    if (header === "verified") {
      return headerCols.concat(
        Object.keys(wbDailies[0].verified).map((key) => `verified.${key}`)
      );
    }
    return headerCols.concat(header);
  },
  [] as string[]
);
const wbDailyRows = wbDailies.reduce(
  (
    rows: string[][],
    record: Record<string, string> & { verified: Record<string, string> }
  ) => {
    return rows.concat([
      wbDailyRowOrder.map((key) => {
        if (key.startsWith("verified.")) {
          if (!record.verified) {
            return "";
          }
          return record.verified[key.replace("verified.", "")];
        }
        return record[key];
      }),
    ]);
  },
  [wbDailyRowOrder.slice()] as string[][]
);
writeManifestCsv(
  ApiResource.WestBankDailyV2,
  `${writePath}/west_bank_daily.csv`,
  wbDailyRows
);

const csvCols = ["name", "name_en", "notes"];
const notesColIdx = csvCols.indexOf("notes");
writeManifestCsv(
  ApiResource.PressKilledInGazaV2,
  `${writePath}/press_killed_in_gaza.csv`,
  [
    csvCols,
    ...pressKilled.map((record: Record<string, string>) =>
      csvCols.map((col, i) =>
        i === notesColIdx ? `"${record[col]}"` : record[col]
      )
    ),
  ]
);
