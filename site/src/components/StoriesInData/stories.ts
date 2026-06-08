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
        { key: "ext_killed_cum", source: "casualties_daily", label: "Killed · Gaza", color: "var(--story-red)" },
        { key: "killed_cum", source: "west_bank_daily", label: "Killed · West Bank", color: "var(--story-blue)" },
      ],
    },
  },
  {
    id: "children",
    kicker: "Children",
    title: "The youngest toll",
    insight: "Children killed in Gaza and the West Bank, counted day by day.",
    caption:
      "Cumulative children killed since October 7, 2023. Gaza’s line dwarfs the West Bank’s, but neither flattens.",
    schema: {
      type: "timeseries-multi",
      x: "report_date",
      sources: ["casualties_daily", "west_bank_daily"],
      fields: [
        { key: "ext_killed_children_cum", source: "casualties_daily", label: "Children · Gaza", color: "var(--story-red)" },
        { key: "killed_children_cum", source: "west_bank_daily", label: "Children · West Bank", color: "var(--story-blue)" },
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
        { key: "ext_med_killed_cum", source: "casualties_daily", label: "Medical personnel", color: "var(--story-amber)" },
        { key: "ext_press_killed_cum", source: "casualties_daily", label: "Journalists", color: "var(--story-red)" },
      ],
    },
  },

  /* ---- single-series area ---- */
  {
    id: "aid",
    kicker: "Aid",
    title: "Killed while seeking aid",
    insight: "A category that barely existed before 2024, then climbs sharply.",
    caption:
      "Cumulative people killed while seeking aid in Gaza. The curve stays near flat, then accelerates through 2024 and into 2025.",
    schema: {
      type: "timeseries-area",
      x: "report_date",
      sources: ["casualties_daily"],
      fields: [
        { key: "aid_seeker_killed_cum", source: "casualties_daily", label: "Killed seeking aid", color: "var(--story-red)" },
      ],
    },
  },
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
        { key: "settler_attacks_cum", source: "west_bank_daily", label: "Settler attacks", color: "var(--story-amber)" },
      ],
    },
  },

  /* ---- stacked area ---- */
  {
    id: "composition",
    kicker: "Gaza",
    title: "The toll, by group",
    insight: "Children, women, and men & others — stacked into the running total in Gaza.",
    caption:
      "Cumulative killed in Gaza, split into children, women, and everyone else, then stacked. ‘Men & others’ is the remainder once children and women are removed from the verified total, so the bands always sum to ext_killed_cum.",
    schema: {
      type: "stacked-area",
      x: "report_date",
      sources: ["casualties_daily"],
      fields: [
        { key: "ext_killed_children_cum", source: "casualties_daily", label: "Children", color: "var(--story-red)" },
        { key: "ext_killed_women_cum", source: "casualties_daily", label: "Women", color: "var(--story-plum)" },
        { key: "ext_killed_men_other_cum", source: "casualties_daily", label: "Men & others", color: "var(--story-olive)", derived: true },
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
        { key: "gaza.killed.children", source: "summary", label: "Children", color: "var(--story-red)" },
        { key: "gaza.killed.women", source: "summary", label: "Women", color: "var(--story-plum)" },
        { key: "gaza.killed.medical", source: "summary", label: "Medical", color: "var(--story-amber)" },
        { key: "gaza.killed.press", source: "summary", label: "Press", color: "var(--story-teal)" },
        { key: "gaza.killed.civil_defence", source: "summary", label: "Civil defence", color: "var(--story-blue)" },
        { key: "gaza.killed.men_other", source: "summary", label: "Men & others", color: "var(--story-olive)", derived: true },
      ],
    },
  },
];
