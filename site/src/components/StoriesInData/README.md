# StoriesInData

The home-page **"Stories in the data"** card carousel. Each card is one angle on
the published datasets; clicking it opens a modal with a large interactive chart.

This is the production port of the prototype in `Stories in the Data — Home.html`
(repo root of the design project) — same visuals, wired to the real datasets and
the site's light/dark theme tokens.

## Files

| File | Role |
| --- | --- |
| `types.ts` | The **typed schema**. A discriminated union (`timeseries-multi`, `timeseries-area`, `stacked-area`, `breakdown`) whose `type` mirrors each card's chart and whose `key`s are real dataset columns. |
| `stories.ts` | The `Story[]` shown in the carousel, each with its typed `schema`. |
| `data.ts` | Reads the schema keys out of `stories-data.json`, derives series/breakdowns, formats numbers. |
| `charts.tsx` | React + SVG charts: `LineAreaChart`, `StackedAreaChart`, `DonutChart` (with hover/tooltips). |
| `StoryCard.tsx` | A single carousel card (chart → kicker → title → insight). |
| `StoryModal.tsx` | Expanded story view: big interactive chart, legend, caption, dataset sources. |
| `StoriesInData.tsx` | The carousel section. |
| `StoriesInData.styles.module.css` | Scoped styles + `--story-*` color tokens with light/dark variants. |
| `generate-stories-data.ts` | Build script that writes `stories-data.json` from the published datasets. |
| `stories-data.json` | Generated data the component imports. A sample is committed so the component runs without a build. |

## Schema → chart mapping

| `schema.type` | Chart | Stories |
| --- | --- | --- |
| `timeseries-multi` | multi-line | Two front lines · The youngest toll · Reporting under fire (dual-scale) |
| `timeseries-area` | filled area | Killed while seeking aid · Settler violence |
| `stacked-area` | stacked bands | The toll, by group |
| `breakdown` | donut | Who has been killed |

Every `key` is a real column — e.g. `ext_killed_cum`, `ext_killed_children_cum`,
`aid_seeker_killed_cum` (`casualties_daily.json`); `killed_cum`,
`settler_attacks_cum` (`west_bank_daily.json`); `gaza.killed.*` (`summary.json`).
Two values are computed in `data.ts` and flagged `derived: true`:
`ext_killed_men_other_cum` and `gaza.killed.men_other` (the remainder after the
named groups).

## Install

1. **Add to the home page** — `site/src/pages/index.tsx`:

   ```tsx
   import { StoriesInData } from "../components/StoriesInData";

   // inside <main>, e.g. right after <HomeDailyChart />:
   <StoriesInData />
   ```

2. **Export from the barrel** — append to `site/src/components/index.ts`:

   ```ts
   export * from "./StoriesInData";
   ```

3. **Generate real data** (optional — a sample is already committed). Add to
   `package.json` next to the other `gen-*` scripts:

   ```json
   "gen-stories": "bun run site/src/components/StoriesInData/generate-stories-data.ts"
   ```

   then `bun run gen-stories` (or fold it into `gen-derived`). It reads
   `casualties_daily.min.json`, `west_bank_daily.min.json`, and
   `site/src/generated/summary.json` and rewrites `stories-data.json`.

## Notes

- Colors are CSS variables (`--story-red`, `--story-blue`, …) defined in the
  module with `[data-theme="dark"]` overrides, so charts follow the site theme.
- The carousel runs edge-to-edge; the container gutter is baked into the scroll
  content so the first card aligns with the heading and cards scroll off-screen
  cleanly. Vertical padding gives the hover shadow room without clipping.
- The committed `stories-data.json` is a sample built to the current published
  totals with modeled daily curves. Run `gen-stories` against the live datasets
  for exact day-by-day values.
