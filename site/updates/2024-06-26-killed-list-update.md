---
title: Killed in Gaza 04-30 Update
description: We've received an update from the Ministry of Health and merged those changes with our existing list.
slug: killed-in-gaza-update-3
tags: [killed-in-gaza, gaza]
---

On May 5th, we received an updated list of names of those killed in Gaza up to April 30th. We've incorporated new records and existing record changes from that update.

The new list was in a PDF format that differed slightly from the prior lists that were distributed in CSV & PDF format. You can <a href="/sources/20240430gaza.pdf">download the Ministry of Health PDF here</a> that was used as the source for this update.

We noted the following changes to their reporting format:

- they dropped the "source" column we previously used to track public submissions vs. official sourcing, so we added a new "unknown" value to our existing source field if a new record has no source attribute (but we've kept the old value if the record already existed)
- they removed the date of birth field and only reported age
- a number of records did not have an identifier, so we generated one based on the report date and their reported index (prefixed with `missing-`)

## Change Summary

The following tables summarize the demographic changes in our [Killed in Gaza list](/docs/killed-in-gaza) following its merge with the abovenoted Ministry list:

### Demographics of Our List Before Merge

| Demographic     | Number | %     |
| --------------- | ------ | ----- |
| Senior Men      | 566    | 2.8%  |
| Senior Women    | 410    | 2.0%  |
| Men             | 8,115  | 39.8% |
| Women           | 4,597  | 22.5% |
| Boys            | 3,402  | 16.7% |
| Girls           | 2,956  | 14.5% |
| Male (no age)   | 182    | 0.9%  |
| Female (no age) | 162    | 0.8%  |
| Total Persons   | 20,390 |       |

### Demographics of Newly Added Records

| Demographic     | Number | %     |
| --------------- | ------ | ----- |
| Senior Men      | 199    | 4.5%  |
| Senior Women    | 115    | 2.6%  |
| Men             | 2,396  | 53.6% |
| Women           | 647    | 14.5% |
| Boys            | 630    | 14.1% |
| Girls           | 391    | 8.8%  |
| Male (no age)   | 66     | 1.5%  |
| Female (no age) | 22     | 0.5%  |
| Total Persons   | 4,466  |       |

### Demographics of Our Updated List After Merge

| Demographic     | Number | %     |
| --------------- | ------ | ----- |
| Senior Men      | 760    | 3.1%  |
| Senior Women    | 524    | 2.1%  |
| Men             | 10,424 | 42.3% |
| Women           | 5,204  | 21.1% |
| Boys            | 4,005  | 16.2% |
| Girls           | 3,330  | 13.5% |
| Male (no age)   | 244    | 1.0%  |
| Female (no age) | 181    | 0.7%  |
| Total Persons   | 24,672 |       |

### Demographics of Removed Records

184 records in our prior list were not present in the latest list release (by identification number) so we removed them.

| Demographic     | Number | %     |
| --------------- | ------ | ----- |
| Senior Men      | 5      | 2.7%  |
| Senior Women    | 1      | 0.5%  |
| Men             | 88     | 47.8% |
| Women           | 40     | 21.7% |
| Boys            | 27     | 14.7% |
| Girls           | 18     | 9.8%  |
| Male (no age)   | 3      | 1.6%  |
| Female (no age) | 2      | 1.1%  |
| Total Persons   | 184    |       |

We believe the higher ratio of Men in this revised list reflects the addition of community-reported sourcing. These records likely include more of those lost or missing for which remains were not received by health authorities as was the case for most of the records in the initial list distributed in January.

## Merge Methodology / Commentary

Our methodology for updating existing records and accepting new ones didn't change and we detailed our approach in our prior [April 13th update](/updates/killed-in-gaza-update-2).

Where there were changes in names for existing records by identification ID within our accepted threshold of 30%, the breakdown was as follows:

| change % upper bound | number of occurrences |
| -------------------: | --------------------: |
|                   0% |                   129 |
|                  10% |                   406 |
|                  20% |                   129 |
|                  30% |                    24 |

(the change threshold upper bound means that 20% would include a 12% or 18% change to the original name)

In terms of overall types of record changes across those already in our list at the time of merge, the breakdown was as follows:

| fields affected  | number of occurences |
| ---------------- | -------------------: |
| Name             |                  676 |
| None (Duplicate) |                  399 |
| Age and Name     |                   12 |
| Only Age         |                    8 |
