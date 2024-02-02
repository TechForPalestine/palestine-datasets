# killed-in-gaza

This subfolder was merged in from https://github.com/saadi42/killed-in-gaza. It holds the name translation logic and dictionaries used in the middle step of the following sequence:

1. Make changes to original list of names in `raw.csv`
2. Run translation using dictionary lookups (see below)
3. Take the output/result.csv and convert into our API JSON (see scripts/data/v2/killed-in-gaza.ts)

## ABOUT THE PROJECT:

This repo provides list of 14k+ names of people killed in Gaza since Oct 7, 2023.
`output/result.csv` as a list of names in arabic and english along with sex and age of the dead.

## HOW IT WORKS:

- Arabic name `name_ar_raw` in `raw.csv` is cleaned using `dict_ar_ar` that mostly removes spaces where it is a single name but is broken down. e.g. (عبد الله,عبدالله).
- Then arabic names in the cleaned `name_ar_raw` are splitted based on spaces and translated into english using `dict_ar_en.csv` file and then joined back as a new column `name_en`.
- Lastly the output is saved in `output/result.csv`

## HOW TO CONTRIBUTE:

To make it easy to contribute, the above process is automated using Github Actions.

- On every PR, the script is run to check if changes are okay and script is successful.
- On every merge to main, the script is run and `result.csv` is committed to the `output.csv` file.

So there are multiple ways you can contribute:

- if you have new data records, please add them in `raw.csv`, trying to fill in as many columns as possible.
- if you think arabic name needs cleaning, please add it to `dict_ar_ar.csv`.
- if you think arabic to english translation is wrong or if you have want to fill in new arabic to english translation, please add it `dict_ar_en.csv`.

NOTES:

- please ensure you avoid duplicates.
- please check previous data and if english translation of a similar word exist, please use the same letter combination.

Thanks and lets pray to be on the right side of the history and in the hereafter.
