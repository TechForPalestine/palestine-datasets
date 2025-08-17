export type Demographics = {
  "elderly-woman": number;
  "elderly-man": number;
  woman: number;
  man: number;
  "teen-boy": number;
  "teen-girl": number;
  "preteen-girl": number;
  "preteen-boy": number;
  "toddler-girl": number;
  "toddler-boy": number;
  "baby-girl": number;
  "baby-boy": number;
};

export type DiffStats = {
  total: number;
  new: number;
  updated: number;
  unchanged: number;
  removed: number;
  updatedRecords: Map<string, string[]>;
  demographics: Demographics;
};
