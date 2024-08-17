---
title: Killed in Gaza 06-30 Update
description: We've received an update from the Ministry of Health and merged those changes with our existing list.
slug: killed-in-gaza-update-4
tags: [killed-in-gaza, gaza]
---

On July 24, we received an updated list of names of those killed in Gaza up to June 30th. We've incorporated this list in its entirety, replacing our prior list.

The new list was in a PDF format like the recent updates. You can <a href="/sources/20240630gaza.pdf">download the Ministry of Health PDF here</a> that was used as the source for this update.

We noted the following changes to their reporting format from the last update:

- they added back the "source" column we previously used to track public submissions vs. official sourcing, so we've accepted these values which may overwrite values previously reported as "unknown" for this column in our prior list
- they added back the date of birth field and kept the age

## Changes to Update Methodology

In the past we accepted a subset of records in order to avoid having to verify each update, by not accepting record changes which were drastically different (by some arbitrary change threshold, like for the arabic name for example). This kind of reconciliation has diminishing benefits now that the ministry's reporting format has standardized. We also want to defer to the official source of truth, rather than introduce our own decisions to their processes. For that reason you may notice the following main differences in output:

- where we generated IDs for records where that field was missing, the field will now be empty - we did not consider this a breaking change given the vast majority of records have IDs
- most records saw small age changes reflecting our wholesale acceptance of their record values - in the past we adjusted these based on the availability of data in prior reports and validation issues we saw when comparing date of births, but the reference date we used may have accounted for the discrepancy

Otherwise the main changes we make to their reporting include:

- normalizing the date of birth date format to YYYY-MM-DD
- converting the source field from arabic to an english abbreviation
- adding the english name translation using our existing lookup tables

## Change Summary

The following tables summarize the demographic changes in our [Killed in Gaza list](/docs/killed-in-gaza) following its merge with the abovenoted Ministry list:

### Demographics of the Updated List

| Demographic     | Number | %   |
| --------------- | ------ | --- |
| Senior Men      | 982    | %   |
| Senior Women    | 655    | %   |
| Men             | 11,583 | %   |
| Women           | 5,614  | %   |
| Boys            | 5,202  | %   |
| Girls           | 4,149  | %   |
| Male (no age)   |        | %   |
| Female (no age) |        | %   |
| Total Persons   | 24,672 |     |

### Demographics of the List Prior to Update

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
