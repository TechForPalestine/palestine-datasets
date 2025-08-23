---
description: Tips on how to get involved or get in touch
---

# Contributing

We welcome anyone to contribute to any part of this repository on Github. We've provided some answers to questions you might have, below. If you can't find an answer here, please ask in one of the following places:

- [Github Issues](https://github.com/TechForPalestine/palestine-datasets/issues)
- [Tech For Palestine Discord in #palestine-datasets](https://techforpalestine.org/get-involved/).

## Important Reading

We expect collaborators to adhere to T4P's [Code of Conduct](https://github.com/techforpalestine/code-of-conduct).

If you're planning on contributing to our code (website build or dataset scripts specifically) please read about our [Architecture](/docs/guides/architecture) first.

If you're planning on introducing a significant change to our datasets, or a new one, please read about [versioning](/docs/guides/versioning).

## Github Workflow

In order to make a change to our code or datasets in Github you'll need to:

- first [fork the repository](https://github.com/TechForPalestine/palestine-datasets/fork); then
- make a change on your fork; then
- open a Pull Request against our repo from the branch where you made your change

You can [read Github's guide to the fork & PR workflow](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork) to learn more.

## Working on the Website

We use [docusaurus](https://docusaurus.io/) as our static website builder. Our content is written in an extended form of Markdown (MDX) which allows for embedding dynamic React components. You can find those under `site/docs`.

Navigation links are managed in two locations:

- `site/sidebars` for the sidebar that shows on all pages aside from the homepage
- `site/docusaurus.config.js` for the header nav under `themeConfig.navbar.items`

## Working on Datasets

### I have a correction to the english name translation in the Killed in Gaza list

To correct a translation, open a PR with your change for the matching name part in [dict_ar_env.csv](https://github.com/TechForPalestine/palestine-datasets/blob/main/scripts/data/common/killed-in-gaza/data/dict_ar_en.csv). Our PR workflow will run the script needed to carry these changes through to the JSON file that makes up our API and you can review the change in the PR diff which will receive that automatic commit.

### I want to add to the Killed in Gaza list or correct a non-translation detail

Our list is derived from [scripts/data/common/killed-in-gaza/data/raw.csv](https://github.com/TechForPalestine/palestine-datasets/blob/main/scripts/data/common/killed-in-gaza/data/raw.csv) in our repo, and any details added or changed here will flow through to the JSON api or CSV export. Please note if you're looking to correct a segment of the arabic name for an individual in this list, that change likely belongs in our [arabic-to-arabic translation file](https://github.com/TechForPalestine/palestine-datasets/blob/main/scripts/data/common/killed-in-gaza/data/dict_ar_ar.csv).

### I've spotted a problem / I can offer a correction

If the issue is with one of our source datasets and it's a specific change to a single record or small subset of the data you can do one of the following, based on your ability:

- open an issue in this repo with directions on how we can make the change you're seeking; or
- open a PR with the change to one of the JSON files in the root of the repo that contains the issue; or
- let us know what's wrong in our Discord channel if you're already there.

### All other ideas / suggestions / issues

Best to open an issue in this repo with your suggestion or question, or chat with us in the [#palestine-datasets Discord channel](https://techforpalestine.org/get-involved/) so that we can align with you or advise on next steps.
