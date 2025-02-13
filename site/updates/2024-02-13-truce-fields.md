---
title: New Fields Added to Gaza Daily
description: Details about a new reporting breakdown during the 2025 ceasefire.
slug: gaza-daily-truce-fields
tags: [daily-casualties, gaza]
---

The Gaza Ministry of Health has been reporting new breakdowns during the ongoing ceasefire for the numbers of individuals killed. We've added the following optional fields to the daily report objects to make this detail available:

| field name       | description                                                            |
| ---------------- | ---------------------------------------------------------------------- |
| killed_recovered | recovered bodies during truce on the given report date                 |
| killed_succumbed | killed by succumbing to injuries on the given report date during truce |
| killed_truce_new | killed on the given report date during truce                           |
| killed_committee | individuals recognized as being killed by a judicial committee         |

All of these field values are included in the existing `killed` and `ext_killed` fields and will be reported for as long as the breakdowns are made available.
