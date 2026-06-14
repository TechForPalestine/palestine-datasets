/**
 * Pre-merge data-integrity gate for the daily casualties source data.
 *
 * Per project policy the reported cumulative is authoritative, so a reported
 * daily figure must equal the day-over-day change in its cumulative. A mismatch
 * is inconsistent data that must be fixed (reconcile the daily to the
 * cumulative) — it is never bypassable, including with editorial remarks. This
 * exits non-zero so it can block a merge in CI.
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
  gazaDiscrepancyAllowlist,
  gazaDiscrepancyPairs,
  westBankContentDir,
  westBankDiscrepancyAllowlist,
  westBankDiscrepancyPairs,
} from "./config";
import { type DeltaRule, findReportingDiscrepancies, readDailyReports } from "./content";

type DatasetSpec = { name: string; dir: string; pairs: DeltaRule[]; allowlist: string[] };

const datasets: DatasetSpec[] = [
  {
    name: "Gaza",
    dir: gazaContentDir,
    pairs: gazaDiscrepancyPairs,
    allowlist: gazaDiscrepancyAllowlist,
  },
  {
    name: "West Bank",
    dir: westBankContentDir,
    pairs: westBankDiscrepancyPairs,
    allowlist: westBankDiscrepancyAllowlist,
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

for (const { name, dir, pairs, allowlist } of datasets) {
  if (pairs.length === 0) {
    continue;
  }
  const allowed = new Set(allowlist);
  const records = readDailyReports(dir);
  let discrepancies = findReportingDiscrepancies(records, pairs);
  if (scoped) {
    const dates = scopeByDir[dir] ?? new Set<string>();
    discrepancies = discrepancies.filter((d) => dates.has(d.report_date));
  }
  // grandfathered pre-policy days are accepted; any new discrepancy fails
  const failures = discrepancies.filter((d) => !allowed.has(`${d.report_date}:${d.field}`));
  const grandfathered = discrepancies.length - failures.length;
  const grandfatheredNote = grandfathered > 0 ? ` (${grandfathered} grandfathered)` : "";
  if (failures.length === 0) {
    console.log(
      `✓ ${name}: reported dailies are consistent with cumulatives${scoped ? " (scoped)" : ""}${grandfatheredNote}.`,
    );
    continue;
  }
  totalFailures += failures.length;
  console.error(`\n✗ ${name}: ${failures.length} reporting discrepancy(ies)${grandfatheredNote}:`);
  for (const d of failures) {
    console.error(
      `  ${d.report_date} ${d.field}: reported ${d.reported}, cumulative implies ${d.expectedFromCum}` +
        ` — reconcile the daily to the cumulative.`,
    );
  }
}

if (totalFailures > 0) {
  console.error(
    `\n${totalFailures} discrepancy(ies) must be fixed before merge.` +
      ` The reported cumulative is authoritative; editorial remarks document the fix, they do not bypass it.`,
  );
  process.exit(1);
}

console.log("\nAll daily reports are internally consistent.");
