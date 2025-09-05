import { writeManifestCsv } from "../../../utils/fs";
import { ApiResource } from "../../../../types/api.types";

const killedPersons = require("../../../../killed-in-gaza-v3.json");

const writePath = "site/src/generated";

writeManifestCsv(
  ApiResource.KilledInGazaV3,
  { from: `${writePath}/killed-in-gaza-v3.csv`, to: "killed-in-gaza.csv" },
  killedPersons
);
