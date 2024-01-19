[![Ceasefire Now](https://badge.techforpalestine.org/default)](https://techforpalestine.org/learn-more)

# Palestine Datasets

[data.techforpalestine.org](https://data.techforpalestine.org)

This repo provides an open source dataset intended to show the human toll of Israel's war on Gaza. This is not limited to Gaza and may include the West Bank. There are two primary datasets:

- `martyrs.json` has a list of martyrs with their name, age, sex
- `casualties_daily.json` has daily reports of aggregate martyr & injury counts from October 7th to the latest reported day

There's also the source for the static documentation site.

See sub readmes for more info on data sources in [english](site/docs) or [arabic](site/i18n/ar/docusaurus-plugin-content-docs) which are also published on the site.

## Contributing

Prerequisites:

- We use [bun](https://bun.sh) as our dependency manager, build tool & runtime.

### Documentation Site

To run the site locally use `bun run docs-start`

To run the site locally in Arabic use `bun run docs-start --locale ar`

### Discussion / Planning

The team uses [Discord](https://discord.com/channels/1186702814341234740/1193636245784494222) to discuss this project. View the channel description & pinned messages to get started.

**Note**: You may want to use a separate / anonymous Github account for your safety. Assess your personal/work situation accordingly.

### Roadmap

We commit to maintaining this dataset for the duration of Israel's attack on Palestinians in Gaza and the West Bank, and for so long as our sources are reporting those figures / lists.

- [ ] Improve readmes (guide to build workflow, dataset source(s) of truth)
- [ ] Allow for anyone to trigger a GSheet fetch job
- [ ] Process for automatically getting updates from Gaza telegram channels
- [ ] Process for cleaning / validating the Killed in Gaza list as it'll grow
- [ ] Add West Bank "attack by IDF/Settlers" numbers to daily dataset (since Oct 7)
- [ ] Add infrastructure impact dataset (housing, ambulances / hospitals, etc.)
- [ ] Add displacement estimates to daily dataset
