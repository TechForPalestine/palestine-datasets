/**
 * One-time migration: turns the existing daily casualties JSON into one
 * markdown content file per report date. Front matter keys preserve the
 * original JSON key order so that regenerating the JSON from content stays
 * byte-identical. Existing content files are left untouched so any source
 * material already added by hand is preserved.
 *
 * Usage: bun run scripts/data/common/casualties-daily/backfill.ts
 */
import { readFileSync } from "fs";
import { gazaContentDir, westBankContentDir } from "./config";
import { type DailyRecord, writeReportFile } from "./content";

const sourceMaterialBody = [
  "## Source material",
  "",
  "<!-- Paste the original source bulletin text, links, or a reference to a",
  "screenshot for this report date here. Backfilled entries have none yet. -->",
].join("\n");

const backfill = (jsonPath: string, dir: string) => {
  const records = JSON.parse(readFileSync(jsonPath, "utf8")) as DailyRecord[];
  let written = 0;
  let skipped = 0;
  for (const record of records) {
    if (writeReportFile(dir, record, sourceMaterialBody)) {
      written += 1;
    } else {
      skipped += 1;
    }
  }
  console.log(`${dir}: wrote ${written}, skipped existing ${skipped} (of ${records.length})`);
};

backfill("casualties_daily.json", gazaContentDir);
backfill("west_bank_daily.json", westBankContentDir);
