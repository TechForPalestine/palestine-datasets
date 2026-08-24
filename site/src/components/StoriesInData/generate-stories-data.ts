/**
 * generate-stories-data.ts
 *
 * Build-time generator for the home-page "Stories in the data" carousel.
 * Reads the published datasets and writes the typed stories-data.json that
 * data.ts consumes — same pattern as scripts/data/v3/*.ts.
 *
 * Run with bun (mirrors the other gen-* scripts in package.json):
 *   bun run site/src/components/StoriesInData/generate-stories-data.ts
 */
import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { CasualtyDailyReportV2 } from "../../../../types/casualties-daily.types";
import type { WestBankDailyReportV2 } from "../../../../types/west-bank-daily.types";
import type { LebanonDailyReportV3 } from "../../../../types/lebanon-daily.types";
import type { PreviewDataV3 } from "../../../../types/summary.types";
import { updateDates } from "../../../../scripts/data/common/killed-in-gaza/constants";
import { STORIES } from "./stories";
import type { TimeField, TimeseriesSource } from "./types";

const ROOT = join(import.meta.dir, "../../../..");
const OUT = join(ROOT, "site/src/generated/stories-data.json");

/** Number of points to sample across the window (keeps the JSON small). */
const POINTS = 140;

/**
 * Trailing window, in days, for the `*_new_<n>d` columns: how many people were
 * killed in the last N days as of each date. Computed at full daily resolution
 * before sampling, so the window is a real 30 days rather than 30 samples.
 */
const ROLLING_DAYS = 30;

/**
 * How many days a plotted column may go without its value actually changing
 * before the build fails. This exists because a frozen column is invisible
 * from the JSON alone — `cumColumn`'s carry-forward logic (below) repeats the
 * last known value forever whether the source stopped reporting a field or
 * genuinely hasn't changed, and a story's copy can keep asserting a "rate"
 * over that flat line long after the source went quiet (see the `press-medics`
 * story: `ext_med_killed_cum` froze at 1,701 in October 2025, but nothing
 * caught its caption still claiming a "steady, relentless rate" for months).
 * Exempt a specific field with `TimeField.staleOk` and a real reason — the
 * two honest ones in practice are "this is a genuine irregular/step series"
 * (e.g. `identified_cum`) or "the source stopped publishing this, and the
 * story's copy already says so instead of asserting a rate over it."
 */
const STALE_THRESHOLD_DAYS = 60;

/**
 * Death-rate-by-age denominator constants (see `buildRateByAge` below). Named
 * and commented here, not buried in the arithmetic, because both numbers are
 * assumptions the "rate-by-age" story's caption has to disclose, not
 * implementation details:
 *
 * - `RATE_AGE_SHIFT_YEARS`: the census is a snapshot from December 2017; the
 *   identified-dead list runs Oct 2023–present. Rather than interpolate a
 *   population that was never measured at intermediate ages, each output
 *   band's denominator is the census band exactly one 5-year shift younger —
 *   the 2017 5-9 cohort *is* (approximately) the 2023 10-14 cohort. This is
 *   honest about migration/mortality between 2017 and 2023 being unmodeled,
 *   which is why the story's caption states the assumption plainly.
 * - `RATE_POP_SCALE_2023` / `RATE_POP_SCALE_2017`: PCBS's mid-year-2023 Gaza
 *   Strip total (prepared before the war, not revised for it) over the 2017
 *   census total. Multiplying every shifted census band by this ratio
 *   approximates the 2023 population size while keeping the 2017 age/sex
 *   *structure* — PCBS publishes no Gaza-only 5-year-band x sex table for any
 *   year after 2017, so there's no better-resolved denominator to use instead.
 */
const RATE_AGE_SHIFT_YEARS = 5;
const RATE_POP_SCALE_2023 = 2226544; // PCBS mid-year-2023 Gaza Strip total (pre-war projection)
const RATE_POP_SCALE_2017 = 1875317; // PCBS Census 2017 Gaza Strip total (measured)

/**
 * Bands excluded from the rate chart, and why — emitted into the output's
 * `meta` so the truncation is auditable from the JSON alone, not just this
 * comment:
 * - 0-4: has no pre-war census cohort to shift forward from (the 2017 census
 *   has no "before 0" band), and most under-5s alive during the war were
 *   born after the census, so no honest denominator exists for this band.
 * - 80+ (80-84 and 85+): the source census bands are small enough (a few
 *   thousand) that a shifted, scaled count swings the rate on noise rather
 *   than signal.
 */
const RATE_EXCLUDED_BANDS_REASON =
  "0-4 excluded: no pre-war census cohort to shift forward from (many under-5s during the war were born after the 2017 census). 80+ excluded: source census bands are small enough that the rate is noise, not signal.";

const readJson = <T>(name: string): T => JSON.parse(readFileSync(join(ROOT, name), "utf8"));

/** Columns we need from each daily dataset (must exist in the typed schema). */
const CASUALTY_KEYS: (keyof CasualtyDailyReportV2)[] = [
  "ext_killed_cum",
  "ext_killed_children_cum",
  "ext_killed_women_cum",
  "ext_med_killed_cum",
  "ext_press_killed_cum",
  "aid_seeker_killed_cum",
];
const WEST_BANK_KEYS: (keyof WestBankDailyReportV2)[] = [
  "killed_cum",
  "killed_children_cum",
  "displaced_persons_cum",
  "settler_attacks_cum",
];
const LEBANON_KEYS: (keyof LebanonDailyReportV3)[] = ["killed_cum"];

/** Lower bound (years) of each 5-year pyramid band; the last is "85+". */
const BAND_MINS = Array.from({ length: 18 }, (_, i) => i * 5);

/**
 * Bucket the individually identified records into 5-year age bands by sex.
 * Reads killed-in-gaza-v3.min.json directly rather than the pre-summed
 * `known_killed_in_gaza` buckets in summary.json — those only carry six
 * age/sex groups, which can't be resplit into 5-year bands after the fact.
 * A record's (band, sex) cell is only known once both fields are valid, so
 * age and sex problems are counted separately rather than folded into a
 * band silently — same disjoint-buckets-that-sum-to-the-whole approach as
 * the breakdown donut's age groups.
 */
function bucketKilledInGaza() {
  const raw = readJson<unknown[][]>("killed-in-gaza-v3.min.json");
  const [header, ...rows] = raw;
  const ageIdx = (header as string[]).indexOf("age");
  const sexIdx = (header as string[]).indexOf("sex");

  const male = new Map(BAND_MINS.map((m) => [m, 0]));
  const female = new Map(BAND_MINS.map((m) => [m, 0]));
  let nullAge = 0;
  let unknownSex = 0;

  for (const row of rows) {
    const age = row[ageIdx];
    if (typeof age !== "number" || Number.isNaN(age) || age < 0) {
      nullAge++;
      continue;
    }
    const sex = row[sexIdx];
    if (sex !== "m" && sex !== "f") {
      unknownSex++;
      continue;
    }
    const band = Math.min(Math.floor(age / 5) * 5, 85);
    const bucket = sex === "m" ? male : female;
    bucket.set(band, (bucket.get(band) ?? 0) + 1);
  }

  const bands = BAND_MINS.map((min) => ({
    min,
    male: male.get(min) ?? 0,
    female: female.get(min) ?? 0,
  }));
  const binned = bands.reduce((sum, b) => sum + b.male + b.female, 0);

  return { total: rows.length, nullAge, unknownSex, binned, bands };
}

/**
 * Age/sex composition of each republish batch of the identified-record list.
 *
 * Counts only the records a batch *added* — `update` is the batch a record
 * first appeared in, so grouping by it partitions the list into ten disjoint
 * cohorts that sum to the whole. The six groups mirror summary.json's
 * `known_killed_in_gaza` exactly (child under 18, senior 65+ across both
 * sexes, `no_age` for age -1; see `genderAge` in scripts/data/v3/summary.ts),
 * so a column here and a slice of the breakdown donut mean the same thing —
 * the donut is just every column added together.
 *
 * Reads killed-in-gaza-v3.min.json directly for the same reason the pyramid
 * does: summary.json's pre-summed buckets carry no `update`, so they can't be
 * cut per batch after the fact.
 */
function bucketByUpdate() {
  const raw = readJson<unknown[][]>("killed-in-gaza-v3.min.json");
  const [header, ...rows] = raw;
  const ageIdx = (header as string[]).indexOf("age");
  const sexIdx = (header as string[]).indexOf("sex");
  const updateIdx = (header as string[]).indexOf("update");

  const empty = () => ({
    records: 0,
    male_child: 0,
    female_child: 0,
    male_adult: 0,
    female_adult: 0,
    senior: 0,
    no_age: 0,
  });
  const byBatch = new Map(updateDates.map((b) => [b.number, empty()]));
  let unbatched = 0;

  for (const row of rows) {
    const batch = byBatch.get(row[updateIdx] as number);
    // A record whose `update` isn't one of the ten known batches can't be
    // placed in a column; counted rather than dropped so the emitted totals
    // always reconcile against the list's own length.
    if (!batch) {
      unbatched++;
      continue;
    }
    batch.records++;

    const age = row[ageIdx];
    const sex = row[sexIdx];
    // Age decides the group first, exactly as summary.ts's genderAge does:
    // senior and no_age are both sex-independent there, so an unusable sex
    // only matters for the child/adult split.
    if (typeof age !== "number" || Number.isNaN(age) || age < 0) batch.no_age++;
    else if (age >= 65) batch.senior++;
    else if (sex !== "m" && sex !== "f") batch.no_age++;
    else if (age < 18) batch[sex === "m" ? "male_child" : "female_child"]++;
    else batch[sex === "m" ? "male_adult" : "female_adult"]++;
  }

  const batches = updateDates.map((b) => ({
    number: b.number,
    includesUntil: b.includesUntil,
    publishedOn: b.on,
    ...byBatch.get(b.number)!,
  }));

  // Every record must land in exactly one (batch, group) cell. A silent
  // shortfall here would render as columns that look complete but aren't, so
  // it fails the build rather than shipping a stack that doesn't add up.
  const GROUPS = [
    "male_child",
    "female_child",
    "male_adult",
    "female_adult",
    "senior",
    "no_age",
  ] as const;
  for (const b of batches) {
    const summed = GROUPS.reduce((s, g) => s + b[g], 0);
    if (summed !== b.records)
      throw new Error(
        `batch ${b.number}: groups sum to ${summed} but the batch holds ${b.records} records`,
      );
  }
  const placed = batches.reduce((s, b) => s + b.records, 0);
  if (placed + unbatched !== rows.length)
    throw new Error(
      `by_update placed ${placed} + ${unbatched} unbatched of ${rows.length} records`,
    );

  return { batches, unbatched, total: rows.length };
}

/** Shape of the hand-authored `site/src/data/gaza-population-pcbs-2017.json`. */
interface CensusReference {
  bands: { band_min: number; band_max: number | null; male: number; female: number }[];
}

/**
 * Death rate per 1,000 pre-war population, by 5-year age band and sex.
 * Numerator: the identified-dead bucketing `bucketKilledInGaza` already
 * built — reused rather than duplicated, since it's the exact same
 * (age, sex) → band cross the pyramid story needs. Denominator: the PCBS
 * 2017 census band shifted `RATE_AGE_SHIFT_YEARS` years older and scaled by
 * `RATE_POP_SCALE_2023 / RATE_POP_SCALE_2017` to approximate 2023 population
 * size (see those constants' comments for why). Only bands 5-9 through
 * 75-79 are emitted — see `RATE_EXCLUDED_BANDS_REASON`.
 */
function buildRateByAge(killedInGaza: { bands: { min: number; male: number; female: number }[] }) {
  const population = readJson<CensusReference>("site/src/data/gaza-population-pcbs-2017.json");
  const censusByMin = new Map(population.bands.map((b) => [b.band_min, b]));
  const scale = RATE_POP_SCALE_2023 / RATE_POP_SCALE_2017;

  const outputMins = BAND_MINS.filter((m) => m >= 5 && m <= 75);
  const bands = outputMins.map((min) => {
    const censusMin = min - RATE_AGE_SHIFT_YEARS;
    const census = censusByMin.get(censusMin);
    if (!census) throw new Error(`No census band at ${censusMin} to shift into rate band ${min}`);
    const killed = killedInGaza.bands.find((b) => b.min === min);
    if (!killed) throw new Error(`No killed_in_gaza band at ${min} for rate-by-age`);

    const malePop = census.male * scale;
    const femalePop = census.female * scale;
    return {
      min,
      label: `${min}-${min + 4}`,
      male: (1000 * killed.male) / malePop,
      female: (1000 * killed.female) / femalePop,
      maleKilled: killed.male,
      femaleKilled: killed.female,
      malePop,
      femalePop,
    };
  });

  // Age-standardized male excess: how many more men died than would have if
  // men's rate matched women's in the same band. Summed over the bands above
  // and no others — the 80+ bands are excluded from the chart, so including
  // them here would print a total a reader can't rebuild from what's shown.
  const maleExcess = bands.reduce((sum, b) => sum + (b.male - b.female) * (b.malePop / 1000), 0);

  return {
    bands,
    meta: {
      sourceId: "pcbs_census_2017_gaza_5yr_age_sex",
      shiftYears: RATE_AGE_SHIFT_YEARS,
      scale: {
        factor: scale,
        numerator: RATE_POP_SCALE_2023,
        denominator: RATE_POP_SCALE_2017,
      },
      excludedBandsReason: RATE_EXCLUDED_BANDS_REASON,
      maleExcess,
      maleExcessBandRange: `${outputMins[0]}-${outputMins[outputMins.length - 1] + 4}`,
    },
  };
}

/**
 * Cumulative count of individually identified dead, aligned onto `dates` (the
 * full-resolution casualties_daily grid) and its own step-jump indices.
 *
 * The identified list isn't rebuilt from scratch each release — each of its
 * ten historical batches (`updateDates`) adds newly-identified records to
 * everyone already identified before it, so the running total is a plain
 * accumulation of batch sizes read off the `update` column. Each batch's
 * total is placed at `includesUntil` — the date its records are complete
 * *through* — not `on`, the (much later) date the ministry published it.
 * Placing it at `on` would draw the jump as if identification happened
 * whenever the ministry got around to saying so, rather than when the work
 * underneath it was actually current.
 */
function buildIdentifiedSeries(dates: string[]): { full: number[]; jumpIndices: number[] } {
  const raw = readJson<unknown[][]>("killed-in-gaza-v3.min.json");
  const [header, ...rows] = raw;
  const updateIdx = (header as string[]).indexOf("update");
  const perBatch = new Map<number, number>();
  for (const row of rows) {
    const u = row[updateIdx];
    if (typeof u === "number") perBatch.set(u, (perBatch.get(u) ?? 0) + 1);
  }

  let cum = 0;
  const jumps = updateDates.map((b) => {
    cum += perBatch.get(b.number) ?? 0;
    // Every includesUntil date so far has landed exactly on a casualties
    // report date, but fall back to the next available date rather than
    // silently dropping the batch if a future one doesn't.
    let i = dates.findIndex((d) => d >= b.includesUntil);
    if (i === -1) i = dates.length - 1;
    return { i, value: cum };
  });

  // Flat-carry between batches, jumping to the new total exactly at its
  // index — never interpolated, since nothing was known between batches.
  const full = new Array(dates.length).fill(0);
  let last = 0;
  let j = 0;
  for (let i = 0; i < dates.length; i++) {
    while (j < jumps.length && jumps[j].i === i) {
      last = jumps[j].value;
      j++;
    }
    full[i] = last;
  }

  return { full, jumpIndices: jumps.map((j) => j.i) };
}

/** Pick evenly-spaced indices across an array (inclusive of first + last). */
function sampleIndices(length: number, count: number): number[] {
  if (length <= count) return Array.from({ length }, (_, i) => i);
  return Array.from({ length: count }, (_, i) => Math.round((i / (count - 1)) * (length - 1)));
}

/** Read a cumulative column, carrying the last known value forward over gaps. */
function cumColumn<T extends object>(rows: T[], key: keyof T): number[] {
  let last = 0;
  return rows.map((r) => {
    const v = r[key];
    if (typeof v === "number" && !Number.isNaN(v)) last = v;
    return last;
  });
}

/**
 * How much a cumulative column grew over the trailing `days` window — the
 * *pace* at each date rather than the running total. Before the window has
 * filled the value is everything counted so far; the series starts at the
 * start of the war, so "so far" *is* the whole window.
 */
function rollingNew(cum: number[], days: number): number[] {
  return cum.map((v, i) => Math.max(0, v - (i >= days ? cum[i - days] : 0)));
}

/**
 * Every (story, TimeField) pair actually rendered on the carousel. Breakdown
 * parts, histogram bands, rate-by-age bands and batch-stack groups are
 * deliberately excluded: they're single snapshot counts (or a ratio of two
 * snapshot counts) read off `summary.json` / `killed-in-gaza-v3.min.json` /
 * the PCBS census reference, not a value sitting on the `dates[]` grid, so
 * "the last date this changed" isn't a question that means anything for them
 * the way it does for a plotted time series. Batch-stack columns are the
 * clearest case: a batch's composition is fixed the moment it lands and is
 * never revised, so it has no freshness to check — the thing that could go
 * stale there is the *list*, which `identified_cum` already guards.
 */
function plottedTimeFields(): { storyId: string; field: TimeField }[] {
  const out: { storyId: string; field: TimeField }[] = [];
  for (const story of STORIES) {
    const schema = story.schema;
    if (
      schema.type === "breakdown" ||
      schema.type === "histogram" ||
      schema.type === "rate-by-age" ||
      schema.type === "batch-stack"
    )
      continue;
    for (const field of schema.fields) out.push({ storyId: story.id, field });
  }
  return out;
}

/**
 * Resolve a plotted field to its full daily-resolution values, mirroring
 * data.ts's own `column()` — same two special cases, for the same reason:
 * `ext_killed_men_other_cum` isn't a dataset column but a subtraction, and
 * `killed_in_gaza`'s object shape doesn't match the other three sources'
 * `Record<string, number[]>`.
 */
function fullColumnFor(
  source: TimeseriesSource,
  key: string,
  casFull: Record<string, number[]>,
  wbFull: Record<string, number[]>,
  lbFull: Record<string, number[]>,
  identifiedFull: number[],
): number[] {
  if (key === "ext_killed_men_other_cum") {
    const total = casFull.ext_killed_cum;
    const child = casFull.ext_killed_children_cum;
    const women = casFull.ext_killed_women_cum;
    return total.map((t, i) => Math.max(0, t - child[i] - women[i]));
  }
  if (source === "killed_in_gaza") {
    if (key !== "identified_cum") throw new Error(`Unknown killed_in_gaza field ${key}`);
    return identifiedFull;
  }
  const table =
    source === "casualties_daily" ? casFull : source === "west_bank_daily" ? wbFull : lbFull;
  const col = table[key];
  if (!col) throw new Error(`Story references ${source}.${key}, which isn't a generated column`);
  return col;
}

/** The date of the last index where a column's value differs from the one before it. */
function lastChangeDate(dates: string[], values: number[]): string {
  let lastIdx = 0;
  for (let i = 1; i < values.length; i++) if (values[i] !== values[i - 1]) lastIdx = i;
  return dates[lastIdx];
}

function daysBetween(earlier: string, later: string): number {
  return Math.round((Date.parse(later) - Date.parse(earlier)) / 86_400_000);
}

interface FreshnessRow {
  source: string;
  key: string;
  lastChange: string;
  days: number;
  storyIds: string[];
  staleOk?: string;
}

/**
 * Guards against the failure mode this file's STALE_THRESHOLD_DAYS comment
 * describes: a plotted column whose value stopped changing, silently
 * rendered as a flat line a caption may still describe as a rate. Every
 * column any story actually plots gets checked against the shared `dates[]`
 * grid's own latest date — the datasets are already aligned onto that one
 * grid (see `alignTo` above), so that's the honest "latest report_date" for
 * all four sources, not just casualties_daily's own.
 */
function checkColumnFreshness(
  dates: string[],
  casFull: Record<string, number[]>,
  wbFull: Record<string, number[]>,
  lbFull: Record<string, number[]>,
  identifiedFull: number[],
) {
  const latest = dates[dates.length - 1];
  const rows = new Map<string, FreshnessRow>();
  const errors: string[] = [];

  for (const { storyId, field } of plottedTimeFields()) {
    const cacheKey = `${field.source}:${field.key}`;
    let row = rows.get(cacheKey);
    if (!row) {
      const values = fullColumnFor(
        field.source,
        field.key,
        casFull,
        wbFull,
        lbFull,
        identifiedFull,
      );
      const lastChange = lastChangeDate(dates, values);
      row = {
        source: field.source,
        key: field.key,
        lastChange,
        days: daysBetween(lastChange, latest),
        storyIds: [],
      };
      rows.set(cacheKey, row);
    }
    if (!row.storyIds.includes(storyId)) row.storyIds.push(storyId);
    if (field.staleOk) row.staleOk = field.staleOk;

    if (row.days > STALE_THRESHOLD_DAYS && !field.staleOk) {
      errors.push(
        `story "${storyId}" plots ${field.source}.${field.key}, unchanged since ${row.lastChange} ` +
          `(${row.days} days, over the ${STALE_THRESHOLD_DAYS}-day threshold). Either the source ` +
          `stopped publishing this column — rewrite the story's copy to say so and add ` +
          `\`staleOk: "<reason>"\` to the field — or it's a genuine irregular/step series and the ` +
          `long gap is expected, in which case add \`staleOk\` explaining why.`,
      );
    }
  }

  console.log("\nColumn freshness (every column a story plots):");
  for (const row of Array.from(rows.values()).sort((a, b) => b.days - a.days)) {
    const label = `${row.source}.${row.key}`;
    const status =
      row.days > STALE_THRESHOLD_DAYS
        ? row.staleOk
          ? `STALE, exempt — ${row.staleOk}`
          : "STALE"
        : "ok";
    console.log(
      `  ${label.padEnd(34)} last changed ${row.lastChange}  (${String(row.days).padStart(3)}d)  ` +
        `[${row.storyIds.join(", ")}]  ${status}`,
    );
  }

  if (errors.length > 0) {
    console.error(
      `\nstories-data.json generation aborted — ${errors.length} plotted column(s) went stale ` +
        `without an exemption:\n`,
    );
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
}

function main() {
  const casualties = readJson<CasualtyDailyReportV2[]>("casualties_daily.min.json");
  const westBank = readJson<WestBankDailyReportV2[]>("west_bank_daily.min.json");
  const lebanon = readJson<LebanonDailyReportV3[]>("lebanon_casualties_daily.min.json");
  const summary = readJson<PreviewDataV3>("site/src/generated/summary.json");

  // The daily datasets each report on their own cadence; align them onto the
  // casualties dates so a single dates[] drives every series. Lebanon only
  // starts reporting partway through, so its columns sit at 0 until then.
  const dates = casualties.map((r) => r.report_date);
  const alignTo = <T extends { report_date: string }>(rows: T[]): T[] => {
    const byDate = new Map(rows.map((r) => [r.report_date, r] as const));
    let last = {} as T;
    return dates.map((d) => {
      const row = byDate.get(d);
      if (row) last = row;
      return last;
    });
  };
  const wbAligned = alignTo(westBank);
  const lbAligned = alignTo(lebanon);

  const identified = buildIdentifiedSeries(dates);

  // The even ~140-point sample can land on either side of a batch's jump
  // without ever landing on it, which would silently interpolate a real step
  // into a slanted line. Forcing the ten jump indices into the sampled set
  // guarantees each jump is represented by an exact before/after pair.
  const idx = Array.from(
    new Set([...sampleIndices(dates.length, POINTS), ...identified.jumpIndices]),
  ).sort((a, b) => a - b);
  const pick = (arr: number[]) => idx.map((i) => arr[i]);

  // Build full-resolution cumulative columns first, derive the rolling windows
  // off them, then sample — sampling first would shrink the window to ~4 points.
  const cols = <T extends object>(rows: T[], keys: (keyof T)[]) =>
    Object.fromEntries(keys.map((k) => [k, cumColumn(rows, k)])) as Record<string, number[]>;

  const casFull = cols(casualties, CASUALTY_KEYS);
  const wbFull = cols(wbAligned, WEST_BANK_KEYS);
  const lbFull = cols(lbAligned, LEBANON_KEYS);
  casFull.ext_killed_new_30d = rollingNew(casFull.ext_killed_cum, ROLLING_DAYS);
  wbFull.killed_new_30d = rollingNew(wbFull.killed_cum, ROLLING_DAYS);
  lbFull.killed_new_30d = rollingNew(lbFull.killed_cum, ROLLING_DAYS);

  checkColumnFreshness(dates, casFull, wbFull, lbFull, identified.full);

  const sample = (full: Record<string, number[]>) =>
    Object.fromEntries(Object.entries(full).map(([k, v]) => [k, pick(v)]));
  const casCols = sample(casFull);
  const wbCols = sample(wbFull);
  const lbCols = sample(lbFull);

  // The breakdown donut reads the individually identified records, not the
  // ministry's running aggregate: each record is counted once under a gendered
  // age group, so the six groups are disjoint and add to `records`. Press /
  // medical are inside these counts and carry no profession field, so they are
  // not separable and are not emitted.
  // Seniors are ~5% of the list, so the two gendered halves would be slivers;
  // they ship as one `senior` group instead.
  const kig = summary.known_killed_in_gaza;
  const both = (k: "child" | "adult" | "senior" | "no_age") =>
    (kig.male[k] ?? 0) + (kig.female[k] ?? 0);

  // The pyramid disclosed coverage date is read off the same identified-records
  // list as the donut (`includes_until` on `known_killed_in_gaza`), rather than
  // duplicated here — both schemas read the same identification work.
  const killedInGaza = bucketKilledInGaza();
  const byUpdate = bucketByUpdate();
  const rateByAge = buildRateByAge(killedInGaza);

  const out = {
    meta: {
      lastUpdate: dates[dates.length - 1],
      startDate: dates[0],
      days: dates.length,
      points: idx.length,
      rollingDays: ROLLING_DAYS,
    },
    dates: idx.map((i) => dates[i]),
    casualties_daily: casCols,
    west_bank_daily: wbCols,
    lebanon_casualties_daily: lbCols,
    summary: {
      known_killed_in_gaza: {
        records: kig.records,
        includes_until: kig.includes_until,
        male_child: kig.male.child ?? 0,
        female_child: kig.female.child ?? 0,
        male_adult: kig.male.adult ?? 0,
        female_adult: kig.female.adult ?? 0,
        senior: both("senior"),
        no_age: both("no_age"),
      },
    },
    killed_in_gaza: {
      ...killedInGaza,
      identified_cum: pick(identified.full),
      by_update: byUpdate.batches,
      unbatched: byUpdate.unbatched,
    },
    rate_by_age: rateByAge,
  };

  writeFileSync(OUT, JSON.stringify(out));
  console.log(
    `stories-data.json written — ${out.dates.length} points, lastUpdate ${out.meta.lastUpdate}`,
  );
  console.log(
    `killed_in_gaza pyramid — total ${killedInGaza.total}, binned ${killedInGaza.binned}, ` +
      `null_age ${killedInGaza.nullAge}, unknown_sex ${killedInGaza.unknownSex}`,
  );
  console.log("\nrate_by_age (per 1,000 pre-war population):");
  for (const b of rateByAge.bands) {
    console.log(
      `  ${b.label.padEnd(6)} male ${b.male.toFixed(1).padStart(5)}  female ${b.female.toFixed(1).padStart(5)}`,
    );
  }
  console.log("\nkilled_in_gaza by update batch (share of the records that batch added):");
  for (const b of byUpdate.batches) {
    const pct = (n: number) => `${((n / b.records) * 100).toFixed(1)}%`.padStart(6);
    console.log(
      `  batch ${String(b.number).padStart(2)} (through ${b.includesUntil})  ` +
        `${String(b.records).padStart(6)} records   ` +
        `boys ${pct(b.male_child)}  girls ${pct(b.female_child)}  ` +
        `men ${pct(b.male_adult)}  women ${pct(b.female_adult)}  elders ${pct(b.senior)}`,
    );
  }
  if (byUpdate.unbatched > 0)
    console.log(`  (${byUpdate.unbatched} records carry no recognized update batch)`);
  console.log(
    `identified_cum batch totals — ${updateDates.map((b) => identified.full[dates.indexOf(b.includesUntil) === -1 ? dates.length - 1 : dates.indexOf(b.includesUntil)]).join(", ")}`,
  );
}

main();
