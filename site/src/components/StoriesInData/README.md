# StoriesInData

The home-page **"Stories in the data"** card carousel. Each card is one angle on
the published datasets; clicking it opens a modal with a large interactive chart.

This is the production port of the prototype in `Stories in the Data — Home.html`
(repo root of the design project) — same visuals, wired to the real datasets and
the site's light/dark theme tokens.

## Files

| File                              | Role                                                                                                                                                                                               |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types.ts`                        | The **typed schema**. A discriminated union (`timeseries-multi`, `timeseries-area`, `stacked-area`, `breakdown`) whose `type` mirrors each card's chart and whose `key`s are real dataset columns. |
| `stories.ts`                      | The `Story[]` shown in the carousel, each with its typed `schema`.                                                                                                                                 |
| `data.ts`                         | Reads the schema keys out of `stories-data.json`, derives series/breakdowns, formats numbers.                                                                                                      |
| `charts.tsx`                      | React + SVG charts: `LineAreaChart`, `StackedAreaChart`, `DonutChart` (with hover/tooltips).                                                                                                       |
| `StoryCard.tsx`                   | A single carousel card (chart → kicker → title → insight).                                                                                                                                         |
| `StoryModal.tsx`                  | Expanded story view: big interactive chart, legend, caption, dataset sources.                                                                                                                      |
| `StoriesInData.tsx`               | The carousel section.                                                                                                                                                                              |
| `StoriesInData.styles.module.css` | Scoped styles + `--story-*` color tokens with light/dark variants.                                                                                                                                 |
| `generate-stories-data.ts`        | Build script that writes `stories-data.json` from the published datasets.                                                                                                                          |
| `stories-data.json`               | Generated data the component imports. A sample is committed so the component runs without a build.                                                                                                 |

## Schema → chart mapping

| `schema.type`      | Chart         | Stories                                                                 |
| ------------------ | ------------- | ----------------------------------------------------------------------- |
| `timeseries-multi` | multi-line    | Two front lines · The youngest toll · Reporting under fire (dual-scale) |
| `timeseries-area`  | filled area   | Killed while seeking aid · Settler violence                             |
| `stacked-area`     | stacked bands | The toll, by group                                                      |
| `breakdown`        | donut         | Who has been killed                                                     |

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
   <StoriesInData />;
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

## Where this fits

StoriesInData is the **curated, opinionated front door** to the datasets — a
small set of high-impact narratives we want every visitor to see on the home
page. It is intentionally not the full surface of what the project publishes;
for the authoritative enumeration of chartable series, see the **series
catalog** below. For a future free-form way to combine and explore series, see
**phase 2** below.

The carousel sits where the existing pre-baked `HomeDailyChart` SVG sits — it
augments rather than replaces that block.

## Series catalog

The authoritative list of chartable series in the project lives at
`site/src/data/series-catalog.json`. It is hand-authored JSON. Each entry
describes one series with metadata sufficient to drive a future explorer UI:

| Field                                     | Purpose                                                                                                                                 |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                      | Stable, dotted form (e.g. `gaza.casualties.killed.children`). Intended as the URL token in phase 2.                                     |
| `datasetFile` + `valuePath` + `dateField` | Where to read the values. `valuePath` is a top-level key for flat rows or a dot-path for nested (e.g. `civic_buildings.ext_destroyed`). |
| `granularity`                             | `daily`, `weekly`, or `per-update`. Drives chart-primitive choice in phase 2.                                                           |
| `kind`                                    | `cumulative`, `delta`, or `stock`.                                                                                                      |
| `originDate`                              | For cumulative series, the implicit zero — the date from which the running total is measured. Two cumulative series are only safe to combine when they share an `originDate`. `null` for non-cumulative entries or placeholders. |
| `parentSeries` / `subSeries`              | Subset relationships. `children` is a `subSeries` of `killed`; a phase 2 chart stacks sub-series into the parent honestly.              |
| `compatibilityKey`                        | Series with the same key are _additive peers_ (e.g. Gaza killed + West Bank killed). For cumulative series, peer compatibility also requires matching `originDate`. |
| `alternates`                              | Series that represent the _same value via a different reporting source_. Phase 2 disables combining alternates.                         |
| `sourceField`                             | Per-record provenance column, surfaced in tooltips when phase 2 lands.                                                                  |
| `caveats`                                 | Short strings phase 2 surfaces inline (sparseness, source switches, methodology notes).                                                 |
| `docPath`                                 | The MDX doc for "about this series".                                                                                                    |
| `derived`                                 | `true` when computed from columns rather than read directly.                                                                            |

StoriesInData **does not currently read from the catalog** — story schemas
reference dataset columns directly via `TimeField`/`BreakdownPart`. The catalog
mirrors and extends those references. **When adding a new dataset or breakdown,
also add an entry to the catalog**, even if no story exists for it yet — that
keeps the catalog current as the source of truth.

The catalog ships with placeholder entries for killed-in-gaza demographic
series (`gaza.kig.*`). Their `datasetFile` / `valuePath` are `null` because the
underlying `demographics-by-update` time series isn't generated yet — that
generator is part of phase 2.

## Phase 2 — free-form explore (planned)

The next phase is a homepage explorer where visitors compose arbitrary
catalog-compatible series rather than choosing from curated stories:

- A live interactive chart replaces the static slot; a strip of sparkline cards
  underneath lets the visitor add or remove any catalog series
- Sub-dimensions stack honestly into their parent (`parentSeries` / `subSeries`)
- Mixed granularities render at native cadence — daily lines, weekly bars,
  per-update points all share the time axis with no resampling
- Mutual exclusivity (`alternates`) is encoded; combining alternates is
  disabled with a one-line reason
- URL state is shareable (`/?series=<id>[,<id>...]`)

Phase 2 is also when **Observable Plot** is likely to enter as a dependency.
The current custom SVG charts (`charts.tsx`) are right-sized for curated
narratives and don't repay the dependency cost; free-form composition with
honest mixed-granularity and gap rendering does.

**Constraints to honor when phase 2 begins** (these are the data-shape
realities the UI must respect):

- No interpolation between known values — gaps render as gaps
- Mixed granularity stays native (no resampling onto a common cadence)
- Mutual exclusivity is encoded via `alternates`
- Subset relationships are encoded via `parentSeries` / `subSeries`
- Caveats from the catalog surface inline on the chart

A `demographics-by-update` generator (`scripts/data/v3/derived/...`) populates
the placeholder `gaza.kig.*` series from killed-in-gaza update batches as part
of phase 2.
