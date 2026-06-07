/**
 * generate-stories-data.ts
 *
 * Build-time generator for the home-page "Stories in the data" carousel.
 * Reads the published datasets and writes the typed stories-data.json that
 * data.ts consumes — same pattern as scripts/data/v3/*.ts.
 *
 * Run with bun (mirrors the other gen-* scripts in package.json):
 *   bun run site/src/components/StoriesInData/generate-stories-data.ts
 *
 * Wire it into package.json alongside the other generators, e.g.:
 *   "gen-stories": "bun run site/src/components/StoriesInData/generate-stories-data.ts"
 * and add `&& bun run gen-stories` to "gen-derived".
 */
import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { CasualtyDailyReportV2 } from "../../../../types/casualties-daily.types";
import type { WestBankDailyReportV2 } from "../../../../types/west-bank-daily.types";
import type { PreviewDataV3 } from "../../../../types/summary.types";

const ROOT = join(import.meta.dir, "../../../..");
const OUT = join(import.meta.dir, "stories-data.json");

/** Number of points to sample across the window (keeps the JSON small). */
const POINTS = 140;

const readJson = <T,>(name: string): T => JSON.parse(readFileSync(join(ROOT, name), "utf8"));

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
  "settler_attacks_cum",
];

/** Pick evenly-spaced indices across an array (inclusive of first + last). */
function sampleIndices(length: number, count: number): number[] {
  if (length <= count) return Array.from({ length }, (_, i) => i);
  return Array.from({ length: count }, (_, i) => Math.round((i / (count - 1)) * (length - 1)));
}

/** Read a cumulative column, carrying the last known value forward over gaps. */
function cumColumn<T extends Record<string, unknown>>(rows: T[], key: keyof T): number[] {
  let last = 0;
  return rows.map((r) => {
    const v = r[key];
    if (typeof v === "number" && !Number.isNaN(v)) last = v;
    return last;
  });
}

function main() {
  const casualties = readJson<CasualtyDailyReportV2[]>("casualties_daily.min.json");
  const westBank = readJson<WestBankDailyReportV2[]>("west_bank_daily.min.json");
  const summary = readJson<PreviewDataV3>("site/src/generated/summary.json");

  // Both daily datasets share the report_date timeline; align West Bank onto
  // the casualties dates so a single dates[] drives every series.
  const dates = casualties.map((r) => r.report_date);
  const wbByDate = new Map(westBank.map((r) => [r.report_date, r] as const));
  let wbLast: WestBankDailyReportV2 | undefined;
  const wbAligned = dates.map((d) => {
    const row = wbByDate.get(d);
    if (row) wbLast = row;
    return wbLast;
  });

  const idx = sampleIndices(dates.length, POINTS);
  const pick = (arr: number[]) => idx.map((i) => arr[i]);

  const casCols = Object.fromEntries(
    CASUALTY_KEYS.map((k) => [k, pick(cumColumn(casualties, k))])
  );
  const wbCols = Object.fromEntries(
    WEST_BANK_KEYS.map((k) => [
      k,
      pick(cumColumn(wbAligned.map((r) => r ?? ({} as WestBankDailyReportV2)), k)),
    ])
  );

  const g = summary.gaza.killed;
  const out = {
    meta: {
      lastUpdate: dates[dates.length - 1],
      startDate: dates[0],
      days: dates.length,
      points: idx.length,
    },
    dates: idx.map((i) => dates[i]),
    casualties_daily: casCols,
    west_bank_daily: wbCols,
    summary: {
      gaza: {
        killed: {
          total: g.total,
          children: g.children,
          women: g.women,
          medical: g.medical,
          press: g.press,
          civil_defence: g.civil_defence,
        },
      },
    },
  };

  writeFileSync(OUT, JSON.stringify(out));
  console.log(`stories-data.json written — ${out.dates.length} points, lastUpdate ${out.meta.lastUpdate}`);
}

main();
