---
title: West Bank Frequency Change
description: The UN has updated how frequently we get West Bank updates
slug: west-bank-frequency
tags: [daily-casualties, west-bank]
---

The United Nations Office for the Coordination of Humanitarian Affairs (UN OCHA) announced today in their regular [Flash Update](https://www.ochaopt.org/content/hostilities-gaza-strip-and-israel-flash-update-146) that their reporting frequency would be changing from the cadence we've grown used to.

For the West Bank in particular, for which [our dataset](/docs/casualties-daily-west-bank) is affected, Flash Reports will only be issued on a weekly basis and the wider report on the region will be issued at most three times a week.

Going forward we will continue to update our daily datasets for Gaza and the West Bank at the same time, but we've now introduced a new field to the West Bank daily casualties dataset called `flash_source`. This field will be one of the following values:

- `un` which indicates that the values for the given date were reported in a UN OCHA Flash Update for that date; or
- `fill` which indicates that the values were from a UN OCHA Flash Update for a prior date

If a subsequent update includes specific information for a date we previously marked as `fill` that allows us to provide more accurate numbers, we will update previously reported days in the time series where more specific values are available. For the most part, "fill" values will just be the last reported values for the latest report date where `flash_source` is equal to `un`.
