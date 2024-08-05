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
