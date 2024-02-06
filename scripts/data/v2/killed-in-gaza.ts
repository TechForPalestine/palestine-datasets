import fs from "fs";
import toEnName from "arabic-name-to-en";
import { differenceInMonths } from "date-fns";
import { writeJson } from "../../utils/fs";
import { ApiResource } from "../../../types/api.types";

const jsonFileName = "killed-in-gaza.json";

const expectedFields = ["id", "name_ar_raw", "dob", "sex", "name_en"];

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

const ageReferenceDate = new Date(2024, 0, 5, 0, 0, 0);

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
      value = sexMapping[fieldValue] ?? "";
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
            return toEnName(namePart);
          }
          return namePart;
        })
        .join(" ")
        .toLowerCase(),
    };
  }

  return {
    [fieldKey]: value,
  };
};

const handleColumn = (
  headerKeys: string[],
  rowValues: string[],
  currentColValue: string,
  currentColIndex: number
) => {
  const currentKey = headerKeys[currentColIndex];

  if (currentKey === "dob") {
    // calc age using dob and static reference date for consistency
    // source spreadsheet used a formula using "today" as reference date
    // which led to drift
    const dob = rowValues[currentColIndex];
    if (!dob) {
      return { age: -1, dob };
    }
    const age = Math.round(differenceInMonths(ageReferenceDate, dob) / 12);
    return { age, dob };
  }

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
          ...handleColumn(headerKeys, rowColumns, colValue, colIndex),
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

const readCsv = () => {
  const rawCsv = fs
    .readFileSync("scripts/data/common/killed-in-gaza/output/result.csv")
    .toString();
  const rows = rawCsv.split("\n");
  return rows.map((row) => row.split(","));
};

const generateJsonFromTranslatedCsv = async () => {
  const [headerKeys, ...rows] = readCsv();
  const jsonArray = formatToJson(headerKeys, rows);
  validateJson(jsonArray);
  // sort by descending ID
  jsonArray.sort((a, b) => b.id.localeCompare(a.id));
  writeJson(ApiResource.KilledInGazaV2, jsonFileName, jsonArray);

  console.log(
    `generated JSON file with ${jsonArray.length} records: ${jsonFileName}`
  );

  const logLines: string[] = [];

  if (namesFallbackTranslated.size) {
    logLines.push(
      `\n\n⚠️ ${namesFallbackTranslated.size} were translated using the fallback library (namePart,occurrences):\n`
    );
    namesFallbackTranslated.forEach((count, namePart) => {
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
