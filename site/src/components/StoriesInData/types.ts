/**
 * StoriesInData — typed schema for the home-page "Stories in the data" carousel.
 *
 * Every Story carries a `schema` that *describes the data behind its chart*. The
 * `schema.type` mirrors the chart you see on the card, and every `key` is a real
 * column in one of the published datasets (see the linked dataset type per source).
 * Nothing here is illustrative — `data.ts` reads these exact keys out of the
 * generated `stories-data.json`.
 */

/* ----------------------------------------------------------------------------
 * Dataset sources + their column keys (the "typed" part of the typed schema)
 * ------------------------------------------------------------------------- */

/**
 * Datasets whose values are emitted as one time series aligned onto the
 * shared `dates[]` axis. `casualties_daily` / `west_bank_daily` /
 * `lebanon_casualties_daily` report daily; `killed_in_gaza` doesn't — its
 * identified-record count only moves on the list's ten irregular republish
 * batches — but generate-stories-data.ts still carries it forward flat onto
 * the same date grid, so it fits the same `TimeField` shape.
 */
export type TimeseriesSource =
  | "casualties_daily"
  | "west_bank_daily"
  | "lebanon_casualties_daily"
  | "killed_in_gaza";

/**
 * The PCBS 2017 census reference table (`gaza-population-pcbs-2017.json`) used
 * as the population denominator for the death-rate-by-age story. It's a
 * reference dataset the generator reads, not one of this project's published
 * daily/summary datasets — hence its own source id rather than folding it
 * into `TimeseriesSource`.
 */
export type PopulationSource = "gaza_population_pcbs_2017";

/** All sources a story can read from. */
export type StorySource = TimeseriesSource | "summary" | PopulationSource;

/**
 * Cumulative numeric columns of `casualties_daily.json`.
 * @see CasualtyDailyReportV2 in /types/casualties-daily.types.ts
 */
export type CasualtyDailyKey =
  | "ext_killed_cum"
  | "ext_killed_children_cum"
  | "ext_killed_women_cum"
  | "ext_med_killed_cum"
  | "ext_press_killed_cum"
  | "ext_civdef_killed_cum"
  | "aid_seeker_killed_cum"
  | "ext_injured_cum"
  /** rolling window, see {@link RollingKey} */
  | "ext_killed_new_30d";

/**
 * Cumulative numeric columns of `west_bank_daily.json`.
 * @see WestBankDailyReportV2 in /types/west-bank-daily.types.ts
 */
export type WestBankDailyKey =
  | "killed_cum"
  | "killed_children_cum"
  | "displaced_persons_cum"
  | "settler_attacks_cum"
  /** rolling window, see {@link RollingKey} */
  | "killed_new_30d";

/**
 * Cumulative numeric columns of `lebanon_casualties_daily.json`. This dataset
 * only begins partway through the window; before its first report every column
 * reads 0.
 * @see LebanonDailyReportV3 in /types/lebanon-daily.types.ts
 */
export type LebanonDailyKey =
  | "killed_cum"
  /** rolling window, see {@link RollingKey} */
  | "killed_new_30d";

/**
 * `*_new_30d` columns are not raw dataset columns: generate-stories-data.ts
 * derives them from the matching `*_cum` column at full daily resolution as
 * "how much this count grew in the trailing 30 days as of this date". They let
 * a chart show the *current pace* — and its spikes — instead of a running
 * total, whose monotonic climb flattens every surge into the same slope.
 *
 * 30 days rather than daily deltas because the underlying datasets report on
 * an irregular cadence and the JSON is sampled down to ~140 points: a daily
 * rate would alias, dropping most spikes between samples.
 */
export type RollingKey = "ext_killed_new_30d" | "killed_new_30d";

/**
 * Age/sex groups of `summary.json`'s `known_killed_in_gaza` — the individually
 * identified records, not the ministry's running aggregate. The dataset counts
 * each record exactly once under a gendered age group, so these keys are
 * disjoint and sum to `records`.
 *
 * There is deliberately no press / medical / civil-defence key here: those
 * people *are* included in these counts, but the dataset carries no profession
 * field, so they cannot be separated back out of the age groups. Slicing a
 * part-to-whole chart by both would double-count.
 *
 * @see PreviewDataV3 in /types/summary.types.ts
 */
export type SummaryKey =
  | "known_killed_in_gaza.male_child"
  | "known_killed_in_gaza.female_child"
  | "known_killed_in_gaza.male_adult"
  | "known_killed_in_gaza.female_adult"
  /** both sexes: seniors are ~5% of the list, so split they'd be two slivers. */
  | "known_killed_in_gaza.senior"
  /** records whose age was not recorded; currently 0, kept so the sum is honest. */
  | "known_killed_in_gaza.no_age";

/**
 * Values computed in `data.ts` from the columns above — not raw dataset
 * columns. Kept in the type so the schema can be honest about provenance.
 */
export type DerivedKey =
  /** ext_killed_cum − ext_killed_children_cum − ext_killed_women_cum */
  "ext_killed_men_other_cum";

/**
 * `killed_in_gaza`'s own time series — not read from a dataset column, but
 * built by generate-stories-data.ts from the identified-record list's ten
 * historical batches (`updateDates` in
 * scripts/data/common/killed-in-gaza/constants.ts). Each batch's records are
 * counted and added to a running total, and that total is placed at the
 * batch's `includesUntil` date — the date the batch's records cover *through*
 * — not its later `on` (publish) date. `includesUntil` is the honest x
 * position: it's what the list can truthfully claim as of that point, while
 * `on` is just when the ministry got around to saying so.
 */
export type KilledInGazaKey = "identified_cum";

export type FieldKey =
  | CasualtyDailyKey
  | WestBankDailyKey
  | LebanonDailyKey
  | SummaryKey
  | DerivedKey
  | KilledInGazaKey;

/* ----------------------------------------------------------------------------
 * Field descriptors
 * ------------------------------------------------------------------------- */

/** One plotted line / band, bound to a real time-series column. */
export interface TimeField {
  key: CasualtyDailyKey | WestBankDailyKey | LebanonDailyKey | DerivedKey | KilledInGazaKey;
  source: TimeseriesSource;
  label: string;
  /** CSS color or var(), e.g. "var(--story-red)". */
  color: string;
  /** true when the value is computed in data.ts rather than read directly. */
  derived?: boolean;
  /**
   * Draw this line step-after (hold flat, then jump vertically at the next
   * known date) instead of interpolating a slanted line between points. A
   * straight line between two known values depicts continuous change that
   * didn't happen; it's only honest for series with a real value on every
   * sampled date. Series like `identified_cum` only change on the handful of
   * dates a batch actually landed — everything between two batches is a flat
   * carry-forward, not a slope — so they opt into `step`. Defaults off,
   * which keeps every other (daily) field rendering exactly as before.
   */
  step?: boolean;
  /**
   * Opt-in acknowledgment that this column has gone quiet, with the reason a
   * human is vouching for that being honest. generate-stories-data.ts fails
   * the build when a plotted column's last real value-change is older than
   * its staleness threshold — unless this is set. It's a required string,
   * not a bare boolean, because "yes I checked" isn't the point; the point is
   * that whoever set it had to write down *why* a flat line here isn't the
   * failure mode the guard exists to catch (a caption asserting motion, or a
   * dual-scaled line pinned at 1.0, over a column the source quietly stopped
   * updating). Two honest reasons in practice: the column is a genuine
   * irregular/step series (e.g. `identified_cum`'s republish batches — long
   * gaps are the series working as intended), or the source stopped
   * publishing that disaggregation and the story's own copy already says so
   * plainly rather than asserting a rate over it.
   */
  staleOk?: string;
}

/** One slice of a categorical breakdown, bound to a summary path. */
export interface BreakdownPart {
  key: SummaryKey;
  source: "summary";
  label: string;
  color: string;
  derived?: boolean;
  /** see {@link TimeField.staleOk} — same contract, for breakdown-sourced fields. */
  staleOk?: string;
}

/**
 * One 5-year age band of the population pyramid. `min` is the lower bound in
 * years; the top band (`min: 85`) is "85+", left unbounded because the
 * dataset doesn't cap recorded ages.
 */
export interface HistogramBand {
  min: number;
  label: string;
}

/**
 * One side of the pyramid — men or women — sharing the centerline. Unlike
 * `TimeField`/`BreakdownPart` there's no `key`: a side isn't one dataset
 * column, it's "this sex's count within each band," which the generator
 * computes by crossing two columns (`age`, `sex`) rather than reading one.
 */
export interface HistogramSide {
  label: string;
  color: string;
}

/**
 * One 5-year age band of the death-rate-by-age chart. Unlike `HistogramBand`
 * this is deliberately not open-ended at either end — the generator only
 * emits bands 5-9 through 75-79 (see `RateByAgeSchema`), so `min`/`max` are
 * both always finite here.
 */
export interface RateBand {
  min: number;
  max: number;
  label: string;
}

/**
 * One sex's line in the rate chart. Like `HistogramSide`, there's no `key` —
 * the generator computes a rate per (band, sex) rather than reading one
 * dataset column.
 */
export interface RateSide {
  label: string;
  color: string;
}

/* ----------------------------------------------------------------------------
 * Schemas — discriminated by `type`, which mirrors the card's chart
 * ------------------------------------------------------------------------- */

export type SchemaType =
  | "timeseries-multi"
  | "timeseries-area"
  | "stacked-area"
  | "breakdown"
  | "histogram"
  | "rate-by-age";

/** Two or more cumulative lines sharing an x axis. */
export interface TimeseriesMultiSchema {
  type: "timeseries-multi";
  x: "report_date";
  /**
   * Normalize each line to its own maximum instead of a shared axis. This is
   * a justified exception, not the default reach for "series of different
   * sizes" — once every line has its own scale, a reader's eye naturally
   * compares vertical *position*, and that comparison stops being backed by
   * the data: a tiny series and a huge one both end at the same height. Turn
   * it on only when the magnitudes differ enough that a shared scale would
   * flatten the smaller line to invisibility, and only alongside two things:
   * the caption discloses that each line is scaled to its own maximum, and
   * the insight makes no claim that depends on comparing the lines' heights
   * or positions (the tooltip still reports true values either way).
   */
  dualScale?: boolean;
  sources: TimeseriesSource[];
  fields: TimeField[];
}

/** A single cumulative line drawn as a filled area. */
export interface TimeseriesAreaSchema {
  type: "timeseries-area";
  x: "report_date";
  sources: TimeseriesSource[];
  fields: [TimeField];
}

/** Bands stacked bottom→top to a combined total. */
export interface StackedAreaSchema {
  type: "stacked-area";
  x: "report_date";
  /**
   * "percent" restacks each column to 100%, so the chart reads as *share* of
   * the combined total rather than its absolute size. Omit for absolute bands.
   */
  normalize?: "percent";
  sources: TimeseriesSource[];
  fields: TimeField[];
}

/** A categorical part-to-whole breakdown (donut). */
export interface BreakdownSchema {
  type: "breakdown";
  x: null;
  sources: ["summary"];
  centerLabel: string;
  parts: BreakdownPart[];
}

/**
 * An age/sex population pyramid of the individually identified dead. This
 * reads killed-in-gaza-v3.min.json — the per-record list — rather than
 * summary.json's `known_killed_in_gaza` aggregate the breakdown donut uses,
 * because that aggregate only carries six pre-summed age/sex buckets. The
 * per-record list still has single-year ages, so it can be rebinned into
 * 5-year bands; the donut's six buckets can't be un-summed back into that
 * resolution. Both read the same underlying identification work — this
 * schema just asks a finer question of it.
 */
export interface HistogramSchema {
  type: "histogram";
  x: null;
  sources: ["killed_in_gaza"];
  left: HistogramSide;
  right: HistogramSide;
  bands: HistogramBand[];
}

/**
 * Death rate per 1,000 pre-war population, by 5-year age band and sex — the
 * pyramid's records (the numerator) against the PCBS 2017 census, aged
 * forward and scaled to a 2023 population size (the denominator; see
 * `RATE_AGE_SHIFT_YEARS` / `RATE_POP_SCALE_*` in generate-stories-data.ts for
 * exactly how). `x` is categorical — an age band, not a date — because this
 * is a cross-sectional comparison of two rates, not a time series.
 */
export interface RateByAgeSchema {
  type: "rate-by-age";
  x: "age_band";
  sources: ["killed_in_gaza", PopulationSource];
  male: RateSide;
  female: RateSide;
  bands: RateBand[];
}

export type StorySchema =
  | TimeseriesMultiSchema
  | TimeseriesAreaSchema
  | StackedAreaSchema
  | BreakdownSchema
  | HistogramSchema
  | RateByAgeSchema;

/* ----------------------------------------------------------------------------
 * Story
 * ------------------------------------------------------------------------- */

export interface Story {
  /** stable id, used as the modal route + React key. */
  id: string;
  kicker: string;
  title: string;
  /** one-line takeaway shown on the card and modal. */
  insight: string;
  /** longer note shown under the chart in the modal. */
  caption: string;
  schema: StorySchema;
}

/* ----------------------------------------------------------------------------
 * Runtime chart shapes (produced by data.ts from the schema)
 * ------------------------------------------------------------------------- */

export interface SeriesPoint {
  date: string;
  value: number;
}

export interface ChartSeries {
  label: string;
  color: string;
  points: SeriesPoint[];
  /** carried from TimeField.step — see that field's doc comment. */
  step?: boolean;
}

export interface BreakdownSlice {
  label: string;
  color: string;
  value: number;
}

/** One row of the pyramid — a band's true count on each side. */
export interface PyramidBand {
  label: string;
  left: number;
  right: number;
}

/**
 * One row of the rate-by-age chart — a band's true rate per 1,000 for each
 * sex, plus the raw killed count and scaled population behind it, so a
 * tooltip can show the arithmetic rather than just the ratio.
 */
export interface AgeRateBand {
  label: string;
  male: number;
  female: number;
  maleKilled: number;
  femaleKilled: number;
  malePop: number;
  femalePop: number;
}
