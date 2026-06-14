# Daily casualties content

Source-of-truth content for the **Gaza** and **West Bank** daily casualties
datasets. Each report date is one markdown file with numeric figures in YAML
front matter and the original source material in the markdown body.

- `gaza-daily/YYYY-MM-DD.md` → builds `casualties_daily.json`
- `west-bank-daily/YYYY-MM-DD.md` → builds `west_bank_daily.json`

Edit these via the CMS at `/admin/` (recommended) or directly. After changes,
regenerate the JSON:

```bash
bun run gen-daily-v2   # Gaza
bun run gen-wbdaily    # West Bank
```

See [`docs/decap-cms-setup.md`](../docs/decap-cms-setup.md) for the full
workflow, the minimum-input / auto-derived-cumulative rules, and CMS setup.
