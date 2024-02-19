#!/usr/bin/env bash

mkdir -p site/src/generated/killed-in-gaza

bun run chart-viz
bun run gen-summaries
bun run gen-csv
bun run download-killed-derived
