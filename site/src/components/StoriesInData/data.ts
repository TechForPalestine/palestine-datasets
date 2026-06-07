import storiesData from "./stories-data.json";
import type {
  Story,
  StorySchema,
  ChartSeries,
  BreakdownSlice,
  TimeField,
} from "./types";

/**
 * Reads the typed schema (stories.ts) against the generated data
 * (stories-data.json) and produces ready-to-plot series / slices.
 *
 * The JSON is built by generate-stories-data.ts from the published datasets;
 * the shape below is the contract between that script and this component.
 */
interface StoriesData {
  meta: { lastUpdate: string; startDate: string; days: number; points: number };
  dates: string[];
  casualties_daily: Record<string, number[]>;
  west_bank_daily: Record<string, number[]>;
  summary: {
    gaza: {
      killed: {
        total: number;
        children: number;
        women: number;
        medical: number;
        press: number;
        civil_defence: number;
      };
    };
  };
}

const DATA = storiesData as StoriesData;
const numFmt = new Intl.NumberFormat();

export const lastUpdate = DATA.meta.lastUpdate;

/** Cumulative column → array, with the one derived time series computed here. */
function column(source: "casualties_daily" | "west_bank_daily", key: string): number[] {
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

/** Slices for a breakdown schema, including the derived remainder. */
export function getBreakdown(schema: StorySchema): { slices: BreakdownSlice[]; total: number } {
  if (schema.type !== "breakdown") return { slices: [], total: 0 };
  const k = DATA.summary.gaza.killed;
  const named = k.children + k.women + k.medical + k.press + k.civil_defence;
  const value = (key: string): number => {
    switch (key) {
      case "gaza.killed.children": return k.children;
      case "gaza.killed.women": return k.women;
      case "gaza.killed.medical": return k.medical;
      case "gaza.killed.press": return k.press;
      case "gaza.killed.civil_defence": return k.civil_defence;
      case "gaza.killed.men_other": return Math.max(0, k.total - named);
      default: throw new Error(`Unknown breakdown key ${key}`);
    }
  };
  const slices = schema.parts.map((p) => ({ label: p.label, color: p.color, value: value(p.key) }));
  return { slices, total: k.total };
}

/** Latest cumulative value of a story's first series (for card chips/labels). */
export function latestHeadline(story: Story): number {
  if (story.schema.type === "breakdown") {
    return getBreakdown(story.schema).total;
  }
  const series = getSeries(story.schema);
  if (story.schema.type === "stacked-area") {
    return series.reduce((sum, s) => sum + s.points[s.points.length - 1].value, 0);
  }
  const first = series[0].points;
  return first[first.length - 1].value;
}

export const fmt = (n: number) => numFmt.format(Math.round(n));

export function fmtShort(n: number): string {
  n = Math.round(n);
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k";
  return String(n);
}

export function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
