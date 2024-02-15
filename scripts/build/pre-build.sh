#!/usr/bin/env bash

bun run scripts/utils/chart-viz.ts
bun run gen-summaries
bun run gen-csv
bun run download-killed-derived
