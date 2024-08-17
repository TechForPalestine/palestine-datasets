---
title: Gaza Daily Reporting Period
description: We've added a new field to the Gaza Daily Casualties dataset
slug: gaza-daily-report-period
tags: [daily-casualties, gaza]
---

The Gaza Ministry of Health has started reporting some days for 48 hour periods on a consistent basis, with the last two dates being August 17th (with no report on August 16th) and August 12th (with no report on August 11th).

In the event of a skipped reporting date like the scenarios noted above, you'll see a new `report_period` field indicating 48 hours for the consolidated report and 0 hours for the skipped report. For example: August 17th would have 48 hours and August 16th would have 0 hours. We're maintaining the skipped report dates for consistency and to reflect the cumulative values on those dates regardless of a report presence.

All existing report dates covering 24 hour periods will have a value of 24 for `report_period`.
