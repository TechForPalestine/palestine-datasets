import { differenceInMonths, subYears } from "date-fns";
import fs from "fs";

const dequote = (value: string) => {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  return value;
};

export const readCsv = <T>(file: string) => {
  const csvRaw = fs.readFileSync(file, "utf8");
  const rows = csvRaw.split("\n");
  const headers = rows[0].replace(/\r$/, "").split(",");
  console.log(`Reading CSV file: ${file}`);
  console.log(`Found ${rows.length} rows and ${headers.length} headers`);
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

export const readCsvToMap = <T>(file: string, mapKey: keyof T) => {
  const csvRecords = readCsv<T>(file);
  const records = new Map<string, T>();
  if (typeof csvRecords[0][mapKey] !== "string") {
    throw new Error(`Invalid map key: ${mapKey.toString()}`);
  }
  csvRecords.forEach((record) => {
    records.set(record[mapKey] as string, record);
  });
  return records;
};

/**
 * returns number of years reflecting the difference between an approximated date of birth
 * based on the reported age and the actual date of birth in the data
 *
 * the expectation is that this number could be up to 2 years off in normal cases with small
 * reporting differences and the fact we're approximating one date of birth with a moving reference
 * date (today)
 *
 * but the intent is to catch ages that are off by more than that, indicating the DOB is wrong,
 * the age is wrong, or (more likely) our date parsing misinterpreted the original date format
 *
 * @param age age in reported data
 * @param dob date of birth in reported data (after our date normalization)
 * @returns
 */
export const differenceBetweenAgeBasedDobAndReportedDob = (
  age: number,
  dob: string
) => {
  const dobDate = dob ? new Date(dob) : null;
  if (!dobDate || !age) {
    return;
  }
  if (dobDate && Number.isNaN(dobDate.getTime())) {
    return "invalid date";
  }
  const approxDobFromAge = subYears(new Date(), age);
  const dobDiff = Math.abs(
    Math.round(differenceInMonths(approxDobFromAge, dobDate) / 12)
  );
  return dobDiff;
};
