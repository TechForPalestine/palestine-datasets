---
description: Overview of how our repo & API build is setup
---

# Architecture

We've opted to host our API as a static website, moving what would traditionally be served by a backend API server & database combo towards a CI build process pulling from a spreadsheet API or from source control as our "database". This keeps our infra overhead low and benefits from CDN edge speed & reliability.

## Dataset Source of Truth

We have two main types of datasets at the moment. Source Datasets are cleaned & manipulated in an external spreadsheet or through CSVs in our repo, while Derivative Datasets derive from the Source Datasets. Changes or additions pulled in from the spreadsheets are reviewed in Github before committing to the main branch, from which the website & API are deployed.

### Source Datasets

These include:

- List of those killed in Gaza
- Daily reports from officials on the ground (casualty counts, etc.)

They're collected from various official sources as documented on our website.

### Derivative Datasets

Currently this includes:

- Summary of latest values from daily or aggregate numbers from Source Datasets
- CSV formats for the two main datasets, above
- Search indexes for the names in our Killed in Gaza dataset and individual API endpoints for each person

## Workflow

The basic flow from start to finish of our dataset generation & build process is:

1. source data gets pulled from the spreadsheet or CSV, manipulated, checked for consistency, and written to disk using our data scripts under `scripts/data`
2. the manifest.json under `site/src/generated` gets updated with the written file paths which is both referenced in website code and by the pre-deploy step, below
3. data scripts run for derivative datasets (see `scripts/build/pre-build`, this also leads to manifest updates)
4. the website gets built (`bun run docs-build`)
5. the API json files get moved from their repo source locations to the folder we're deploying (see `scripts/build/pre-deploy`, which relies on the manifest noted above)
6. the website gets deployed (our repo's Cloudflare integration handles this on `main` for the live website and on each branch for a preview website)

Our build process in CI handles steps 3 to 6.

### Daily Dataset Updates

Our daily dataset is updated most frequently and the general process as a maintainer is to:

1. update the values in the google spreadsheet's dataset tab(s)
2. run `bun run gen-daily` (handles steps 1 to 2 from above)
3. commit the changes after review which builds & deploys the site

We have a github actions workflow named gen-daily that can perform steps 2-3 above so updating just means having access to a web browser.

### Killed in Gaza List Updates

The source data for our names list is in our repo under in [scripts/data/common/killed-in-gaza/data/raw.csv](https://github.com/TechForPalestine/palestine-datasets/blob/main/scripts/data/common/killed-in-gaza/data/raw.csv) and the arabic-to-english translations are managed in [scripts/data/common/killed-in-gaza/data/dict_ar_en.csv](https://github.com/TechForPalestine/palestine-datasets/blob/main/scripts/data/common/killed-in-gaza/data/dict_ar_en.csv). These are the two primary files that will be contributed to by those looking to make corrections, but there's a number of scripts running in our [gen-killed-in-gaza.yml](https://github.com/TechForPalestine/palestine-datasets/blob/main/.github/workflows/gen-killed-in-gaza.yml) github actions workflow that work to produce the final JSON and also ensure the consistency & format of the source CSVs.
