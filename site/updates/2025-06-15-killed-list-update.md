---
title: Killed in Gaza 2025-06-15 Update
description: We've received an update from the Ministry of Health and merged those changes with our existing list.
slug: killed-in-gaza-update-2025-06-15
tags: [killed-in-gaza, gaza]
---

On June 15th, 2025 Gaza officials released a newlist of those killed in Gaza up to June 15th, 2025.

The list format was very similar to recent updates we received earlier versions. You can download an Excel file provided by Iraq Body Count <a href="/sources/20250615_ibc.xlsx">here</a> that was used as the source for this update. This sheet was sourced by IBC from the Gaza Ministry of Health and formatted to include english names. IBC also changed the age terminologies as mentioned in their <a href="https://x.com/iraqbodycount/status/1937155328853914100">tweet</a> You can view the updated dataset on our [Killed in Gaza page](/docs/killed-in-gaza). To keep it consistent with our current age values i.e. integers starting from 0, 1, 2 and onwards, the original csv from MOH was used and joined with IBC excel sheet on `id` column. Data consistency was checked [here](../../scripts/data/common/killed-in-gaza/extract_20250615.py) before publishing data.

## Methodology

We slightly change the update method we last reported and instead of using our own arabic to english name mapping we used [Iraq Body Count excel list](https://iraqbodycount.org/pal/ibc_moh_2025-03-23.xlsx) in order to expedite the process. The current process still used following adjustments to the source report:

- renaming header to comply with our previous naming
- adding source `u` i.e. unknown since no source was provided by Ministry of Health

## Change Summary

The following tables summarize the updated demographics of the [Killed in Gaza list](/docs/killed-in-gaza) following this update:

| Demographic   | Number | %     |
| ------------- | ------ | ----- |
| Men           | 25,706 | 46.6% |
| Women         | 9,636  | 17.5% |
| Boys          | 9,766  | 17.7% |
| Girls         | 7,355  | 13.3% |
| Senior Men    | 1,662  | 3.0%  |
| Senior Women  | 1,077  | 2.0%  |
| Total Persons | 55,202 | 100%  |

Of the children in this list (31.2% of the total), the following is the breakdown by age group:

| Child Age Group          | Number | %      |
| ------------------------ | ------ | -----  |
| Teen Boy (Under 18)      | 4,031  | 7.30%  |
| Teen Girl (Under 18)     | 2,267  | 4.11%  |
| Pre-teen Boy (Under 12)  | 4,279  | 7.75%  |
| Pre-teen Girl (Under 12) | 3,752  | 6.80%  |
| Toddler Boy (Under 3)    | 956    | 1.73%  |
| Toddler Girl (Under 3)   | 899    | 1.63%  |
| Baby Boy (Under 1)       | 500    | 0.91%  |
| Baby Girl (Under 1)      | 437    | 0.79%  |
| Total Children           | 17,121 | 30.02% |
