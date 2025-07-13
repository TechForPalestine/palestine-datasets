[![Ceasefire Now](https://badge.techforpalestine.org/default)](https://techforpalestine.org/learn-more)

# Palestine Datasets

[data.techforpalestine.org](https://data.techforpalestine.org)

This repo provides an open source dataset intended to show the human toll of Israel's hostilities across Palestine since Oct 7, 2023.

> **Caution!!** These datasets do not fully reflect the impact of the genocide in Gaza, please [read more about how we source our Gaza data and the limitations](https://data.techforpalestine.org/updates/gaza-ministry-casualty-context/).

There are five datasets:

- `killed-in-gaza.json` has a list of known fatalities in Gaza with their name, age, sex
- `casualties_daily.json` has daily reports of aggregate killed & injury counts for Gaza
- `west_bank_daily.json` has daily reports of killed, injured, and settler attack counts for the West Bank
- `press_killed_in_gaza.json` has a list of journalists known to have been killed in Gaza
- `infrastructure-damaged.json` has weekly reports of damage estimates to human infrastructure

Note that the JSON files in this repo are intended for tracking historical changes and manual access/download. If you're building a system that relies on pulling in regular updates please see our [API docs](https://data.techforpalestine.org/docs/datasets/) for versioned endpoints instead.

There's also the source for the static documentation website under `site/`.

See sub readmes for more info on data sources in [site/docs](site/docs).

[![Genocide Watch](https://hinds-banner.vercel.app/genocide-watch?variant=classic)](https://www.pcrf.net/)

Banner courtesy Hind's Banner ([github repo](https://github.com/alvii147/hinds-banner)).

## Contributing

Reading:

- [Contributing](https://data.techforpalestine.org/docs/guides/contributing)
- [Architecture](https://data.techforpalestine.org/docs/guides/architecture)
- [Versioning](https://data.techforpalestine.org/docs/guides/versioning)

### Development Environment

Prerequisites:

- We use [bun](https://bun.sh) as our dependency manager, build tool & runtime.

### Documentation Site

To run the site locally use `bun docs-start`

### Discussion / Planning

The team uses [Discord](https://techforpalestine.org/get-involved/) to discuss this project in the `tfp-datasets` channel. View the channel description & pinned messages to get started.

**Note**: You may want to use a separate / anonymous Github account for your safety. Assess your personal/work situation accordingly.

### Roadmap

We commit to maintaining this dataset for the duration of Israel's attack on Palestinians in Gaza and the West Bank, and for so long as our sources are reporting those figures / lists. See [github issues](https://github.com/TechForPalestine/palestine-datasets/issues) and our [project board](https://github.com/orgs/TechForPalestine/projects/4) for in-process work or ideas for how you can contribute.
