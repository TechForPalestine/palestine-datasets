import { ArabicClass } from "arabic-utils";
import fs from "fs";

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
  ar: (row: string) => {
    const [arKey, cleanedValue] = row.split(",");
    trackDuplicateKeysForLogging(arKey);
    const normalizedValue = new ArabicClass(cleanedValue.trim()).normalize();
    return [arKey, normalizedValue].join(",");
  },

  // for ar_en we split on potential spaces around the comma to ensure no spaces in
  // the key column lead to mismatched lookups, and we normalize the AR key per above
  en: (row: string) => {
    const [arKey, cleanedValue] = row.split(/\s*,\s*/);
    const normalizedArKey = new ArabicClass(arKey.trim()).normalize();
    trackDuplicateKeysForLogging(normalizedArKey);
    return [normalizedArKey, cleanedValue.trim().toLowerCase()].join(",");
  },
};

const sortForType = (resultType: "ar" | "en", list: string[]) => {
  if (resultType === "ar") {
    return list; // skip sorting ar_ar for now since order matters (?)
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
  const csv = fs.readFileSync(repoFilePath).toString();

  const cleanedRows = csv
    .split("\n")
    .map(rowTransformerForDictResultType[resultType])
    .filter((row) => !!row);

  const sortedRows = sortForType(resultType, cleanedRows);

  fs.writeFileSync(repoFilePath, sortedRows.join("\n"));
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
