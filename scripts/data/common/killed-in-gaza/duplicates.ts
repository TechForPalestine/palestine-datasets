/**
 * Manually curated map of known duplicate records.
 *
 * Key: canonical ID (the record to keep)
 * Value: array of duplicate IDs to be removed and merged into the canonical record
 *
 * When adding a new duplicate group:
 * 1. Add an entry here mapping canonical ID → [duplicate IDs]
 * 2. Remove the duplicate rows from raw.csv (keep only the canonical row)
 * 3. Re-run the pipeline
 *
 * The canonical record will get a `duplicate_ids` field listing the merged IDs
 * so API consumers can trace consolidated records.
 */
export const knownDuplicates: Record<string, string[]> = {
  // Abdel Raouf Hassan Awad Al-Najjar - assumed to be same person with two IDs
  // See: https://github.com/TechForPalestine/palestine-datasets/issues/599
  "938867033": ["700187263"],
};
