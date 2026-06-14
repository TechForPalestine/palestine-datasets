/**
 * Configuration for the markdown-content-backed daily casualties pipeline.
 *
 * `*DerivedCumulatives` lists [dailyField, cumulativeField] pairs where the
 * cumulative is exactly the running sum of the daily figure across the entire
 * historical dataset (verified byte-for-byte). Only these are auto-derived so
 * contributors can omit them; every other reported figure (including the
 * source-reported cumulative totals that carry corrections/recoveries) is
 * entered directly because it cannot be safely inferred.
 */
export const gazaContentDir = "content/gaza-daily";
export const westBankContentDir = "content/west-bank-daily";

export const gazaDerivedCumulatives: [string, string][] = [
  ["ext_killed", "ext_killed_cum"],
  ["ext_injured", "ext_injured_cum"],
];

// West Bank verified.* cumulatives carry reporting-gap anomalies that prevent
// clean inference, so they are entered directly for now.
export const westBankDerivedCumulatives: [string, string][] = [];
