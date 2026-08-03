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
    insight:
      "Settler attacks held flat for three years — then spiked in 2026, long after injuries fell.",
    caption:
      "Both lines are a 30-day pace — how many were recorded in the trailing month — rather than a running total, so surges read as spikes instead of a steeper slope. Each line is scaled to its own maximum so both stay legible. Settler attacks averaged about 117 a month across 2023, 2024 and 2025 alike, then rose to about 168 in 2026 with a peak near 396. Injuries ran the opposite way: roughly 1,230 a month during the military raids of late 2023, falling to about 180–260 a month ever since. The two are not linked in the data — the West Bank dataset counts settler attacks as incidents and counts injuries separately, with no attribution of any injury to a cause. Read the lines side by side, but neither explains the other.",
    schema: {
      type: "timeseries-multi",
      x: "report_date",
      dualScale: true,
      sources: ["west_bank_daily"],
      fields: [
        {
          key: "settler_attacks_new_30d",
          source: "west_bank_daily",
          label: "Settler attacks · per 30 days",
          color: "var(--story-amber)",
          derived: true,
        },
        {
          key: "injured_new_30d",
          source: "west_bank_daily",
          label: "Injured · per 30 days",
          color: "var(--story-blue)",
          derived: true,
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
