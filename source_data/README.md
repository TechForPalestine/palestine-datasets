# Source data

Source-of-truth data for the **Gaza**, **West Bank** and **Lebanon** daily
casualties datasets and the **journalists killed in Gaza** list (named
`source_data` to disambiguate from the Docusaurus site content). Each record is
one markdown file with its figures/fields in YAML front matter and the original
source material in the markdown body.

- `gaza-daily/YYYY-MM-DD.md` → builds `casualties_daily.json` (reported daily,
  one file per day)
- `west-bank-daily/YYYY-MM-DD.md` → builds `west_bank_daily.json` (not reported
  daily — only dates with new values get a file; the build carries figures
  forward to fill every day through the latest Gaza report date)
- `lebanon-daily/YYYY-MM-DD.md` → builds `lebanon_casualties_daily.json`
- `press-killed/NNNN.md` → builds `press_killed_in_gaza.json` (one journalist
  per file, published in sequence order). The file name is the zero-padded
  4-digit `seq` from the front matter; **append a new journalist with the next
  number after the current highest** (e.g. `0263.md` with `seq: "0263"`).
  `name` is the Arabic name as reported (the build normalises it and generates
  `name_en`), `notes` is published as-is, and the optional `source` link is kept
  for reference but not published.

Edit these via the CMS at `/admin/` (recommended) or directly. After changes,
regenerate the JSON and run the consistency gate:

```bash
bun run gen-daily-v2     # Gaza
bun run gen-wbdaily      # West Bank
bun run gen-lbdaily      # Lebanon
bun run gen-killed-press # journalists killed in Gaza
bun run validate-daily   # reported daily must match the cumulative delta
```

See [`docs/decap-cms-setup.md`](../docs/decap-cms-setup.md) for the full
workflow, the reported-vs-auto-calculated `ext_` rules, the discrepancy gate,
and CMS setup.
