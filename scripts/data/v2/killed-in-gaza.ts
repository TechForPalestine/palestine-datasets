import toEnName from "arabic-name-to-en";
import { writeJson } from "../../utils/fs";
import { ApiResource } from "../../../types/api.types";
import { SheetTab, fetchGoogleSheet } from "../../utils/gsheets";

const jsonFileName = "killed-in-gaza.json";

const formatAge = (colValue: string) => {
  let numericValue = -1;

  if (colValue) {
    numericValue = Number(colValue);
  }

  if (numericValue > 120) {
    numericValue = -1;
  }

  return numericValue;
};

enum ManualNameFields {
  LibraryTranslation = "library english translation",
  HumanOverride = "english translation override",
}

const expectedFields = [
  "name",
  ManualNameFields.LibraryTranslation,
  ManualNameFields.HumanOverride,
  "id",
  "dob",
  "sex",
  "age",
];

interface MappedRecord extends Record<string, string | number> {
  name: string;
  [ManualNameFields.LibraryTranslation]: string;
  [ManualNameFields.HumanOverride]: string;
  en_name: string;
  dob: string;
  sex: string;
  age: number;
}

type NamedRecord = Omit<
  MappedRecord,
  ManualNameFields.HumanOverride | ManualNameFields.LibraryTranslation
>;

const sexMapping = {
  ذكر: "m",
  انثى: "f",
};

const addRecordField = (fieldKey: string, fieldValue: string) => {
  if (expectedFields.includes(fieldKey) === false) {
    return; // omit unexpected field
  }

  let value: string | number = fieldValue;

  switch (fieldKey) {
    case "age":
      value = formatAge(fieldValue);
      break;
    case "sex":
      value = sexMapping[fieldValue] ?? "";
      break;
  }

  return {
    [fieldKey]: value,
  };
};

/**
 * turns spreadsheet row / col arrays into an array of objects for each report date
 * @param headerKeys the row with valid json object keys in the spreadsheet header
 * @param rows spreadsheet rows for each report date with column values to reduce into a report object
 * @returns array of daily report objects
 */
const formatToJson = (headerKeys: string[], rows: string[][]) => {
  return rows.map((rowColumns) => {
    const mappedRecord = rowColumns.reduce(
      (dayRecord, colValue, colIndex) => ({
        ...dayRecord,
        ...addRecordField(headerKeys[colIndex], colValue),
      }),
      {} as MappedRecord
    );

    const namedRecord: NamedRecord = mappedRecord;

    if (mappedRecord[ManualNameFields.HumanOverride]) {
      delete namedRecord[ManualNameFields.LibraryTranslation];
      namedRecord.en_name = namedRecord[ManualNameFields.HumanOverride];
      delete namedRecord[ManualNameFields.HumanOverride];
      return namedRecord;
    }

    delete namedRecord[ManualNameFields.HumanOverride];

    if (namedRecord[ManualNameFields.LibraryTranslation]) {
      delete namedRecord[ManualNameFields.LibraryTranslation];
      namedRecord.en_name = namedRecord[ManualNameFields.LibraryTranslation];
      return namedRecord;
    }

    delete namedRecord[ManualNameFields.LibraryTranslation];
    namedRecord.en_name = toEnName(namedRecord.name);
    return namedRecord;
  });
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
      throw new Error(`Unexpected "sex" value for record with id=${record.id}`);
    }

    if (typeof record.age === "number") {
      if (maxAgeValue < record.age) {
        maxAgeValue = record.age;
      } else if (minAgeValue > record.age) {
        minAgeValue = record.age;
      }
    } else {
      throw new Error(`Unexpected "age" value for record with id=${record.id}`);
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

const generateJsonFromGSheet = async () => {
  const sheetJson = await fetchGoogleSheet(SheetTab.KilledInGaza);
  // first row: english keys, second row: arabic keys, third row: first person
  const [__, headerKeys, ...rows] = sheetJson.values;
  const jsonArray = formatToJson(headerKeys, rows);
  validateJson(jsonArray);
  writeJson(ApiResource.KilledInGazaV2, jsonFileName, jsonArray);
  console.log(`generated JSON file: ${jsonFileName}`);
};

generateJsonFromGSheet();
