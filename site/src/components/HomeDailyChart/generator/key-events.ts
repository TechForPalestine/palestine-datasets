/**
 * Key dated events plotted as markers on the v2 homepage chart.
 *
 * Each entry must line up with a `report_date` in the daily casualties series
 * (any date missing from the series is dropped at generate time). Keep the
 * list chronological, the `title` short enough to headline a tooltip, and the
 * `detail` to a single factual sentence — the point is to put the day's
 * numbers in context, not to narrate the war.
 *
 * Markers that would collide are thinned out per-viewport by the generator,
 * so adding a closely-spaced entry degrades gracefully: the marker may be
 * dropped on the narrow chart, but scrubbing onto the date still surfaces it.
 */
export type KeyEvent = {
  /** YYYY-MM-DD, matching a report_date in casualties_daily */
  date: string;
  title: string;
  detail: string;
};

export const keyEvents: KeyEvent[] = [
  {
    date: "2023-10-07",
    title: "Attack on southern Israel",
    detail:
      "Hamas leads an attack from Gaza killing about 1,200 people and taking over 240 hostages. Israel declares war and cuts off water, food, fuel and electricity to Gaza.",
  },
  {
    date: "2023-10-27",
    title: "Ground invasion begins",
    detail: "Israeli forces launch a ground invasion of the Gaza Strip.",
  },
  {
    date: "2023-11-24",
    title: "First truce",
    detail:
      "A week-long truce and captive-prisoner exchange begins. Fighting resumes on December 1.",
  },
  {
    date: "2023-12-29",
    title: "Genocide case filed at the ICJ",
    detail:
      "South Africa files a case against Israel at the International Court of Justice alleging acts of genocide.",
  },
  {
    date: "2024-01-26",
    title: "ICJ orders provisional measures",
    detail:
      "The court finds it plausible that Israel's actions amount to genocide and orders measures to prevent them.",
  },
  {
    date: "2024-02-29",
    title: "The flour massacre",
    detail: "Over 100 Palestinians are killed near Gaza City while waiting for food aid.",
  },
  {
    date: "2024-03-18",
    title: "Al-Shifa hospital raid",
    detail: "Israeli forces begin a two-week raid on Gaza's largest hospital complex.",
  },
  {
    date: "2024-05-06",
    title: "Rafah offensive",
    detail:
      "Israel orders eastern Rafah to evacuate and takes the crossing into Egypt, closing a main aid route.",
  },
  {
    date: "2024-10-06",
    title: "Siege of northern Gaza",
    detail:
      "A renewed offensive seals off Jabalia and the northern towns, cutting them off for months.",
  },
  {
    date: "2024-11-21",
    title: "ICC arrest warrants",
    detail:
      "The International Criminal Court issues arrest warrants for Israel's prime minister and former defence minister.",
  },
  {
    date: "2025-01-19",
    title: "Ceasefire takes effect",
    detail: "A ceasefire and captive-prisoner exchange deal pauses the fighting.",
  },
  {
    date: "2025-03-02",
    title: "All aid blocked",
    detail: "Israel halts every shipment of aid into Gaza, beginning a total blockade.",
  },
  {
    date: "2025-03-18",
    title: "Ceasefire collapses",
    detail: "Israel resumes large-scale strikes across Gaza, ending the January ceasefire.",
  },
  {
    date: "2025-05-27",
    title: "Aid moves to militarised sites",
    detail:
      "Distribution shifts to a handful of Gaza Humanitarian Foundation sites; killings of people seeking aid climb steeply from here.",
  },
  {
    date: "2025-08-22",
    title: "Famine confirmed",
    detail: "The IPC declares famine in Gaza governorate, the first ever confirmed in the region.",
  },
  {
    date: "2025-10-10",
    title: "Ceasefire takes effect",
    detail:
      "A US-brokered ceasefire begins and the remaining living hostages are released days later.",
  },
];
