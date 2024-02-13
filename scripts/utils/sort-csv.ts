import { ArabicClass } from "arabic-utils";
import { readCsvToDict, writeCsvRows } from "./csv";
import { arToArAssertKey } from "../data/common/killed-in-gaza/constants";

const headerRow = "original,cleaned";

const uniqueArParts = new Set<string>();
const duplicates = new Set<string>();

const trackDuplicateKeysForLogging = (key: string) => {
  if (uniqueArParts.has(key)) {
    duplicates.add(key);
  } else {
    uniqueArParts.add(key);
  }
};

const rowTransformerForDictResultType = {
  // for ar_ar dict, we maintain spaces in key to allow for segment consolidation
  // we normalize the value since that will be used to lookup against normalized
  // ar values in the en_en dict
  ar: ([arKey, cleanedValue]: [string, string]) => {
    trackDuplicateKeysForLogging(arKey);
    const normalizedValue = new ArabicClass(cleanedValue).normalize();
    const arRow = [arKey, normalizedValue].join(",");
    if (arKey === arToArAssertKey && arRow.endsWith(arToArAssertKey)) {
      throw new Error(
        `sort-csv expected arKey '${arKey}' in RTL but resulting row was inverted: ${arRow}`
      );
    }
    return arRow;
  },

  // for EN we trim leading and ending spaces from each column value and normalize
  // the arabic key column value so that it can match the value column in the ar dict
  en: ([arKey, cleanedValue]: [string, string]) => {
    const normalizedArKey = new ArabicClass(arKey.trim()).normalize();
    trackDuplicateKeysForLogging(normalizedArKey);
    return [normalizedArKey, cleanedValue.trim().toLowerCase()].join(",");
  },
};

const sortForType = (resultType: "ar" | "en", list: string[]) => {
  if (resultType === "ar") {
    return list.sort((a, b) => {
      if (a === headerRow) {
        return -1;
      }

      if (b === headerRow) {
        return 1;
      }

      return b.length - a.length;
    });
  }

  return list.sort((a, b) => {
    if (a === headerRow) {
      return -1;
    }

    if (b === headerRow) {
      return 1;
    }

    return a.localeCompare(b);
  });
};

const sortCsv = (repoFilePath: string, resultType: "ar" | "en") => {
  const csvDict = readCsvToDict(
    repoFilePath,
    resultType === "ar" ? { assertKey: arToArAssertKey } : {}
  );

  const cleanedRows = Object.entries(csvDict)
    .map(rowTransformerForDictResultType[resultType])
    .filter((row) => !!row);

  const sortedRows = sortForType(resultType, cleanedRows);

  writeCsvRows(repoFilePath, sortedRows);
};

const filePath = process.argv.slice().pop();
if (
  typeof filePath !== "string" ||
  filePath.endsWith("sort-csv.ts") ||
  filePath.includes("ar_") === false
) {
  console.log("requires a repo file path argument for ar_* dict csv");
  process.exit(1);
}

const dictResultType = filePath.includes("ar_ar.csv") ? "ar" : "en";

sortCsv(filePath, dictResultType);

console.log(
  `${filePath} sorted alphabetically by arabic name column (${uniqueArParts.size} names)`
);
if (duplicates.size) {
  console.log(
    `${duplicates.size} duplicate arabic names found:\n${Array.from(
      duplicates
    ).join("\n")}`
  );
}
