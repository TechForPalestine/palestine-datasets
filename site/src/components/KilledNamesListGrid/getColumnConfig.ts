import { kig3FieldIndex, type KiG3ColumnKey } from "./types";

export const recordCols: Partial<Record<KiG3ColumnKey, number>> = {};
kig3FieldIndex.forEach((col, index) => {
  recordCols[col] = index;
});

const makeLookups = (columns: ReadonlyArray<KiG3ColumnKey>) => {
  const indices: Partial<Record<KiG3ColumnKey, number>> = {};
  columns.forEach((col, index) => {
    indices[col] = index;
  });

  return { indices, recordCols };
};

const getFullDesktopConfig = () => {
  const columns: ReadonlyArray<KiG3ColumnKey> = kig3FieldIndex;
  const colWeights = [1, 2, 3, 0.5, 1, 0.5, 0.5];
  const colWeightSum = colWeights.reduce((a, b) => a + b, 0);
  const colWeightShare = colWeights.map((w) => w / colWeightSum);
  return { columns, colWeightShare, ...makeLookups(columns) };
};

const getSmallDesktopTabletConfig = () => {
  const omit = ["update"];
  const columns = kig3FieldIndex.filter((c) => !omit.includes(c));
  // id, name, name, age, dob, sex
  const colWeights = [1, 2, 3, 0.5, 1, 0.5];
  const colWeightSum = colWeights.reduce((a, b) => a + b, 0);
  const colWeightShare = colWeights.map((w) => w / colWeightSum);
  return { columns, colWeightShare, ...makeLookups(columns) };
};

const getTabletConfig = () => {
  const omit = ["id", "sex", "update"];
  const columns = kig3FieldIndex.filter((c) => !omit.includes(c));
  // name, name, age, dob
  const colWeights = [1.5, 2, 0.5, 1];
  const colWeightSum = colWeights.reduce((a, b) => a + b, 0);
  const colWeightShare = colWeights.map((w) => w / colWeightSum);
  return { columns, colWeightShare, ...makeLookups(columns) };
};

const getPhabletConfig = () => {
  const omit = ["id", "dob", "sex", "update"];
  const columns = kig3FieldIndex.filter((c) => !omit.includes(c));
  // name, name, age
  const colWeights = [1.5, 2, 0.5];
  const colWeightSum = colWeights.reduce((a, b) => a + b, 0);
  const colWeightShare = colWeights.map((w) => w / colWeightSum);
  return { columns, colWeightShare, ...makeLookups(columns) };
};

const getPhoneConfig = () => {
  const omit = ["id", "age", "dob", "sex", "update"];
  const columns = kig3FieldIndex.filter((c) => !omit.includes(c));
  // name, name
  const colWeights = [1.2, 2];
  const colWeightSum = colWeights.reduce((a, b) => a + b, 0);
  const colWeightShare = colWeights.map((w) => w / colWeightSum);
  return { columns, colWeightShare, ...makeLookups(columns) };
};

const getSmallPhoneConfig = () => {
  const omit = ["id", "ar_name", "age", "dob", "sex", "update"];
  const columns = kig3FieldIndex.filter((c) => !omit.includes(c));
  // name
  const colWeights = [1];
  const colWeightSum = colWeights.reduce((a, b) => a + b, 0);
  const colWeightShare = colWeights.map((w) => w / colWeightSum);
  return { columns, colWeightShare, ...makeLookups(columns) };
};

export const getColumnConfig = (width: number) => {
  if (width < 615) {
    return getSmallPhoneConfig();
  }

  if (width < 720) {
    return getPhoneConfig();
  }

  if (width < 920) {
    return getPhabletConfig();
  }

  if (width < 1050) {
    return getTabletConfig();
  }

  if (width < 1200) {
    return getSmallDesktopTabletConfig();
  }

  return getFullDesktopConfig();
};
