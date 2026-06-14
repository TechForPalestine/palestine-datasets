/**
 * One-time migration: turns the existing daily casualties JSON into markdown
 * source files. Front matter keys preserve the original JSON key order so that
 * regenerating the JSON from source data stays byte-identical. Existing files
 * are left untouched so any source material already added by hand is preserved.
 *
 * Gaza is reported daily, so it gets one file per date. West Bank is not: only
 * dates with newly reported values get a file (flash-change dates and verified
 * dates); the build regenerates the "fill" days by carrying values forward.
 *
 * Usage: bun run scripts/data/common/casualties-daily/backfill.ts
 */
import { readFileSync } from "fs";
import { gazaContentDir, westBankCarryFields, westBankContentDir } from "./config";
import { type DailyRecord, writeReportFile } from "./content";

const sourceMaterialBody = [
  "## Source material",
  "",
  "<!-- Paste the original source bulletin text, links, or a reference to a",
  "screenshot for this report date here. Backfilled entries have none yet. -->",
].join("\n");

const readJson = (jsonPath: string) => JSON.parse(readFileSync(jsonPath, "utf8")) as DailyRecord[];

const report = (dir: string, written: number, total: number) => {
  console.log(`${dir}: wrote ${written} file(s) from ${total} JSON row(s)`);
};

const backfillGaza = () => {
  const records = readJson("casualties_daily.json");
  let written = 0;
  for (const record of records) {
    if (writeReportFile(gazaContentDir, record, sourceMaterialBody)) {
      written += 1;
    }
  }
  report(gazaContentDir, written, records.length);
};

const flashTuple = (record: DailyRecord) =>
  westBankCarryFields.map((field) => record[field]).join("|");

const backfillWestBank = () => {
  const records = readJson("west_bank_daily.json");
  let written = 0;
  let previousTuple: string | null = null;
  for (const record of records) {
    const tuple = flashTuple(record);
    const isFlashReport = tuple !== previousTuple;
    previousTuple = tuple;
    const hasVerified = Boolean(record.verified);
    // skip pure fill days; the build regenerates them
    if (!isFlashReport && !hasVerified) {
      continue;
    }
    const data: DailyRecord = { report_date: record.report_date };
    if (hasVerified) {
      data.verified = record.verified;
    }
    if (isFlashReport) {
      for (const field of westBankCarryFields) {
        if (record[field] !== undefined && record[field] !== null) {
          data[field] = record[field];
        }
      }
    }
    if (writeReportFile(westBankContentDir, data, sourceMaterialBody)) {
      written += 1;
    }
  }
  report(westBankContentDir, written, records.length);
};

backfillGaza();
backfillWestBank();
