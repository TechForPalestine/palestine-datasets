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

/** Datasets that are daily time series (one row per `report_date`). */
export type TimeseriesSource = "casualties_daily" | "west_bank_daily";

/** All sources a story can read from. */
export type StorySource = TimeseriesSource | "summary";

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
  | "ext_injured_cum";

/**
 * Cumulative numeric columns of `west_bank_daily.json`.
 * @see WestBankDailyReportV2 in /types/west-bank-daily.types.ts
 */
export type WestBankDailyKey =
  | "killed_cum"
  | "killed_children_cum"
  | "injured_cum"
  | "settler_attacks_cum";

/**
 * Paths into `summary.json` (gaza.killed breakdown).
 * @see PreviewDataV3 in /types/summary.types.ts
 */
export type SummaryKey =
  | "gaza.killed.children"
  | "gaza.killed.women"
  | "gaza.killed.medical"
  | "gaza.killed.press"
  | "gaza.killed.civil_defence";

/**
 * Values computed in `data.ts` from the columns above — not raw dataset
 * columns. Kept in the type so the schema can be honest about provenance.
 */
export type DerivedKey =
  /** ext_killed_cum − ext_killed_children_cum − ext_killed_women_cum */
  | "ext_killed_men_other_cum"
  /** gaza.killed.total − (children + women + medical + press + civil_defence) */
  | "gaza.killed.men_other";

export type FieldKey = CasualtyDailyKey | WestBankDailyKey | SummaryKey | DerivedKey;

/* ----------------------------------------------------------------------------
 * Field descriptors
 * ------------------------------------------------------------------------- */

/** One plotted line / band, bound to a real time-series column. */
export interface TimeField {
  key: CasualtyDailyKey | WestBankDailyKey | DerivedKey;
  source: TimeseriesSource;
  label: string;
  /** CSS color or var(), e.g. "var(--story-red)". */
  color: string;
  /** true when the value is computed in data.ts rather than read directly. */
  derived?: boolean;
}

/** One slice of a categorical breakdown, bound to a summary path. */
export interface BreakdownPart {
  key: SummaryKey | DerivedKey;
  source: "summary";
  label: string;
  color: string;
  derived?: boolean;
}

/* ----------------------------------------------------------------------------
 * Schemas — discriminated by `type`, which mirrors the card's chart
 * ------------------------------------------------------------------------- */

export type SchemaType = "timeseries-multi" | "timeseries-area" | "stacked-area" | "breakdown";

/** Two or more cumulative lines sharing an x axis. */
export interface TimeseriesMultiSchema {
  type: "timeseries-multi";
  x: "report_date";
  /** normalize each line to its own max so small + large series both read. */
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

/** Cumulative bands stacked bottom→top to a combined total. */
export interface StackedAreaSchema {
  type: "stacked-area";
  x: "report_date";
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

export type StorySchema =
  | TimeseriesMultiSchema
  | TimeseriesAreaSchema
  | StackedAreaSchema
  | BreakdownSchema;

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
}

export interface BreakdownSlice {
  label: string;
  color: string;
  value: number;
}
