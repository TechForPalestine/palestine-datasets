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
    caption:
      "Everyone here was identified individually — name, age, sex — rather than counted in a daily total, so this is the smaller, slower-moving list: identification lags the ministry’s running aggregate by months, and the date it currently reaches is noted below. Each record sits in exactly one age-and-sex group, so the slices add up to the whole list; elders are shown together rather than split, being under 5% of it. Journalists, medics and civil-defence workers are counted here too, but the records carry no profession, so they can’t be pulled back out of these groups — showing them as separate slices would count those people twice.",
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

  /* ---- multi-line ---- */
  {
    id: "fronts",
    kicker: "Gaza & West Bank",
    title: "Two front lines",
    insight: "How the toll in Gaza and the West Bank climbs over the same window.",
    caption:
      "Cumulative people killed in each territory. The West Bank line is small only by comparison — neither pauses.",
    schema: {
      type: "timeseries-multi",
      x: "report_date",
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
  {
    id: "press-medics",
    kicker: "Press & medics",
    title: "Reporting under fire",
    insight: "Journalists and medical personnel killed in Gaza, scaled to read together.",
    caption:
      "Those who document and those who heal — killed at a steady, relentless rate. Each line is scaled to its own maximum so both are legible.",
    schema: {
      type: "timeseries-multi",
      x: "report_date",
      dualScale: true,
      sources: ["casualties_daily"],
      fields: [
        {
          key: "ext_med_killed_cum",
          source: "casualties_daily",
          label: "Medical personnel",
          color: "var(--story-amber)",
        },
        {
          key: "ext_press_killed_cum",
          source: "casualties_daily",
          label: "Journalists",
          color: "var(--story-red)",
        },
      ],
    },
  },

  {
    id: "settler",
    kicker: "West Bank",
    title: "A steady drumbeat, then a surge",
    insight: "Settler attacks and displacement have climbed together since 2023 — and both steepened in 2026.",
    caption:
      "Both lines are running totals since October 2023, each scaled to its own maximum so the two shapes stay comparable. Settler attacks reached 370 by the end of 2023, 1,797 a year later, 3,143 by the end of 2025 and 4,401 by August 2026 — a pace of roughly 3.7 incidents a day through 2025 that rises to about 5.9 a day across 2026. Displacement tracks the same shape at a little over twice the count: 1,012, then 3,841, then 6,831, then 9,420 people, with the daily pace going from about 8 to about 12 over the same turn. The two are not linked in the data: the West Bank dataset counts settler attacks as incidents and counts displaced persons separately, with no attribution of any displacement to a cause. Read the lines side by side, but neither explains the other.",
    schema: {
      type: "timeseries-multi",
      x: "report_date",
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

  /* ---- stacked area ---- */
  {
    id: "share",
    kicker: "Gaza, West Bank & Lebanon",
    title: "Where the killing is happening",
    insight: "Gaza was almost the whole toll — until Lebanon became most of it.",
    caption:
      "Each band is one territory’s share of everyone killed across the three in the trailing 30 days, so the chart tracks where the current pace sits rather than all-time totals. For two years Gaza is effectively the entire column; once Lebanon’s health ministry begins reporting in March 2026 it takes the majority within weeks. The West Bank stays a thin, unbroken band throughout — never large, never absent.",
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
];
