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
            → edits/creates one markdown file per report date under content/
            → editorial workflow opens a Pull Request
PR CI       → regenerates casualties_daily.json / west_bank_daily.json from content
            → runs typechecks + formatting → maintainer reviews & merges
main        → existing SQLite export runs unchanged
```

## Content model

Each report date is one markdown file:

- `content/gaza-daily/YYYY-MM-DD.md`
- `content/west-bank-daily/YYYY-MM-DD.md`

Numeric figures live in YAML **front matter**; the markdown **body** holds the
original source material (bulletin text, links, screenshot references).

The build (`scripts/data/v2/gaza-daily.ts`, `scripts/data/v2/west-bank-daily.ts`)
reads these files and produces the exact same JSON the Google Sheet pipeline did.
Regenerating from the backfilled content is byte-identical to the committed JSON.

### Minimum input + derived cumulatives

Contributors enter the minimum reported figures. Cumulative totals that are a
clean running sum of a daily figure are filled in automatically:

| Dataset | Entered (daily) | Auto-derived (cumulative) |
| --- | --- | --- |
| Gaza | `ext_killed` | `ext_killed_cum` |
| Gaza | `ext_injured` | `ext_injured_cum` |

Other cumulative fields (the source-reported totals for children, women,
massacres, medical, press, and all West Bank figures) carry corrections,
recoveries, and reporting-gap anomalies, so they cannot be inferred safely and
are entered directly. If a cumulative field is provided it is always respected
as-is (used for historical accuracy and manual corrections); it is only computed
when left blank. See `scripts/data/common/casualties-daily/config.ts`.

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
# regenerate datasets from content
bun run gen-daily-v2   # Gaza
bun run gen-wbdaily    # West Bank

# one-time migration from existing JSON into content/ (already run)
bun run scripts/data/common/casualties-daily/backfill.ts
```
