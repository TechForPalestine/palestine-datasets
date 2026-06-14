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
import type { CarryForwardRule, DeltaRule } from "./content";

export const gazaContentDir = "content/gaza-daily";
export const westBankContentDir = "content/west-bank-daily";

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

// West Bank has no extended series; figures are entered as reported.
export const westBankCarryForward: CarryForwardRule[] = [];
export const westBankExtDeltas: DeltaRule[] = [];
