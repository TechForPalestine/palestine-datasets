import { ExistingRecord, NewRecord, sourceMapping } from "./constants";
import { Demographics } from "./diff_lists.types";
import { generateBlogUpdate } from "./update_generator";
import {
  differenceBetweenAgeBasedDobAndReportedDob,
  readCsv,
  readCsvToMap,
} from "./utils";

const demographicsInit: Demographics = {
  "elderly-woman": 0,
  "elderly-man": 0,
  woman: 0,
  man: 0,
  "teen-boy": 0,
  "teen-girl": 0,
  "preteen-girl": 0,
  "preteen-boy": 0,
  "toddler-girl": 0,
  "toddler-boy": 0,
  "baby-girl": 0,
  "baby-boy": 0,
};

const stats = {
  total: 0,
  new: 0,
  updated: 0,
  unchanged: 0,
  removed: 0,
  updatedRecords: new Map<string, string[]>(),
  demographics: demographicsInit,
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

const genderValues = new Set();
const sourceValues = new Set();
const sourceCount = { h: 0, j: 0, c: 0, u: 0 };

export const personGroup = (
  ageUnparsed: string,
  sex: "m" | "f"
): keyof (typeof stats)["demographics"] => {
  if (ageUnparsed === "-1" || !ageUnparsed) {
    return sex === "f" ? "woman" : "man";
  }

  const age = +ageUnparsed;

  if (age >= 65) {
    return sex === "f" ? "elderly-woman" : "elderly-man";
  }

  if (age === 0) {
    return sex === "f" ? "baby-girl" : "baby-boy";
  }

  if (age < 3) {
    return sex === "f" ? "toddler-girl" : "toddler-boy";
  }

  if (age < 12) {
    return sex === "f" ? "preteen-girl" : "preteen-boy";
  }

  if (age < 18) {
    return sex === "f" ? "teen-girl" : "teen-boy";
  }

  return sex === "f" ? "woman" : "man";
};

const diffRecord = (
  existing: ExistingRecord | undefined,
  newRecord: NewRecord
) => {
  genderValues.add(newRecord.sex);
  sourceValues.add(newRecord.source);
  const newSrc = newRecord.source as keyof typeof sourceCount;
  sourceCount[newSrc] = sourceCount[newSrc] + 1;

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

  const recordDobChanged = newRecord.dob.trim() !== existing.dob.trim();

  if (recordDobChanged && newRecord.dob.trim() && newRecord.age.trim()) {
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
    stats.total++;
    const group = personGroup(newRecord.age, newRecord.sex);
    stats.demographics[group] = stats.demographics[group] + 1;
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
// NOTE: remember to make sure the new CSV file has no empty lines at the end
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
console.log("unique gender values:", Array.from(genderValues).join(", "));
console.log("unique source values:", Array.from(sourceValues).join(", "));
console.log("source counts:", JSON.stringify(sourceCount, null, 2));
console.log("");
console.log("Demographics:", JSON.stringify(stats.demographics, null, 2));
console.log(
  "Demographics percentages:",
  JSON.stringify(
    Object.keys(stats.demographics).reduce(
      (acc, key) => ({
        ...acc,
        [key]:
          (stats.demographics[key as keyof (typeof stats)["demographics"]] /
            stats.total) *
          100,
      }),
      {}
    ),
    null,
    2
  )
);
console.log("");

const { content, yyyymmdd } = generateBlogUpdate(stats);
const blogUpdateFilename = `site/updates/${yyyymmdd}-killed-list-update.md`;
require("fs").writeFileSync(blogUpdateFilename, content);

console.log("");

const inspectFlag = process.argv.indexOf("--inspect");
const inspectFlagValue = process.argv[inspectFlag + 1];

if (inspectFlag > 0 && typeof inspectFlagValue === "string") {
  const records = updatedRecords.get(inspectFlagValue);
  console.log(records?.join(","));
}
