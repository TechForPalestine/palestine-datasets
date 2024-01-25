# Architecture

We've opted to host our API as a static website, moving what would traditionally be served by a backend API server & database combo towards a CI build process pulling from a spreadsheet API as our "database". This keeps our infra overhead low and benefits from CDN edge speed & reliability.

## Dataset Source of Truth

We have two main types of datasets at the moment. Source Datasets are cleaned & manipulated in an external spreadsheet while Derivative Datasets derive from the Source Datasets. Changes or additions pulled in from the spreadsheet are reviewed in Github before committing to the main branch, from which the website & API are deployed.

### Source Datasets

These include:

- List of those killed in Gaza
- Daily reports from officials on the ground (casualty counts, etc.)

They're collected from various official sources as documented on our website.

### Derivative Datasets

Currently this includes:

- Summary of latest values from daily or aggregate numbers from Source Datasets

To the extent we need to accomplish better developer ergonomics in our APIs (for example: searching an index or fetching individual records), that work belongs here under derivative datasets.

## Workflow

The basic flow from start to finish of our dataset generation & build process is:

1. source data gets pulled from the spreadsheet, manipulated, checked for consistency, and written to disk in our data scripts (under `scripts/data`)
2. the manifest.json under `site/src/generated` gets updated with the written file paths which is both referenced in website code and by the pre-deploy step, below
3. data scripts run for derivative datasets (see `scripts/build/pre-build`, this also leads to manifest updates)
4. the website gets built (`bun run docs-build`)
5. the API json files get moved from their repo source locations to the folder we're deploying (see `scripts/build/pre-deploy`, which relies on the manifest noted above)
6. the website gets deployed (our repo's Cloudflare integration handles this on `main` for the live website and on each branch for a preview website)

Our build process in CI handles steps 3 to 6.

### Daily Dataset Updates

Our daily dataset is updated most frequently and the general process as a maintainer is to:

- update the values in the google spreadsheet's dataset tab(s)
- run `bun run gen-daily` (handles steps 1 to 2 from above)
- commit the changes after review which builds & deploys the site
