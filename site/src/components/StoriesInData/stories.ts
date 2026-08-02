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

  /* ---- single-series area ---- */
  {
    id: "settler",
    kicker: "West Bank",
    title: "Settler violence",
    insight: "Israeli settler attacks in the West Bank, accumulating week after week.",
    caption:
      "Cumulative settler attacks recorded in the West Bank daily dataset since October 2023.",
    schema: {
      type: "timeseries-area",
      x: "report_date",
      sources: ["west_bank_daily"],
      fields: [
        {
          key: "settler_attacks_cum",
          source: "west_bank_daily",
          label: "Settler attacks",
          color: "var(--story-amber)",
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

  /* ---- breakdown / donut ---- */
  {
    id: "who",
    kicker: "Gaza",
    title: "Who has been killed",
    insight: "The verified Gaza toll, broken down by group.",
    caption:
      "A part-to-whole breakdown of the verified killed in Gaza. ‘Men & others’ is the remainder after the named categories; overlaps (e.g. a medic who was also a parent) are assigned to a single group.",
    schema: {
      type: "breakdown",
      x: null,
      sources: ["summary"],
      centerLabel: "killed · Gaza",
      parts: [
        {
          key: "gaza.killed.children",
          source: "summary",
          label: "Children",
          color: "var(--story-red)",
        },
        { key: "gaza.killed.women", source: "summary", label: "Women", color: "var(--story-plum)" },
        {
          key: "gaza.killed.medical",
          source: "summary",
          label: "Medical",
          color: "var(--story-amber)",
        },
        { key: "gaza.killed.press", source: "summary", label: "Press", color: "var(--story-teal)" },
        {
          key: "gaza.killed.civil_defence",
          source: "summary",
          label: "Civil defence",
          color: "var(--story-blue)",
        },
        {
          key: "gaza.killed.men_other",
          source: "summary",
          label: "Men & others",
          color: "var(--story-olive)",
          derived: true,
        },
      ],
    },
  },
];
