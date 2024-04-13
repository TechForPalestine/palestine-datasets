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

const flipDateParts = (dob: string) => {
  const [year, date, month] = dob.split(/[/-]/);
  return `${year}-${month}-${date}`;
};

const existingRecordAgeRefDate = new Date(2024, 0, 5, 0, 0, 0);
const validateDobAgeWithinYear = (
  age: number,
  dob: string,
  ref: string,
  flipped = false
): [boolean, string | undefined] => {
  const dobDate = dob ? new Date(dob) : null;
  if (dobDate && Number.isNaN(dobDate.getTime())) {
    if (!flipped) {
      return validateDobAgeWithinYear(age, flipDateParts(dob), ref, true);
    }
    throw new Error(
      `Invalid date found in addExistingAge transform: ${dob} (${ref})`
    );
  }
  const ageFromDob = Math.round(
    differenceInMonths(existingRecordAgeRefDate, dob) / 12
  );
  const diff = Math.abs(age - ageFromDob);
  return [diff < 2, flipped ? dob : undefined];
};
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

const normalizeDateStr = (dateStr: string) => {
  const unquoted = stripQuotes(dateStr).replace(/[^0-9]/g, "-");
  if (/^\d{4}-/.test(unquoted)) {
    return unquoted;
  }
  if (/-\d{4}$/.test(unquoted)) {
    return unquoted.split("-").reverse().join("-");
  }
  throw new Error("Invalid date format found in normalizeDateStr: " + dateStr);
};

const getDiff = (
  recordA: (ExistingRecord & { age?: string }) | NewRecord,
  recordB: NewRecord
) => {
  const diff: Record<
    "name" | "age" | "dob" | "sex",
    boolean | number | undefined
  > = {
    name: 0,
    age: undefined,
    dob: undefined,
    sex: undefined,
  };
  const ageA = recordA.age ? +recordA.age : -1;
  const ageB = recordB.age ? +recordB.age : -1;
  const dobA = recordA.dob ? normalizeDateStr(recordA.dob) : null;
  const dobB = recordB.dob ? normalizeDateStr(recordB.dob) : null;
  const nameA = stripQuotes(recordA.name_ar_raw);
  const nameB = stripQuotes(recordB.name_ar_raw);
  const sexA = stripQuotes(recordA.sex);
  const sexB = stripQuotes(recordB.sex);

  if (ageA !== -1 && ageB === -1) {
    diff.age = false; // age removed
  } else if (ageA === -1 && ageB !== -1) {
    diff.age = true; // age added
  } else if (ageA !== -1 && ageB !== -1) {
    diff.age = Math.abs(ageA - ageB); // age changed, return diff
  }

  if (!dobA && dobB) {
    diff.dob = true; // dob added
  } else if (dobA && !dobB) {
    diff.dob = false; // dob removed
  } else if (dobA && dobB) {
    diff.dob = distance(dobA, dobB) / dobA.length; // dob changed, return diff
  }

  if (nameA !== nameB) {
    diff.name = distance(nameA, nameB) / nameA.length;
  }

  if (!sexA && sexB) {
    diff.sex = true;
  } else if (sexA && !sexB) {
    diff.sex = false;
  } else if (sexA !== sexB) {
    diff.sex = 1;
  }

  // if (recordA.id === "931542690") {
  //   console.log({ ageA, ageB, dobA, dobB, nameA, nameB, sexA, sexB, diff });
  // }

  return { ...diff, id: recordA.id } as typeof diff & { id: string };
};

type DemoDistribution = {
  srmen: number;
  srwomen: number;
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

const getRecordDemo = (
  record: NewRecord | (ExistingRecord & { age?: string })
): keyof DemoDistribution => {
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

  if (age >= 65) {
    if (record.sex === "M") {
      return "srmen";
    }
    if (record.sex === "F") {
      return "srwomen";
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

const reportingSource = "تبيلغ ذوي الشهداء";
const ministrySource = "سجالت وزارة الصحة";
type Source = typeof reportingSource | typeof ministrySource;
type ReconcileSkips = Record<
  "age" | "dob" | "sex" | "name" | "سجالت وزارة الصحة" | "تبيلغ ذوي الشهداء",
  string[]
>;
type ReconcileAccepts = {
  ageAdded: string[];
  ageSame: string[];
  ageChangeOk: string[];
  ageDirty: string[];
  dobAdded: string[];
  dobFixed: string[];
  dobDirty: string[];
  nameSame: string[];
  nameChangeOk: string[];
  sexAdded: string[];
  [ministrySource]: string[];
  [reportingSource]: string[];
};
type FreeAccepts = {
  newRecordsFromMinistry: string[];
  newRecordsFromSubmissions: string[];
};

const newRecordConflictSkips: ReconcileSkips = {
  age: [],
  dob: [],
  sex: [],
  name: [],
  [ministrySource]: [],
  [reportingSource]: [],
};

const newRecordConflictAccepts: ReconcileAccepts = {
  ageAdded: [],
  ageSame: [],
  ageChangeOk: [],
  ageDirty: [],
  dobAdded: [],
  dobFixed: [],
  dobDirty: [],
  nameSame: [],
  nameChangeOk: [],
  sexAdded: [],
  [ministrySource]: [],
  [reportingSource]: [],
};

const mergedRecordConflictSkips: ReconcileSkips = {
  age: [],
  dob: [],
  sex: [],
  name: [],
  [ministrySource]: [],
  [reportingSource]: [],
};

const mergedRecordConflictAccepts: ReconcileAccepts = {
  ageAdded: [],
  ageSame: [],
  ageChangeOk: [],
  ageDirty: [],
  dobAdded: [],
  dobFixed: [],
  dobDirty: [],
  nameSame: [],
  nameChangeOk: [],
  sexAdded: [],
  [ministrySource]: [],
  [reportingSource]: [],
};

const mergedRecordFreeAccepts: FreeAccepts = {
  newRecordsFromMinistry: [],
  newRecordsFromSubmissions: [],
};

const distributionStep = (pct: number) => Math.round(pct * 10) * 10;

const newRecordsWithInvalidDob: string[] = [];
const nameDiffThreshold = 0.3;
const nameChangeAcceptDist: Record<number, number> = {};

const addIfAcceptable = (
  lookup: Map<string, NewRecord | (ExistingRecord & { age?: string })>,
  record: NewRecord,
  results: {
    skips: ReconcileSkips;
    accepts: ReconcileAccepts;
    freeAccepts?: FreeAccepts;
  }
) => {
  const age = record.age ? +dequote(record.age) : -1;
  const dob = record.dob ? normalizeDateStr(record.dob) : null;
  let validDob = true;
  let dobFixed = false;
  if (age !== -1 && dob) {
    const dobCheckResult = validateDobAgeWithinYear(age, dob, record.id);
    if (!dobCheckResult[0]) {
      validDob = false;
    } else if (dobCheckResult[1]) {
      dobFixed = true;
      record.dob = dobCheckResult[1];
    } else {
      record.dob = normalizeDateStr(record.dob);
    }
  }

  const priorRecord = lookup.get(record.id);
  if (!priorRecord) {
    if (validDob) {
      if (record.source === ministrySource) {
        results.freeAccepts?.newRecordsFromMinistry.push(record.id);
      } else if (record.source === reportingSource) {
        results.freeAccepts?.newRecordsFromSubmissions.push(record.id);
      }
      lookup.set(record.id, record);
    } else {
      newRecordsWithInvalidDob.push(record.id);
    }
    return;
  }

  const diff = getDiff(priorRecord, record);
  const source = record.source as Source;

  if (
    diff.age === false ||
    (typeof diff.age === "number" && diff.age > 1) ||
    (age !== -1 && dob && !validDob)
  ) {
    results.skips.age.push(record.id);
    results.skips[source].push(record.id);
    return;
  }
  if (diff.sex === false || diff.sex === 1) {
    results.skips.sex.push(record.id);
    results.skips[source].push(record.id);
    return;
  }
  if (
    (diff.name &&
      typeof diff.name === "number" &&
      diff.name > nameDiffThreshold) ||
    record.name_ar_raw.includes("0")
  ) {
    results.skips.name.push(record.id);
    results.skips[source].push(record.id);
    return;
  }
  if (diff.dob === false) {
    results.skips.dob.push(record.id);
    results.skips[source].push(record.id);
    return;
  }

  if (diff.age === 0) {
    results.accepts.ageSame.push(record.id);
  } else if (diff.age === true) {
    results.accepts.ageDirty.push(record.id);
    results.accepts.ageAdded.push(record.id);
  } else if (typeof diff.age === "number") {
    results.accepts.ageDirty.push(record.id);
    results.accepts.ageChangeOk.push(record.id);
  }
  if (diff.dob === true) {
    results.accepts.dobDirty.push(record.id);
    results.accepts.dobAdded.push(record.id);
  }
  if (dobFixed) {
    results.accepts.dobDirty.push(record.id);
    results.accepts.dobFixed.push(record.id);
  }
  if (
    diff.name &&
    typeof diff.name === "number" &&
    diff.name <= nameDiffThreshold &&
    diff.name !== 0
  ) {
    const distKey = distributionStep(diff.name as number) || 0;
    const existingDistCount = nameChangeAcceptDist[distKey] || 0;
    nameChangeAcceptDist[distKey] = existingDistCount + 1;
    results.accepts.nameChangeOk.push(record.id);
  } else {
    results.accepts.nameSame.push(record.id);
  }
  if (diff.sex === true) {
    results.accepts.sexAdded.push(record.id);
  }
  results.accepts[source].push(record.id);
  lookup.set(record.id, record);
};

const sumArrayLookup = (lookup: Record<string, any[]>) =>
  Object.keys(lookup).reduce(
    (acc, key) => ({
      ...acc,
      [key]: lookup[key as keyof typeof lookup].length,
    }),
    {} as Record<keyof typeof lookup, number>
  );

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
  const mergedRecords = new Map<string, NewRecord | ExistingRecord>(
    existingRecords
  );

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

    addIfAcceptable(newRecordLookup, record, {
      skips: newRecordConflictSkips,
      accepts: newRecordConflictAccepts,
    });

    // check for dupe in new records vs existing records
    const existingRecord = existingRecords.get(record.id);
    if (existingRecord && isDupe(existingRecord, record)) {
      const existingDupes = existingDuplicates.get(record.id) || [];
      existingDuplicates.set(record.id, [...existingDupes, existingRecord]);
    } else if (existingRecord) {
      existingConflicts.add(existingRecord.id);
    }
  });

  console.log("new record lookup size:", newRecordLookup.size);
  for (const key of newRecordLookup.keys()) {
    const record = newRecordLookup.get(key) as NewRecord;
    addIfAcceptable(mergedRecords, record, {
      skips: mergedRecordConflictSkips,
      accepts: mergedRecordConflictAccepts,
      freeAccepts: mergedRecordFreeAccepts,
    });
  }

  const recordsToRemove = new Set<string>();
  const recordsToAdd = new Set<string>();
  const existingDemographics: DemoDistribution = {
    srmen: 0,
    srwomen: 0,
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
  const addedDemographics: DemoDistribution = {
    srmen: 0,
    srwomen: 0,
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
  const mergedDemographics: DemoDistribution = {
    srmen: 0,
    srwomen: 0,
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
    const demo = getRecordDemo(existingRecords.get(key) as ExistingRecord);
    existingDemographics[demo]++;

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

  for (const key of mergedRecords.keys()) {
    const demo = getRecordDemo(
      mergedRecords.get(key) as NewRecord | ExistingRecord
    );
    mergedDemographics[demo]++;
  }

  const overlap = existingDuplicates.size + existingConflicts.size;
  const estMergedListSize =
    existingRecords.size -
    recordsToRemove.size +
    recordsToAdd.size -
    addedDuplicates -
    addedConflicts;

  const existingConflictDiffs = Array.from(existingConflicts.keys()).reduce(
    (acc, id) => {
      const record = existingRecords.get(id) as ExistingRecord;
      const newRecord = newRecordLookup.get(id);
      if (!newRecord) {
        return acc;
      }
      return acc.concat(getDiff(record, newRecord));
    },
    [] as Array<ReturnType<typeof getDiff>>
  );

  const handleDiffAge = (
    age: boolean | number | undefined,
    acc: { removed: number; concerning: number; ok: number }
  ) => {
    if (age === false) {
      return { ...acc, removed: acc.removed + 1 };
    }
    if (typeof age === "number" && age > 1) {
      return { ...acc, concerning: acc.concerning + 1 };
    }
    return { ...acc, ok: acc.ok + 1 };
  };
  const handleDiffDob = (
    dob: number | boolean | undefined,
    acc: { removed: number; concerning: number; ok: number }
  ) => {
    if (dob === false) {
      return { ...acc, removed: acc.removed + 1 };
    }
    // <=40% distance is likely an acceptable change (month / date swap, etc.)
    if (typeof dob === "number" && dob > 0.4) {
      return { ...acc, concerning: acc.concerning + 1 };
    }
    return { ...acc, ok: acc.ok + 1 };
  };
  const handleDiffSex = (
    sex: boolean | number | undefined,
    acc: { removed: number; concerning: number; ok: number }
  ) => {
    if (sex === false) {
      return { ...acc, removed: acc.removed + 1 };
    }
    if (typeof sex === "number") {
      return { ...acc, concerning: acc.concerning + 1 };
    }
    return { ...acc, ok: acc.ok + 1 };
  };

  const existingConflictsDistribution = existingConflictDiffs.reduce(
    (acc, diff) => ({
      ...acc,
      name: {
        ...acc.name,
        [distributionStep(diff.name as number) || 0]:
          (acc.name[distributionStep(diff.name as number) || 0] || 0) + 1,
      },
      age: {
        ...acc.age,
        ...handleDiffAge(diff.age, acc.age),
      },
      dob: {
        ...acc.dob,
        ...handleDiffDob(diff.dob, acc.dob),
      },
      sex: {
        ...acc.sex,
        ...handleDiffSex(diff.sex, acc.sex),
      },
    }),
    {
      name: {} as Record<number, number>,
      // these ones we think added or within a certain threshold are ok to accept
      age: { removed: 0, concerning: 0, ok: 0 },
      dob: { removed: 0, concerning: 0, ok: 0 },
      sex: { removed: 0, concerning: 0, ok: 0 },
    }
  );

  const renderDemoDist = (dist: DemoDistribution, pctBasis: number) =>
    (Object.keys(dist) as Array<keyof DemoDistribution>).reduce(
      (acc, key) => ({
        ...acc,
        [`${key}Pct`]: dist[key] / pctBasis,
      }),
      dist
    );

  const mergedRecordConflictChangeDist = [
    ...mergedRecordConflictAccepts[ministrySource],
    ...mergedRecordConflictAccepts[reportingSource],
  ].reduce((acc, id) => {
    const age = mergedRecordConflictAccepts.ageDirty.includes(id);
    const dob = mergedRecordConflictAccepts.dobDirty.includes(id);
    const name = mergedRecordConflictAccepts.nameChangeOk.includes(id);
    const sex = mergedRecordConflictAccepts.sexAdded.includes(id);
    const key =
      [age ? "age" : "", dob ? "dob" : "", name ? "name" : "", sex ? "sex" : ""]
        .filter(Boolean)
        .join("_") || "unchanged";
    const existingValue = acc[key] || [];
    return {
      ...acc,
      [key]: existingValue.concat(id),
    };
  }, {} as Record<string, string[]>);

  console.log("summary", {
    estMergedListSize,
    estMergedListSizeChg:
      (estMergedListSize - existingRecords.size) / existingRecords.size,
    estMergedListSizeOfLatestKilled: estMergedListSize / 33_175,
    priorListSizeOfLatestKilled: existingRecords.size / 33_175,
    added: recordsToAdd.size,
    addedPct: recordsToAdd.size / newRecordLookup.size,
    existingDemographics: renderDemoDist(
      existingDemographics,
      existingRecords.size
    ),
    addedDemographics: renderDemoDist(addedDemographics, recordsToAdd.size),
    mergedDemographics: renderDemoDist(mergedDemographics, mergedRecords.size),
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
    newRecordsWithInvalidDob: newRecordsWithInvalidDob.length,
    newRecordsFromMinistry:
      mergedRecordFreeAccepts.newRecordsFromMinistry.length,
    newRecordsFromSubmissions:
      mergedRecordFreeAccepts.newRecordsFromSubmissions.length,
    newRecordConflictSkips: sumArrayLookup(newRecordConflictSkips),
    newRecordConflictAccepts: sumArrayLookup(newRecordConflictAccepts),
    mergedRecordConflictSkips: sumArrayLookup(mergedRecordConflictSkips),
    mergedRecordConflictAccepts: sumArrayLookup(mergedRecordConflictAccepts),
    mergedRecordConflictChangeDist: sumArrayLookup(
      mergedRecordConflictChangeDist
    ),
    nameChangeAcceptDist,
    mergedRecordConflictChange_ageDob: mergedRecordConflictChangeDist.age_dob,
    mergedRecordConflictChangeDist_ageDobName:
      mergedRecordConflictChangeDist.age_dob_name,
    someAgeAndNameChanges: mergedRecordConflictChangeDist.age_name.slice(0, 10),
    someAgeOnlyChanges: mergedRecordConflictChangeDist.age.slice(0, 10),
    existingConflictsDistribution,

    /* big name diffs */
    // existingConflictDiffs: existingConflictDiffs.filter(
    //   (diff) => typeof diff.name === "number" && diff.name >= 1
    // ),

    /* concerning dob diffs */
    // existingConflictDiffs: existingConflictDiffs.filter(
    //   (diff) => typeof diff.dob === "number" && diff.dob > 0.4
    // ),
  });

  const csvHeader = ["id", "name_ar_raw", "dob", "age", "sex"];
  const format = (value: string, header: string) =>
    header === "age" ? `"${value}"` : value;
  const rows: string[] = [];
  for (const key of mergedRecords.keys()) {
    const record = mergedRecords.get(key) as NewRecord | ExistingRecord;
    rows.push(
      csvHeader
        .map((header) => format(record[header as keyof typeof record], header))
        .join(",")
    );
  }
  const newListLength = rows.length;
  console.log("new list length:", newListLength);
  if (process.argv.includes("--write")) {
    fs.writeFileSync(
      path.resolve(__dirname, "data/raw.csv"),
      [csvHeader.join(","), ...rows].join("\r\n")
    );
  }
}

// Usage example
reconcileCSVs(
  path.resolve(__dirname, "data/raw.csv"),
  path.resolve(__dirname, "data/raw-v2.csv")
);
