export type PersonRow = [
  string,
  string,
  string,
  number,
  string,
  string,
  number
];

export const kig3FieldIndex = [
  "id",
  "en_name",
  "ar_name",
  "age",
  "dob",
  "sex",
  "update",
];

const colWeights = [1, 2, 3, 0.5, 1, 0.5, 0.5];
const colWeightSum = colWeights.reduce((a, b) => a + b, 0);
export const colWeightShare = colWeights.map((w) => w / colWeightSum);
