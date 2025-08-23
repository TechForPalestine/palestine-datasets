---
title: Gaza Daily Famine & Aid Seekers
description: We've added new fields to our datasets.
slug: gaza-daily-famine-aid-aug-23
tags: [daily-casualties, gaza, summary]
---

Since early June, the Ministry of Health in Gaza has been reporting additional casualties broken down by those attributed to famine and those attributed to seeking aid.

We've added four new fields to the [Gaza Daily Casualties dataset](/docs/casualties-daily/), and the latest values from these fields are also surfaced in our [Summary dataset](/docs/summary/).

## Famine / Starvation

Around July 20th, the Ministry began reporting daily numbers of those killed by starvation or malnutrition. These numbers are reported in total and a subset total for children. These numbers have been reported reliably on a daily basis since that date.

- `famine_cum` is the cumulative total killed by famine on the [daily dataset](/docs/casualties-daily/)
- `child_famine_cum` is the cumulative total of children killed by famine on the [daily dataset](/docs/casualties-daily/)
- `gaza.famine.total` is the latest cumulative value from the daily dataset of _famine_cum_ on the [summary dataset](/docs/summary/)
- `gaza.famine.children` is the latest cumulative value from the daily dataset of _child_famine_cum_ on the [summary dataset](/docs/summary/)

## Aid Seeker Casualties

In early June (first reported on June 2nd), the Ministry began sharing the number of those killed and injured in the act of seeking aid. These reports became consistent on a daily basis on July 1st. Before this date you will find our datasets skip some dates up to 3 days at a time in June.

- `aid_seeker_killed_cum` is the cumulative total killed while seeking aid on the [daily dataset](/docs/casualties-daily/)
- `aid_seeker_injured_cum` is the cumulative total injured while seeking aid on the [daily dataset](/docs/casualties-daily/)
- `gaza.aid_seeker.killed` is the latest cumulative value from the daily dataset of _aid_seeker_killed_cum_ available on the [summary dataset](/docs/summary/)
- `gaza.aid_seeker.injured` is the latest cumulative value from the daily dataset of _aid_seeker_injured_cum_ available on the [summary dataset](/docs/summary/)

It is assumed that these counts are included in the killed & injured totals since the remainder when subtracting these values from their respective totals is never negative.
