import fs from "fs";
import { ArabicClass } from "arabic-utils";

const pwd = "scripts/data/common/killed-in-gaza";
const arRawNameColumnLabel = "name_ar_raw";
const arEnNameColumnLabel = "name_en";

const readCsv = (repoPath: string) => {
  const csvString = fs.readFileSync(repoPath).toString();
  return csvString.split(/\r?\n/g).map((row) => row.split(","));
};

/**
 * read a CSV file and return an object lookup ("dict") with keys
 * as the first CSV column value, and values as the second CSV column
 */
const readCsvToDict = (repoPath: string) => {
  return readCsv(repoPath).reduce(
    (dict, row) => ({
      ...dict,
      [row[0]]: row[1],
    }),
    {} as Record<string, string>
  );
};

const rawList = readCsv(`${pwd}/data/raw.csv`);
const arToAr = readCsvToDict(`${pwd}/data/dict_ar_ar.csv`);
console.log(arToAr);
const arToEn = readCsvToDict(`${pwd}/data/dict_ar_en.csv`);

const [rawHeaderRow, ...rawListRows] = rawList;
const arRawColumn = rawHeaderRow.indexOf(arRawNameColumnLabel);
if (arRawColumn === -1) {
  throw new Error(`Expected raw list column named "${arRawNameColumnLabel}"`);
}

/**
 * splits the full name into segments and replaces each segment with
 * matching values from dict, otherwise keeps the unmatched segment
 * @param name full name
 * @param dict lookup used to swap each name segment
 * @returns full name string with replaced segments
 */
const replaceWholeNameSegments = (
  name: string,
  dict: Record<string, string>
) => {
  return name
    .split(/\s+/)
    .map((segment) => dict[segment] ?? segment)
    .join(" ");
};

const replaceBySubstring = (name: string, dict: Record<string, string>) => {
  return Object.keys(dict).reduce((prior, key) => {
    return name.replace(key, dict[key]);
  }, name);
};

const resultList = rawListRows.map((row) => {
  const arName = replaceBySubstring(row[arRawColumn], arToAr);
  const normalizedArName = new ArabicClass(arName).normalize();
  row[arRawColumn] = normalizedArName;
  // append name_en col value
  return [...row, replaceWholeNameSegments(normalizedArName, arToEn)];
});

const toCsv = (list: string[][]) => list.map((row) => row.join(",")).join("\n");

const newHeaders = [...rawHeaderRow, arEnNameColumnLabel].join(",");
fs.writeFileSync(
  `${pwd}/output/result.csv`,
  `${newHeaders}\n${toCsv(resultList)}`
);
