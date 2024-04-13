---
title: Killed in Gaza 03-29 Update
description: We've received an update from the Ministry of Health and merged those changes with our existing list.
slug: killed-in-gaza-update-2
tags: [killed-in-gaza, gaza]
---

On April 3rd, we received an updated list of names of those killed in Gaza up to March 29th. We've incorporated new records and existing record changes from that update.

The new list was in a PDF format that differed slightly from the initial lists that were distributed in CSV format. It also included the source of the record being one of either the Ministry of Health ("سجالت وزارة الصحة"), or a submission made from the public ("تبيلغ ذوي الشهداء"). You can <a href="/sources/20240329gaza.pdf">download the Ministry of Health PDF here</a>. You can also <a href="/sources/20240413killed-in-gaza.csv">download our Killed in Gaza list from before in CSV format here</a> to compare how individual records may have changed.

## Change Summary

The following tables summarize the demographic changes in our [Killed in Gaza list](/docs/killed-in-gaza) following its merge with the abovenoted Ministry list:

### Demographics of Our List Before Merge

| Demographic     | Number |    % |
| --------------- | -----: | ---: |
| Men             |  4,594 | 32.5 |
| Women           |  3,147 | 22.3 |
| Boys            |  2,545 | 18.0 |
| Girls           |  2,247 | 15.9 |
| Senior Men      |    328 |  2.3 |
| Senior Women    |    282 |  2.0 |
| Male (no age)   |    565 |  4.0 |
| Female (no age) |    432 |  3.1 |
| Total Persons   | 14,140 |      |

### Demographics of Newly Added Records

| Demographic     | Number |    % |
| --------------- | -----: | ---: |
| Men             |  3,181 | 46.5 |
| Women           |  1,205 | 17.6 |
| Boys            |    987 | 14.4 |
| Girls           |    774 | 11.3 |
| Sr. Men         |    259 |  3.8 |
| Sr. Women       |    137 |  2.0 |
| Male (no age)   |    207 |  3.0 |
| Female (no age) |     91 |  1.3 |
| Total Persons   |  6,841 |      |

### Demographics of Our Updated List After Merge

| Demographic     | Number |    % |
| --------------- | -----: | ---: |
| Men             |  7,745 | 36.9 |
| Women           |  4,335 | 20.7 |
| Boys            |  3,466 | 16.5 |
| Girls           |  2,999 | 14.3 |
| Sr. Men         |    591 |  2.8 |
| Sr. Women       |    422 |  2.0 |
| Male (no age)   |    721 |  3.4 |
| Female (no age) |    507 |  2.4 |
| Total Persons   | 20,786 |      |

### Demographics of Removed Records

195 records in our prior list were not present in the latest list release (by identification number) so we removed them.

| Demographic     | Number |    % |
| --------------- | -----: | ---: |
| Men             |     63 | 32.3 |
| Women           |     27 | 13.8 |
| Boys            |     33 | 16.9 |
| Girls           |     11 |  5.6 |
| Sr. Men         |      4 |  2.1 |
| Sr. Women       |      2 |  1.0 |
| Male (no age)   |     43 | 22.1 |
| Female (no age) |     12 |  6.2 |
| Total Persons   |    195 |      |

## Merge Methodology / Commentary

Incorporating the new list required a few steps:

1. Parse the tabular data from the PDF
1. Clean the parsed data for data format inconsistencies
1. Render the data in a format comparable to our existing list
1. Reconcile record conflicts & changes
1. Merge and rewrite our existing source list

Commentary on our approach for some of the steps follows.

### Cleaning the Data

At this stage we worked to determine common issues with the parsed data and found the following cases:

- date of birth formats were not standardized (ie: long year vs. short year)
  - we worked to normalize these, and if the format was hard to decipher we validated against the provided age
- some numerical values ended up merged into the name field (age, identification number)
  - we used pattern matching to clean these values and move them into the correct column position
- age was sometimes repeated in both the age and date of birth columns (no date of birth)
  - we removed any age values from the date of birth column
- identification number field sometimes had non-number values or was clearly invalid
  - we created a new unique value based on the index of the record in the PDF, ie: `v0329-e-1000` where the middle character could be either `e` meaning the ident field we encountered was empty, or `o` meaning it had another invalid value or overflow from another column
- date of birth field was full of hashes (`#`)
  - we removed these and left the date of birth empty
- female gender was represented by two different arabic words (`أنثى` or `ىانث`)
  - we consolidated these

This was an iterative process of gathering stats, updating cleaning logic, and reviewing the output in our standard format to assess how to repeat with refined logic.

### Reconciling Conflicts & Changes

We focused on assessing record conflicts based on the provided identification number only. If our existing list had a record with the same identification value, we checked the field changes (the "diff") to determine whether the change was acceptable using the following methodology:

- if the age only changed by a year, we allowed the change as it's likely a reference date or rounding issue (the initial Ministry list was provided in a form that had an unfixed reference date of the current day and our prior list fixed that to January 5, 2024 per source dating)
- if a comparison of names using Levenshtein Distance led to a change amounting to less than 30% of the original name's length, we allowed the change (based on a sampled manual review of the changes this seemed acceptable, but we will continue refining this method with the help of those fluent in arabic)
- if an age or date of birth was not on the existing record and it was on the incoming one, we accepted it

This process helped us narrow in on specific record sets to refine our approach.

Where there were changes in names for existing records by identification ID within our accepted threshold of 30%, the breakdown was as follows:

| change % upper bound | number of occurrences |
| -------------------: | --------------------: |
|                   0% |                 1,306 |
|                  10% |                 4,146 |
|                  20% |                 1,327 |
|                  30% |                   242 |

(the change threshold upper bound means that 20% would include a 12% or 18% change to the original name)

In terms of overall types of record changes across those already in our list at the time of merge, the breakdown was as follows:

| fields affected           | number of occurences |
| ------------------------- | -------------------: |
| Name                      |                5,381 |
| None (Duplicate)          |                2,911 |
| Age and Name              |                1,585 |
| Only Age                  |                  800 |
| Age, Birth Date, and Name |                    5 |
| Age and Birth Date        |                    1 |
