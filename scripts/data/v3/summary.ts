import type { PreviewDataV3 } from "../../../types/summary.types";
import { writeJson } from "../../utils/fs";
import { ApiResource } from "../../../types/api.types";

import killedPersons from "../../../killed-in-gaza.json";
import killedPress from "../../../press_killed_in_gaza.json";
import gazaDailies from "../../../casualties_daily.json";
import westBankDailies from "../../../west_bank_daily.json";

const [lastGazaReport] = gazaDailies.slice().reverse();
const [lastWestBankReport] = westBankDailies.slice().reverse();

const kigPageSize = 100;

const genderAge = (
  record: (typeof killedPersons)[0]
): [Exclude<typeof gender, undefined>, Exclude<typeof ageGroup, undefined>] => {
  let gender: "male" | "female" | undefined;
  let ageGroup: "no_age" | "senior" | "adult" | "child" | undefined;

  if (record.sex === "f") {
    gender = "female";
  }
  if (record.sex === "m") {
    gender = "male";
  }
  if (record.age >= 65) {
    ageGroup = "senior";
  }
  if (record.age < 18) {
    ageGroup = "child";
  }
  if (record.age === -1) {
    ageGroup = "no_age";
  }

  if (!gender) {
    throw new Error(`record ${record.id} had invalid sex (unexpected gender)`);
  }

  return [gender, ageGroup ?? "adult"];
};
const known_killed_in_gaza = killedPersons.reduce((acc, record) => {
  const [gender, ageGroup] = genderAge(record);
  const recordCount = (acc.records ?? 0) + 1;
  return {
    ...acc,
    records: recordCount,
    pages: Math.ceil(recordCount / kigPageSize),
    page_size: kigPageSize,
    [gender]: {
      ...acc[gender],
      [ageGroup]: (acc[gender]?.[ageGroup] ?? 0) + 1,
    },
  };
}, {} as PreviewDataV3["known_killed_in_gaza"]);

const previewData: PreviewDataV3 = {
  gaza: {
    reports: gazaDailies.length,
    last_update: lastGazaReport.report_date,
    massacres: lastGazaReport.ext_massacres_cum,
    killed: {
      total: lastGazaReport.ext_killed_cum,
      children: lastGazaReport.ext_killed_children_cum,
      women: lastGazaReport.ext_killed_women_cum,
      civil_defence: lastGazaReport.ext_civdef_killed_cum,
      press: lastGazaReport.ext_press_killed_cum,
      medical: lastGazaReport.ext_med_killed_cum,
    },
    famine: {
      total: lastGazaReport.famine_cum,
      children: lastGazaReport.child_famine_cum,
    },
    injured: {
      total: lastGazaReport.ext_injured_cum,
    },
  },
  west_bank: {
    reports: westBankDailies.length,
    last_update: lastWestBankReport.report_date,
    settler_attacks: lastWestBankReport.settler_attacks_cum,
    killed: {
      total:
        lastWestBankReport.verified?.killed_cum ??
        lastWestBankReport.killed_cum,
      children:
        lastWestBankReport.verified?.killed_children_cum ??
        lastWestBankReport.killed_children_cum,
    },
    injured: {
      total:
        lastWestBankReport.verified?.injured_cum ??
        lastWestBankReport.injured_cum,
      children:
        lastWestBankReport.verified?.injured_children_cum ??
        lastWestBankReport.injured_children_cum,
    },
  },
  known_killed_in_gaza,
  known_press_killed_in_gaza: {
    records: killedPress.length,
  },
};

writeJson(
  ApiResource.SummaryV3,
  "site/src/generated/summary.json",
  previewData
);
