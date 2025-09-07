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
  "ar_name",
  "en_name",
  "age",
  "dob",
  "sex",
  "update",
] as const;

export type KiG3ColumnKey = Readonly<(typeof kig3FieldIndex)[number]>;
