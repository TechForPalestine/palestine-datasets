// we've found that the RTL column order in the ar_ar dict csv isn't reliable in CI
// so if the key isn't in the resulting dict we either invert it or throw an error
export const arToArAssertKey = "ابو الليل";

const reportingSource = "تبليغ ذوي الشهداء";
const ministrySource = "سجالت وزارة الصحة";
const unknownSource = "unknown";
export const sourceMapping = {
  [reportingSource]: "c",
  [ministrySource]: "h",
  [unknownSource]: "u",
};

export type ExistingRecord = {
  id: string;
  name_ar_raw: string;
  dob: string;
  sex: "M" | "F";
  age: string;
  source: "h" | "c" | "u";
};

export type NewRecord = {
  index: string;
  name_ar_raw: string;
  id: string;
  dob: string;
  sex: "M" | "F";
  age: string;
  source: string;
};
