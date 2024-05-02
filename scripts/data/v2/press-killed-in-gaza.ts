import { ApiResource } from "../../../types/api.types";
import { writeJson } from "../../utils/fs";
import { writeManifestCsv } from "../../utils/fs";
import { SheetTab, fetchGoogleSheet } from "../../utils/gsheets";
import {
  getArToArMap,
  getArToEnMap,
  normalizeArabic,
  replaceBySubstring,
  replaceWholeNameSegments,
} from "../common/killed-in-gaza/translate";

const jsonFileName = "press_killed_in_gaza.json";

const columnFilter = ["name", "notes"];

const arToAr = getArToArMap();
const arToEn = getArToEnMap();

const withTranslatedName = (record: {
  name: string;
  name_en: string;
  notes: string;
}) => {
  const arName = replaceBySubstring(record.name, arToAr);
  const normalizedArName = normalizeArabic(arName);
  record.name = normalizedArName;
  record.name_en = replaceWholeNameSegments(normalizedArName, arToEn);
  return record;
};

const untranslatedParts = new Set<string>();
const validateTranslations = (press: { name_en: string }[]) => {
  press.forEach((journo) => {
    journo.name_en.split(/\s+/).forEach((namePart) => {
      if (/[\u{0600}-\u{06FF}]+/u.test(namePart)) {
        untranslatedParts.add(namePart.trim());
      }
    });
  });
};

const generateFromGSheet = async () => {
  const sheetJson = await fetchGoogleSheet(SheetTab.Journalists);
  const [headerKeys, ...rows] = sheetJson.values;
  const headerIdxLookup = columnFilter.reduce(
    (acc, key) => ({
      ...acc,
      [key]: headerKeys.indexOf(key),
    }),
    {} as Record<string, number>
  );

  const jsonArray = rows.map((row) =>
    withTranslatedName({
      name: row[headerIdxLookup["name"]],
      name_en: "",
      notes: row[headerIdxLookup["notes"]],
    })
  );

  validateTranslations(jsonArray);
  writeJson(ApiResource.PressKilledInGazaV2, jsonFileName, jsonArray);
  console.log(`generated JSON file: ${jsonFileName}`);
  if (untranslatedParts.size) {
    console.log("untranslated parts:", [...untranslatedParts].join(", "));
  }

  const csvCols = ["name", "name_en", "notes"];
  const writePath = "site/src/generated";
  writeManifestCsv(
    ApiResource.PressKilledInGazaV2,
    `${writePath}/press_killed_in_gaza.csv`,
    [
      csvCols,
      ...jsonArray.map((record) =>
        csvCols.map((col) => record[col as keyof typeof record])
      ),
    ]
  );
};

generateFromGSheet();
