import type { Story } from "./types";

export const STORIES_INDEX: string[] = [
  "ages",
  "who",
  "rate-by-age",
  "share",
  // "fronts",
  "settler",
  "coverage",
  // "batches",
];

/**
 * The stories shown in the home-page carousel.
 *
 * Each `schema.type` matches the chart rendered on the card, and every `key`
 * is a real column in the named dataset (or a clearly-marked derived value).
 * Series colors are CSS variables defined in StoriesInData.styles.module.css,
 * so they adapt to light/dark mode.
 */
export const STORIES: Story[] = [
  /* ---- histogram / pyramid ---- */
  {
    id: "ages",
    kicker: "Gaza",
    title: "Death at every age",
    insight:
      "Deaths occur across all age groups, from infants to the elderly. This reflects the structure of a general population, not a fighting force.",
    caption:
      "Each record represents an identified person. The distribution of deaths mirrors Gaza’s young population. A campaign targeting specific groups would not result in this pyramid shape.",
    schema: {
      type: "histogram",
      x: null,
      sources: ["killed_in_gaza"],
      left: { label: "Male", color: "var(--story-blue)" },
      right: { label: "Female", color: "var(--story-teal)" },
      bands: [
        { min: 0, label: "0-4" },
        { min: 5, label: "5-9" },
        { min: 10, label: "10-14" },
        { min: 15, label: "15-19" },
        { min: 20, label: "20-24" },
        { min: 25, label: "25-29" },
        { min: 30, label: "30-34" },
        { min: 35, label: "35-39" },
        { min: 40, label: "40-44" },
        { min: 45, label: "45-49" },
        { min: 50, label: "50-54" },
        { min: 55, label: "55-59" },
        { min: 60, label: "60-64" },
        { min: 65, label: "65-69" },
        { min: 70, label: "70-74" },
        { min: 75, label: "75-79" },
        { min: 80, label: "80-84" },
        { min: 85, label: "85+" },
      ],
    },
  },

  /* ---- rate by age: the numerator is the pyramid above, against a census denominator ---- */
  {
    id: "rate-by-age",
    kicker: "Gaza",
    title: "Men and boys targeted",
    insight:
      "Compared to the pre-war population, men and boys are killed at a much higher rate—a gap that begins in adolescence and persists through old age.",
    caption:
      "This chart shows the death rate per 1,000 people of each age and sex, using pre-war census data as a baseline. The higher rates for men and boys reflect the roles they often play: gathering supplies for the family, digging through rubble, staffing hospitals, ambulances and civil defence, sleeping apart from the family or guarding what's left of a home. This disparity is visible from early teens through their seventies.",
    schema: {
      type: "rate-by-age",
      x: "age_band",
      sources: ["killed_in_gaza", "gaza_population_pcbs_2017"],
      male: { label: "Male", color: "var(--story-blue)" },
      female: { label: "Female", color: "var(--story-teal)" },
      bands: [
        { min: 5, max: 9, label: "5-9" },
        { min: 10, max: 14, label: "10-14" },
        { min: 15, max: 19, label: "15-19" },
        { min: 20, max: 24, label: "20-24" },
        { min: 25, max: 29, label: "25-29" },
        { min: 30, max: 34, label: "30-34" },
        { min: 35, max: 39, label: "35-39" },
        { min: 40, max: 44, label: "40-44" },
        { min: 45, max: 49, label: "45-49" },
        { min: 50, max: 54, label: "50-54" },
        { min: 55, max: 59, label: "55-59" },
        { min: 60, max: 64, label: "60-64" },
        { min: 65, max: 69, label: "65-69" },
        { min: 70, max: 74, label: "70-74" },
        { min: 75, max: 79, label: "75-79" },
      ],
    },
  },

  /* ---- breakdown / donut ---- */
  {
    id: "who",
    kicker: "Gaza",
    title: "Indiscriminate killing",
    insight:
      "More than half of those killed are children, women, or the elderly, with children making up the largest group.",
    caption:
      "This count only includes people identified by name; the actual number is likely much higher. It excludes those missing under rubble or those who cannot be identified.Children are under 18, and elders are 65 or older.",
    schema: {
      type: "breakdown",
      x: null,
      sources: ["summary"],
      centerLabel: "identified · Gaza",
      parts: [
        {
          key: "known_killed_in_gaza.female_child",
          source: "summary",
          label: "Girls",
          color: "var(--story-plum)",
        },
        {
          key: "known_killed_in_gaza.male_child",
          source: "summary",
          label: "Boys",
          color: "var(--story-red)",
        },
        {
          key: "known_killed_in_gaza.female_adult",
          source: "summary",
          label: "Women",
          color: "var(--story-teal)",
        },
        {
          key: "known_killed_in_gaza.male_adult",
          source: "summary",
          label: "Men",
          color: "var(--story-blue)",
        },
        {
          key: "known_killed_in_gaza.senior",
          source: "summary",
          label: "Elders",
          color: "var(--story-amber)",
        },
        {
          key: "known_killed_in_gaza.no_age",
          source: "summary",
          label: "Age unrecorded",
          color: "var(--story-olive)",
        },
      ],
    },
  },

  /* ---- multi-line: identification catching up to the aggregate ---- */
  {
    id: "coverage",
    kicker: "Gaza",
    title: "Naming every life",
    insight: "Health authorities in Gaza have tirelessly accounted for those lost by name.",
    caption:
      "The red line shows total daily casualties reported by the Ministry; the stepped line shows how many have been identified by name. This tracks how closely the list of named individuals keeps up with the total death toll.",
    schema: {
      type: "timeseries-multi",
      x: "report_date",
      sources: ["casualties_daily", "killed_in_gaza"],
      fields: [
        {
          key: "ext_killed_cum",
          source: "casualties_daily",
          label: "Ministry aggregate",
          color: "var(--story-red)",
        },
        {
          key: "identified_cum",
          source: "killed_in_gaza",
          label: "Identified by name",
          color: "var(--story-teal)",
          step: true,
          // Genuinely a ten-batch step series, not a stalled feed: the list only
          // moves when a republish batch lands (most recently 2026-05-07, the
          // date this line last jumped), and there's no telling when the next
          // one arrives. A long flat stretch here is the series behaving
          // exactly as documented (see stories.ts's step comment and the
          // README's "reading a batch list as a time series" section), not a
          // source that quietly stopped reporting.
          staleOk:
            "identified_cum only changes on the list's irregular republish batches (ten total; most recent 2026-05-07) — a long gap since the last one is the step series working as intended, not a discontinued feed.",
        },
      ],
    },
  },

  /* ---- batch-stack: the composition of each release of the identified list ---- */
  {
    id: "batches",
    kicker: "Gaza",
    title: "Names list updates",
    insight:
      "Each column represents a new update to the list of identified names, rather than a monthly death toll.",
    caption:
      "These columns show the composition of each update. A 'batch' represents a period of identification—often through rubble recovery or legal declarations—rather than when the deaths occurred. As methods of identification change, so does the makeup of the list.",
    schema: {
      type: "batch-stack",
      x: "update_batch",
      // Batches range from 1,765 records to 18,408. On absolute columns the
      // eye compares batch *size*, which is an artifact of release cadence
      // and backlog, not of who was killed — the composition is the story.
      normalize: "percent",
      sources: ["killed_in_gaza"],
      // Colors match the "Who has been killed" donut group for group: the same
      // category has to be the same color across the carousel, or a reader
      // moving between the two charts re-learns the legend each time.
      groups: [
        { key: "female_child", label: "Girls", color: "var(--story-plum)" },
        { key: "male_child", label: "Boys", color: "var(--story-red)" },
        { key: "female_adult", label: "Women", color: "var(--story-teal)" },
        { key: "male_adult", label: "Men", color: "var(--story-blue)" },
        { key: "senior", label: "Elders", color: "var(--story-amber)" },
        // Currently 0 in every batch. Kept so the columns provably sum to each
        // batch's whole size rather than quietly dropping unusable records;
        // the legend omits a group that is zero at both ends.
        { key: "no_age", label: "Age unrecorded", color: "var(--story-olive)" },
      ],
    },
  },

  /* ---- stacked area ---- */
  {
    id: "share",
    kicker: "Gaza, West Bank & Lebanon",
    title: "Every neighbour attacked",
    insight:
      "The focus of the violence has shifted. Lebanon now accounts for a larger share of the recent deaths.",
    caption:
      "Each band shows the percentage of deaths in each territory over the last 30 days. This illustrates where violence is currently concentrated, rather than total death counts.",
    schema: {
      type: "stacked-area",
      x: "report_date",
      normalize: "percent",
      sources: ["casualties_daily", "west_bank_daily", "lebanon_casualties_daily"],
      fields: [
        {
          key: "ext_killed_new_30d",
          source: "casualties_daily",
          label: "Gaza",
          color: "var(--story-red)",
          derived: true,
        },
        {
          key: "killed_new_30d",
          source: "west_bank_daily",
          label: "West Bank",
          color: "var(--story-blue)",
          derived: true,
        },
        {
          key: "killed_new_30d",
          source: "lebanon_casualties_daily",
          label: "Lebanon",
          color: "var(--story-amber)",
          derived: true,
        },
      ],
    },
  },

  /* ---- multi-line ---- */
  {
    id: "fronts",
    kicker: "Gaza, West Bank & Lebanon",
    title: "Two front lines",
    insight:
      "The West Bank is not a quiet backdrop to Gaza; its death toll is rising alongside Gaza's, though it receives much less attention.",
    caption:
      "Because Gaza's death toll is so much larger, the lines for the West Bank and Lebanon are scaled separately so their trends remain visible. Lebanon's data covers a shorter period and should be viewed as a fragment of a larger trend. The shaded area marks the October 2025 ceasefire.",
    schema: {
      type: "timeseries-multi",
      x: "report_date",
      // Gaza's cumulative toll (~73k) dwarfs the West Bank's (~1.1k) and
      // Lebanon's (~4.3k); a shared axis would flatten both smaller lines to a
      // barely-visible sliver along the bottom, hiding that they climb too.
      dualScale: true,
      sources: ["casualties_daily", "west_bank_daily", "lebanon_casualties_daily"],
      fields: [
        {
          key: "ext_killed_cum",
          source: "casualties_daily",
          label: "Killed · Gaza",
          color: "var(--story-red)",
        },
        {
          key: "killed_cum",
          source: "west_bank_daily",
          label: "Killed · West Bank",
          color: "var(--story-blue)",
        },
        {
          key: "killed_cum",
          source: "lebanon_casualties_daily",
          label: "Killed · Lebanon",
          color: "var(--story-amber)",
        },
      ],
    },
  },

  {
    id: "settler",
    kicker: "West Bank",
    title: "Pushed off the land",
    insight:
      "In the West Bank, settler attacks and Palestinian displacement are rising together, with both trends accelerating.",
    caption:
      "Lines are scaled to their own maximums to show trends. Compare the steepness of the slopes rather than the height of the lines; use the tooltip for exact numbers.",
    schema: {
      type: "timeseries-multi",
      x: "report_date",
      // Displaced persons (~9,420) run a little over 2x settler attacks
      // (~4,401) — not the extreme gap fronts/press-medics have, but still
      // enough that a shared axis would visibly compress the smaller line
      // relative to the larger one, understating how much it has also grown.
      dualScale: true,
      sources: ["west_bank_daily"],
      fields: [
        {
          key: "settler_attacks_cum",
          source: "west_bank_daily",
          label: "Settler attacks",
          color: "var(--story-amber)",
        },
        {
          key: "displaced_persons_cum",
          source: "west_bank_daily",
          label: "People displaced",
          color: "var(--story-blue)",
        },
      ],
    },
  },

  {
    id: "press-medics",
    kicker: "Press & medics",
    title: "Counting the people who count",
    insight:
      "Journalists and medics are being killed in attacks that are also destroying the very systems used to record the toll.",
    caption:
      "The medical personnel count is flat because the Ministry stopped providing that specific breakdown in late 2025, not because deaths stopped. Journalist deaths are recorded as they are confirmed; because these are rare events, the line moves in infrequent steps.",
    schema: {
      type: "timeseries-multi",
      x: "report_date",
      // Medical personnel (1,701) and journalists (262) differ by ~6.5x — on a
      // shared axis the smaller line would read as flat regardless of whether
      // it was actually moving, which is exactly the ambiguity this story
      // needs to avoid given ext_med_killed_cum really is flat underneath.
      dualScale: true,
      sources: ["casualties_daily"],
      fields: [
        {
          key: "ext_med_killed_cum",
          source: "casualties_daily",
          label: "Medical personnel",
          color: "var(--story-amber)",
          // Frozen at 1,701 since 2025-10-07 because the ministry stopped
          // publishing this disaggregation, not because deaths stopped — the
          // caption above says so plainly rather than asserting a rate over a
          // dead column, which is the exemption this flag exists to require.
          staleOk:
            "Ministry stopped disaggregating medical-personnel deaths after 2025-10-07 (frozen at 1,701 since); the caption states this is a reporting gap, not a claim about the killing rate.",
        },
        {
          key: "ext_press_killed_cum",
          source: "casualties_daily",
          label: "Journalists",
          color: "var(--story-red)",
          // Real, still-updating count — it moved three times in 2026 alone
          // (260 on Jan 21, 261 on Mar 9, 262 on Apr 8) — but confirmed
          // journalist deaths are rare enough that gaps between updates
          // regularly exceed the staleness threshold on their own; that's the
          // nature of this series, not a sign the ministry stopped counting.
          staleOk:
            "Journalist deaths are rare, irregular events; the column moved three times within 2026 itself (most recently 2026-04-08), unlike ext_med_killed_cum, which the ministry stopped updating entirely.",
        },
      ],
    },
  },
];

export const getStoryById = (storyId: string) => {
  const story = STORIES.find((story) => story.id === storyId);
  if (!story) {
    throw new Error(`Story not found for id=${storyId}`);
  }
  return story;
};

if (STORIES_INDEX.some((storyId) => !STORIES.find((story) => story.id === storyId))) {
  throw new Error(`STORIES_INDEX has unexpected ID not found in STORIES`);
}
