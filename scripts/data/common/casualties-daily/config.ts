/**
 * Configuration for the markdown-content-backed daily casualties pipeline.
 *
 * Contributors enter the as-reported figures (killed, killed_cum, injured, ...).
 * The extended (ext_) continuous series is derived from them:
 *   - carryForward: ext_*_cum follows the reported *_cum, carried over gaps.
 *   - extDeltas: ext_ daily figures are the delta of their ext_*_cum.
 * Stored values (history, manual overrides) are always respected; only blanks
 * are filled, so regenerating history is byte-identical.
 *
 * discrepancyPairs lists reported daily/cumulative pairs to cross-check: per
 * project policy the reported cumulative is authoritative and the daily is
 * reconciled to it, so mismatches are flagged for editorial review.
 */
import type { CarryForwardRule, DeltaRule, IncrementalRule } from "./content";

export const gazaContentDir = "source_data/gaza-daily";
export const westBankContentDir = "source_data/west-bank-daily";

export const gazaCarryForward: CarryForwardRule[] = [
  { ext: "ext_killed_cum", reported: "killed_cum" },
  { ext: "ext_injured_cum", reported: "injured_cum" },
  { ext: "ext_killed_children_cum", reported: "killed_children_cum" },
  { ext: "ext_killed_women_cum", reported: "killed_women_cum" },
  { ext: "ext_massacres_cum", reported: "massacres_cum" },
  { ext: "ext_civdef_killed_cum", reported: "civdef_killed_cum" },
  { ext: "ext_med_killed_cum", reported: "med_killed_cum" },
  { ext: "ext_press_killed_cum", reported: "press_killed_cum" },
];

export const gazaExtDeltas: DeltaRule[] = [
  { daily: "ext_killed", cum: "ext_killed_cum" },
  { daily: "ext_injured", cum: "ext_injured_cum" },
];

export const gazaDiscrepancyPairs: DeltaRule[] = [
  { daily: "killed", cum: "killed_cum" },
  { daily: "injured", cum: "injured_cum" },
];

/**
 * Pre-policy historical days where the reported daily does not match the
 * cumulative delta. These predate the consistency rule and are grandfathered:
 * the validator accepts them but fails on any NEW discrepancy. Keyed by
 * `report_date:field`. Do not add to this list — fix new data instead; entries
 * may be removed as history is reconciled.
 */
export const gazaDiscrepancyAllowlist: string[] = [
  "2023-10-11:injured",
  "2023-10-15:injured",
  "2023-10-16:injured",
  "2023-10-21:injured",
  "2023-12-02:injured",
  "2023-12-04:injured",
  "2023-12-05:killed",
  "2023-12-07:killed",
  "2023-12-07:injured",
  "2023-12-08:killed",
  "2023-12-08:injured",
  "2023-12-09:killed",
  "2023-12-12:injured",
  "2023-12-13:injured",
  "2023-12-18:killed",
  "2023-12-18:injured",
  "2023-12-24:injured",
  "2024-01-12:killed",
  "2024-01-12:injured",
  "2024-01-16:killed",
  "2024-01-22:injured",
  "2024-08-27:killed",
  "2024-08-27:injured",
  "2024-08-28:killed",
  "2024-08-28:injured",
];

// West Bank is not reported daily: source files exist only for actual report
// dates, and these flash cumulative fields are carried forward to fill every
// day through the latest Gaza report date (keeping the two series in sync).
export const westBankCarryFields = [
  "killed_cum",
  "killed_children_cum",
  "injured_cum",
  "injured_children_cum",
  "settler_attacks_cum",
  "flash_source",
];

// West Bank verified reporting is sparse/gapped, so daily-vs-cumulative
// consistency is not gated here yet (would need gap-aware comparison).
export const westBankDiscrepancyPairs: DeltaRule[] = [];
export const westBankDiscrepancyAllowlist: string[] = [];

// Some flash reports give an incremental figure (since the prior report)
// rather than a fresh cumulative. When a cumulative is left blank, it is
// resolved as the prior reported cumulative plus the incremental, before the
// carry-forward timeline is built — see applyIncrementalToCumulative.
export const westBankIncrementalRules: IncrementalRule[] = [
  { incremental: "killed", cum: "killed_cum" },
  { incremental: "killed_children", cum: "killed_children_cum" },
  { incremental: "injured", cum: "injured_cum" },
  { incremental: "injured_children", cum: "injured_children_cum" },
  { incremental: "settler_attacks", cum: "settler_attacks_cum" },
];
