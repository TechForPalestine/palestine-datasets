/**
 * separate types file since we use this on the homepage to type
 * the env var "import" but also so that the generating script
 * can conform to that type
 *
 * (and avoid importing the JSON inadvertently in our web build)
 */

export type PreviewDataV1 = {
  martyrListCount: number;
  lastDailyUpdate: string;
  massacres: number;
  martyred: {
    total: number;
    children: number;
    civilDefence: number;
    women: number;
    press: number;
    medical: number;
  };
  injured: {
    total: number;
  };
};

export type PreviewDataV2 = {
  killedInGazaListCount: number;
  dailyReportCount: number;
  lastDailyUpdate: string;
  massacres: number;
  killed: {
    total: number;
    children: number;
    civilDefence: number;
    women: number;
    press: number;
    medical: number;
  };
  injured: {
    total: number;
  };
};

export type PreviewDataV3 = {
  gaza: {
    reports: number;
    last_update: string;
    massacres: number;
    killed: {
      total: number;
      children: number;
      civil_defence: number;
      women: number;
      press: number;
      medical: number;
    };
    injured: {
      total: number;
    };
  };
  west_bank: {
    reports: number;
    last_update: string;
    killed: {
      total: number;
      children: number;
    };
    injured: {
      total: number;
      children: number;
    };
    settler_attacks: number;
  };
  known_killed_in_gaza: {
    records: number;
    male: {
      senior: number;
      adult: number;
      child: number;
      no_age: number;
    };
    female: {
      senior: number;
      adult: number;
      child: number;
      no_age: number;
    };
  };
};
