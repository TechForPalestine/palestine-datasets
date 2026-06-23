#!/usr/bin/env python3
"""
Create Lebanon MoPH daily casualties source .md files.
Uses the scraped cumulative data to produce per-date files with daily deltas.
"""

import os
from datetime import date

OUTPUT_DIR = "source_data/lebanon-daily"
BASE_URL = "https://moph.gov.lb/en/Media/view"

# Conflict began March 2, 2026; use the day before as the "previous date" for
# the first report so report_period correctly covers March 2–5 (4 days = 96h).
CONFLICT_PREV_DATE = date(2026, 3, 1)

# Final dataset: (date, page_id, killed_cum, injured_cum, title)
# Computed from moph.gov.lb scraping. Skips dates with no usable HTML data.
# killed and injured (daily) are computed as deltas from previous report.
REPORTS = [
    # date, page_id, killed_cum, injured_cum, source_title
    ("2026-03-05", 82875, 123, 683, "The Death Toll from the Aggression has Risen to 123 Martyrs and 683 Wounded"),
    ("2026-03-06", 82885, 217, 798, "The Death Toll from the Aggression has Risen to 217 Martyrs and 798 Wounded"),
    # March 7-10: no standard daily HTML reports found
    ("2026-03-11", 83025, 634, 1586, "Daily Report on the Aggression: Death Toll Rises to 634"),
    ("2026-03-12", 83045, 687, 1774, "Daily Report on the Aggression: Death Toll Rises to 687"),
    ("2026-03-13", 83095, 773, 1933, "Daily Report on the Aggression: Death Toll Rises to 773"),
    ("2026-03-14", 83140, 826, 2009, "Daily Report on the Aggression: Death Toll Rises to 826"),
    ("2026-03-15", 83170, 850, 2105, "Daily Report on the Aggression: Death Toll Rises to 850"),
    ("2026-03-16", 83200, 886, 2141, "Daily Report on the Aggression: Death Toll Rises to 886"),
    ("2026-03-17", 83235, 912, 2221, "Daily Report on the Aggression: Death Toll Rises to 912"),
    ("2026-03-18", 83270, 968, 2432, "Daily Report on the Aggression: Death Toll Rises to 968"),
    ("2026-03-19", 83305, 1001, 2584, "Daily Report on the Aggression: Death Toll Exceeds 1000"),
    # March 20: no report found
    ("2026-03-21", 83340, 1024, 2740, "Daily Report on the Aggression: 1,024 Martyrs"),
    ("2026-03-22", 83350, 1029, 2786, "Daily Report on the Aggression: 1,029 Martyrs"),
    ("2026-03-23", 83355, 1039, 2876, "Daily Report on the Aggression: 1,039 Martyrs"),
    ("2026-03-24", 83395, 1072, 2966, "Daily Report on the Aggression: 1,072 Martyrs"),
    ("2026-03-25", 83420, 1094, 3119, "Daily Report on the Aggression: 1,094 Martyrs"),
    ("2026-03-26", 83450, 1116, 3229, "Daily Report on the Aggression: 1,116 Martyrs"),
    ("2026-03-27", 83490, 1142, 3315, "Daily Report on the Aggression: 1,142 Martyrs"),
    ("2026-03-28", 83500, 1189, 3427, "Daily Report on the Aggression: 1,189 Martyrs"),
    ("2026-03-29", 83535, 1238, 3543, "Daily Report on the Aggression: 1,238 Martyrs"),
    ("2026-03-30", 83560, 1247, 3680, "Daily Report on the Aggression: 1,247 Martyrs"),
    ("2026-03-31", 83600, 1268, 3750, "Daily Report on the Aggression: 1,268 Martyrs"),
    ("2026-04-01", 83630, 1318, 3935, "Daily Report on the Aggression: 1,318 Martyrs"),
    ("2026-04-02", 83650, 1345, 4040, "Daily Report on the Aggression: 1345 Martyrs and the Number of Wounded Exceeds 4000"),
    ("2026-04-03", 83675, 1368, 4138, "Daily Report on the Aggression: 1368 Martyrs"),
    ("2026-04-04", 83695, 1422, 4294, "Daily Report on the Aggression: 1400 Martyrs"),
    ("2026-04-05", 83710, 1461, 4430, "Daily Report on the Aggression: 1461 Martyrs"),
    ("2026-04-06", 83740, 1497, 4639, "Daily Report on the Aggression: 1497 Martyrs"),
    ("2026-04-07", 83780, 1530, 4812, "Daily Report on the Aggression: 1530 Martyrs"),
    # April 8-9: no standard daily HTML reports
    ("2026-04-10", 83894, 1953, 6303, "The Cumulative Death Toll from the Aggression Exceeds 1900 martyrs and the Toll from April 8th is Expected to Rise Further"),
    ("2026-04-11", 83910, 2020, 6436, "Daily Report on the Aggression: 2020 Martyrs"),
    ("2026-04-12", 83920, 2055, 6588, "Daily Report on the Aggression: 2055 Martyrs"),
    ("2026-04-13", 83945, 2089, 6762, "Daily Report on the Aggression: 2089 Martyrs"),
    ("2026-04-14", 83975, 2124, 6921, "Daily Report on the Aggression: 2124 Martyrs and 6921 Wounded"),
    ("2026-04-15", 83985, 2167, 7061, "Daily Report on the Aggression: 2167 Martyrs and 7061 Wounded"),
    ("2026-04-16", 84025, 2196, 7185, "Daily Report on the Aggression: 2196 Martyrs and 7185 Wounded"),
    # April 17 report covers through midnight April 16; published April 17
    ("2026-04-17", 84057, 2294, 7544, "The Preliminary Toll of the Aggression: 2294 Martyrs and 7544 Wounded"),
    # April 18-23: no separate daily reports
    ("2026-04-24", 84095, 2491, 7719, "Updated Total Toll of the Aggression: 2491 Martyrs and 7719 Wounded"),
    ("2026-04-25", 84100, 2496, 7725, "Updated Total Toll of the Aggression: 2496 Martyrs and 7725 Wounded"),
    ("2026-04-26", 84110, 2509, 7755, "Updated Total Toll of the Aggression: 2509 Martyrs and 7755 Wounded"),
    ("2026-04-27", 84125, 2521, 7804, "Updated Total Toll of the Aggression: 2521 Martyrs and 7804 Wounded"),
    ("2026-04-28", 84150, 2534, 7863, "Updated Total Toll of the Aggression: 2534 Martyrs and 7863 Wounded"),
    ("2026-04-29", 84185, 2576, 7962, "Updated Total Toll of the Aggression: 2576 Martyrs and 7962 Wounded"),
    ("2026-04-30", 84210, 2586, 8020, "Updated Total Toll of the Aggression: 2586 Martyrs and 8020 Wounded"),
    ("2026-05-01", 84220, 2618, 8094, "Updated Total Toll of the Aggression: 2618 Martyrs and 8094 Wounded"),
    ("2026-05-02", 84230, 2659, 8183, "Updated Total Toll of the Aggression: 2659 Martyrs and 8183 Wounded"),
    ("2026-05-03", 84240, 2679, 8229, "Updated Total Toll of the Aggression: 2679 Martyrs and 8229 Wounded"),
    ("2026-05-04", 84285, 2696, 8264, "Updated Total Toll of the Aggression: 2696 Martyrs and 8264 Wounded"),
    ("2026-05-05", 84315, 2702, 8311, "Updated Total Toll of the Aggression: 2702 Martyrs and 8311 Wounded"),
    ("2026-05-06", 84360, 2715, 8353, "Updated Total Toll of the Aggression: 2715 Martyrs and 8353 Wounded"),
    ("2026-05-07", 84385, 2727, 8438, "Updated Total Toll of the Aggression: 2727 Martyrs and 8438 Wounded"),
    ("2026-05-08", 84410, 2759, 8512, "Updated Total Toll of the Aggression: 2759 Martyrs and 8512 Wounded"),
    ("2026-05-09", 84455, 2795, 8586, "Updated Total Toll of the Aggression: 2795 Martyrs and 8586 Wounded"),
    ("2026-05-10", 84470, 2846, 8693, "Updated Total Toll of the Aggression: 2846 Martyrs and 8693 Wounded"),
    ("2026-05-11", 84480, 2869, 8730, "Updated Total Toll of the Aggression: 2869 Martyrs and 8730 Wounded"),
    # May 12: no daily report found
    ("2026-05-13", 84565, 2896, 8824, "Updated Total Toll of the Aggression: 2896 Martyrs and 8824 Wounded"),
    ("2026-05-14", 84620, 2935, 8917, "Updated Total Toll of the Aggression: 2935 Martyrs and 8917 Wounded"),
    ("2026-05-15", 84625, 2951, 8988, "Updated Total Toll of the Aggression: 2951 Martyrs and 8988 Wounded"),
    ("2026-05-16", 84690, 2969, 9112, "Updated Total Toll of the Aggression: 2969 Martyrs and 9112 Wounded"),
    ("2026-05-17", 84695, 2988, 9210, "Updated Total Toll of the Aggression: 2988 Martyrs and 9210 Wounded"),
    ("2026-05-18", 84750, 3020, 9273, "Updated Total Toll of the Aggression: 3020 Martyrs and 9273 Wounded"),
    ("2026-05-19", 84775, 3042, 9301, "Updated Total Toll of the Aggression: 3042 Martyrs and 9301 Wounded"),
    ("2026-05-20", 84850, 3073, 9362, "Updated Total Toll of the Aggression: 3073 Martyrs and 9362 Wounded"),
    ("2026-05-21", 84895, 3089, 9397, "Updated Total Toll of the Aggression: 3089 Martyrs and 9397 Wounded"),
    ("2026-05-22", 84950, 3111, 9432, "Updated Total Toll of the Aggression: 3111 Martyrs and 9432 Wounded"),
    ("2026-05-23", 84965, 3123, 9506, "Updated Total Toll of the Aggression: 3123 Martyrs and 9506 Wounded"),
    ("2026-05-24", 84990, 3151, 9571, "Updated Total Toll of the Aggression: 3151 Martyrs and 9571 Wounded"),
    ("2026-05-25", 85015, 3185, 9633, "Updated Total Toll of the Aggression: 3185 Martyrs and 9633 Wounded"),
    ("2026-05-26", 85075, 3213, 9737, "Updated Total Toll of the Aggression: 3213 Martyrs and 9737 Wounded"),
    ("2026-05-27", 85095, 3269, 9840, "Updated Total Toll of the Aggression: 3269 Martyrs and 9840 Wounded"),
    ("2026-05-28", 85110, 3324, 10027, "Updated Total Toll of the Aggression: 3324 Martyrs and 10027 Wounded"),
    ("2026-05-29", 85120, 3355, 10095, "Updated Total Toll of the Aggression: 3355 Martyrs and 10095 Wounded"),
    ("2026-05-30", 85135, 3371, 10129, "Updated Total Toll of the Aggression: 3371 Martyrs and 10129 Wounded"),
    ("2026-05-31", 85160, 3412, 10269, "Updated Total Toll of the Aggression: 3412 Martyrs and 10269 Wounded"),
    ("2026-06-01", 85170, 3433, 10395, "Updated Total Toll of the Aggression: 3433 Martyrs and 10395 Wounded"),
    ("2026-06-02", 85225, 3468, 10577, "Updated Total Toll of the Aggression: 3468 Martyrs and 10577 Wounded"),
    ("2026-06-03", 85260, 3516, 10674, "Updated Total Toll of the Aggression: 3516 Martyrs and 10674 Wounded"),
    ("2026-06-04", 85380, 3526, 10733, "Updated Total Toll of the Aggression: 3526 Martyrs and 10733 Wounded"),
    ("2026-06-05", 85440, 3558, 10870, "Updated Total Toll of the Aggression: 3558 Martyrs and 10870 Wounded"),
    ("2026-06-06", 85450, 3593, 10990, "Updated Total Toll of the Aggression: 3593 Martyrs and 10990 Wounded"),
    ("2026-06-07", 85470, 3613, 11072, "Updated Total Toll of the Aggression: 3613 Martyrs and 11072 Wounded"),
    ("2026-06-08", 85480, 3637, 11188, "Updated Total Toll of the Aggression: 3637 Martyrs and 11188 Wounded"),
    ("2026-06-09", 85495, 3666, 11321, "Updated Total Toll of the Aggression: 3666 Martyrs and 11321 Wounded"),
    ("2026-06-10", 85520, 3696, 11413, "Updated Total Toll of the Aggression: 3696 Martyrs and 11413 Wounded"),
    ("2026-06-11", 85540, 3711, 11483, "Updated Total Toll of the Aggression: 3711 Martyrs and 11483 Wounded"),
    # June 12: no standard daily report found
    ("2026-06-13", 85571, 3756, 11632, "Updated Total Toll of the Aggression: 3756 Martyrs and 11632 Wounded"),
    ("2026-06-14", 85581, 3783, 11699, "Updated Total Toll of the Aggression: 3783 Martyrs and 11699 Wounded"),
    ("2026-06-15", 85611, 3798, 11781, "Updated Total Toll of the Aggression: 3798 Martyrs and 11781 Wounded"),
    ("2026-06-16", 85616, 3826, 11851, "Updated Total Toll of the Aggression: 3826 Martyrs and 11851 Wounded"),
    ("2026-06-17", 85641, 3884, 11856, "Updated Total Toll of the Aggression: 3884 Martyrs and 11856 Wounded"),
    ("2026-06-18", 85666, 3912, 11873, "Updated Total Toll of the Aggression: 3912 Martyrs and 11873 Wounded"),
    ("2026-06-19", 85716, 3980, 12001, "Updated Total Toll of the Aggression: 3980 Martyrs and 12001 Wounded"),
    ("2026-06-20", 85731, 4057, 12121, "Updated Total Toll of the Aggression: 4057 Martyrs and 12121 Wounded"),
    ("2026-06-21", 85751, 4106, 12153, "Updated Total Toll of the Aggression: 4106 Martyrs and 12153 Wounded"),
]

def create_md_file(report_date, page_id, killed_cum, injured_cum, title, killed, injured, report_period):
    slug = title.lower().replace(' ', '-').replace(',', '').replace(':', '').replace("'", '')[:60]
    url = f"{BASE_URL}/{page_id}/{slug}"
    body = f"Source: [{title}]({url})\n"
    frontmatter = (
        f'report_date: "{report_date}"\n'
        f'report_source: "moph_lb"\n'
        f'report_period: {report_period}\n'
        f'killed: {killed}\n'
        f'killed_cum: {killed_cum}\n'
        f'injured: {injured}\n'
        f'injured_cum: {injured_cum}\n'
    )
    return f"---\n{frontmatter}---\n\n{body}"

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    prev_killed_cum = 0
    prev_injured_cum = 0
    prev_date = CONFLICT_PREV_DATE
    created = 0

    for date_str, page_id, killed_cum, injured_cum, title in REPORTS:
        killed = killed_cum - prev_killed_cum
        injured = injured_cum - prev_injured_cum

        cur_date = date.fromisoformat(date_str)
        report_period = (cur_date - prev_date).days * 24

        content = create_md_file(date_str, page_id, killed_cum, injured_cum, title, killed, injured, report_period)
        filepath = os.path.join(OUTPUT_DIR, f"{date_str}.md")

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)

        print(f"Created {date_str}.md: killed={killed}, killed_cum={killed_cum}, injured={injured}, injured_cum={injured_cum}, period={report_period}h")
        prev_killed_cum = killed_cum
        prev_injured_cum = injured_cum
        prev_date = cur_date
        created += 1

    print(f"\nCreated {created} files in {OUTPUT_DIR}/")

if __name__ == "__main__":
    main()
