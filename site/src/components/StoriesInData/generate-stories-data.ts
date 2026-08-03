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

// @ts-expect-error .dir is specific to the bun runtime which this script is invoked with
const ROOT = join(import.meta.dir, "../../../..");
// @ts-expect-error .dir is specific to the bun runtime which this script is invoked with
const OUT = join(import.meta.dir, "stories-data.json");

/** Number of points to sample across the window (keeps the JSON small). */
const POINTS = 140;

/**
 * Trailing window, in days, for the `*_new_<n>d` columns: how many people were
 * killed in the last N days as of each date. Computed at full daily resolution
 * before sampling, so the window is a real 30 days rather than 30 samples.
 */
const ROLLING_DAYS = 30;

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

  const idx = sampleIndices(dates.length, POINTS);
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
  };

  writeFileSync(OUT, JSON.stringify(out));
  console.log(
    `stories-data.json written — ${out.dates.length} points, lastUpdate ${out.meta.lastUpdate}`,
  );
}

main();
