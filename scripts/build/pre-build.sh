#!/usr/bin/env bash

rm -rf site/build
rm -rf site/src/generated/killed-in-gaza
mkdir -p site/src/generated/killed-in-gaza

bun run chart-viz
bun run gen-summaries
bun run gen-csv
bun run download-killed-derived
bun run gen-killed-child-names
