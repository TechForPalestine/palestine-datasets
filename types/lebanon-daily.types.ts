/**
 * lebanon_casualties_daily.json — one row per report from Lebanon's Ministry of
 * Public Health.
 *
 * Unlike the Gaza series, rows exist only for dates a report was actually
 * published: the build does not fill calendar gaps, so consecutive rows can be
 * several days apart and `report_period` states how many hours a row covers.
 *
 * MoPH restarts its cumulative count at zero for each escalation, so the series
 * spans two counting phases (see `phase`). To keep one Oct-2023 origin shared
 * with the Gaza and West Bank datasets, `killed_cum` / `injured_cum` are the
 * continuous totals since 8 October 2023, derived by the build; the figure as
 * MoPH actually published it — relative to its own phase — is preserved
 * alongside in `killed_cum_reported` / `injured_cum_reported`. Comparing a row
 * against its cited source means reading the `_reported` fields.
 *
 * The cumulative figures are authoritative and always present; the daily
 * `killed` / `injured` deltas are only set when the source gives them.
 */
export type LebanonDailyReportV3 = {
  report_date: string;
  /**
   * Who published the figures on this row. MoPH is the originating authority
   * throughout, but it ran no cumulative series before 28 Oct 2024, so earlier
   * phase-1 rows carry totals as relayed by OCHA flash updates or WHO EMRO
   * situation reports.
   */
  report_source: "moph_lb" | "ocha" | "who";
  /** hours covered by this report; a multiple of 24 when days are skipped. */
  report_period: number;
  /** MoPH counting episode: 1 = from 8 Oct 2023, 2 = from 2 Mar 2026. */
  phase: number;
  killed?: number;
  /** continuous total killed since 8 Oct 2023 (derived across phases). */
  killed_cum: number;
  /** killed as published for `phase`, before rebasing onto the continuous series. */
  killed_cum_reported: number;
  injured?: number;
  /** continuous total injured since 8 Oct 2023 (derived across phases). */
  injured_cum: number;
  /** injured as published for `phase`, before rebasing onto the continuous series. */
  injured_cum_reported: number;
};
