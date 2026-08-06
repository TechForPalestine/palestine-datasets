# StoriesInData

The home-page **"Stories in the data"** card carousel. Each card is one angle on
the published datasets; clicking it opens a modal with a large interactive chart.

## Files

| File                              | Role                                                                                                                                                                                                                                          |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types.ts`                        | The **typed schema**. A discriminated union (`timeseries-multi`, `timeseries-area`, `stacked-area`, `batch-stack`, `breakdown`, `histogram`, `rate-by-age`) whose `type` mirrors each card's chart and whose `key`s are real dataset columns. |
| `stories.ts`                      | The `Story[]` shown in the carousel, each with its typed `schema`.                                                                                                                                                                            |
| `data.ts`                         | Reads the schema keys out of `stories-data.json`, derives series/breakdowns/pyramid bands/rate bands, formats numbers.                                                                                                                        |
| `charts.tsx`                      | React + SVG charts: `LineAreaChart`, `StackedAreaChart`, `StackedColumnChart`, `DonutChart`, `PyramidChart`, `RateByAgeChart` (with hover/tooltips).                                                                                          |
| `StoryCard.tsx`                   | A single carousel card (chart → kicker → title → insight).                                                                                                                                                                                    |
| `StoryModal.tsx`                  | Expanded story view: big interactive chart, legend, caption, dataset sources.                                                                                                                                                                 |
| `StoriesInData.tsx`               | The carousel section.                                                                                                                                                                                                                         |
| `StoriesInData.styles.module.css` | Scoped styles + `--story-*` color tokens with light/dark variants.                                                                                                                                                                            |
| `generate-stories-data.ts`        | Build script that writes `stories-data.json` from the published datasets.                                                                                                                                                                     |
| `stories-data.json`               | Generated data the component imports. A sample is committed so the component runs without a build.                                                                                                                                            |

## Schema → chart mapping

| `schema.type`      | Chart                             | Stories                                                                                                                             |
| ------------------ | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `timeseries-multi` | multi-line                        | Two front lines · Reporting under fire · A steady drumbeat, then a surge (dual-scale) · Naming every name (shared scale, step line) |
| `timeseries-area`  | filled area                       | _(no story currently uses it; the primitive is kept for future stories)_                                                            |
| `stacked-area`     | stacked bands                     | Where the killing is happening                                                                                                      |
| `batch-stack`      | stacked columns, one per batch    | Who each new list names                                                                                                             |
| `breakdown`        | donut                             | Who has been killed                                                                                                                 |
| `histogram`        | age/sex pyramid                   | The ages of the dead                                                                                                                |
| `rate-by-age`      | age/sex rate lines (shared scale) | A death rate flat by age — except for men                                                                                           |

Every `key` is a real column — e.g. `ext_killed_cum`, `ext_killed_children_cum`
(`casualties_daily.json`); `killed_cum`, `displaced_persons_cum`, `settler_attacks_cum`
(`west_bank_daily.json`); `known_killed_in_gaza.*` (`summary.json`). The `histogram`
pyramid has no per-bar `key` — its source is `killed_in_gaza`
(`killed-in-gaza-v3.min.json`, the individually identified records), and each
band is a cross of that list's `age` and `sex` columns rather than one column
read directly. `killed_in_gaza`'s `identified_cum` key is built the same
way — not a column read directly, but a running total of that list's
`update` column, one accumulation per historical batch (see below).
`rate-by-age` has no `key` either — each band is a ratio of two things that
are each already computed elsewhere: the pyramid's per-band killed counts
(numerator) and a PCBS census reference table
(`site/src/data/gaza-population-pcbs-2017.json`, source id
`gaza_population_pcbs_2017`) shifted and scaled (denominator; see below).

### `identified_cum`: reading a batch list as a time series

"Naming every name" plots `identified_cum` (`killed_in_gaza`) against
`ext_killed_cum` (`casualties_daily`) on one shared scale. `identified_cum`
doesn't exist as a column anywhere — `generate-stories-data.ts` builds it by
counting `killed-in-gaza-v3.min.json` records per `update` batch (see
`updateDates` in `scripts/data/common/killed-in-gaza/constants.ts`),
accumulating batch sizes into a running total, and placing each total at that
batch's `includesUntil` date rather than its `on` (publish) date.
`includesUntil` is the coverage date — the date the batch's records are
complete _through_ — which is the only honest x position for a value that
claims "this many people were identified as of here." `on` is just when the
ministry got around to publishing that claim, months later.

Two consequences worth being explicit about:

- **Step, not slope.** Ten batches means ten true values; the ~140-point
  sample is forced to include each batch's exact index (see "Sampling and
  step points" below) so the jump survives, and the line renders step-after
  (`TimeField.step`) rather than interpolated, because nothing changed
  between batches — a slanted line there would depict gradual identification
  that never happened.
- **The lines can cross.** The identified count and the ministry's aggregate
  are two separately compiled totals; nothing in this chart clamps one to the
  other. From the March 2025 batch on, the identified list runs slightly
  _ahead_ of the aggregate. That's real, and the caption says so rather than
  the chart hiding it.

#### `step` on `TimeField`

`step?: boolean` (default off) tells `LineAreaChart` to draw a series
step-after — hold flat, then jump vertically at the next point — instead of
a straight interpolated line. Reach for it only when a series has real value
only at a handful of known dates and is flat-carried everywhere else
(`identified_cum` is the only current example); every daily series should
keep the default straight-line rendering, since a straight line between two
daily points is a fair reading of what happened in between.

#### Sampling and step points

`generate-stories-data.ts` samples ~140 evenly-spaced points from the full
daily resolution to keep `stories-data.json` small. An even sample can land
on either side of a `step` field's jump without ever landing on the jump
itself, which would silently smooth a real step into a slanted line. So the
generator unions the ten batch indices into the sampled index set before
picking every column — a few extra points shared by the whole file, in
exchange for the jump always being representable.

### `batch-stack`: reading the list as ten cohorts instead of one total

"Who each new list names" cuts `killed-in-gaza-v3.min.json` by its `update`
column into the ten republish batches, and draws each batch's age/sex
composition as one percent-stacked column.

Four choices carry the honesty of this chart, and each has a cheaper
alternative that would have been wrong:

- **Per-batch, not cumulative.** A column counts only the records that batch
  _added_. The running list is dominated by its early mass, so a cumulative
  cut damps every later shift toward invisibility — girls go 18.1% → 13.3%
  cumulatively but 18.1% → 8.2% per batch, and the second is the real
  movement. `update` is assigned once, on the batch where a ministry ID first
  appears, and never reassigned (`gatherIds` in
  `scripts/data/v3/killed-in-gaza.ts` guards on `!identifierUpdateIndex.has`),
  so the ten cohorts are genuinely disjoint and sum to the whole list. That
  makes the breakdown donut exactly these ten columns added together.
- **Columns, not an area; ordinal x, not dates.** Batches land at irregular
  coverage dates and nothing was measured between any two of them. An area
  across those gaps would draw a gradual demographic drift no one observed,
  and date-spacing would imply a continuous axis the data doesn't sit on —
  the same reasoning that makes `identified_cum` a step line rather than a
  slope. Columns claim this batch, this mix, and nothing about the space
  between.
- **Percent, not absolute.** Batches range from 1,765 records to 18,408. On
  absolute columns the eye compares batch _size_, which is an artifact of
  release cadence and identification backlog rather than of who was killed.
- **The same six groups as the donut, in the same colors.** Child under 18,
  senior 65+ across both sexes, `no_age` for an unrecorded age — the cutoffs
  are copied from `genderAge` in `scripts/data/v3/summary.ts` rather than
  re-chosen, so a column and a donut slice partition the same people the same
  way. `no_age` is currently 0 in every batch and is still emitted, so the
  generator can assert that the groups sum to each batch's own `records`
  (it throws if they don't); the modal legend omits a group that's zero at
  both ends rather than printing "0% → 0%".

**What the chart cannot say.** A batch is an _identification_ cohort, not a
death cohort. The records carry `age`, `dob` and `sex` but no date of death,
so a column is who was newly named in that release — heavily but not
exclusively people who died within its coverage window. Two compilation
changes also sit underneath the trend and can't be separated from it: from
batch 2 the ministry accepted family submissions alongside hospital records,
and from batch 6 the list has reached us via Iraq Body Count rather than
directly. The story's caption states all three limits; they are the reason
its copy claims a fact about the list rather than a fact about the war.

The generator's aggregate output is checkable against the project's own
published change summaries — summing all ten columns gives 49.5% men, 17.6%
boys, 16.1% women, 12.1% girls, 4.7% elders, which is the table in
`site/updates/2026-07-27-killed-list-update.md` exactly.

### The pyramid shares one scale across the centerline

`PyramidChart` scales men (left) and women (right) off a single `maxValue` —
the max across every band on _either_ side — computed once in
`getHistogram`. Giving each side its own maximum would make bar length mean
different things on the two sides of the centerline: a band where men are
scaled to their own max and women to theirs can look like parity when the
underlying counts aren't close at all. One shared scale is what makes the
left/right comparison at any given band honest.

### The pyramid reads the record list, not the aggregate — and reads it deeper than the donut does

Like the "Who has been killed" donut, the pyramid is built from the
individually identified dead, not `gaza.killed`. But where the donut reads
`summary.json`'s `known_killed_in_gaza` — which pre-sums every record into
six age/sex buckets — the pyramid reads `killed-in-gaza-v3.min.json`
directly, because those six buckets can't be resplit into 5-year bands after
the fact. The per-record list still carries each person's single-year age,
so `generate-stories-data.ts` rebins it into 18 five-year bands (85+ as the
top, open-ended band) per sex. Records with an unusable age or an
unrecognized sex are counted (`nullAge`, `unknownSex` in `stories-data.json`)
rather than dropped, so the emitted total is always accounted for, the same
disjoint-buckets discipline as the donut's age groups.

### The rate-by-age story: a per-population denominator, and its assumptions

"A death rate flat by age — except for men" divides the pyramid's per-band
killed counts by a population, rather than just counting people. That turns a
count (which mechanically grows with population size) into a rate (which
doesn't), and a rate is what actually lets you compare the shape of the male
and female curves across age — the entire point of the story. The numerator
is `bucketKilledInGaza`'s output, reused rather than recomputed: it's the same
(age, sex) → 5-year-band cross the pyramid needs, so `generate-stories-data.ts`
calls it once and both the `histogram` and `rate-by-age` stories read the
result.

The denominator has no equally clean source, because Gaza has had no census
since 2017. `generate-stories-data.ts` builds it from
`site/src/data/gaza-population-pcbs-2017.json` — a hand-authored reference
file, **not** one of this project's published/versioned datasets, so it lives
under `site/src/data/` rather than the repo root — via two named constants
(`RATE_AGE_SHIFT_YEARS`, `RATE_POP_SCALE_2023` / `RATE_POP_SCALE_2017`):

- **Shift, don't interpolate.** The census is a December 2017 snapshot; the
  identified-dead list runs from October 2023 onward. Rather than guess at a
  population that was never measured at intermediate ages, each output band's
  denominator is the census band exactly 5 years younger — the 2017 5-9
  cohort stands in for the (approximate) 2023 10-14 cohort. This is honest
  about migration and non-war mortality between 2017 and 2023 being
  unmodeled; the story's caption says so, because it's a real assumption, not
  an implementation detail to hide.
- **Scale, don't resplit.** PCBS publishes no Gaza-only 5-year-band-by-sex
  table for any year after the 2017 census — only the 2017 census meets that
  full specification (see `gaza-population-pcbs-2017.json`'s
  `scaling_reference` for the alternatives that were checked and rejected).
  So every shifted census count is multiplied by
  `RATE_POP_SCALE_2023 / RATE_POP_SCALE_2017` — PCBS's 2023 mid-year Gaza
  Strip total over the 2017 census total — to approximate 2023 population
  _size_ while keeping the census's 2017 age/sex _structure_, rather than
  inventing a resplit that isn't backed by any actual 2023 measurement.
- **Truncate at the edges, and say why.** The generator only emits bands
  5-9 through 75-79. 0-4 is excluded because it has no pre-war census cohort
  to shift forward from — most under-5s alive during the war were born after
  the 2017 census. 80-84 and 85+ are excluded because their source census
  bands are small enough that a shifted, scaled count would swing the rate on
  noise rather than signal. Both the shift years and this truncation reason
  are written into `stories-data.json`'s `rate_by_age.meta` — not just this
  file — so the assumptions travel with the data rather than living only in
  code comments a future editor might not read.

Like `dualScale` is a justified exception to shared-axis scaling, this
chart is the opposite: **there is no own-max mode for `rate-by-age`, ever.**
The male and female lines share one `maxValue` unconditionally, because the
entire finding is the contrast between a flat female line and a humped male
one — own-max scaling would stretch the flat line to fill its own range and
erase exactly the thing the chart exists to show.

### The breakdown donut reads the identified records, not the aggregate

"Who has been killed" is built from `summary.json`'s `known_killed_in_gaza` —
the individually identified dead (name, age, sex) — rather than `gaza.killed`,
the ministry's running daily aggregate. Two consequences the chart has to be
honest about:

- **The gap moves, and it used to run months behind.** The identified list
  only covers deaths through `includes_until`. That date used to trail the
  daily aggregate by months; a single 2025 batch closed the gap, and the list
  now runs at or slightly ahead of the aggregate as of its own coverage date
  (the "Naming every name" story on this page charts that catch-up). The
  relationship isn't pinned there forever, so the modal still renders the date
  from the data (`getCoverageThrough`, keyed on the parts' dataset rather than
  on "is this a donut") instead of the caption naming a lag that would go
  stale the next time the gap reopens. The two totals are not interchangeable
  and must never be mixed in one part-to-whole.
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

### `dualScale` is a justified exception, not a default

`dualScale` scales each line to its own maximum instead of a shared axis. It
is not the default reach for "series of different sizes" sharing a card —
once every line has its own scale, a reader's eye compares vertical
_position_, and that comparison stops being backed by the data: a tiny series
and a huge one both end at the same height. Three of the six current stories
use it (`fronts`, `settler`, `press-medics`), and each pays two costs for it:
cumulative series render as near-identical rising curves ending at exactly
1.0, and the vertical gap between two lines no longer means anything.

Reach for it only when the magnitudes differ enough that a shared scale would
flatten the smaller line to invisibility, and only alongside two disclosures,
enforced by convention rather than the type system:

- the caption states plainly that each line is scaled to its own maximum
- the `insight` makes no claim that depends on comparing the lines' heights or
  positions — that comparison isn't valid under own-max scaling, even though
  the tooltip still reports true values regardless of `dualScale`

### The build fails on a plotted column that quietly stopped moving

A frozen column is invisible from the JSON alone: `cumColumn`'s carry-forward
logic repeats the last known value forever whether the source stopped
reporting that field or genuinely hasn't changed, and nothing stops a story's
copy from asserting a "rate" over that flat line long after the source went
quiet. `generate-stories-data.ts` guards against exactly this: it walks
`STORIES`, collects every column any story's `fields` actually plot (breakdown
parts, histogram bands and rate-by-age bands are exempt from this check —
they're single snapshot counts, or a ratio of two snapshot counts, not a
value on the `dates[]` grid, so "the last date this changed" isn't a
meaningful question for them), and fails the build if a
plotted column's last real value-change is more than `STALE_THRESHOLD_DAYS`
(60) before the dataset's latest date — unless the field opts out with
`staleOk: "<reason>"`. The reason has to be an actual string, not a bare
boolean, because writing it down is the point: the two honest reasons in
practice are "this is a genuine irregular/step series" (`identified_cum`,
whose batches land irregularly by design) or "the source stopped publishing
this, and the story's copy already says so instead of asserting a rate over
it" (`ext_med_killed_cum`, frozen at 1,701 since October 2025 — see the
`press-medics` story). Every run prints a per-column freshness table so the
state is visible even when nothing trips it.

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

The `batch-stack` story does **not** close those placeholders and deliberately
added no catalog entry of its own. It reads columns that already exist
(`age`, `sex`, `update` on `killed-in-gaza-v3.min.json`) and emits its
per-batch cross only into `stories-data.json`, a component build artifact.
Catalog entries describe _published, versioned series a phase 2 explorer could
plot_ — pointing one at a file this component generates for itself would name
a series no API consumer can fetch. The `gaza.kig.*` placeholders stay
placeholders until a real `demographics-by-update` dataset is published.

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
