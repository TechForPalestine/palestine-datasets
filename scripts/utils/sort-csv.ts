import { ArabicClass } from "arabic-utils";
import fs from "fs";

const headerRow = "original,cleaned";

const sortCsv = (repoFilePath: string) => {
  const csv = fs.readFileSync(repoFilePath).toString();

  const uniqueArParts = new Set<string>();
  const duplicates = new Set<string>();

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
    .map((row) => {
      const [arKey, cleanedValue] = row.split(/\s*,\s*/);
      const normalizedArKey = new ArabicClass(arKey.trim()).normalize();

      if (uniqueArParts.has(normalizedArKey)) {
        duplicates.add(normalizedArKey);
      } else {
        uniqueArParts.add(normalizedArKey);
      }

      return [normalizedArKey, cleanedValue.trim()].join(",");
    })
    .filter((row) => !!row);

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

sortCsv(filePath);
