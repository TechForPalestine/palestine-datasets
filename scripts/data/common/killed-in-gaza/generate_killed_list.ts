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
const arToArSpaceKeys = Object.keys(arToAr).filter((key) => key.includes(" "));
const arSpacedSegmentMatchers = arToArSpaceKeys.map(
  // bookend with spaces or string terminators to ensure we match whole segments
  (key): [RegExp, string] => [new RegExp(`(^|\\s)${key}($|\\s)`, "g"), key]
);
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
const replaceNameSegments = (name: string, dict: Record<string, string>) => {
  return name
    .split(/\s+/)
    .map((segment) => dict[segment] ?? segment)
    .join(" ");
};

/**
 * if the name includes some segments that match keys in our ar->ar
 * mapping that include spaces, we replace those two segments with one
 * and we do so in a way that avoids doing substring replacements in
 * whole segments
 *
 * @param name full arabic name
 * @returns full name string with replacements
 */
const consolidateSpacedSegments = (name: string) => {
  return arSpacedSegmentMatchers.reduce((prior, [matcher, key]) => {
    const matches = name.match(matcher);
    if (matches) {
      const startPad = matches[0].startsWith(" ") ? " " : "";
      const endPad = matches[0].endsWith(" ") ? " " : "";
      const replaced = prior.replace(
        matches[0],
        `${startPad}${arToAr[key]}${endPad}`
      );
      return replaced;
    }
    return prior;
  }, name);
};

const resultList = rawListRows.map((row) => {
  const arName = consolidateSpacedSegments(
    replaceNameSegments(row[arRawColumn], arToAr)
  );

  const normalizedArName = new ArabicClass(arName).normalize();
  row[arRawColumn] = normalizedArName;
  // append name_en col value
  return [...row, replaceNameSegments(normalizedArName, arToEn)];
});

const toCsv = (list: string[][]) => list.map((row) => row.join(",")).join("\n");

const newHeaders = [...rawHeaderRow, arEnNameColumnLabel].join(",");
fs.writeFileSync(
  `${pwd}/output/result.csv`,
  `${newHeaders}\n${toCsv(resultList)}`
);
