# AGENTS.md

This repo provides open-source datasets documenting the human toll of Israel's hostilities in Palestine since Oct 7, 2023. It also hosts a Docusaurus-based documentation/API site at [data.techforpalestine.org](https://data.techforpalestine.org).

## Commands

**Runtime**: [Bun](https://bun.sh) — install specific version `bun-v1.0.22`. Bun is used as package manager, build tool, and TypeScript runtime.

```bash
# Install dependencies
bun install

# Typecheck everything (root + site)
bun run types

# Generate all datasets from source data
bun run gen-all

# Generate individual datasets
bun run gen-daily          # casualties_daily.json + west_bank_daily.json + infrastructure
bun run gen-killed         # killed-in-gaza.json (v2 format)
bun run gen-killed-v3      # killed-in-gaza-v3.json (array format with update tracking)
bun run gen-killed-press   # press_killed_in_gaza.json
bun run gen-summaries      # summary JSON for site homepage (v1, v2, v3)
bun run gen-derived        # summaries + CSVs + killed-in-gaza indices/name data

# Generate chart visualization (SVG -> React components for homepage)
bun run chart-viz

# Docusaurus site
bun run docs-start         # dev server
bun run docs-build         # production build (includes pre-build + pre-deploy scripts)
bun run docs-serve         # serve production build locally

# Full local validation pipeline
bun run flightcheck        # types + reset manifest + gen-all + docs-build + docs-serve

# Other utilities
bun run reset-manifest     # empties site/src/generated/manifest.json
bun run sort-list-csvs     # sort killed-in-gaza CSV dictionaries
```

### Typechecking

`bun run types` runs two separate tsc checks:
1. Root `tsc --noEmit` (scripts, types) — excludes `site/`
2. `cd site && bun run typecheck` (Docusaurus site code)

Both must pass in CI.

## Architecture

### Monorepo Structure

- **Root** (`/`): Data generation scripts, type definitions, and published JSON datasets
- **`site/`**: Docusaurus static site (docs + API), configured as a bun workspace
- **`types/`**: Shared TypeScript types for both API consumers and internal scripts

### Data Pipeline

The project uses a **static API** pattern — there is no backend server. Data flows through:

1. **Source data**: Google Sheets (accessed via `TFP_SHEET_KEY` env var through a proxy at `tfp.fediship.workers.dev`) and CSV files in `scripts/data/common/killed-in-gaza/data/`
2. **Generation scripts** (`scripts/data/`): Pull source data, transform, validate, write JSON to repo root and `site/src/generated/`
3. **Manifest** (`site/src/generated/manifest.json`): Registry of all generated files. Every `writeJson` call updates this manifest. The site code reads it to build API download links. **Must be reset to `{}` before regenerating** (hence `reset-manifest` in flightcheck)
4. **Site build**: Docusaurus builds the site; a pre-deploy script moves JSON files into the deployable output based on manifest entries
5. **Deployment**: Cloudflare integration deploys from `main` (live) and branches (preview)

### Datasets (5 source JSON files in repo root)

| File | Description | Source |
|------|-------------|--------|
| `killed-in-gaza.json` | Named fatalities with id, name, age, sex, dob | CSV in repo |
| `casualties_daily.json` | Daily aggregate killed/injured counts for Gaza | Google Sheets |
| `west_bank_daily.json` | Daily killed/injured/settler attacks for West Bank | Google Sheets |
| `press_killed_in_gaza.json` | Journalists killed in Gaza | Google Sheets |
| `infrastructure-damaged.json` | Weekly infrastructure damage estimates | Google Sheets |

Each has a `.min.json` companion (no whitespace) for API serving.

### Script Versions

Scripts under `scripts/data/` use versioned subfolders (`v1/`, `v2/`, `v3/`). Version suffixes in `ApiResource` enum values (e.g., `CasualtiesDaily_V2`) are parsed by the manifest system to determine API path (`api/v2/`, `api/v3/`). The underscore separator between name and version is required by the manifest logic.

### Killed-in-Gaza List (complex pipeline)

The names list has the most involved pipeline:

1. Raw Arabic names in `scripts/data/common/killed-in-gaza/data/raw.csv`
2. Arabic-to-English translation dictionaries: `dict_ar_en.csv`, `dict_ar_ar.csv`
3. `generate_killed_list.ts` — processes raw CSV, translates names, outputs cleaned CSV
4. `scripts/data/v2/killed-in-gaza.ts` — converts CSV → `killed-in-gaza.json` (object format)
5. `scripts/data/v3/killed-in-gaza.ts` — converts v2 JSON → `killed-in-gaza-v3.json` (array-of-arrays format with update tracking). Fetches historical commits from GitHub to tag which update batch each record appeared in
6. `scripts/data/v2/derived/killed-indices.ts` — generates paged JSON files, name indices, family groupings into `site/src/generated/killed-in-gaza/`
7. Known duplicates managed manually in `scripts/data/common/killed-in-gaza/duplicates.ts`
8. `canonicalUpdateCommits` in `constants.ts` maps git commits to list update batches

### Chart Generation

`chart-viz` (`chart-generator.ts`) reads `casualties_daily.min.json` + `west_bank_daily.min.json`, generates SVG charts using D3, converts to React components via SVGR, writes to `site/src/generated/`. These are imported directly by the homepage component.

## Site (Docusaurus)

- Config: `site/docusaurus.config.ts`
- Blog/updates: `site/updates/` (uses Docusaurus blog plugin with `routeBasePath: "updates"`)
- Docs: `site/docs/` — dataset API documentation, guides, examples
- Custom webpack plugin in docusaurus config serves `killed-in-gaza-v3.min.json` locally at `/api/v3/killed-in-gaza.min.json`

### Names List Page (`/list`)

Uses a **Web Worker** (`KilledNamesListGrid/worker.ts`) that streams the v3 killed-in-gaza JSON via `oboe` (streaming JSON parser). The v3 format is array-of-arrays with a header row for field names, defined in `scripts/data/v3/constants.ts` (`kig3FieldIndex`). The worker posts individual records back to the main thread.

### Key Generated Files

All under `site/src/generated/` (gitignored, generated by scripts):
- `manifest.json` — file registry for API serving
- `summary.json` — homepage preview data (v3 format)
- `daily-chart.svg` / `daily-chart-mobile.svg` / `daily-chart.json` — chart data
- `killed-in-gaza/` — paged JSON files, name indices, family lists for the names viewer

## Key Patterns and Gotchas

- **`TFP_SHEET_KEY` env var**: Required for scripts that fetch Google Sheets data. Not needed for killed-in-gaza scripts (those use local CSVs). Required for daily, press, infrastructure, and west-bank scripts. Missing in CI unless configured as a secret.
- **`age: -1`** means unknown age in the killed-in-gaza dataset. Not `null` or `undefined`.
- **`ext_` prefix** on fields in daily reports denotes "guaranteed non-optional" fields. Validation in `scripts/data/common/casualties-daily/index.ts` asserts these are always present.
- **`report_source` values**: `"mohtel"`, `"gmotel"`, `"unocha"`, `"missing"` — different reporting entities for Gaza daily data.
- **`source` field in killed-in-gaza**: `"h"` = Ministry of Health, `"c"` = citizen reports (family reporting).
- **`require()` vs `import`**: Some scripts use `require()` to load JSON (e.g., v2 summary), others use `import`. This is intentional — `require` avoids module graph issues with large JSON files in some contexts.
- **Manifest must be clean before regeneration**: Running `gen-all` without resetting manifest will produce corrupt results. Use `reset-manifest` or `flightcheck`.
- **RTL column ordering**: The Arabic-to-Arabic dictionary CSV can have unreliable column order in CI. The `arToArAssertKey` constant (`"ابو الليل"`) is used to verify correct parsing.
- **`kig3ColMapping` vs `kig3FieldIndex`**: v3 killed-in-gaza uses positional arrays. `kig3FieldIndex` is the header row (field names in order), `kig3ColMapping` maps field names to array indices. Both are in `scripts/data/v3/constants.ts`.
- **Derived data artifact caching**: `killed-indices.ts` uses checksum-based caching via `scripts/utils/artifacts.ts` to skip regeneration when source JSON hasn't changed.
- **`postinstall` runs `patch-deps`**: Applies patches to docusaurus-utils via `patches/docusaurus-utils.sh`.
- **Test workflow** stubs generated files: CI creates `site/src/generated/killed-in-gaza/` dir, runs `chart-viz`, `gen-summaries`, `gen-killed-derived`, and stubs `page-info.json` before typechecking.
- **Google Sheets proxy**: All sheet fetches go through `tfp.fediship.workers.dev` with `x-token` header, not directly to Google Sheets API.
- **West Bank `verified` field**: `WestBankDailyReportV2.verified` is optional. When present, its values take precedence over the top-level cumulative fields. Summary scripts use `??` to fall back.
