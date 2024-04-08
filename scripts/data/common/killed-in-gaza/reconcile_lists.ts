import fs from "fs";
import path from "path";
import { distance } from "fastest-levenshtein";
import { differenceInMonths } from "date-fns";

type ExistingRecord = {
  id: string;
  name_ar_raw: string;
  dob: string;
  sex: "M" | "F";
};

type NewRecord = {
  index: string;
  name_ar_raw: string;
  id: string;
  dob: string;
  sex: "M" | "F";
  age: string;
  source: string;
};

const dequote = (value: string) => {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  return value;
};

const readCsv = <T>(file: string) => {
  const csvRaw = fs.readFileSync(file, "utf8");
  const rows = csvRaw.split("\n");
  const headers = rows[0].replace(/\r$/, "").split(",");
  return rows.slice(1).map((row) => {
    const values = row.replace(/\r$/, "").split(",");
    return headers.reduce(
      (acc, header, index) => ({
        ...acc,
        [header]: dequote(values[index]),
      }),
      {} as T
    );
  });
};

const readCsvToMap = <T, V extends T>(
  file: string,
  mapKey: keyof T,
  transform: (rec: T) => V
) => {
  const csvRecords = readCsv<T>(file);
  const records = new Map<string, V>();
  if (typeof csvRecords[0][mapKey] !== "string") {
    throw new Error(`Invalid map key: ${mapKey.toString()}`);
  }
  csvRecords.forEach((record) => {
    records.set(record[mapKey] as string, transform(record));
  });
  return records;
};

const stripQuotes = (value: string) => value.replace(/"/g, "");

const isDupe = (
  recordA: NewRecord | (ExistingRecord & { age?: string }),
  recordB: NewRecord
) => {
  let ageClose = false;
  let nameClose = false;

  if (
    recordA.sex &&
    recordB.sex &&
    stripQuotes(recordA.sex) !== stripQuotes(recordB.sex)
  ) {
    return false;
  }

  if (recordA.age && recordB.age) {
    ageClose =
      Math.abs(+stripQuotes(recordA.age) - +stripQuotes(recordB.age)) < 2;
  }

  const aName = stripQuotes(recordA.name_ar_raw);
  const bName = stripQuotes(recordB.name_ar_raw);
  const distanceAllowance = Math.max(aName.length, bName.length) * 0.15;
  if (distance(aName, bName) < distanceAllowance) {
    nameClose = true;
  }

  return ageClose && nameClose;
};

const existingRecordAgeRefDate = new Date(2024, 0, 5, 0, 0, 0);
const addExistingAge = (record: ExistingRecord) => {
  const dobDate = record.dob ? new Date(record.dob) : null;
  if (dobDate && Number.isNaN(dobDate.getTime())) {
    throw new Error(
      `Invalid date found in addExistingAge transform: ${record.dob}`
    );
  }
  return {
    ...record,
    age: record.dob
      ? Math.round(
          differenceInMonths(existingRecordAgeRefDate, record.dob) / 12
        ).toString()
      : undefined,
  };
};

type DemoDistribution = {
  men: number;
  women: number;
  boys: number;
  girls: number;
  male: number;
  female: number;
  adult: number;
  child: number;
  noDemo: number;
};

const getRecordDemo = (record: NewRecord): keyof DemoDistribution => {
  const age = record.age ? +record.age : -1;
  if (age === -1 || Number.isNaN(age)) {
    if (record.sex === "M") {
      return "male";
    }
    if (record.sex === "F") {
      return "female";
    }
    return "noDemo";
  }

  if (age >= 18) {
    if (record.sex === "M") {
      return "men";
    }
    if (record.sex === "F") {
      return "women";
    }
    return "adult";
  } else {
    if (record.sex === "M") {
      return "boys";
    }
    if (record.sex === "F") {
      return "girls";
    }
    return "child";
  }
};

async function reconcileCSVs(
  existingCSVPath: string,
  newCSVPath: string
): Promise<void> {
  const existingRecords = readCsvToMap<
    ExistingRecord,
    ExistingRecord & { age?: string }
  >(existingCSVPath, "id", addExistingAge);
  const newRecords = readCsv<NewRecord>(newCSVPath);
  const newDuplicates = new Map<string, NewRecord[]>();
  const newConflicts = new Map<string, NewRecord[]>();
  const existingDuplicates = new Map<string, ExistingRecord[]>();
  const existingConflicts = new Set<string>();
  const newRecordLookup = new Map<string, NewRecord>();

  newRecords.forEach((record, index) => {
    if (record.sex && record.sex !== "M" && record.sex !== "F") {
      throw new Error(
        `Record index=${record.index} id=${record.id} has invalid gender`
      );
    }

    // check for dupes in new records
    const newDupes = newDuplicates.get(record.id) || [];
    const priorNewRecord = newRecordLookup.get(record.id);
    if (priorNewRecord && isDupe(priorNewRecord, record)) {
      newDuplicates.set(record.id, [...newDupes, priorNewRecord, record]);
    } else if (newDupes.some((dupe) => isDupe(dupe, record))) {
      newDuplicates.set(record.id, [...newDupes, record]);
    } else if (priorNewRecord) {
      const conflicts = newConflicts.get(record.id) || [];
      newConflicts.set(record.id, [...conflicts, record]);
    }

    newRecordLookup.set(record.id, record);

    // check for dupe in new records vs existing records
    const existingRecord = existingRecords.get(record.id);
    if (existingRecord && isDupe(existingRecord, record)) {
      const existingDupes = existingDuplicates.get(record.id) || [];
      existingDuplicates.set(record.id, [...existingDupes, existingRecord]);
    } else if (existingRecord) {
      existingConflicts.add(existingRecord.id);
    }

    // if (
    //   record.sex.length > 5 ||
    //   (record.dob && !/^[0-9/-]+$/.test(record.dob)) ||
    //   (!!record.id &&
    //     !record.id.startsWith("v0329") &&
    //     !/^[0-9-]+$/.test(record.id)) ||
    //   (record.dob && record.dob.length !== 10) ||
    //   record.age.replace(/[^0-9]+/g, "").length > 3 ||
    //   index + 1 !== +record.index ||
    //   (!record.id.startsWith("v0329") &&
    //     record.id.replace(/[0-9-"]+/g, "").length > 0)
    // ) {
    //   badRecords.push(record);
    //   badRecordIndex.add(record.index);
    // }
  });

  const recordsToRemove = new Set<string>();
  const recordsToAdd = new Set<string>();
  const addedDemographics: DemoDistribution = {
    men: 0,
    women: 0,
    boys: 0,
    girls: 0,
    male: 0,
    female: 0,
    adult: 0,
    child: 0,
    noDemo: 0,
  };
  let overlapDuplicateCount = 0;
  let overlapConflictCount = 0;
  const overlapCountDist: Record<number, number> = {};

  for (const key of existingRecords.keys()) {
    if (!newRecordLookup.has(key)) {
      recordsToRemove.add(key);
    }

    const duplicates = existingDuplicates.get(key);
    if (duplicates?.length) {
      overlapDuplicateCount++;
      overlapCountDist[duplicates.length] =
        (overlapCountDist[duplicates.length] ?? 0) + 1;
    }

    const conflict = existingConflicts.has(key);
    if (conflict) {
      overlapConflictCount++;
    }
  }

  let addedDuplicates = 0;
  let addedConflicts = 0;
  for (const key of newRecordLookup.keys()) {
    if (!existingRecords.has(key)) {
      recordsToAdd.add(key);
      const demo = getRecordDemo(newRecordLookup.get(key) as NewRecord);
      addedDemographics[demo]++;
      if (newDuplicates.get(key)?.length) {
        addedDuplicates++;
      }
      if (newConflicts.get(key)) {
        addedConflicts++;
      }
    }
  }

  const overlap = existingDuplicates.size + existingConflicts.size;
  const estMergedListSize =
    existingRecords.size -
    recordsToRemove.size +
    recordsToAdd.size -
    addedDuplicates -
    addedConflicts;

  console.log("summary", {
    estMergedListSize,
    estMergedListSizeChg:
      (estMergedListSize - existingRecords.size) / existingRecords.size,
    estMergedListSizeOfLatestKilled: estMergedListSize / 33_175,
    priorListSizeOfLatestKilled: existingRecords.size / 33_175,
    added: recordsToAdd.size,
    addedPct: recordsToAdd.size / newRecordLookup.size,
    addedDemographics: (
      Object.keys(addedDemographics) as Array<keyof DemoDistribution>
    ).reduce(
      (acc, key) => ({
        ...acc,
        [`${key}Pct`]: addedDemographics[key] / recordsToAdd.size,
      }),
      addedDemographics
    ),
    addedConflicts,
    addedDuplicates,
    removed: recordsToRemove.size,
    removedPct: recordsToRemove.size / newRecordLookup.size,
    overlap: overlap,
    overlapPct: overlap / existingRecords.size,
    overlapDuplicateCount,
    overlapConflictCount,
    overlapCountDist,
    newDuplicates: newDuplicates.size,
    newConflicts: newConflicts.size,
  });
}

// Usage example
reconcileCSVs(
  path.resolve(__dirname, "data/raw.csv"),
  path.resolve(__dirname, "data/raw-v2.csv")
);
