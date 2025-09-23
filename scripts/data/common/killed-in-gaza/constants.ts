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

export const canonicalUpdateCommits = [
  "389c0b4db80d8765039579f06f40b434efb129c8", // 1: Feb 2024
  "408b08baea1446d75d41e4d1e9fd2f7493d5b4a7", // 2: April 2024
  "57ca16478b6ea15502a2366bb70584f9f0db85c3", // 3: May 2024
  "9f7e93dbff3aa5101c37be40b69045d5ce77d410", // 4: June/July 2024
  "8ef255407d7cb9d77a8d5e70094c29c6ccebbace", // 5: August/September 2024
  "9f628a0b779fba1b4b87ce5f50925accdad24494", // 6: March-May 2025 (IBC)
  "b936c35ff3556d31df0833815456b9820b4882c8", // 7: June/July 2025 (IBC)
  "4e95d05d79fffe232d7e551a89e3913199addf46", // 8: July 2025 (IBC)
  "68a207a49227514b0822f8816add4415718ec172", // 9: August 2025 (IBC)
];

export const updateDates = [
  { number: 1, on: "2024-02-19", includesUntil: "2024-01-05" },
  { number: 2, on: "2024-04-29", includesUntil: "2024-03-29" },
  { number: 3, on: "2024-07-18", includesUntil: "2024-04-30" },
  { number: 4, on: "2024-09-07", includesUntil: "2024-06-30" },
  { number: 5, on: "2024-09-21", includesUntil: "2024-08-31" },
  { number: 6, on: "2025-05-22", includesUntil: "2025-03-23" },
  { number: 7, on: "2025-07-06", includesUntil: "2025-06-15" },
  { number: 8, on: "2025-07-21", includesUntil: "2025-07-15" },
  { number: 9, on: "2025-08-17", includesUntil: "2025-07-31" },
];

export const updateLinks = [
  "https://data.techforpalestine.org/updates/killed-in-gaza-update-1/",
  "https://data.techforpalestine.org/updates/killed-in-gaza-update-2/",
  "https://data.techforpalestine.org/updates/killed-in-gaza-update-3/",
  "https://data.techforpalestine.org/updates/killed-in-gaza-update-4/",
  "https://data.techforpalestine.org/updates/killed-in-gaza-update-5/",
  "https://data.techforpalestine.org/updates/killed-in-gaza-update-6/",
  "https://data.techforpalestine.org/updates/killed-in-gaza-update-2025-06-15/",
  "https://data.techforpalestine.org/updates/killed-in-gaza-update-2025-07-15/",
  "https://data.techforpalestine.org/updates/killed-in-gaza-update-2025-08-17/",
];

export type ExistingRecord = {
  id: string;
  name_ar_raw: string;
  dob: string;
  sex: "m" | "f";
  age: string;
  source: "h" | "c" | "u";
};

export type NewRecord = {
  index: string;
  name_ar_raw: string;
  id: string;
  dob: string;
  sex: "m" | "f";
  age: string;
  source: string;
};
