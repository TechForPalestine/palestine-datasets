import fs from "fs";
import { ArabicClass } from "arabic-utils";

const files = new Array(46)
  .fill(1)
  .map((i, idx) => i + idx * 10)
  .map(
    (i) => `downloads/${i.toString().padStart(3, "0")}/tables/fileoutpart0.csv`
  )
  .sort();

let headers: string[] = [];
const headerLookup = {
  المصدر: "source",
  العمر: "age",
  الجنس: "sex",
  الميلاد: "dob",
  الهوية: "id",
  "مستوفى البيانات لدى": "name_ar_raw",
  "كش  الرقم": "index",
};
const genders = {
  ىأنث: "F",
  انثى: "F",
  "ى  انث": "F",
  أنثى: "F",
  ذكر: "M",
};
const arHeaderPartials = Object.keys(headerLookup);

const issues = {
  ageInvalid: new Set<string>(),
  identInName: new Set<string>(),
  nameWithNumbers: new Set<string>(),
  identWithNonNumbers: new Set<string>(),
  dobAgeMismatch: new Set<string>(),
};

const formatRecordValue = (
  value: string,
  header: string,
  id: string,
  index: string
) => {
  if (header === "sex") {
    const enSex = genders[value.trim() as keyof typeof genders];
    return enSex || value.trim();
  }
  if (header === "id") {
    if (!value.trim()) {
      return `MISSING_ID`;
    }
    if (value.trim().match(/\D/)) {
      return `INVALID_ID: ${value.trim()}`;
    }
    return value.trim();
  }
  if (header === "dob") {
    if (value.includes("#")) {
      return "";
    }
    if (!!value && value.trim().length < 6) {
      return "";
    }
  }
  // strip "yes" from start of names and any other single chars
  // figure out a way to get name to match for 15yr old girl case
  if (header === "name_ar_raw") {
    if (id && value.includes(id)) {
      issues.identInName.add(value);
    } else if (value.match(/\d/)) {
      if (value.includes("00")) {
        return value.trim().replace("00", "");
      }
      const spacedNumbers = value.match(/\b[0-9]+\b/);
      if (spacedNumbers) {
        return value.trim().replace(/\b[0-9]+\b/g, " ");
      }
      issues.nameWithNumbers.add(id);
    }

    return new ArabicClass(value.trim()).normalize();
  }
  return value.trim();
};

const records: Array<Record<string, string>> = [];
for (const filepath of files) {
  const data = fs.readFileSync(filepath, "utf8");
  const rows: string[] = data.split("\n");
  if (!headers.length) {
    const topRow = rows
      .shift()
      ?.split(",")
      .map((arValue) => {
        const key = arHeaderPartials.find((arPart) => arValue.includes(arPart));
        const enValue = headerLookup[key as keyof typeof headerLookup];
        return enValue;
      });
    headers = topRow ?? [];
  }
  const idIdx = headers.indexOf("id");
  const indexIdx = headers.indexOf("index");
  rows.forEach((row) => {
    const cells = row.split(",");
    const id = cells[idIdx];
    const index = cells[indexIdx];
    const record = cells.reduce((rec, cell, idx) => {
      const header = headers[idx];
      return {
        ...rec,
        [header]: formatRecordValue(cell, header, id, index),
      };
    }, {} as Record<string, string>);
    if (
      !record.id ||
      record.id.startsWith("INVALID") ||
      record.id.startsWith("MISSING") ||
      Object.keys(record).length === 0 ||
      Object.values(record).filter((v) => !!v).length === 0
    ) {
      return;
    }
    records.push(record);
  });
}

console.log(
  "issue summary:",
  Object.keys(issues).reduce(
    (sums, key) => ({
      ...sums,
      [key]: issues[key as keyof typeof issues].size,
      [`${key}Sample`]: Array.from(
        issues[key as keyof typeof issues].values()
      ).slice(0, 5),
    }),
    {}
  )
);

const csv = [
  headers,
  ...records.map((record) => headers.map((header) => record[header]).join(",")),
].join("\n");

fs.writeFileSync("downloads/merged.csv", csv, "utf8");
