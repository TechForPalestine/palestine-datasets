# Decap CMS for daily casualties data entry

This repo uses [Decap CMS](https://decapcms.org/) to let collaborators add and
edit the **Gaza** and **West Bank** daily casualties datasets without touching a
spreadsheet, and to capture the **original source material** for each report.

It stays true to the project's "no backend, no database" constraint: Decap is
git-based and commits directly to this repository. The only externally hosted
piece is a tiny **stateless** OAuth proxy (a Cloudflare Worker) that completes
the GitHub login handshake — it stores nothing.

## How it fits together

```
Contributor → /admin (static Decap UI served by the Docusaurus site)
            → "Login with GitHub" → Cloudflare Worker OAuth proxy → GitHub
            → edits/creates one markdown file per report date under source_data/
            → editorial workflow opens a Pull Request
PR CI       → validates the changed report dates (casualties-pr-check.yml):
              reported-vs-cumulative consistency + the source data builds
main CI      → on merge, regenerates casualties_daily.json / west_bank_daily.json
              from source_data and commits them (casualties-build.yml),
              then triggers the SQLite export
```

## Continuous integration

Two workflows drive the source-data pipeline:

- **`.github/workflows/casualties-pr-check.yml`** (on `pull_request`) — read-only
  gate. It runs `validate-daily` scoped to the report dates the PR changed and
  regenerates the datasets to confirm the source data is well-formed. It does not
  modify the PR branch, so it never interferes with Decap's editorial-workflow
  branches. A failure blocks the merge.
- **`.github/workflows/casualties-build.yml`** (on `push` to `main`) — the
  authoritative regeneration. It rebuilds the Gaza & West Bank JSON from
  `source_data` and commits any changes, then dispatches the SQLite export. This
  is also the safety net for source data that reaches main any other way (direct
  edits, fork PRs).

Neither needs `TFP_SHEET_KEY`: Gaza and West Bank are now built entirely from
committed `source_data`. The Google Sheet (and `gen-daily.yml`) still drives the
other datasets (infrastructure, press-killed).

## Content model

A report date is one markdown file. Numeric figures live in YAML **front
matter**; the markdown **body** holds the original source material (bulletin
text, links, screenshot references).

- `source_data/gaza-daily/YYYY-MM-DD.md` — Gaza is reported daily, so there is
  one file per day.
- `source_data/west-bank-daily/YYYY-MM-DD.md` — West Bank is **not** reported
  daily, so files exist **only for dates with newly reported values**. The build
  generates the "fill" days by carrying the last reported flash figures forward
  to **every day through the latest Gaza report date**, keeping the two daily
  series in sync. Verified figures are emitted only on the dates a report
  actually provided them (they are never carried forward).

The build (`scripts/data/v2/gaza-daily.ts`, `scripts/data/v2/west-bank-daily.ts`)
reads these files and produces the exact same JSON the Google Sheet pipeline did.
Regenerating from the backfilled source data is byte-identical to the committed JSON.

### Manual input vs the auto-calculated `ext_` series

Contributors enter the figures **as reported by the source** (`killed`,
`killed_cum`, `injured`, `injured_cum`, and the various reported `*_cum`
totals). The extended (`ext_`) continuous series is **calculated by the build**,
so contributors leave those fields blank:

| Reported (entered) | Extended (auto-calculated) | Rule |
| --- | --- | --- |
| `killed_cum` | `ext_killed_cum` | reported cumulative, carried forward over gaps |
| `ext_killed_cum` | `ext_killed` | day-over-day delta of the extended cumulative |
| `injured_cum` | `ext_injured_cum` | carried forward |
| `ext_injured_cum` | `ext_injured` | delta |
| `killed_children_cum`, `killed_women_cum`, `massacres_cum`, `civdef_killed_cum`, `med_killed_cum`, `press_killed_cum` | corresponding `ext_*_cum` | carried forward |

West Bank flash reports sometimes give an incremental figure (since the prior
report) instead of a fresh cumulative. Contributors can enter either; when a
cumulative is left blank, it's resolved as the prior reported cumulative plus
the incremental (`killed`, `killed_children`, `injured`, `injured_children`,
`settler_attacks` → their `*_cum` counterparts) before the carry-forward
timeline is built. See `westBankIncrementalRules` and
`applyIncrementalToCumulative` in `scripts/data/common/casualties-daily/`.

Any value that is already present is respected as-is: backfilled history keeps
its exact `ext_` values (which embed prior editorial gap-filling), and an editor
can override a calculated value when needed. Only blank fields are filled, so
regenerating history is byte-identical. See
`scripts/data/common/casualties-daily/config.ts`.

### Reporting discrepancies (consistency gate)

Per project policy the **reported cumulative is authoritative**, so a reported
daily figure must equal the day-over-day change in its cumulative
(`killed` vs the `killed_cum` delta, `injured` vs the `injured_cum` delta). A
mismatch is **inconsistent data that must be fixed** — reconcile the daily to the
cumulative — never waved through.

`bun run validate-daily` checks this and exits non-zero on any discrepancy, so it
gates a merge:

```bash
bun run validate-daily                          # whole dataset
bun run validate-daily source_data/gaza-daily/2026-06-14.md   # only given dates
```

In CI this runs against the report dates a PR changed (using the full series for
prior-day context). The check is **not bypassable**: editorial remarks document
*why* a figure was reconciled, they do not suppress the gate — allowing a bypass
would let inconsistent data through, which we never want. Ideally this same check
also runs in the CMS at entry time; that is more involved and tracked separately.

25 pre-policy historical days are **grandfathered** via an allowlist in
`config.ts` (`gazaDiscrepancyAllowlist`): the gate accepts those exact rows but
fails on any new discrepancy. Don't add to the allowlist — fix new data instead;
entries can be removed as history is reconciled.

The `Editorial notes` field is kept for documenting decisions and is internal —
it is **not** published in the dataset JSON.

## Self-hosted CMS bundle

The Decap CMS JavaScript is **served from our own deploy**, not a third-party CDN
(unpkg), so we own the code and the version. The version is pinned via the
`decap-cms` devDependency in `site/package.json`, and `bun run vendor-decap`
copies that exact bundle to `site/static/admin/decap-cms.js` (served at
`/admin/decap-cms.js`). This runs automatically in `scripts/build/pre-build.sh`;
the copied file is gitignored (generated at build time). To bump the version,
change the pin and re-run the vendor step. For local admin testing run
`bun run vendor-decap` once after `bun install`.

## One-time setup

### 1. GitHub OAuth App

Create a GitHub OAuth App (org **TechForPalestine** → Settings → Developer
settings → OAuth Apps → New):

- **Homepage URL:** `https://data.techforpalestine.org`
- **Authorization callback URL:** the Worker's callback, e.g.
  `https://<worker-subdomain>.workers.dev/callback`

Note the **Client ID** and **Client Secret**.

### 2. Cloudflare Worker OAuth proxy

Deploy a stateless Decap-compatible OAuth proxy Worker (same Cloudflare account
that already runs the sheet proxy). A widely used implementation is
[`decap-cms-cloudflare-pages-oauth`](https://github.com/i40west/netlify-cms-cloudflare-pages)
/ the [Sveltia/Decap OAuth Worker](https://github.com/sveltia/sveltia-cms-auth).
Configure these secrets on the Worker:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

### 3. Point Decap at the Worker

In `site/static/admin/config.yml`, set `backend.base_url` to the deployed Worker
origin (the `auth_endpoint` defaults to `/auth`).

### 4. Grant access

Add data-entry collaborators with write access to the repository (or to a team
with write access). Decap authorizes against GitHub repo permissions.

## Using it

Visit `https://data.techforpalestine.org/admin/`, log in with GitHub, pick the
Gaza or West Bank collection, and create/edit a report. Saving as "Ready" opens
a Pull Request that a maintainer reviews and merges. CI regenerates the JSON.

## Local development

```bash
# regenerate datasets from source data
bun run gen-daily-v2   # Gaza
bun run gen-wbdaily    # West Bank

# one-time migration from existing JSON into source_data/ (already run)
bun run scripts/data/common/casualties-daily/backfill.ts
```
