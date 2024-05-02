import { readCsv, readCsvToDict, writeCsv } from "../../../utils/csv";
import { arToArAssertKey } from "./constants";
import {
  getArToArMap,
  getArToEnMap,
  normalizeArabic,
  replaceBySubstring,
  replaceWholeNameSegments,
} from "./translate";

const pwd = "scripts/data/common/killed-in-gaza";
const arRawNameColumnLabel = "name_ar_raw";
const arEnNameColumnLabel = "name_en";

const rawList = readCsv(`${pwd}/data/raw.csv`);
const arToAr = getArToArMap();
const arToEn = getArToEnMap();

const [rawHeaderRow, ...rawListRows] = rawList;
const arRawColumn = rawHeaderRow.indexOf(arRawNameColumnLabel);
if (arRawColumn === -1) {
  throw new Error(`Expected raw list column named "${arRawNameColumnLabel}"`);
}

const resultList = rawListRows.map((row) => {
  const arName = replaceBySubstring(row[arRawColumn], arToAr);
  const normalizedArName = normalizeArabic(arName);
  row[arRawColumn] = normalizedArName;
  // append name_en col value
  return [...row, replaceWholeNameSegments(normalizedArName, arToEn)];
});

const newHeaders = [...rawHeaderRow, arEnNameColumnLabel];
const rows = [newHeaders, ...resultList];
writeCsv(`${pwd}/output/result.csv`, rows);
