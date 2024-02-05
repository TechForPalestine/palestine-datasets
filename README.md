[![Ceasefire Now](https://badge.techforpalestine.org/default)](https://techforpalestine.org/learn-more)

# Palestine Datasets

[data.techforpalestine.org](https://data.techforpalestine.org)

This repo provides an open source dataset intended to show the human toll of Israel's war on Gaza. This is not limited to Gaza and may include the West Bank. There are two primary datasets:

- `killed-in-gaza.json` has a list of known fatalities in Gaza with their name, age, sex
- `casualties_daily.json` has daily reports of aggregate killed & injury counts from October 7th to the latest reported day

There's also the source for the static documentation website under `site/`.

See sub readmes for more info on data sources in [site/docs](site/docs).

## Contributing

Reading:

- [Contributing](https://data.techforpalestine.org/docs/guides/contributing)
- [Architecture](https://data.techforpalestine.org/docs/guides/architecture)
- [Versioning](https://data.techforpalestine.org/docs/guides/versioning)

### Development Environment

Prerequisites:

- We use [bun](https://bun.sh) as our dependency manager, build tool & runtime.

### Documentation Site

To run the site locally use `bun run docs-start`

To run the site locally in Arabic use `bun run docs-start --locale ar`

### Discussion / Planning

The team uses [Discord](https://discord.com/channels/1186702814341234740/1193636245784494222) to discuss this project. View the channel description & pinned messages to get started.

**Note**: You may want to use a separate / anonymous Github account for your safety. Assess your personal/work situation accordingly.

### Roadmap

We commit to maintaining this dataset for the duration of Israel's attack on Palestinians in Gaza and the West Bank, and for so long as our sources are reporting those figures / lists. See [github issues](https://github.com/TechForPalestine/palestine-datasets/issues) and our [project board](https://github.com/orgs/TechForPalestine/projects/4) for in-process work or ideas for how you can contribute.
