export type WestBankDailyVerified = {
  killed: number;
  killed_cum: number;
  injured: number;
  injured_cum: number;
  killed_children: number;
  killed_children_cum: number;
  injured_children: number;
  injured_children_cum: number;
};

export type WestBankDailyReportV2 = {
  report_date: string;
  verified?: WestBankDailyVerified;
  killed_cum: number;
  killed_children_cum: number;
  injured_cum: number;
  injured_children_cum: number;
  settler_attacks_cum: number;
  flash_source: string;
};
