/**
 * mapping from v2 KiG object format to v3 KiG arryay format
 * based on field index order below (kig3FieldIndex)
 */
export const kig3ColMapping = Object.freeze({
  id: 0,
  en_name: 1,
  name: 2,
  age: 3,
  dob: 4,
  sex: 5,
  update: 6,
});

export const kig3FieldIndex = Object.freeze([
  "id",
  "en_name",
  "ar_name",
  "age",
  "dob",
  "sex",
  "update",
]);
