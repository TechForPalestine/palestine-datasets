import fs from "fs";
import Bidi from "bidi-js";
import { ArabicClass } from "arabic-utils";

const bidi = Bidi();
const pwd = "scripts/data/common/killed-in-gaza";
const arRawNameColumnLabel = "name_ar_raw";
const arEnNameColumnLabel = "name_en";

const readCsv = (repoPath: string, rtl: boolean) => {
  const csvString = fs.readFileSync(repoPath).toString();
  return csvString.split(/\r?\n/g).map((row) => {
    if (rtl) {
      const { paragraphs } = bidi.getEmbeddingLevels(row);
      console.log(
        ">>",
        row,
        paragraphs.length === 1 && paragraphs[0].level === 1
      );
    }
    const ltrRow = row.replace(/\u200f/u, "");
    return ltrRow.split(",");
  });
};

/**
 * read a CSV file and return an object lookup ("dict") with keys
 * as the first CSV column value, and values as the second CSV column
 */
const readCsvToDict = (repoPath: string, rtl = false) => {
  return readCsv(repoPath, rtl).reduce(
    (dict, row) => ({
      ...dict,
      [row[0]]: row[1],
    }),
    {} as Record<string, string>
  );
};

const rawList = readCsv(`${pwd}/data/raw.csv`, false);
const arToAr = readCsvToDict(`${pwd}/data/dict_ar_ar.csv`, true);
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

const toCsv = (list: string[][]) =>
  list.map((row) => row.join(",")).join("\r\n");

const newHeaders = [...rawHeaderRow, arEnNameColumnLabel].join(",");
fs.writeFileSync(
  `${pwd}/output/result.csv`,
  `${newHeaders}\n${toCsv(resultList)}`
);
