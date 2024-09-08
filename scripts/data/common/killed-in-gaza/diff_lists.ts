import { ExistingRecord, NewRecord, sourceMapping } from "./constants";
import {
  differenceBetweenAgeBasedDobAndReportedDob,
  readCsv,
  readCsvToMap,
} from "./utils";

const stats = {
  new: 0,
  updated: 0,
  unchanged: 0,
  removed: 0,
  updatedRecords: new Map<string, string[]>(),
};

enum DiffValue {
  New,
  Updated,
  Unchanged,
}

const ageDiffs: Record<number, number> = {};
const dobDiffs: Record<number, number> = {};
const ageDefinedPreviouslyNeg1 = new Set<string>();
const invalidAges = new Set<string>();

const diffValueOrder = ["name", "dob", "age", "sex", "source"];

const diffRecord = (
  existing: ExistingRecord | undefined,
  newRecord: NewRecord
) => {
  if (
    +newRecord.age.trim() > 150 ||
    Number.isNaN(+newRecord.age.trim()) ||
    +newRecord.age.trim() < 0
  ) {
    invalidAges.add(newRecord.id);
  }

  if (!existing) {
    stats.new++;
    return;
  }

  if (
    (existing.age.includes("-1") && !newRecord.age.includes("-1")) ||
    (!existing.age.trim() && newRecord.age.trim())
  ) {
    ageDefinedPreviouslyNeg1.add(existing.id);
  }

  let incomingSource = newRecord.source;
  if (incomingSource.length > 1) {
    incomingSource =
      sourceMapping[incomingSource as keyof typeof sourceMapping];
    if (!incomingSource) {
      throw new Error(`Source missing in mapping: ${newRecord.source}`);
    }
  }

  let name = DiffValue.Unchanged;
  let dob = DiffValue.Unchanged;
  let age = DiffValue.Unchanged;
  let sex = DiffValue.Unchanged;
  let source = DiffValue.Unchanged;

  if (!existing.name_ar_raw.trim() && newRecord.name_ar_raw.trim()) {
    name = DiffValue.New;
  } else if (existing.name_ar_raw.trim() !== newRecord.name_ar_raw.trim()) {
    name = DiffValue.Updated;
  } else {
    name = DiffValue.Unchanged;
  }

  if (!existing.dob.trim() && newRecord.dob.trim()) {
    dob = DiffValue.New;
  } else if (existing.dob.trim() !== newRecord.dob.trim()) {
    dob = DiffValue.Updated;
  } else {
    dob = DiffValue.Unchanged;
  }

  if (!existing.age.trim() && newRecord.age.trim()) {
    age = DiffValue.New;
  } else if (existing.age.trim() !== newRecord.age.trim()) {
    const changeDiff = +existing.age.trim() - +newRecord.age.trim();
    ageDiffs[changeDiff] = (ageDiffs[changeDiff] ?? 0) + 1;
    age = DiffValue.Updated;
  } else {
    age = DiffValue.Unchanged;
  }

  if (!existing.sex.trim() && newRecord.sex.trim()) {
    sex = DiffValue.New;
  } else if (existing.sex.trim() !== newRecord.sex.trim()) {
    sex = DiffValue.Updated;
  } else {
    sex = DiffValue.Unchanged;
  }

  if (!existing.source.trim() && incomingSource.trim()) {
    source = DiffValue.New;
  } else if (existing.source.trim() !== incomingSource.trim()) {
    source = DiffValue.Updated;
  } else {
    source = DiffValue.Unchanged;
  }

  // special case: if source was "unknown" before, count it as unchanged
  if (existing.source === "u" && incomingSource !== "u") {
    source = DiffValue.Unchanged;
  }

  if (newRecord.dob.trim() && newRecord.age.trim()) {
    const diffYears = differenceBetweenAgeBasedDobAndReportedDob(
      +newRecord.age.trim(),
      newRecord.dob.trim()
    );
    if (typeof diffYears === "number" && !Number.isNaN(diffYears)) {
      dobDiffs[diffYears] = (dobDiffs[diffYears] ?? 0) + 1;
    }
  }

  // align with diffValueOrder above
  const diffDimensions = [name, dob, age, sex, source];

  if (diffDimensions.every((d) => d === DiffValue.Unchanged)) {
    stats.unchanged++;
    return;
  }

  stats.updated++;
  return diffDimensions.join("-");
};

async function diffCSVs(existingCSVPath: string, newCSVPath: string) {
  const existingRecords = readCsvToMap<ExistingRecord>(existingCSVPath, "id");
  const newRecords = readCsv<NewRecord>(newCSVPath);
  const newRecordIds = new Set<string>();
  newRecords.forEach((newRecord) => {
    newRecordIds.add(newRecord.id);
    const existingRecord = existingRecords.get(newRecord.id);
    const diff = diffRecord(existingRecord, newRecord);
    if (diff) {
      const diffTypeUpdates = stats.updatedRecords.get(diff) ?? [];
      stats.updatedRecords.set(diff, [...diffTypeUpdates, newRecord.id]);
    }
  });
  existingRecords.forEach((existingRecord) => {
    if (!newRecordIds.has(existingRecord.id)) {
      stats.removed++;
    }
  });
}

const newCsvFilename = process.argv.find((arg) => arg.endsWith(".csv"));
if (!newCsvFilename) {
  throw new Error("No new CSV filename provided as argument");
}

diffCSVs(
  "scripts/data/common/killed-in-gaza/data/raw.csv",
  `scripts/data/common/killed-in-gaza/output/${newCsvFilename}`
);

const leftPad = (value: string, length: number) => {
  return value.padStart(length, " ");
};

const humanReadableDiffValues = (diffValues: string) => {
  const parts = diffValues.split("-");
  return parts
    .map((part, index) => {
      const dimension = diffValueOrder[index];
      switch (+part) {
        case DiffValue.New:
          return `${dimension} new`;
        case DiffValue.Updated:
          return `${dimension} changed`;
        case DiffValue.Unchanged:
          return ""; // don't print if unchanged
      }
    })
    .filter((part) => !!part) // exclude unchanged
    .join(", ");
};

const { updatedRecords, ...statsWithoutUpdatedRecords } = stats;
const changeCounts: [number, string, string][] = [];
for (const [diff, ids] of updatedRecords) {
  changeCounts.push([ids.length, humanReadableDiffValues(diff), diff]);
}

console.log(
  changeCounts
    .sort((a, b) => b[0] - a[0])
    .map((row) => `${leftPad(row[0].toString(), 5)} (${row[2]}) : ${row[1]}`)
    .join("\n")
);
console.log(JSON.stringify(statsWithoutUpdatedRecords, null, 2));

console.log(
  "age change differences above/below 10:",
  JSON.stringify(
    Object.keys(ageDiffs).reduce((acc, diff) => {
      const diffCount = ageDiffs[diff as any];
      if (Math.abs(diffCount) >= 10) {
        return {
          ...acc,
          [diff]: diffCount,
        };
      }

      return acc;
    }, {}),
    null,
    2
  )
);

console.log(
  "dob change differences (years diff):",
  JSON.stringify(dobDiffs, null, 2)
);

console.log(
  "records with previously unavailable ages (-1)",
  ageDefinedPreviouslyNeg1.size,
  "sample:",
  Array.from(ageDefinedPreviouslyNeg1).slice(0, 5)
);
console.log(
  "invalid ages (above 150, isNaN or negative):",
  invalidAges.size,
  "sample:",
  Array.from(invalidAges).slice(0, 5)
);

console.log("");

const inspectFlag = process.argv.indexOf("--inspect");
const inspectFlagValue = process.argv[inspectFlag + 1];

if (inspectFlag > 0 && typeof inspectFlagValue === "string") {
  const records = updatedRecords.get(inspectFlagValue);
  console.log(records?.join(","));
}
