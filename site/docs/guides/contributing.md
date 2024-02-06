---
description: Tips on how to get involved or get in touch
---

# Contributing

We welcome anyone to contribute to any part of this repository on Github. We've provided some answers to questions you might have, below. If you can't find an answer here, please ask in one of the following places:

- [Github Issues](https://github.com/TechForPalestine/palestine-datasets/issues)
- [Tech For Palestine Discord in #tfp-oss-palestine-dataset](https://discord.com/channels/1186702814341234740/1193636245784494222).

## Important Reading

We expect collaborators to adhere to TFP's [Code of Conduct](https://github.com/techforpalestine/code-of-conduct).

If you're planning on contributing to our code (website build or dataset scripts specifically) please read about our [Architecture](/docs/guides/architecture) first.

If you're planning on introducing a significant change to our datasets, or a new one, please read about [versioning](/docs/guides/versioning).

## Working on the Website

We use [docusaurus](https://docusaurus.io/) as our static website builder. Our content is written in an extended form of Markdown (MDX) which allows for embedding dynamic React components. You can find those under `site/docs`.

Navigation links are managed in two locations:

- `site/sidebars` for the sidebar that shows on all pages aside from the homepage
- `site/docusaurus.config.js` for the header nav under `themeConfig.navbar.items`

## Working on Datasets

### I have a correction to the english name translation in the Killed in Gaza list

To correct a translation, open a PR with your change for the matching name part in [dict_ar_env.csv](https://github.com/TechForPalestine/palestine-datasets/blob/main/scripts/data/common/killed-in-gaza/data/dict_ar_en.csv). Our PR workflow will run the script needed to carry these changes through to the JSON file that makes up our API and you can review the change in the PR diff which will receive that automatic commit.

### I've spotted a problem / I can offer a correction

If the issue is with one of our source datasets and it's a specific change to a single record or small subset of the data you can do one of the following, based on your ability:

- open an issue in this repo with directions on how we can make the change you're seeking; or
- open a PR with the change to one of the JSON files in the root of the repo that contains the issue; or
- let us know what's wrong in our Discord channel if you're already there.

### All other ideas / suggestions / issues

Best to open an issue in this repo with your suggestion or question, or chat with us in the [Discord channel](https://discord.com/channels/1186702814341234740/1193636245784494222) so that we can align with you or advise on next steps.
