import fs from "fs";
import { ArabicClass } from "arabic-utils";

const pdfFolders = new Array(46)
  .fill(1)
  .map((i, idx) => i + idx * 10)
  .map((i) => `downloads/${i.toString().padStart(3, "0")}`)
  .sort();

const files = [] as string[];
pdfFolders.forEach((folder) => {
  const folderFiles = fs
    .readdirSync(folder + "/tables")
    .filter((file) => file.endsWith(".csv"))
    .map((file) => `${folder}/tables/${file}`);
  files.push(...folderFiles);
});

files.sort();
// console.log(">>", files.join("\n"));
// process.exit(0);

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
  ageParsedDiff: new Set<string>(),
  ageInDob: new Set<string>(),
  identInName: new Set<string>(),
  nameWithNumbers: new Set<string>(),
  nameStartingWithSingleChar: new Set<string>(),
  nameEndingWithSingleChar: new Set<string>(),
  identWithNonNumbers: new Set<string>(),
  dobAgeMismatch: new Set<string>(),
  dobNot3Parts: new Set<string>(),
  dobDatePartSwappedToEnd: new Set<string>(),
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
  if (header === "age" && !!value.trim()) {
    if (/[/-]/.test(value)) {
      return "";
    }
    if (value.trim() === "سنتان") {
      return "2";
    }
    if (value.trim().includes("#")) {
      return "";
    }
    const parsed = parseFloat(value.trim());
    if (parsed.toString() !== value.trim()) {
      issues.ageParsedDiff.add(id);
      const numeric = value.trim().replace(/\D/g, "");
      const parsedNumeric = parseFloat(numeric);
      if (parsedNumeric.toString() === numeric) {
        return numeric;
      } else {
        return "";
      }
    }
  }
  if (header === "dob") {
    if (value.includes("#")) {
      return "";
    }
    if (!!value && value.trim().length < 6) {
      return "";
    }
    const parts = value
      .trim()
      .split(/[-/]/)
      .map((p) => (p.trim().length === 1 ? `0${p.trim()}` : p.trim()));
    let dirtyDob: string[] | undefined;
    if (!!value.trim() && parts.length !== 3) {
      issues.dobNot3Parts.add(id);
      return "";
    } else if (+(parts[2] ?? 0) > 1000) {
      dirtyDob = parts.reverse();
    } else if ((parts.reduce((sum, p) => sum + +p, 0) ?? 0) < 300) {
      // year in short form ("88")
      const reversed = parts.slice().reverse();
      let fixed = false;

      if (
        reversed[0] === "0002" ||
        reversed[0] === "0001" ||
        reversed[0] === "0200"
      ) {
        reversed[0] = "00"; // assume got reversed via RTL
      }

      if (reversed[0] === "0005") {
        reversed[0] = "05";
      }

      if (reversed[0] === "0196" || reversed[0] === "1960") {
        reversed[0] = "60";
      }

      reversed[0] =
        +reversed[0] >= 0 && +reversed[0] <= 24
          ? `20${reversed[0]}`
          : `19${reversed[0]}`;
      dirtyDob = reversed;
    }

    if (dirtyDob && +dirtyDob[1] > 12) {
      issues.dobDatePartSwappedToEnd.add(id);
      dirtyDob = [dirtyDob[0], dirtyDob[2], dirtyDob[1]];
    }

    if (dirtyDob) {
      return dirtyDob.join("-");
    }
  }
  // strip "yes" from start of names and any other single chars
  // figure out a way to get name to match for 15yr old girl case
  if (header === "name_ar_raw") {
    let cleanedName = value.trim();

    if (id && value.includes(id)) {
      issues.identInName.add(value);
    }
    if (value.match(/\d/)) {
      if (value.includes("00")) {
        cleanedName = value.trim().replace("00", "");
      }
      const spacedNumbers = value.match(/\b[0-9]+\b/);
      if (spacedNumbers) {
        cleanedName = value.trim().replace(/\b[0-9]+\b/g, " ");
      }
      issues.nameWithNumbers.add(id);
    }
    while (/^[^\s]\s+/.test(cleanedName)) {
      cleanedName = cleanedName.replace(/^[^\s]\s+/, "");
      issues.nameStartingWithSingleChar.add(id);
    }
    while (/\s+[^\s]?$/.test(cleanedName)) {
      cleanedName = cleanedName.replace(/\s+[^\s]?$/, "");
      issues.nameEndingWithSingleChar.add(id);
    }

    return new ArabicClass(cleanedName).normalize();
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

  const iterateRow = (cells: string[]) => {
    if (cells.length !== headers.length) {
      console.log("encountered row with length:", cells.length);
      if (cells.length === 12) {
        console.log(cells, headers);
        process.exit(0);
      }
    }
    const id = cells[idIdx];
    const index = cells[indexIdx];
    const record = cells.reduce((rec, cell, idx) => {
      const header = headers[idx];
      return {
        ...rec,
        [header]: formatRecordValue(cell, header, id, index),
      };
    }, {} as Record<string, string>);
    if (record.dob && !record.age && record.dob.length < 4) {
      record.age = record.dob;
      record.dob = "";
      issues.ageInDob.add(id);
    }
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
  };

  const handleCombinedRow = (cells: string[]) => {
    const splitPoint =
      cells.slice(1).findIndex((cell) => cell.includes("سجلات وزارة الصحة ")) +
      1;
    if (splitPoint <= 0) {
      console.log("could not find split point in combined row:", cells);
      process.exit(1);
      return;
    }

    const firstRow = cells.slice(0, splitPoint);
    const secondRow = cells.slice(splitPoint);
    [firstRow, secondRow].forEach((row) => {
      if (row.length === headers.length) {
        iterateRow(row);
      } else if (
        row.length === 5 &&
        Object.keys(genders).includes(row[1].trim())
      ) {
        row.splice(1, 0, "");
        row.splice(3, 0, "");
        iterateRow(row);
      } else {
        console.log("unhandled row with bad length:", row.length, "-->", row);
        process.exit(1);
      }
    });
  };

  rows.forEach((row) => {
    const cells = row.split(",");
    if (cells.length === headers.length) {
      iterateRow(cells);
    } else if (cells.length === 12) {
      handleCombinedRow(cells);
    } else if (cells.length === 1 && cells[0].trim() === "") {
      // no-op empty row
    } else {
      console.log("encountered row with length:", cells.length, "-->", cells);
    }
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
