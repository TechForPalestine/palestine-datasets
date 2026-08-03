# StoriesInData

The home-page **"Stories in the data"** card carousel. Each card is one angle on
the published datasets; clicking it opens a modal with a large interactive chart.

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

| `schema.type`      | Chart         | Stories                                                                                   |
| ------------------ | ------------- | ----------------------------------------------------------------------------------------- |
| `timeseries-multi` | multi-line    | Two front lines · Reporting under fire · A steady drumbeat, then a surge (all dual-scale) |
| `timeseries-area`  | filled area   | _(no story currently uses it; the primitive is kept for future stories)_                  |
| `stacked-area`     | stacked bands | Where the killing is happening                                                            |
| `breakdown`        | donut         | Who has been killed                                                                       |

Every `key` is a real column — e.g. `ext_killed_cum`, `ext_killed_children_cum`
(`casualties_daily.json`); `killed_cum`, `displaced_persons_cum`, `settler_attacks_cum`
(`west_bank_daily.json`); `known_killed_in_gaza.*` (`summary.json`).

### The breakdown donut reads the identified records, not the aggregate

"Who has been killed" is built from `summary.json`'s `known_killed_in_gaza` —
the individually identified dead (name, age, sex) — rather than `gaza.killed`,
the ministry's running daily aggregate. Two consequences the chart has to be
honest about:

- **It lags.** The identified list only covers deaths through `includes_until`,
  months behind the daily aggregate, and the gap moves with each release — so
  the modal renders that date from the data (`getCoverageThrough`, keyed on the
  parts' dataset rather than on "is this a donut") instead of the caption naming
  one that goes stale. The two totals are not interchangeable and must never be
  mixed in one part-to-whole.
- **Age and sex only.** The dataset counts each record exactly once under a
  gendered age group, which the generator emits as the disjoint `male_child` /
  `female_child` / `male_adult` / `female_adult` / `senior` / `no_age` keys
  that add to `records` (seniors are combined across sexes — under 5% of the
  list, so split they'd be two slivers). Press, medical and civil-defence dead
  are inside those counts, but the records carry no profession field, so they
  cannot be pulled back out — giving them their own slices would count those
  people twice. That is why the donut has no profession slices, even though
  `gaza.killed` does.

`data.ts` drops zero-value slices, so `no_age` (currently 0) doesn't render as
an invisible arc with a legend entry.

One value is computed in `data.ts` and flagged `derived: true`:
`ext_killed_men_other_cum`. The `*_new_30d` keys are also `derived: true`, but
are computed earlier — `generate-stories-data.ts` builds them from the matching `*_cum`
column at **full daily resolution**, before the ~140-point sampling, so the
window is a real 30 days rather than 30 samples. They express _pace_ rather
than a running total, which is what makes surges visible as spikes.

`dualScale` scales each line to its own maximum. Use it whenever series of very
different magnitude share a card; the tooltip still reports true values.

## Series catalog

The authoritative list of chartable series in the project lives at
`site/src/data/series-catalog.json`. It is hand-authored JSON. Each entry
describes one series with metadata sufficient to drive a future explorer UI:

| Field                                     | Purpose                                                                                                                                                                                                                          |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                      | Stable, dotted form (e.g. `gaza.casualties.killed.children`). Intended as the URL token in phase 2.                                                                                                                              |
| `datasetFile` + `valuePath` + `dateField` | Where to read the values. `valuePath` is a top-level key for flat rows or a dot-path for nested (e.g. `civic_buildings.ext_destroyed`).                                                                                          |
| `granularity`                             | `daily`, `weekly`, or `per-update`. Drives chart-primitive choice in phase 2.                                                                                                                                                    |
| `kind`                                    | `cumulative`, `delta`, or `stock`.                                                                                                                                                                                               |
| `originDate`                              | For cumulative series, the implicit zero — the date from which the running total is measured. Two cumulative series are only safe to combine when they share an `originDate`. `null` for non-cumulative entries or placeholders. |
| `parentSeries` / `subSeries`              | Subset relationships. `children` is a `subSeries` of `killed`; a phase 2 chart stacks sub-series into the parent honestly.                                                                                                       |
| `compatibilityKey`                        | Series with the same key are _additive peers_ (e.g. Gaza killed + West Bank killed). For cumulative series, peer compatibility also requires matching `originDate`.                                                              |
| `alternates`                              | Series that represent the _same value via a different reporting source_. Phase 2 disables combining alternates.                                                                                                                  |
| `sourceField`                             | Per-record provenance column, surfaced in tooltips when phase 2 lands.                                                                                                                                                           |
| `caveats`                                 | Short strings phase 2 surfaces inline (sparseness, source switches, methodology notes).                                                                                                                                          |
| `docPath`                                 | The MDX doc for "about this series".                                                                                                                                                                                             |
| `derived`                                 | `true` when computed from columns rather than read directly.                                                                                                                                                                     |

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
