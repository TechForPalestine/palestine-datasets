import type { Story } from "./types";

/**
 * The stories shown in the home-page carousel.
 *
 * Each `schema.type` matches the chart rendered on the card, and every `key`
 * is a real column in the named dataset (or a clearly-marked derived value).
 * Series colors are CSS variables defined in StoriesInData.styles.module.css,
 * so they adapt to light/dark mode.
 */
export const STORIES: Story[] = [
  /* ---- breakdown / donut ---- */
  {
    id: "who",
    kicker: "Gaza",
    title: "Who has been killed",
    insight: "Of the dead identified by name, nearly a third were children.",
    caption: "",
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

  /* ---- histogram / pyramid ---- */
  {
    id: "ages",
    kicker: "Gaza",
    title: "The ages of the dead",
    insight:
      "The identified dead peak among people in their twenties and thirties, and thin out from there in both directions.",
    caption:
      "72,835 people are identified by name — 99.3% of the toll. 5,293 were under 5; the single largest band is ages 30–34, at 8,312.",
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
    title: "A death rate flat by age — except for men",
    insight:
      "Women and girls die at the same rate at every age. Males do not — and the gap opens at about age 10 and never closes, not even in their seventies.",
    caption:
      "Girls and boys under 10 die at nearly the same rate. From age 10 on, the male rate breaks away — peaking at 3.6x the female rate at 35–39 — and never closes the gap, even into their seventies. Standardized against the female rate, that divergence adds up to roughly 28,000 excess male deaths, 39% of the identified list.",
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

  /* ---- batch-stack: the composition of each release of the identified list ---- */
  {
    id: "batches",
    kicker: "Gaza",
    title: "Who each new list names",
    insight:
      "Boys hold a near-constant share of every batch the ministry has released. Girls and women don’t — their share roughly halves after the first one.",
    caption:
      "The first release of the identified-dead list was 62.1% women and children. Every release since has fallen further — down to 36.9% in the most recent — while boys' share has barely moved, holding near 17–21% across all ten.",
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

  /* ---- multi-line: identification catching up to the aggregate ---- */
  {
    id: "coverage",
    kicker: "Gaza",
    title: "Naming every name",
    insight:
      "The identified list held near half the ministry’s toll for over a year, then jumped to full coverage in a single March 2025 batch and has stayed there since.",
    caption:
      "For over a year, the identified list held at little more than half the ministry's toll. A single batch covering March 2025 pushed it past full coverage, and it's stayed there since.",
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

  /* ---- multi-line ---- */
  {
    id: "fronts",
    kicker: "Gaza & West Bank",
    title: "Two front lines",
    insight: "How the toll in Gaza and the West Bank climbs over the same window.",
    caption:
      "Gaza's toll is roughly 66x the West Bank's — each line is scaled to its own maximum so both climbs stay visible. Read the tooltip for true counts, not line height. Neither ever flattens.",
    schema: {
      type: "timeseries-multi",
      x: "report_date",
      // Gaza's cumulative toll (~73k) dwarfs the West Bank's (~1.1k); a shared
      // axis would flatten the West Bank line to a barely-visible sliver
      // along the bottom, hiding that it climbs too.
      dualScale: true,
      sources: ["casualties_daily", "west_bank_daily"],
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
      ],
    },
  },

  /* ---- stacked area ---- */
  {
    id: "share",
    kicker: "Gaza, West Bank & Lebanon",
    title: "Where the killing is happening",
    insight: "Gaza was almost the whole toll — until Lebanon became most of it.",
    caption:
      "Each band is a territory's share of deaths in the trailing 30 days. Gaza is nearly the whole column for two years — until Lebanon starts reporting in March 2026 and takes the majority within weeks. The West Bank never disappears, and never grows large.",
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

  {
    id: "press-medics",
    kicker: "Press & medics",
    title: "Reporting under fire",
    insight:
      "Medical-personnel deaths haven’t been updated since October 2025; journalist deaths have kept climbing.",
    caption:
      "The medical-personnel count has been frozen at 1,701 since October 2025 — the ministry stopped reporting it, not a sign the killing stopped. Journalist deaths keep climbing, most recently to 262 in April 2026.",
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

  {
    id: "settler",
    kicker: "West Bank",
    title: "A steady drumbeat, then a surge",
    insight:
      "Settler attacks and displacement have climbed together since 2023 — and both steepened in 2026.",
    caption:
      "Settler attacks climbed from 370 in 2023 to 4,401 by August 2026 — the daily pace nearly doubling in 2026 alone, from about 3.7 to 5.9 a day. Displacement has accelerated on a similar curve, though the dataset draws no direct link between the two.",
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
];
