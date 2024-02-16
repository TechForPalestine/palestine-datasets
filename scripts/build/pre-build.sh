#!/usr/bin/env bash

mkdir -p site/src/generated/killed-in-gaza
echo '{}' > site/src/generated/manifest.json

bun run scripts/utils/chart-viz.ts
bun run gen-summaries
bun run gen-csv
bun run download-killed-derived
