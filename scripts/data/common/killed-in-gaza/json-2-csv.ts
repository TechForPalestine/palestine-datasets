const fs = require("fs");
const path = require("path");
const rawJson = require("./data/raw-v2.json");
const arUtils = require("arabic-utils");

const {
  pageTables: [firstPage, ...remainingPages],
} = rawJson;
const {
  tables: [, headerRow, ...peopleRows],
} = firstPage;
const headerMap: Record<string, string> = {
  المصدر: "source",
  العمر: "age",
  الجنس: "sex",
  "تاري خ الميالد": "dob",
  الهوية: "id",
  االسم: "name_ar_raw",
  الرقم: "index",
};

const headerOrder = [
  "name_ar_raw",
  "age",
  "sex",
  "dob",
  "id",
  "index",
  "source",
];
const originalEnglishOrder = (headerRow as string[]).map(
  (header) => headerMap[header]
);
const englishHeaders = originalEnglishOrder.slice().sort((a, b) => {
  return headerOrder.indexOf(a) - headerOrder.indexOf(b);
});
const reorderIndex = englishHeaders.map((header) =>
  originalEnglishOrder.indexOf(header)
);
console.log({ originalEnglishOrder, englishHeaders, reorderIndex });

const quote = (value: string) => {
  return `"${value}"`;
};
const stripQuotes = (value: string) => value.replace(/"/g, "");

const dobIdx = headerOrder.indexOf("dob");
const nameIdx = headerOrder.indexOf("name_ar_raw");
const indexIdx = headerOrder.indexOf("index");
const ageIdx = headerOrder.indexOf("age");
const sexIdx = headerOrder.indexOf("sex");
const identIdx = headerOrder.indexOf("id");

const cleanedRows = {
  longDob: new Set<string>(),
  ageInDob: new Set<string>(),
  ageInvalid: new Set<string>(),
  identEmpty: new Set<string>(),
  identInName: new Set<string>(),
  nameWithAge: new Set<string>(),
  identWithNonNumbers: new Set<string>(),
  identOverflow: new Set<string>(),
  dobWithHashes: new Set<string>(),
  sexWithMaleName: new Set<string>(),
  sexWithAnthName: new Set<string>(),
  sexWithFemaleName: new Set<string>(),
};

const appendName = (name: string, append: string) => {
  const cleanedName = name.replace(/\"/g, "").trim();
  if (!cleanedName) {
    return `"${append}"`;
  }
  return `"${cleanedName} (${append})"`;
};

const parseDob = (dob: string, age: string) => {
  const [date, month, year] = dob.split(/[/-]/);
  if (!date || !month || !year) {
    return null;
  }
  let fullYear = year;
  let thisCentury = age ? +age < 15 : +year < 15;
  if (fullYear.length === 2) {
    fullYear = thisCentury ? `20${year}` : `19${year}`;
  }
  return `${date.length === 1 ? `0${date}` : date}-${
    month.length === 1 ? `0${month}` : month
  }-${fullYear}`;
};

const fixRow = (row: string[]) => {
  let name = row[nameIdx];
  const sex = row[sexIdx];
  let dob = row[dobIdx];
  const age = row[ageIdx];
  const idx = row[indexIdx];
  const ident = row[identIdx];
  const rawIdx = idx.replace(/"/g, "");

  // if (idx.includes("10904")) {
  //   console.log({ dob, ident, idx });
  // }

  if (ident.includes("802023796")) {
    console.log(row);
  }

  const identJustNumbers = ident.replace(/[^0-9-]+/g, "");
  if (ident.length - identJustNumbers.length > 10) {
    const nonNumbers = ident.replace(identJustNumbers, "");
    name = row[nameIdx] = name ? appendName(name, nonNumbers) : nonNumbers;
    row[identIdx] = `"${identJustNumbers}"`;
    cleanedRows.identWithNonNumbers.add(idx);
  } else if (ident.length - identJustNumbers.length > 2) {
    // ignore small diff other than surrounding quotes
    row[identIdx] = `"${identJustNumbers}"`;
  }

  if (!ident.length) {
    row[identIdx] = `v0329-e-${rawIdx}`;
    cleanedRows.identEmpty.add(idx);
  }

  if (ident.length > 0 && /^[^0-9]+$/.test(ident)) {
    row[identIdx] = `v0329-o-${rawIdx}`;
    cleanedRows.identOverflow.add(idx);
  }

  if (stripQuotes(sex).length > 5) {
    if (ident.includes("802023796")) {
      console.log("oop");
    }
    if (sex.endsWith('ذكر"')) {
      name = row[nameIdx] = sex.replace("ذكر", "");
      row[sexIdx] = '"M"';
      cleanedRows.sexWithMaleName.add(idx);
    }

    if (sex.endsWith('أنثى"')) {
      name = row[nameIdx] = sex.replace("أنثى", "");
      row[sexIdx] = '"F"';
      cleanedRows.sexWithFemaleName.add(idx);
    }

    if (sex.endsWith('ىانث"')) {
      name = row[nameIdx] = sex.replace("ىانث", "");
      row[sexIdx] = '"F"';
      cleanedRows.sexWithAnthName.add(idx);
    }
  }
  if (sex === '"ذكر"') {
    row[sexIdx] = '"M"';
  }
  if (sex === '"ىأنث"' || sex === '"ىانث"') {
    row[sexIdx] = '"F"';
  }

  if (dob.length > 12) {
    const match = dob.match(/[0-9/-]+/);
    if (match) {
      const withoutDob = row[dobIdx].replace(match[0], "");
      dob = row[dobIdx] = '"' + match[0] + '"';
      name = row[nameIdx] = appendName(name, withoutDob);
      cleanedRows.longDob.add(idx);
    }
  }

  const rawAge = age.replace(/["]+/g, "");

  if (
    rawAge &&
    !/[0-9]{2,4}[-/][0-9]{2}[-/][0-9]{2,4}/.test(dob) &&
    dob.includes(rawAge)
  ) {
    const dobWithoutAge = dob.replace(rawAge, "").trim();
    if (dobWithoutAge === '""' || !dobWithoutAge) {
      dob = row[dobIdx] = dobWithoutAge;
      cleanedRows.ageInDob.add(idx);
    }
  } else if (dob.replace(/[#"]+/g, "").length === 0) {
    dob = row[dobIdx] = '""';
    cleanedRows.dobWithHashes.add(idx);
  }

  if (rawAge && name.includes(rawAge)) {
    name = row[nameIdx] = name.replace(rawAge, "").trim();
    cleanedRows.nameWithAge.add(idx);
  }

  if ((!dob || dob === '""' || dob === age) && rawAge.length > 3) {
    row[ageIdx] = '""';
    cleanedRows.ageInvalid.add(idx);
  } else if (dob === age) {
    dob = row[dobIdx] = '""';
    cleanedRows.ageInDob.add(idx);
  }

  if (/\s[0-9]\s/.test(name)) {
    name = row[nameIdx] = quote(
      name
        .replace(/\b[0-9]\b/g, " ")
        .replace(/^"/, "")
        .replace(/"$/, "")
        .trim()
    );
  }

  const normalizedName = new arUtils.ArabicClass(stripQuotes(name)).normalize();
  name = row[nameIdx] = normalizedName;

  // only specific-case fixes below this
  if (dob.includes('"الشاعر0.58"')) {
    dob = row[dobIdx] = '""';
  }
  if (dob === "0" || dob === '"0"') {
    dob = row[dobIdx] = '""';
  }

  // reformat dob to expected format for raw.csv
  const parsedDob = row[dobIdx]
    ? parseDob(row[dobIdx].replace(/"/g, ""), row[ageIdx].replace(/"/g, ""))
    : null;
  if (parsedDob) {
    dob = row[dobIdx] = `"${parsedDob}"`;
  }

  return row;
};

let count = 0;
const mapRows = (rows: string[][]) =>
  rows.map((row: string[]) =>
    fixRow(
      reorderIndex.map((rowIdx) => {
        const cell = row[rowIdx];
        return quote(cell.trim().replace(/\n/g, "").replace(/\r/g, ""));
      })
    ).join(",")
  );

const rows: string[] = [...mapRows(peopleRows)];
remainingPages.forEach((page: any) => {
  rows.push.apply(rows, mapRows(page.tables));
});

console.log(
  "cleaning summary:",
  Object.keys(cleanedRows).reduce(
    (sums, key) => ({
      ...sums,
      [key]: cleanedRows[key as keyof typeof cleanedRows].size,
    }),
    {}
  )
);

console.log("misordered", count);

const rtlChars = "\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC",
  rtlDirCheck = new RegExp("^[^" + rtlChars + "]*?[" + rtlChars + "]");

const rtlLines = rows.reduce((sum, row) => {
  if (rtlDirCheck.test(row)) {
    sum++;
  }
  return sum;
}, 0);

console.log("rtl lines", rtlLines);

fs.writeFileSync(
  path.resolve(__dirname, "data/raw-v2.csv"),
  [englishHeaders, ...rows].join("\n"),
  "utf8"
);
