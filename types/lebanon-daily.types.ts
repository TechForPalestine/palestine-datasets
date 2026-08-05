/**
 * lebanon_casualties_daily.json — one row per report from Lebanon's Ministry of
 * Public Health.
 *
 * Unlike the Gaza series, rows exist only for dates the ministry actually
 * reported: the build does not fill calendar gaps, so consecutive rows can be
 * several days apart and `report_period` states how many hours a row covers.
 * The cumulative figures are authoritative and always present; the daily
 * `killed` / `injured` deltas are only set when the source gives them.
 */
export type LebanonDailyReportV3 = {
  report_date: string;
  report_source: "moph_lb";
  /** hours covered by this report; a multiple of 24 when days are skipped. */
  report_period: number;
  killed?: number;
  killed_cum: number;
  injured?: number;
  injured_cum: number;
};
