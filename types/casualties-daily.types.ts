export type CasualtyDailyReport = {
  report_date: string;
  report_source: "mohtel" | "gmotel" | "unocha" | "missing";
  martyred_cum?: number;
  ext_martyred: number;
  ext_martyred_cum: number;
  injured_cum?: number;
  ext_injured: number;
  ext_injured_cum: number;
  med_martyred_cum?: number;
  ext_med_martyred_cum: number;
  press_martyred_cum?: number;
  ext_press_martyred_cum: number;
};
