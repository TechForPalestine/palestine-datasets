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
      "Everyone here was identified individually — name, age, sex — rather than counted in a daily total. That list used to lag the ministry’s running aggregate by months; it no longer does — as of this list’s own coverage date (noted below), it holds slightly more records than the aggregate held on that same date, covering 99.3% of the toll counted since. The “Naming every name” story on this page charts how that gap closed. Each record sits in exactly one age-and-sex group, so the slices add up to the whole list; elders are shown together rather than split, being under 5% of it. Journalists, medics and civil-defence workers are counted here too, but the records carry no profession, so they can’t be pulled back out of these groups — showing them as separate slices would count those people twice.",
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
      "killed-in-gaza-v3 carries a name, an age and a date of birth for 72,835 people — as of this list’s own coverage date, that is more records than the ministry’s running aggregate held on the same date (72,628), and it covers 99.3% of the current total (73,375). Nearly everyone in the toll now has an identity behind the number, which is what makes a chart at this resolution possible: the “Who has been killed” donut sums these same records into six age-and-sex buckets, but the underlying records carry single-year ages, so they can also be rebinned into 5-year bands. The base is wide — 5,293 of the dead were under 5 — and the widest single band is 30–34, at 8,312; the two bands either side of 30 hold 16,443 people between them.",
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
      "Each line is deaths per 1,000 people of that age and sex in Gaza’s approximate 2023 population — the same identified dead as “The ages of the dead” pyramid, now divided by a population instead of just counted. The denominator comes from PCBS’s 2017 census, the only Gaza-only breakdown by 5-year age band and sex PCBS has published: each band is shifted five years older (the 2017 5–9 cohort stands in for the 2023 10–14 cohort) and every count is scaled by 2,226,544 ⁄ 1,875,317 — PCBS’s 2023 mid-year Gaza Strip estimate over the 2017 census total — to approximate 2023 population size while keeping the census age structure. The female rate barely moves with age: 15.5 to 18.9 per 1,000 across ages 5–49, a coefficient of variation of 8%. The male rate swings from 17.1 to 67.9 over the same span, a coefficient of variation of 37%. A death rate flat with respect to age is what indiscriminate killing looks like, and it holds for women and children alike — girls and boys under 10 die at nearly identical rates, 15.8 versus 17.1 per 1,000. Males break from that flat baseline at every age past childhood.\n\nTaking the female rate in each band as the baseline, the age-standardized male excess — how many more men died than would have if men’s rate matched women’s at every age — is 28,247 people across the ages charted here, 38.8% of the identified list, largest at 30–34. That total covers ages 5–79 only, the bands the chart shows; the excluded 80+ bands would add fewer than a hundred to it.\n\nWhere that excess sits matters more than its size. Under 10 there is barely any: boys die at 1.08 times the girls’ rate, 221 deaths above parity, and children that age are plainly being killed without regard to which they are. From 10–14 onward the male rate never returns to the female one — 1.47 times at 10–14, 2.68 by 15–19, peaking at 3.62 at 35–39, and still 1.74 to 1.96 times among men in their sixties and seventies. Nearly three in ten of the excess deaths — 28.7% — fall outside ages 20–49 altogether: 4,892 among boys aged 10–19, 1,611 among men in their fifties, 1,386 among men aged 60–79, and 221 among children under 10. A gap that opens at age 10 and is still open at 79 is not the shape of a count of fighters.\n\nWhat it is the shape of, this data cannot settle. The dataset carries no combatant field, and two different explanations predict the same curve: an approach that treats males of almost any age as presumptively legitimate targets, and gendered exposure — men and boys outdoors working, queuing for aid, digging through rubble, staying behind when families evacuate. Both would elevate male rates at 12 and at 72. So 28,247 is a ceiling containing every one of those mechanisms, not an estimate of combatants, and the age profile rules out the narrowest reading without establishing which of the rest is doing the work.\n\nThe denominator is static and pre-war: it is the 2017 census structure, shifted and scaled, not a population actually measured in 2023 — running the same computation unshifted moves the overall male:female ratio from 2.42 to 2.27, so the conclusion is robust to that choice, but each individual band’s rate carries the shift assumption. Rates use the individually identified list, about 99.3% of the ministry’s aggregate toll, so if anything they run slightly low. Under-5s aren’t computable at all: the 2017 census has no age band below zero to shift forward from, and most under-5s alive during the war were born after that census.",
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
      "Each column is one of the ten releases of the identified-dead list, showing only the people that release newly named — not the list as it stood after it, which is dominated by its early mass and would flatten every later shift into invisibility. Columns are evenly spaced and sit at a batch ordinal, not a date: the releases land at irregular coverage dates and nothing is known about the composition between two of them, so an area drawn across those gaps would depict a gradual drift no one measured.\n\nThe first release stands apart from all nine that followed. Names added in it — deaths through January 5, 2024, the opening three months — are 62.1% women and children. No later batch exceeds 49.2%, and the most recent is 36.9%. But the shift is not spread evenly across those groups. Boys barely move: 20.9% of the first batch, 17.1% of the latest, and never outside 14.0–20.9% in any release. It is girls and women whose share falls by roughly half — girls from 18.1% to 8.2%, women from 23.1% to 11.6% — while men rise from 33.5% to 59.4%. Read alongside “A death rate flat by age — except for men,” where the male excess opens at about age 10 and never closes, the same asymmetry shows up twice in two independent cuts of this list.\n\nWhat a column is not: a death cohort. The records carry a name, an age, a date of birth and a sex, but no date of death, so a batch is the set of people newly *identified* by that release, heavily but not exclusively those who died within its coverage window. A record’s batch is the release its ministry ID first appeared in and is never reassigned afterward, so the ten columns are disjoint and sum to the whole list; the “Who has been killed” donut is precisely these ten columns added together.\n\nTwo changes in how the list was compiled sit underneath the trend and cannot be separated from it. From the second release onward the ministry accepted submissions from families of the killed, alongside its own hospital records. From the sixth onward the list has reached us via Iraq Body Count rather than directly. Either could shift who gets named and how quickly, independent of any change in who was killed. The columns are an honest account of the list; they are a bounded account of the war.",
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
      "Both lines count the same dead on the same scale: the ministry’s running daily aggregate, and how many of those deaths had by then been individually identified by name. Each point on the identified line sits at a batch’s includesUntil date — the date its records are complete through — not the later date the batch was actually published; publication lagged coverage by 6 to 81 days across the list’s ten historical batches, so the line is plotted where the honest claim is, not where the announcement landed. Coverage sat at 54.3% through the first five batches, then a single 18,408-record batch covering March 2025 pushed it to 100.7% and it has stayed at or above full coverage since — 72,835 identified against 72,628 in the aggregate as of the most recent batch. That the identified count runs slightly ahead of the aggregate from there on is real, not a rounding artifact: they are two separately compiled counts, and neither is clamped to the other here.",
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
      "Cumulative people killed in each territory. Gaza’s toll is roughly 66x the West Bank’s, so each line is scaled to its own maximum rather than a shared one — that keeps the West Bank’s climb legible, but it also means the two lines reach the same height on the chart despite the real gap between them; read the tooltip for true counts, not line position. Neither pauses.",
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

  {
    id: "press-medics",
    kicker: "Press & medics",
    title: "Reporting under fire",
    insight:
      "Medical-personnel deaths haven’t been updated since October 2025; journalist deaths have kept climbing.",
    caption:
      "The medical-personnel count has sat at 1,701 since October 7, 2025 — the ministry stopped publishing that disaggregation, and this flat line is that reporting gap, not a claim that medics stopped being killed. Journalists are a live count by contrast: it rose from 257 to 262 during 2026, most recently in April. Each line is scaled to its own maximum so both are legible on one chart — that means line height compares each series to itself, not to the other; read the tooltip for true counts.",
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
      "Both lines are running totals since October 2023. Each is scaled to its own maximum, not a shared axis, so the smaller settler-attacks count doesn’t get flattened by displacement’s larger one — that means the two curves reaching similar heights is a scaling choice, not evidence the counts are close; the numbers below are what to compare, not line position. Settler attacks reached 370 by the end of 2023, 1,797 a year later, 3,143 by the end of 2025 and 4,401 by August 2026 — a pace of roughly 3.7 incidents a day through 2025 that rises to about 5.9 a day across 2026. Displacement tracks a similar acceleration at a little over twice the count: 1,012, then 3,841, then 6,831, then 9,420 people, with the daily pace going from about 8 to about 12 over the same turn. The two are not linked in the data: the West Bank dataset counts settler attacks as incidents and counts displaced persons separately, with no attribution of any displacement to a cause. Read the lines side by side, but neither explains the other.",
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
