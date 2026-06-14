# Daily casualties source data

Source-of-truth data for the **Gaza** and **West Bank** daily casualties
datasets (named `source_data` to disambiguate from the Docusaurus site content).
Each report date is one markdown file with the as-reported numeric figures in
YAML front matter and the original source material in the markdown body.

- `gaza-daily/YYYY-MM-DD.md` → builds `casualties_daily.json` (reported daily,
  one file per day)
- `west-bank-daily/YYYY-MM-DD.md` → builds `west_bank_daily.json` (not reported
  daily — only dates with new values get a file; the build carries figures
  forward to fill every day through the latest Gaza report date)

Edit these via the CMS at `/admin/` (recommended) or directly. After changes,
regenerate the JSON and run the consistency gate:

```bash
bun run gen-daily-v2   # Gaza
bun run gen-wbdaily    # West Bank
bun run validate-daily # reported daily must match the cumulative delta
```

See [`docs/decap-cms-setup.md`](../docs/decap-cms-setup.md) for the full
workflow, the reported-vs-auto-calculated `ext_` rules, the discrepancy gate,
and CMS setup.
