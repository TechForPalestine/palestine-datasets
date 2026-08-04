import storiesData from "./stories-data.json";
import type {
  StorySchema,
  ChartSeries,
  BreakdownSlice,
  PyramidBand,
  AgeRateBand,
  TimeField,
  TimeseriesSource,
} from "./types";

/**
 * Reads the typed schema (stories.ts) against the generated data
 * (stories-data.json) and produces ready-to-plot series / slices.
 *
 * The JSON is built by generate-stories-data.ts from the published datasets;
 * the shape below is the contract between that script and this component.
 */
interface StoriesData {
  meta: {
    lastUpdate: string;
    startDate: string;
    days: number;
    points: number;
    rollingDays: number;
  };
  dates: string[];
  casualties_daily: Record<string, number[]>;
  west_bank_daily: Record<string, number[]>;
  lebanon_casualties_daily: Record<string, number[]>;
  summary: {
    known_killed_in_gaza: {
      records: number;
      includes_until: string;
      male_child: number;
      female_child: number;
      male_adult: number;
      female_adult: number;
      senior: number;
      no_age: number;
    };
  };
  killed_in_gaza: {
    total: number;
    nullAge: number;
    unknownSex: number;
    binned: number;
    bands: { min: number; male: number; female: number }[];
    identified_cum: number[];
  };
  rate_by_age: {
    bands: {
      min: number;
      label: string;
      male: number;
      female: number;
      maleKilled: number;
      femaleKilled: number;
      malePop: number;
      femalePop: number;
    }[];
    meta: {
      sourceId: string;
      shiftYears: number;
      scale: { factor: number; numerator: number; denominator: number };
      excludedBandsReason: string;
    };
  };
}

const DATA = storiesData as StoriesData;
const numFmt = new Intl.NumberFormat();

export const lastUpdate = DATA.meta.lastUpdate;

/** Dataset column → array, with the one derived time series computed here. */
function column(source: TimeseriesSource, key: string): number[] {
  if (key === "ext_killed_men_other_cum") {
    const total = DATA.casualties_daily.ext_killed_cum;
    const child = DATA.casualties_daily.ext_killed_children_cum;
    const women = DATA.casualties_daily.ext_killed_women_cum;
    return total.map((t, i) => Math.max(0, t - child[i] - women[i]));
  }
  // killed_in_gaza's own object carries the pyramid's fixed-shape summary
  // fields alongside identified_cum, not a Record<string, number[]> like the
  // three daily datasets — handled here rather than by the generic lookup
  // below so that lookup can stay simply typed for the daily sources.
  if (source === "killed_in_gaza") {
    if (key !== "identified_cum") throw new Error(`Unknown killed_in_gaza field ${key}`);
    return DATA.killed_in_gaza.identified_cum;
  }
  const col = DATA[source][key];
  if (!col) throw new Error(`stories-data.json missing ${source}.${key}`);
  return col;
}

function toSeries(field: TimeField): ChartSeries {
  const values = column(field.source, field.key);
  return {
    label: field.label,
    color: field.color,
    step: field.step,
    points: DATA.dates.map((date, i) => ({ date, value: values[i] })),
  };
}

/** Series for any time-based schema (line / area / stacked). */
export function getSeries(schema: StorySchema): ChartSeries[] {
  if (schema.type === "breakdown" || schema.type === "histogram" || schema.type === "rate-by-age")
    return [];
  return schema.fields.map(toSeries);
}

/**
 * Slices for a breakdown schema. The age groups are disjoint and sum to
 * `records`, so the donut is a true part-to-whole. Empty groups (today:
 * `no_age`) are dropped rather than drawn as a zero-width arc with a legend
 * entry — they'd read as a category that exists but is invisible.
 */
export function getBreakdown(schema: StorySchema): { slices: BreakdownSlice[]; total: number } {
  if (schema.type !== "breakdown") return { slices: [], total: 0 };
  const k = DATA.summary.known_killed_in_gaza;
  const value = (key: string): number => {
    const group = key.replace("known_killed_in_gaza.", "") as keyof typeof k;
    const v = k[group];
    if (typeof v !== "number") throw new Error(`Unknown breakdown key ${key}`);
    return v;
  };
  const slices = schema.parts
    .map((p) => ({ label: p.label, color: p.color, value: value(p.key) }))
    .filter((s) => s.value > 0);
  return { slices, total: k.records };
}

/**
 * Bands for the population pyramid. Each cell (band, sex) comes from one
 * pass over the individually identified records at build time, so left/right
 * are true counts, not derived from the donut's coarser buckets. `maxValue`
 * is the max across *both* sides so a chart scales left and right off one
 * shared axis — a side its own max would make bar length incomparable
 * across the centerline.
 */
export function getHistogram(schema: StorySchema): {
  bands: PyramidBand[];
  maxValue: number;
  total: number;
} {
  if (schema.type !== "histogram") return { bands: [], maxValue: 0, total: 0 };
  const data = DATA.killed_in_gaza;
  const bands = schema.bands.map((b) => {
    const row = data.bands.find((r) => r.min === b.min);
    if (!row) throw new Error(`stories-data.json missing killed_in_gaza band ${b.min}`);
    return { label: b.label, left: row.male, right: row.female };
  });
  const maxValue = Math.max(...bands.flatMap((b) => [b.left, b.right])) || 1;
  return { bands, maxValue, total: data.binned };
}

/**
 * Rows for the death-rate-by-age chart. Both sexes share one `maxValue` (the
 * max rate across either sex, any band) for the same reason the pyramid
 * shares one `maxValue` across the centerline: separate scales would make
 * the male and female lines' relative height meaningless, and this chart
 * exists specifically to make that comparison honest — flat female line,
 * humped male line, on one axis.
 */
export function getRateByAge(schema: StorySchema): { bands: AgeRateBand[]; maxValue: number } {
  if (schema.type !== "rate-by-age") return { bands: [], maxValue: 0 };
  const data = DATA.rate_by_age;
  const bands = schema.bands.map((b) => {
    const row = data.bands.find((r) => r.min === b.min);
    if (!row) throw new Error(`stories-data.json missing rate_by_age band ${b.min}`);
    return {
      label: b.label,
      male: row.male,
      female: row.female,
      maleKilled: row.maleKilled,
      femaleKilled: row.femaleKilled,
      malePop: row.malePop,
      femalePop: row.femalePop,
    };
  });
  const maxValue = Math.max(...bands.flatMap((b) => [b.male, b.female])) * 1.08 || 1;
  return { bands, maxValue };
}

/**
 * The date a breakdown's or pyramid's data actually runs to, when that needs
 * disclosing — otherwise null. The identified-records list trails the daily
 * aggregate and the gap moves with every release, so the modal reads the date
 * from the data rather than the caption naming one that goes stale. Keyed on
 * *which dataset the parts read* — `known_killed_in_gaza` / `killed_in_gaza`
 * are the same underlying identification work — not on "is this a donut", so
 * a future breakdown off a current dataset gets no note.
 */
export function getCoverageThrough(schema: StorySchema): string | null {
  if (schema.type === "breakdown") {
    const readsKnownKilled = schema.parts.some((p) => p.key.startsWith("known_killed_in_gaza."));
    return readsKnownKilled ? DATA.summary.known_killed_in_gaza.includes_until : null;
  }
  if (schema.type === "histogram") return DATA.summary.known_killed_in_gaza.includes_until;
  return null;
}

export const fmt = (n: number) => numFmt.format(Math.round(n));

export function fmtShort(n: number): string {
  n = Math.round(n);
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k";
  return String(n);
}

export function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
