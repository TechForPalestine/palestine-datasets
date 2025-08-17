import { Demographics, DiffStats } from "./diff_lists.types";

const months = {
  "01": "January",
  "02": "February",
  "03": "March",
  "04": "April",
  "05": "May",
  "06": "June",
  "07": "July",
  "08": "August",
  "09": "September",
  "10": "October",
  "11": "November",
  "12": "December",
};

const getDateWithSuffix = (date: Date): string => {
  const day = date.getDate();
  const suffix = (day: number) => {
    if (day > 3 && day < 21) return "th"; // 4th to 20th
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };
  return `${day}${suffix(day)}`;
};

const getUpdateDateStrings = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
  const day = String(today.getDate()).padStart(2, "0");
  const readableDate = `${
    months[month as keyof typeof months] ?? month
  } ${getDateWithSuffix(today)}`;
  return {
    yyyymmdd: `${year}-${month}-${day}`,
    readableDate,
  };
};

type OverallTableKeys =
  | "Men"
  | "Boys"
  | "Girls"
  | "Women"
  | "Senior Men"
  | "Senior Women";

export const generateBlogUpdate = (stats: DiffStats) => {
  const { yyyymmdd, readableDate } = getUpdateDateStrings();

  const overallMapping: Record<keyof Demographics, OverallTableKeys> = {
    "baby-boy": "Boys",
    "baby-girl": "Girls",
    "elderly-man": "Senior Men",
    "elderly-woman": "Senior Women",
    man: "Men",
    "preteen-boy": "Boys",
    "preteen-girl": "Girls",
    "teen-boy": "Boys",
    "teen-girl": "Girls",
    "toddler-boy": "Boys",
    "toddler-girl": "Girls",
    woman: "Women",
  };

  const tables = Object.keys(stats.demographics).reduce(
    (acc, key) => {
      const overallValueKey: OverallTableKeys =
        overallMapping[key as keyof Demographics];
      const priorOverallValue = acc.overall[overallValueKey]?.[0] ?? 0;
      const newOverallValue =
        priorOverallValue + stats.demographics[key as keyof Demographics];

      let children = acc.children;

      if (overallValueKey === "Boys" || overallValueKey === "Girls") {
        children = {
          ...acc.children,
          [key]: stats.demographics[key as keyof Demographics],
        };
      }

      return {
        ...acc,
        overall: {
          ...acc.overall,
          [overallMapping[key as keyof Demographics]]: [
            newOverallValue,
            `${((newOverallValue / stats.total) * 100).toFixed(1)}%`,
          ],
        },
        children,
      };
    },
    {
      overall: {} as Record<OverallTableKeys, [number, string]>,
      children: {} as Record<keyof Demographics, number>,
    }
  );

  const totalChildren = tables.overall.Boys[0] + tables.overall.Girls[0];
  const overallTotal = Object.values(tables.overall).reduce(
    (sum, [number]) => sum + number,
    0
  );

  const content = `
---
title: Killed in Gaza ${readableDate} Update
description: We've received an update from the Ministry of Health and merged those changes with our existing list.
slug: killed-in-gaza-update-${yyyymmdd}
tags: [killed-in-gaza, gaza]
---

On _________REPLACE_ME_WITH_DATASET_RELEASE_DATE_FROM_MOH_TELEGRAM_____________, Gaza officials released a new list of those killed in Gaza up to __________REPLACE_ME_WITH_AS_OF_DATE_FOR_REPORT____________.

The list format was very similar to recent updates we received. You can <a href="___________REPLACE_ME_WITH_IBC_SOURCE_FILE_LINK_________" target="_blank">download an Excel file provided by Iraq Body Count here</a> that was used as the source for this update. This sheet was sourced by IBC from the Gaza Ministry of Health and formatted to include english names. You can <a href="__________REPLACE_ME_WITH_IBC_ANNOUNCEMENT_LINK_FROM_X_OR_ELSEWHERE__________" target="_blank">view IBC's announcement here</a>.

Where age was provided in months, we've defaulted to age of 0.

## Methodology

Our methodology is the same as used in prior updates using the IBC list. You can [read about that here](/updates/killed-in-gaza-update-2025-07-15/).

## Change Summary

The following tables summarize the updated demographics of the [Killed in Gaza list](/docs/killed-in-gaza) following this update:

| Demographic   | Number | %     |
| ------------- | ------ | ----- |
${Object.entries(tables.overall)
  .map(
    ([key, [number, percentage]], index) =>
      `| ${key} | ${number.toLocaleString()} | ${percentage} |${
        index < Object.keys(tables.overall).length - 1 ? "\n" : ""
      }`
  )
  .join("")}
| Total Persons | ${overallTotal.toLocaleString()} | 100% |

Between this update and the last, based on the Ministry-provided ID:

- ${stats.unchanged.toLocaleString()} rows had no change in details
- ${stats.new.toLocaleString()} were newly added
- ${stats.removed.toLocaleString()} were removed
- ${stats.updated.toLocaleString()} had updated details

Of the children in this list (${(
    (tables.overall.Boys[0] + tables.overall.Girls[0]) /
    stats.total
  ).toFixed(1)}% of the total), the following is the breakdown by age group:

| Child Age Group          | Number | %     |
| ------------------------ | ------ | ----- |
${Object.entries(tables.children)
  .map(
    ([key, value], index) =>
      `| ${key
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) =>
          c.toUpperCase()
        )} | ${value.toLocaleString()} | ${(
        (value / totalChildren) *
        100
      ).toFixed(1)} |${
        index < Object.keys(tables.children).length - 1 ? "\n" : ""
      }`
  )
  .join("")}
| Total Children | ${totalChildren.toLocaleString()} | 100% |
  `;

  return { content, yyyymmdd };
};
