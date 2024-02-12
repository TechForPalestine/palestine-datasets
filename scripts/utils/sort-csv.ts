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

const sortCsv = (repoFilePath: string, resultType: "ar" | "en") => {
  const csv = fs.readFileSync(repoFilePath).toString();

  const sortedRows = csv
    .split("\n")
    .sort((aRaw, bRaw) => {
      if (aRaw === headerRow) {
        return -1;
      }

      if (bRaw === headerRow) {
        return 1;
      }

      const a = new ArabicClass(aRaw).normalize();
      const b = new ArabicClass(bRaw).normalize();
      return a.localeCompare(b);
    })
    .map(rowTransformerForDictResultType[resultType])
    .filter((row) => !!row);

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
