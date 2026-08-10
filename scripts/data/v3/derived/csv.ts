import { writeManifestCsv } from "../../../utils/fs";
import { ApiResource } from "../../../../types/api.types";
import { LebanonDailyReportV3 } from "../../../../types/lebanon-daily.types";

const killedPersons = require("../../../../killed-in-gaza-v3.json");
const lebanonDailies = require("../../../../lebanon_casualties_daily.json");

const writePath = "site/src/generated";

writeManifestCsv(
  ApiResource.KilledInGazaV3,
  { from: `${writePath}/killed-in-gaza-v3.csv`, to: "killed-in-gaza.csv" },
  killedPersons,
);

const lebanonRowOrder: (keyof LebanonDailyReportV3)[] = [
  "report_date",
  "report_source",
  "report_period",
  "phase",
  "killed",
  "killed_cum",
  "killed_cum_reported",
  "injured",
  "injured_cum",
  "injured_cum_reported",
];
const lebanonRows = lebanonDailies.reduce(
  (rows: string[][], record: Record<string, string>) => {
    return rows.concat([lebanonRowOrder.map((key) => record[key])]);
  },
  [lebanonRowOrder.slice()] as string[][],
);
writeManifestCsv(
  ApiResource.LebanonDailyV3,
  `${writePath}/lebanon_casualties_daily.csv`,
  lebanonRows,
);
