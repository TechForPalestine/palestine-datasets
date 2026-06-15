#!/usr/bin/env python3
"""
Scrape Lebanon MoPH daily casualty reports from moph.gov.lb.
Scans page IDs in the range for daily/cumulative casualty report pages,
extracts date and cumulative killed/wounded figures.
"""

import re
import subprocess
import sys
import time

BASE_URL = "https://moph.gov.lb/en/Media/view"

# Patterns that indicate this is a daily/cumulative casualty report
TITLE_PATTERNS = [
    r"Updated Total Toll of the Aggression",
    r"Daily Report on the Aggression",
    r"Death Toll Rises to",
    r"Death Toll from the Aggression has Risen",
    r"Cumulative Emergency Report",
]

def fetch_page(page_id):
    """Fetch a single MoPH media page and return its HTML."""
    url = f"{BASE_URL}/{page_id}/x"
    result = subprocess.run(
        ["curl", "-s", "--max-time", "15", url],
        capture_output=True, text=True, timeout=20
    )
    return result.stdout

def parse_killed_wounded_from_title(title):
    """Try to extract killed and wounded from a title string."""
    # "3711 Martyrs and 11483 Wounded"
    m = re.search(r'([\d,]+)\s*Martyrs?\s+and\s+([\d,]+)\s*Wounded', title, re.I)
    if m:
        return int(m.group(1).replace(',', '')), int(m.group(2).replace(',', ''))

    # "Death Toll Rises/has Risen to X Martyrs and Y Wounded"
    m = re.search(r'Death Toll (?:Rises to|has Risen to)\s+([\d,]+)\s+Martyrs?\s+and\s+([\d,]+)\s+Wounded', title, re.I)
    if m:
        return int(m.group(1).replace(',', '')), int(m.group(2).replace(',', ''))

    # "Death Toll Rises/has Risen to X" (killed only)
    m = re.search(r'Death Toll (?:Rises to|has Risen to)\s+([\d,]+)', title, re.I)
    if m:
        return int(m.group(1).replace(',', '')), None

    # "X,XXX Martyrs" or "X Martyrs" in title (killed only)
    m = re.search(r'(?:^|:\s+)([\d,]+)\s*Martyrs?\b', title, re.I)
    if m:
        return int(m.group(1).replace(',', '')), None

    return None, None

def parse_killed_wounded_from_body(html):
    """Extract cumulative killed and wounded from the Arabic body text."""
    # Handle both hamza forms of ارتفع (ارتفعت / إرتفعت) and الى/إلى
    ALF = r'[اإأآ]'  # any alef variant
    VERBS = (
        r'(?:بلغ'
        r'|' + ALF + r'رتفع\s+(?:إلى|الى|' + ALF + r'لى)'
        r'|' + ALF + r'رتفعت\s+(?:إلى|الى|' + ALF + r'لى)'
        r')'
    )

    # Pattern 1: "للشهداء ... VERB X ... عدد الجرحى Y"
    m = re.search(
        r'(?:الشهداء|للشهداء)[^0-9]{0,100}' + VERBS + r'\s+([\d,]+)'
        r'[^0-9]{0,150}عدد الجرحى\s*(?:الى|إلى|' + ALF + r'لى)?\s*([\d,]+)',
        html, re.DOTALL
    )
    if m:
        return int(m.group(1).replace(',', '')), int(m.group(2).replace(',', ''))

    # Pattern 2: "VERB X شهيدا و Y جريحا" (early/late form without عدد الجرحى)
    m = re.search(
        VERBS + r'\s+([\d,]+)\s+شهيد\S*\s+و\s*([\d,]+)\s+جريح',
        html
    )
    if m:
        return int(m.group(1).replace(',', '')), int(m.group(2).replace(',', ''))

    # Pattern 3: "عدد الجرحى X" — try wounded first, then killed nearby
    mw = re.search(r'عدد الجرحى\s*(?:الى|إلى)?\s*([\d,]+)', html)
    if mw:
        wounded = int(mw.group(1).replace(',', ''))
        # Look for killed in the same context (preceding number near الشهداء/بلغ)
        mk = re.search(VERBS + r'\s+([\d,]+)', html[: html.find(mw.group())])
        if not mk:
            mk = re.search(r'بلغ\s+([\d,]+)\s+شهيد', html)
        killed = int(mk.group(1).replace(',', '')) if mk else None
        return killed, wounded

    # Pattern 4 (English): "X Martyrs and Y Wounded"
    m = re.search(r'([\d,]+)\s+martyrs?\s+and\s+([\d,]+)\s+wounded', html, re.I)
    if m:
        return int(m.group(1).replace(',', '')), int(m.group(2).replace(',', ''))

    # Pattern 5 (English): "reached X ... Y wounded"
    m = re.search(r'reached\s+([\d,]+)[^.]{0,80}(?:wounded|injured)[^.]{0,40}([\d,]+)', html, re.I)
    if m:
        return int(m.group(1).replace(',', '')), int(m.group(2).replace(',', ''))

    return None, None

def parse_report(html, page_id):
    """
    Parse an HTML page to check if it's a daily casualty report and extract data.
    Returns dict or None.
    """
    if not html or len(html) < 200:
        return None

    # Check og:title for report pattern
    title_match = re.search(r'og:title.*?content="([^"]+)"', html)
    if not title_match:
        return None
    title = title_match.group(1).strip()

    is_report = any(re.search(p, title, re.I) for p in TITLE_PATTERNS)
    if not is_report:
        return None

    # Extract date from "Date: DD/MM/YYYY" in body (may have HTML tags between "Date:" and value)
    date_body = re.search(r'Date:(?:[^0-9]{0,50})(\d{1,2})/(\d{1,2})/(\d{4})', html)
    if date_body:
        day, month, year = date_body.group(1), date_body.group(2), date_body.group(3)
        date_str = f"{year}-{int(month):02d}-{int(day):02d}"
    else:
        # Try image filename: DD-M-YYYY-eng.jpg
        date_img = re.search(r'(\d{1,2})-(\d{1,2})-(\d{4})-eng\.jpg', html)
        if date_img:
            day, month, year = date_img.group(1), date_img.group(2), date_img.group(3)
            date_str = f"{year}-{int(month):02d}-{int(day):02d}"
        else:
            return None

    # Skip pages from before the conflict (before March 2, 2026)
    if date_str < "2026-03-02":
        return None

    # Try to get killed/wounded from title first
    killed_cum, wounded_cum = parse_killed_wounded_from_title(title)

    # If title only has killed, get wounded from body
    if killed_cum is not None and wounded_cum is None:
        _, wounded_cum = parse_killed_wounded_from_body(html)

    # If nothing in title, try body
    if killed_cum is None:
        killed_cum, wounded_cum = parse_killed_wounded_from_body(html)

    if killed_cum is None or wounded_cum is None:
        # Return partial if at least killed is found
        return {
            "page_id": page_id,
            "date": date_str,
            "killed_cum": killed_cum,
            "wounded_cum": wounded_cum,
            "title": title,
            "partial": True,
        }

    return {
        "page_id": page_id,
        "date": date_str,
        "killed_cum": killed_cum,
        "wounded_cum": wounded_cum,
        "title": title,
        "partial": False,
    }

def scan_range(start_id, end_id, step=10):
    """Scan a range of IDs and return all daily casualty reports found."""
    reports = []
    ids_to_check = list(range(start_id, end_id + 1, step))
    total = len(ids_to_check)

    print(f"Scanning {total} IDs from {start_id} to {end_id} (step={step})", file=sys.stderr)

    for i, page_id in enumerate(ids_to_check):
        if i % 50 == 0:
            print(f"  Progress: {i}/{total} (id={page_id})", file=sys.stderr)

        try:
            html = fetch_page(page_id)
            report = parse_report(html, page_id)
            if report:
                flag = " [PARTIAL]" if report.get("partial") else ""
                print(
                    f"  FOUND{flag}: {report['date']} id={page_id} "
                    f"killed={report['killed_cum']} wounded={report['wounded_cum']}",
                    file=sys.stderr
                )
                reports.append(report)
        except Exception as e:
            print(f"  ERROR id={page_id}: {e}", file=sys.stderr)

        time.sleep(0.05)

    return reports

def main():
    start_id = 82750
    end_id = 85539

    if len(sys.argv) > 1:
        start_id = int(sys.argv[1])
    if len(sys.argv) > 2:
        end_id = int(sys.argv[2])

    step = 10
    if len(sys.argv) > 3:
        step = int(sys.argv[3])

    reports = scan_range(start_id, end_id, step)

    # Deduplicate: if same date appears multiple times, keep the one with the highest
    # cumulative killed (last update of the day). Ties go to the highest page_id.
    seen_dates = {}
    for r in sorted(reports, key=lambda x: x["page_id"]):
        d = r["date"]
        if d not in seen_dates:
            seen_dates[d] = r
        else:
            prev = seen_dates[d]
            prev_k = prev.get("killed_cum") or -1
            curr_k = r.get("killed_cum") or -1
            if curr_k > prev_k:
                print(f"  DUP-UPDATE: date={d} upgrading from id={prev['page_id']} ({prev_k}) to id={r['page_id']} ({curr_k})", file=sys.stderr)
                seen_dates[d] = r
            else:
                print(f"  DUP: date={d} keeping id={prev['page_id']} ({prev_k}), skipping id={r['page_id']} ({curr_k})", file=sys.stderr)
    deduped = list(seen_dates.values())

    print(f"\nFound {len(deduped)} unique dated reports:", file=sys.stderr)
    print("date,page_id,killed_cum,wounded_cum,title")
    for r in sorted(deduped, key=lambda x: x["date"]):
        print(f"{r['date']},{r['page_id']},{r['killed_cum']},{r['wounded_cum']},\"{r['title']}\"")

if __name__ == "__main__":
    main()
