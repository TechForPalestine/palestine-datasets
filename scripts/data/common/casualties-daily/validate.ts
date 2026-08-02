/**
 * Pre-merge data-integrity gate for the daily casualties source data.
 *
 * Gates three classes of corruption that the Decap CMS editorial workflow can
 * introduce, any of which exits non-zero to block a merge in CI:
 *
 *  1. Filename/date drift — a file whose name disagrees with its front-matter
 *     report_date (Decap derives the name from a slug, so an edited date can
 *     drift). Reports are loaded by report_date, so a drifted file lands on the
 *     wrong day.
 *  2. Cumulative regressions — a reported cumulative lower than a prior report
 *     (e.g. a placeholder "missing" stub that zeroed killed_cum). Cumulatives
 *     only rise; a drop makes the derived day-over-day delta go negative.
 *  3. Reported daily vs. cumulative discrepancies — per project policy the
 *     cumulative is authoritative, so a reported daily must equal the
 *     day-over-day change in its cumulative. Never bypassable, including with
 *     editorial remarks.
 *
 * Usage:
 *   bun run validate-daily                 # check the whole dataset
 *   bun run validate-daily <changed.md...> # check only the given report dates
 *
 * Passing changed file paths (as CI does from the PR diff) limits which dates
 * are gated, while still using the full series for prior-day context.
 */
import {
  gazaContentDir,
  gazaCumulativeFields,
  gazaCumulativeRegressionAllowlist,
  gazaDiscrepancyAllowlist,
  gazaDiscrepancyPairs,
  lebanonContentDir,
  lebanonCumulativeFields,
  lebanonCumulativeRegressionAllowlist,
  lebanonDiscrepancyAllowlist,
  lebanonDiscrepancyPairs,
  westBankContentDir,
  westBankCumulativeFields,
  westBankCumulativeRegressionAllowlist,
  westBankDiscrepancyAllowlist,
  westBankDiscrepancyPairs,
} from "./config";
import {
  type DeltaRule,
  findCumulativeRegressions,
  findFilenameDateMismatches,
  findReportingDiscrepancies,
  readDailyReports,
} from "./content";

type DatasetSpec = {
  name: string;
  dir: string;
  pairs: DeltaRule[];
  allowlist: string[];
  cumulativeFields: string[];
  cumulativeRegressionAllowlist: string[];
};

const datasets: DatasetSpec[] = [
  {
    name: "Gaza",
    dir: gazaContentDir,
    pairs: gazaDiscrepancyPairs,
    allowlist: gazaDiscrepancyAllowlist,
    cumulativeFields: gazaCumulativeFields,
    cumulativeRegressionAllowlist: gazaCumulativeRegressionAllowlist,
  },
  {
    name: "West Bank",
    dir: westBankContentDir,
    pairs: westBankDiscrepancyPairs,
    allowlist: westBankDiscrepancyAllowlist,
    cumulativeFields: westBankCumulativeFields,
    cumulativeRegressionAllowlist: westBankCumulativeRegressionAllowlist,
  },
  {
    name: "Lebanon",
    dir: lebanonContentDir,
    pairs: lebanonDiscrepancyPairs,
    allowlist: lebanonDiscrepancyAllowlist,
    cumulativeFields: lebanonCumulativeFields,
    cumulativeRegressionAllowlist: lebanonCumulativeRegressionAllowlist,
  },
];

// optional scope: file paths limit which report dates are gated (per directory)
const scopeArgs = process.argv.slice(2);
const scoped = scopeArgs.length > 0;
const scopeByDir: Record<string, Set<string>> = {};
for (const arg of scopeArgs) {
  const match = arg.match(/(.*)\/(\d{4}-\d{2}-\d{2})\.md$/);
  if (match) {
    const [, dir, date] = match;
    (scopeByDir[dir] ??= new Set<string>()).add(date);
  }
}

let totalFailures = 0;

for (const {
  name,
  dir,
  pairs,
  allowlist,
  cumulativeFields,
  cumulativeRegressionAllowlist,
} of datasets) {
  const inScope = (date: string) => !scoped || (scopeByDir[dir] ?? new Set<string>()).has(date);
  const records = readDailyReports(dir);

  // 1. filename/date drift — structural, never grandfathered
  const mismatches = findFilenameDateMismatches(dir).filter(
    (m) => !scoped || inScope(m.file.slice(0, 10)),
  );
  if (mismatches.length > 0) {
    totalFailures += mismatches.length;
    console.error(`\n✗ ${name}: ${mismatches.length} filename/date mismatch(es):`);
    for (const m of mismatches) {
      console.error(
        `  ${m.file}: front-matter report_date is '${m.reportDate || "<missing>"}'` +
          ` — rename the file or fix report_date so they agree.`,
      );
    }
  } else {
    console.log(`✓ ${name}: filenames match report_date${scoped ? " (scoped)" : ""}.`);
  }

  // 2. cumulative regressions — cumulatives only rise; a drop is corruption
  const regressionAllowed = new Set(cumulativeRegressionAllowlist);
  const regressions = findCumulativeRegressions(records, cumulativeFields).filter((r) =>
    inScope(r.report_date),
  );
  // grandfathered pre-policy revisions are accepted; any new regression fails
  const regressionFailures = regressions.filter(
    (r) => !regressionAllowed.has(`${r.report_date}:${r.field}`),
  );
  const regressionGrandfathered = regressions.length - regressionFailures.length;
  const regressionNote =
    regressionGrandfathered > 0 ? ` (${regressionGrandfathered} grandfathered)` : "";
  if (regressionFailures.length > 0) {
    totalFailures += regressionFailures.length;
    console.error(
      `\n✗ ${name}: ${regressionFailures.length} cumulative regression(s)${regressionNote}:`,
    );
    for (const r of regressionFailures) {
      console.error(
        `  ${r.report_date} ${r.field}: ${r.value} is below ${r.previous} from ${r.previousDate}` +
          ` — cumulatives cannot decrease.`,
      );
    }
  } else {
    console.log(
      `✓ ${name}: cumulative fields never decrease${scoped ? " (scoped)" : ""}${regressionNote}.`,
    );
  }

  // 3. reported daily vs. cumulative discrepancies
  if (pairs.length > 0) {
    const allowed = new Set(allowlist);
    const discrepancies = findReportingDiscrepancies(records, pairs).filter((d) =>
      inScope(d.report_date),
    );
    // grandfathered pre-policy days are accepted; any new discrepancy fails
    const failures = discrepancies.filter((d) => !allowed.has(`${d.report_date}:${d.field}`));
    const grandfathered = discrepancies.length - failures.length;
    const grandfatheredNote = grandfathered > 0 ? ` (${grandfathered} grandfathered)` : "";
    if (failures.length === 0) {
      console.log(
        `✓ ${name}: reported dailies are consistent with cumulatives${scoped ? " (scoped)" : ""}${grandfatheredNote}.`,
      );
    } else {
      totalFailures += failures.length;
      console.error(
        `\n✗ ${name}: ${failures.length} reporting discrepancy(ies)${grandfatheredNote}:`,
      );
      for (const d of failures) {
        console.error(
          `  ${d.report_date} ${d.field}: reported ${d.reported}, cumulative implies ${d.expectedFromCum}` +
            ` — reconcile the daily to the cumulative.`,
        );
      }
    }
  }
}

if (totalFailures > 0) {
  console.error(
    `\n${totalFailures} data-integrity issue(s) must be fixed before merge.` +
      ` The reported cumulative is authoritative; editorial remarks document the fix, they do not bypass it.`,
  );
  process.exit(1);
}

console.log("\nAll daily reports are internally consistent.");
