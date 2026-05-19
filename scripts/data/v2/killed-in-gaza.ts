import fs from "fs";
import toEnName from "arabic-name-to-en";
import { writeJson } from "../../utils/fs";
import { ApiResource } from "../../../types/api.types";
import { readCsv } from "../../utils/csv";
import { knownDuplicates } from "../common/killed-in-gaza/duplicates";

const jsonFileName = "killed-in-gaza.json";

const expectedFields = [
  "id",
  "name_ar_raw",
  "dob",
  "age",
  "sex",
  "name_en",
  "source",
];

interface MappedRecord extends Record<string, string | number> {
  id: string;
  name: string;
  en_name: string;
  dob: string;
  sex: string;
  age: number;
}

const sexMapping = {
  M: "m",
  F: "f",
};

const namesFallbackTranslated = new Map<string, number>();
const idsEncountered = new Set<string>();
const duplicateIds = new Set<string>();

const addSingleRecordField = (fieldKey: string, fieldValue: string) => {
  if (expectedFields.includes(fieldKey) === false) {
    return; // omit unexpected field
  }

  let value: string | number = fieldValue;

  switch (fieldKey) {
    case "id":
      if (idsEncountered.has(fieldValue)) {
        duplicateIds.add(fieldValue);
      }
      idsEncountered.add(fieldValue);
      break;
    case "sex":
      value = sexMapping[fieldValue as keyof typeof sexMapping] ?? fieldValue;
      break;
    case "age":
      const rawValue = fieldValue.replace(/["]/g, "").trim();
      value = rawValue ? parseInt(rawValue, 10) : -1;
      break;
  }

  if (fieldKey === "name_ar_raw") {
    return {
      name: fieldValue,
    };
  }

  if (fieldKey === "name_en") {
    return {
      // split & rejoin to remove duplicate spaces
      en_name: fieldValue
        .split(/\s+/)
        .map((namePart) => {
          if (/[\u{0600}-\u{06FF}]+/u.test(namePart)) {
            const existingCount = namesFallbackTranslated.get(namePart) ?? 0;
            namesFallbackTranslated.set(namePart, existingCount + 1);
            return toEnName(namePart).trim();
          }
          return namePart.trim();
        })
        .join(" "),
    };
  }

  return {
    [fieldKey]: value,
  };
};

const handleColumn = (
  headerKeys: string[],
  currentColValue: string,
  currentColIndex: number
) => {
  const currentKey = headerKeys[currentColIndex];
  return addSingleRecordField(currentKey, currentColValue);
};

/**
 * turns spreadsheet row / col arrays into an array of objects for each report date
 * @param headerKeys the row with valid json object keys in the spreadsheet header
 * @param rows spreadsheet rows for each report date with column values to reduce into a report object
 * @returns array of daily report objects
 */
const formatToJson = (headerKeys: string[], rows: string[][]) => {
  return rows
    .map((rowColumns) => {
      return rowColumns.reduce(
        (dayRecord, colValue, colIndex) => ({
          ...dayRecord,
          ...handleColumn(headerKeys, colValue, colIndex),
        }),
        {} as MappedRecord
      );
    })
    .filter((row) => !!row.id);
};

/**
 * our docs claim the IDs will be unique so we should verify that claim
 */
const validateJson = (json: Array<Record<string, number | string>>) => {
  const uniqueIds = new Set<string>();
  const duplicateIds = new Set<string>();
  const uniqueSexValues = new Set<string>();
  let minAgeValue = -1;
  let maxAgeValue = 105;

  json.forEach((record, index) => {
    if (!record.id) {
      console.log("skipped record with no id:", record);
      return;
    }

    if (typeof record.id !== "string") {
      throw new Error(
        `Encountered record with non-string ID at index=${index}`
      );
    }

    if (uniqueIds.has(record.id)) {
      duplicateIds.add(record.id);
    }

    uniqueIds.add(record.id);

    if (typeof record.sex === "string") {
      uniqueSexValues.add(record.sex);
    } else {
      throw new Error(
        `Unexpected "sex" value for record with id=${record.id} (${record.sex})`
      );
    }
  });

  if (duplicateIds.size) {
    throw new Error(
      `Encountered the following duplicate IDs: ${Array.from(duplicateIds).join(
        ", "
      )}`
    );
  }

  if (!uniqueSexValues.has("m") || !uniqueSexValues.has("f")) {
    throw new Error(
      `Unexpected "sex" value(s) found: ${Array.from(uniqueSexValues).join(
        ", "
      )}`
    );
  }

  if (minAgeValue < -1) {
    throw new Error(`Unexpected low-end age value found: ${minAgeValue}`);
  }

  if (maxAgeValue > 105) {
    throw new Error(`Unexpected high-end age value found: ${maxAgeValue}`);
  }
};

/**
 * Build a set of all IDs that are known duplicates (values in knownDuplicates map)
 * so we can skip them during consolidation and unknown duplicate detection.
 */
const allKnownDuplicateIds = new Set<string>();
for (const dupIds of Object.values(knownDuplicates)) {
  for (const dupId of dupIds) {
    allKnownDuplicateIds.add(dupId);
  }
}

/**
 * Detect records that share the same name+dob+sex but have different IDs.
 * These are potential duplicates that should be resolved in the duplicates config.
 * Known duplicates (from the config) are excluded from this check.
 */
const detectUnknownDuplicates = (
  json: MappedRecord[]
): Map<string, MappedRecord[]> => {
  const keyMap = new Map<string, MappedRecord[]>();

  for (const record of json) {
    // Skip records that are known duplicates (to be consolidated)
    if (allKnownDuplicateIds.has(record.id)) {
      continue;
    }
    const key = `${record.name}|${record.dob}|${record.sex}`;
    if (!keyMap.has(key)) {
      keyMap.set(key, []);
    }
    keyMap.get(key)!.push(record);
  }

  const unknownDupes = new Map<string, MappedRecord[]>();
  for (const [key, records] of keyMap) {
    if (records.length > 1) {
      unknownDupes.set(key, records);
    }
  }
  return unknownDupes;
};

/**
 * Consolidate known duplicates: remove duplicate records and add duplicate_ids
 * to the canonical record.
 */
const consolidateKnownDuplicates = (json: MappedRecord[]): MappedRecord[] => {
  const result: MappedRecord[] = [];

  for (const record of json) {
    // Skip records that are known duplicate IDs (non-canonical)
    if (allKnownDuplicateIds.has(record.id)) {
      continue;
    }

    // If this is a canonical record with known duplicates, add the field
    if (knownDuplicates[record.id]) {
      (record as Record<string, unknown>).duplicate_ids =
        knownDuplicates[record.id];
    }

    result.push(record);
  }

  return result;
};

const generateJsonFromTranslatedCsv = async () => {
  const [headerKeys, ...rows] = readCsv(
    "scripts/data/common/killed-in-gaza/output/result.csv"
  );
  const jsonArray = formatToJson(headerKeys, rows);
  validateJson(jsonArray);

  // Detect unknown duplicates (same name+dob+sex, different IDs) and error
  const unknownDupes = detectUnknownDuplicates(jsonArray);
  if (unknownDupes.size > 0) {
    const dupeDetails = Array.from(unknownDupes.entries())
      .map(([key, records]) => {
        const ids = records.map((r) => r.id).join(", ");
        return `  ${records[0].en_name} (${key}): [${ids}]`;
      })
      .join("\n");
    throw new Error(
      `Found ${unknownDupes.size} unknown duplicate group(s) with same name+dob+sex but different IDs.\n` +
        `Add them to scripts/data/common/killed-in-gaza/duplicates.ts and remove duplicates from raw.csv.\n` +
        `Duplicate groups:\n${dupeDetails}`
    );
  }

  // Consolidate known duplicates
  const consolidated = consolidateKnownDuplicates(jsonArray);
  const removedCount = jsonArray.length - consolidated.length;
  if (removedCount > 0) {
    console.log(
      `Consolidated ${removedCount} known duplicate record(s) from ${jsonArray.length} total`
    );
  }

  // sort by descending ID
  consolidated.sort((a, b) => b.id.localeCompare(a.id));
  writeJson(ApiResource.KilledInGazaV2, jsonFileName, consolidated);

  console.log(
    `generated JSON file with ${consolidated.length} records: ${jsonFileName}`
  );

  const logLines: string[] = [];

  if (namesFallbackTranslated.size) {
    logLines.push(
      `\n\n⚠️ ${namesFallbackTranslated.size} were translated using the fallback library (namePart,occurrences):\n`
    );
    Array.from(namesFallbackTranslated)
      .sort((a, b) => b[1] - a[1])
      .forEach(([namePart, count]) => {
        logLines.push(`${namePart},${count}`);
      });
  }

  if (duplicateIds.size) {
    logLines.push(
      `\n\n⚠️ ${duplicateIds.size} record ID conflicts were encountered:\n`
    );
    duplicateIds.forEach((id) => {
      logLines.push(id);
    });
  }

  if (process.env.CI) {
    fs.writeFileSync("ci-tmp/killed-in-gaza-log.txt", logLines.join("\n"));
  } else {
    console.warn(logLines.join("\n"));
  }
};

generateJsonFromTranslatedCsv();
