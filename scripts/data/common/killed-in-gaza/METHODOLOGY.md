# killed-in-gaza: methodology & learnings

Context for whoever picks up the next list update. `README.md` has the runbook; this
file explains _why_ the steps are what they are, and records the traps that have
already cost time.

Per-update scripts are not kept — they hardcode one release's paths and one PDF's
layout, and once `data/raw.csv` absorbs their output they are dead weight. They stay
in git history: `git show a9fc873:scripts/data/common/killed-in-gaza/<file>`.

## The two source formats

**xlsx with English transliterations** — the easy path. IBC has already done the
transliteration, so we take it verbatim and only reshape the columns; `extract.py`
covers it end to end.

**Arabic-only PDF** — we generate the transliterations ourselves. Everything below is
about that case.

## Extraction

Do not reach for `pdftotext -layout`. Two things break it:

- Embedded font subsets can have **glyphs whose ToUnicode entries fall back to
  identity** — Arabic presentation-form ligatures rendering as `?`, `_`, `x`, `Ä`.
  Recover the mapping by aligning against known-good names already in `raw.csv`;
  singletons that appear too rarely to align have to be read off rendered pages.
- bidi handling misplaces spaces around those wide ligatures
  (`عبدالله البراوي` → `عبدا للهالبراوي`) and sometimes rotates a whole name.

Character _geometry_ stays reliable even when text extraction does not, so rebuild
each row from character positions: Arabic-font characters in descending-x (RTL
logical) order, Latin columns left to right. PyMuPDF (`fitz`) exposes what you need.

**Always validate against the records you already have.** The ids already in
`raw.csv` are a free correctness oracle — expect ~95% byte-exact, ~99% after
orthographic normalisation, and zero residual bad characters. A parse that can't
clear that bar is mangling names.

## Building the dictionary

`dict_ar_en.csv` is the trustworthy lookup, and it improves each time a release is
mined into it. Mining is how you _extend_ it, not a reason to route around it.

- Take rows where the Arabic and English word counts match so segments zip 1:1, and
  keep the majority English per Arabic segment.
- Where a mined value disagrees with an existing entry, the mined value wins — it is
  IBC's own choice, backed by occurrence counts you can check.
- Some segments are context-dependent: `عبد` is "Abdel" before most words but "Abd"
  in `عبد ربه` → "Abd Rabbo". Keep bigram entries that disagree with the unigram
  choice in `data/dict_bigrams.csv`.
- Compounds never seen whole (`ابونبهان`) get split against known segments and
  recorded in `dict_ar_ar.csv`, which exists for exactly this.
- Whatever is still unresolved becomes a manual worklist, in two tiers: segments with
  no evidence at all, and segments only the legacy dictionary can resolve. The second
  tier looks resolved but needs eyes on it just as much.
- **Fold hand-filled transliterations back into `dict_ar_en.csv` as part of the
  update.** Left in a worklist file they are invisible to every later run.

Validate with a held-out split before trusting it — 80/20 on the aligned rows should
reproduce IBC's exact English on ~99% of the names it can fully render.

## Auditing the dictionary

The hand-built dictionary the repo started from carried a layer of bad entries.
Sweep for three signatures after any mining pass:

- mangled prefixes — `ابولبن` → `abolbn`, `ابواسماعيل` → `abwasamaail`
- vowel-less strings — `دهمش` → `dhmsh`
- semantic _translations_ where a transliteration belongs — `ابناسراء` →
  "son of israa" rather than "ibn israa"

Build an evidence map (majority English per Arabic segment) from a release IBC
transliterated itself. Evidence-backed entries that disagree with it are stale; fix
them to the mined value. For the rest, decompose compounds against attested segments
and compare — `abolbn` next to `abu laban` is obvious side by side. Repair rather
than delete wherever the Arabic decomposes, since that grows coverage; delete only
what cannot be reconstructed.

Then regenerate and diff. Dead entries produce no change — anything that _does_
change was reaching the published list. The first run of this audit found two records
publishing real people's names as "Aboaishaah" and "Aboaiadah".

Ignore pure style differences (`abu-baraka` vs `abu baraka`, `basheer` vs `bashir`).
They outnumber the genuine faults, so a naive "disagrees with its decomposition"
filter over-reports badly.

## Traps

**Hamza is written both ways.** Source PDFs write hamza composed (`أ`, U+0623) _and_
decomposed (`ا` + U+0654). They look identical and compare unequal. When two rows
appear to share a key, dump codepoints (`' '.join(hex(ord(c)) for c in key)`) rather
than trusting your eyes.

**Normalisation is a fallback key only.** `dict_ar_en.csv` deliberately carries both
composed and decomposed forms. Never normalise when _writing_ dictionary keys.

**Never let file order break a tie.** Many keys collapse to a shared normalised form,
and `setdefault` over file order silently picks a winner. Since CI rewrites the file
on every push, that winner flips with no change in intent — it once turned Ayham into
"Aihm" and Aseed into "Asaid", both times choosing a legacy entry with zero IBC
evidence over the composed key carrying IBC's own value. Sort candidates
deterministically, preferring the NFC-composed spelling, and warn loudly on duplicate
keys with conflicting values.

**Prefer evidence over the incumbent entry.** When the dictionary and the mined data
disagree, count occurrences in `raw.csv` before deciding. `فريال` shipped as `friyal`
only because two byte-identical rows existed and CI's dedupe kept the wrong one —
IBC's own rows use `firyal` overwhelmingly and `friyal` never.

**CI rewrites the dictionaries.** `gen-killed-in-gaza.yml` runs `sort-list-csvs` on
`dict_ar_en.csv` and `dict_ar_ar.csv` and commits the result. The `en` dict is
normalised, lowercased and sorted by `localeCompare`; the `ar` dict is sorted by
descending row length and asserts `arToArAssertKey` survives RTL round-tripping.
Duplicate keys are deduped last-wins. Any local change must be a fixed point: run the
sorter twice and confirm no diff.

**CSV shape is load-bearing.** CRLF row delimiters, **no trailing newline**.
`utils.ts:readCsv` splits on `"\n"` without dropping a blank final line, so a trailing
newline crashes `diff_lists.ts`.

**Arabic literals get mangled in shell commands.** RTL reordering scrambles the
arguments of things like `git show $c:…dict_ar_en.csv | grep "^فريال,"`. Put anything
containing Arabic literals inside a `python3 -c` script.

## Age is age-at-death

`age`, `age_raw` and `dob` are copied verbatim from the source. Nothing derives age
from the current date, and nothing should — these are ages at time of death, not ages
the person would be now.

Ages still change between releases, in both directions, because IBC revises them.
Across shared ids the deltas cluster at zero with decreases outnumbering increases,
which is the signature you want: a clock leaking in would push uniformly upward.
(`differenceBetweenAgeBasedDobAndReportedDob` in `utils.ts` does call `new Date()`,
but only for a `diff_lists.ts` histogram — it never writes a field.)

## After the merge: v3 and the update index

`killed-in-gaza-v3.json` carries an `update` field — which list update first
introduced each id — built by fetching `killed-in-gaza.json` at every commit in
`canonicalUpdateCommits`. **The update's squashed merge commit must already be on
main**, so v3 is inherently a post-merge step and cannot run in
`gen-killed-in-gaza.yml`, which is scoped to `"!main"`.

After merging, add the merge commit to `canonicalUpdateCommits` and matching entries
to `updateDates` and `updateLinks`. `gen-killed-in-gaza-v3.yml` then regenerates v3
and fails the run if any record is left at `update: -1` — the symptom of forgetting.
This matters because v3 is what the `/names` viewer loads (`worker.ts` fetches
`/api/v3/killed-in-gaza.min.json`) and what `scripts/build/sqlite-export.ts` reads;
it went unautomated for several updates and silently served a stale, much shorter
list on both surfaces.

Expect per-update counts to run lower than the "new records" figure in the update
post: ids that appeared earlier, were removed, and later returned are attributed to
their _first_ appearance.
