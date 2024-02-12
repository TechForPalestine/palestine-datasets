import fs from "fs";

export const readCsv = (repoPath: string) => {
  const csvString = fs.readFileSync(repoPath).toString();
  return csvString.split(/\r?\n/g).map((row) => row.split(","));
};

/**
 * read a CSV file and return an object lookup ("dict") with keys
 * as the first CSV column value, and values as the second CSV column
 *
 * @param repoPath relative path from root of repo
 * @param options optional object with assertion key to make sure key exists in resulting object
 *  if assertKey does not exist, the dict is inverted and if the assertKey still does not exist
 *  the method @throws
 */
export const readCsvToDict = (
  repoPath: string,
  options: { assertKey?: string; invert?: boolean } = {}
): Record<string, string> => {
  const result = readCsv(repoPath).reduce(
    (dict, row) => ({
      ...dict,
      [row[options.invert ? 1 : 0]]: row[options.invert ? 0 : 1],
    }),
    {} as Record<string, string>
  );

  if (options.assertKey && !options.invert && !result[options.assertKey]) {
    console.log(
      `could not find assertKey ${options.assertKey} in resulting dict, inverting`
    );
    return readCsvToDict(repoPath, { ...options, invert: true });
  }

  if (options.assertKey && options.invert && !result[options.assertKey]) {
    throw new Error(
      `Expected dict to include key '${options.assertKey}' but it did not exist in the initial or inverted dict`
    );
  }

  return result;
};

const toCsv = (rows: string[][]) =>
  rows.map((columns) => columns.join(",")).join("\r\n");

export const writeCsv = (repoPath: string, rows: string[][]) => {
  fs.writeFileSync(repoPath, toCsv(rows));
};
