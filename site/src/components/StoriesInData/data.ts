import storiesData from "./stories-data.json";
import type {
  StorySchema,
  ChartSeries,
  BreakdownSlice,
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
  const col = DATA[source][key];
  if (!col) throw new Error(`stories-data.json missing ${source}.${key}`);
  return col;
}

function toSeries(field: TimeField): ChartSeries {
  const values = column(field.source, field.key);
  return {
    label: field.label,
    color: field.color,
    points: DATA.dates.map((date, i) => ({ date, value: values[i] })),
  };
}

/** Series for any time-based schema (line / area / stacked). */
export function getSeries(schema: StorySchema): ChartSeries[] {
  if (schema.type === "breakdown") return [];
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
 * The date a breakdown's data actually runs to, when that needs disclosing —
 * otherwise null. The identified-records list trails the daily aggregate by
 * months and the gap moves with every release, so the modal reads the date from
 * the data rather than the caption naming one that goes stale. Keyed on the
 * parts' dataset, not on "is this a donut": another breakdown off a
 * current dataset gets no note.
 */
export function getCoverageThrough(schema: StorySchema): string | null {
  if (schema.type !== "breakdown") return null;
  const readsKnownKilled = schema.parts.some((p) => p.key.startsWith("known_killed_in_gaza."));
  return readsKnownKilled ? DATA.summary.known_killed_in_gaza.includes_until : null;
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
