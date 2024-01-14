# PALESTINE NUMBERS

This repo provides an open source dataset intended to show the human toll of the 2023/2024 Gaza Nakba. This is not limited to Gaza and may include the West Bank. There are two primary datasets:

- `martyrs.json` has a list of martyrs with their name, age, sex
- `casualities_daily.json` has daily reports of aggregate martyr & injury counts from October 7th to the latest reported day

## Martyrs List

[TODO: details about martyr list & sourcing]

## Casualties Daily

Each daily report in this JSON array will have the following fields:

(optional fields will be omitted from the JSON if there is no value reported)

| field name             | value                                                            | optional |
| ---------------------- | ---------------------------------------------------------------- | -------- |
| report_date            | date in YYYY-MM-DD                                               | no       |
| report_source          | one of `mohtel`, `gmotel`, `unocha` or `missing` (see below)     | no       |
| martyred               | killed persons on the given report date                          | yes      |
| martyred_cum           | cumulative number of killed persons to the report date           | yes      |
| ext_martyred           | same as `martyred` but extrapolated (see below)                  | no       |
| ext_martyred_cum       | same as `martyred_cum` but extrapolated (see below)              | no       |
| injured                | injured persons on the given report date                         | yes      |
| injured_cum            | cumulative number of injured persons to the report date          | yes      |
| ext_injured            | injured persons on the given report date                         | no       |
| ext_injured_cum        | cumulative number of injured persons to the report date          | no       |
| med_martyred_cum       | cumulative number of medical personnel killed to the report date | yes      |
| ext_med_martyred_cum   | same as `med_martyed_cum` but extrapolated (see below)           | no       |
| press_martyred_cum     | cumulative number of journalists killed to the report date       | yes      |
| ext_press_martyred_cum | same as `press_martyed_cum` but extrapolated (see below)         | no       |

### Daily Sources

There are four source values for daily casualty reports we use to build the time series:

- `mohtel` - [Gaza's Ministry of Health Telegram channel](https://t.me/s/MOHMediaGaza)
- `gmotel` - [Gaza's Government Media Office Telegram channel](https://t.me/s/mediagovps)
- `unocha` - [the UN's Office for the Coordination of Humanitarian Affairs](https://docs.google.com/spreadsheets/d/e/2PACX-1vSUyVkEg8Y_gYEzq8VeFY6vjKoZFvO2y5X1eVZ_1bRsabeDC6hv3Aaf8WFn-F4KR8TP5kDWtylSWLhG/pubhtml?gid=96613236&single=true)
- `missing` - No official report was available for the given date (some reasons below)

Our methodology is to prioritize official sources for this dataset in order to best align the reporting time periods (`mohtel` falling back to `gmotel`). When communications were cut to Gaza, `gmotel` would provide reporting but in some cases neither would. Reports were also stopped during the humanitarian pause.

### Extrapolated (`ext_` fields)

Since official numbers weren't always available, and it can be useful to have a timeseries where all dates have values, we're providing the same official fields in extrapolated form using the following methodology:

- if the missing field was a cumulative one and we had an official report for a daily martyr or injury count, we calculate the cumulative using the daily increment
- if the missing field was a daily increment and we had cumulative counts, we subtracted the reported cumulative count from the prior period for the missing daily count
- if we were missing both sets of numbers for a given reporting period we average the difference between surrounding periods

# DETAILS

Roadmap, Current Status, Sources etc are provided here.
https://docs.google.com/spreadsheets/d/15qPT5cpC_WeVht1L3dp8N8YC4V_Jm3ijngiwAnchRXE

# NOTES

Where the magic is happening https://discord.com/channels/1186702814341234740/1193636245784494222

**REMINDER: Please use burner account for your own safety**
