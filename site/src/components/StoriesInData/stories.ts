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
      "Every five-year band is populated, from infants to people in their nineties. This is the shape of a population, not of a fighting force.",
    caption:
      "Each record here is a person identified by name. What the two sides trace is close to Gaza's own age structure — a very young population, killed roughly in the proportions it exists in. A campaign that distinguished between people would not produce a pyramid.",
    schema: {
      type: "histogram",
      x: null,
      sources: ["killed_in_gaza"],
      left: { label: "Men", color: "var(--story-blue)" },
      right: { label: "Women", color: "var(--story-teal)" },
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
      "Measured against how many of each were alive before the war, men and boys are killed at a far higher rate — a gap that opens in early adolescence and never closes.",
    caption:
      "This chart tracks the death rate per 1,000 people of that age and sex, against a pre-war census aged forward (the rates are best estimates). Men and boys are the ones sent to the flour queues and water points, the ones digging through rubble, staffing hospitals, ambulances and civil defence, sleeping apart from the family or guarding what's left of a home. Being outside is what the rate measures. And it holds for boys barely into their teens and for men in their seventies, these are ages no one seriously describes as combatant-aged.",
    schema: {
      type: "rate-by-age",
      x: "age_band",
      sources: ["killed_in_gaza", "gaza_population_pcbs_2017"],
      male: { label: "Men", color: "var(--story-blue)" },
      female: { label: "Women", color: "var(--story-teal)" },
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
      "Children, women, and the elderly account for more than half of those killed. Children account for the largest share of that.",
    caption:
      "Only individually named humans are counted here and the number is estimated to be far larger. This number excludes those still missing under rubble or who were unidentifiable. Children are counted as under 18, elders as 65 and over.",
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
      "The red line is the ministry's daily casualties aggregate; the stepped line is how many of those people had been individually named. This chart shows how up to date the names list is with daily casualty reporting, which in the past was often called into doubt.",
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
      "Each column is one republication of the identified list — a record of who could be named by then, not of who died that month.",
    caption:
      "A batch marks recovery and adjudication, not death. Some of these people were pulled from rubble months after they were killed; others were declared dead by a court once their families could file, later still. Columns are shown as shares because the batches differ enormously in size, and the mix shifts with what identification was possible — early releases lean on hospital and morgue records, later ones on rubble recovery and family testimony. Read a change in composition as a change in how the dead were found.",
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
      "The center of the killing has moved. Lebanon increasingly accounts for the brunt of Israel's air attacks.",
    caption:
      "Each band is a territory's share of the deaths reported in the trailing 30 days — a picture of where the killing is concentrated at that moment, not how much of it there has been.",
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
      "The West Bank is not a quiet backdrop to Gaza — it has its own toll, climbing through the same window with far less attention paid to it.",
    caption:
      "Gaza's toll is larger than the West Bank's by orders of magnitude, so each line is scaled to its own maximum and the two heights mean nothing against each other — read the tooltip for true counts. What the shapes are for is timing: whether a period of intensity in one coincides with one in the other. Lebanon's line starts where this dataset's Lebanon figures start, not where the killing there did, so its steepness is partly an artifact of a short window — treat it as a fragment, not a trend to compare against the other two. The shaded span is the ceasefire announced in October 2025 and still in effect: an annotation placed by hand, not a field in any of these datasets. It's the only one marked, because it's the only one all three lines run inside — and all three keep climbing through it.",
    schema: {
      type: "timeseries-multi",
      x: "report_date",
      // Gaza's cumulative toll (~73k) dwarfs the West Bank's (~1.1k) and
      // Lebanon's (~4.3k); a shared axis would flatten both smaller lines to a
      // barely-visible sliver along the bottom, hiding that they climb too.
      dualScale: true,
      // One ceasefire span, drawn behind the lines so a reader can check whether
      // a slope changed at it. Not from the datasets — the dates are hand-placed
      // from the source named below, and the caption says so.
      //
      // Deliberately the only one. Earlier ceasefires (the Nov 2023 pause, the
      // Jan-Mar 2025 Gaza ceasefire, the Nov 2024 Israel-Hezbollah cessation)
      // all fall before 2026-03-05, where this dataset's Lebanon column begins —
      // so on a chart whose third line is Lebanon they'd invite exactly the
      // comparison the data can't support: a reader checking Lebanon's slope
      // against a marker that predates the Lebanon series entirely. Marking only
      // the ceasefire all three lines are actually inside keeps every
      // before/after the chart offers a real one.
      markers: [
        {
          date: "2025-10-10",
          ongoing: true,
          label: "Ceasefire · from Oct 2025",
          // The one span this repo's own source data pins down: the daily Gaza
          // briefings from mid-2026 still run a "Since the ceasefire (October
          // 11)" tally, and OCHA's West Bank reports date the announcement to
          // 10 Oct 2025 — announcement date used here, so the band starts a day
          // before the counting does.
          source:
            "Announced 10 Oct 2025 (OCHA, quoted in source_data/west-bank-daily/2026-06-15.md); still in effect at the last plotted date.",
        },
      ],
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
      "In the West Bank, settler attacks and the displacement of Palestinian families rise on the same curve — and both have steepened, not settled.",
    caption:
      "Each line is scaled to its own maximum, so compare the slopes, not the heights; the tooltip carries the true counts.",
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
      "Journalists and medics are killed in a war that also destroys the capacity to record it — including, eventually, the count of the medics themselves.",
    caption:
      "The medical-personnel line is flat because the ministry stopped publishing that breakdown in late 2025, not because medics stopped being killed; a flat line here is the absence of a count, not the absence of deaths. The journalist line is still live, but it moves rarely — each step is a confirmed death, and long gaps between steps are normal for it. Each line is scaled to its own maximum, so the tooltip, not the height, carries the true numbers.",
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
