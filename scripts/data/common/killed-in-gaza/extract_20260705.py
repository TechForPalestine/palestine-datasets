"""Extract the 2026-07-05 IBC release (Arabic names only) from PDF.

Unlike the 2025 releases, IBC published this one as a 1,777-page PDF with no
English transliterations, so this script only produces the Arabic side; the
name_en column is filled afterwards by translate_20260705.py.

Why geometry instead of `pdftotext -layout`
-------------------------------------------
The text layer is clean but two things break naive extraction:

1. The embedded AAAAAE+GeezaPro-Bold subset has 11 glyphs whose ToUnicode
   entries fell back to identity (Quartz could not decompose them). They are
   Arabic presentation-form ligatures, and render as '?', '_', 'x', 'A"' etc --
   7,072 corrupted characters across ~20k names. GLYPHS below maps them back.

2. pdftotext's bidi handling misplaces spaces around those wide ligatures
   ("عبدالله البراوي" -> "عبدا للهالبراوي") and occasionally rotates a whole
   name. The underlying character geometry is correct, so each row is rebuilt
   from character positions: Arabic-font chars in descending-x (RTL logical)
   order, Latin columns left-to-right.

Verified against the 59,957 records already in data/raw.csv: 95.2% byte-exact,
99.3% equal after orthographic normalisation, 0 residual bad characters.

Usage:
    source ./venv/bin/activate
    python3 extract_20260705.py
"""

import csv
import os
import re
import sys

import fitz  # PyMuPDF

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "../../../.."))

PDF = os.path.join(REPO, "site/static/sources/20260705gaza-via-ibc.pdf")
OUT = os.path.join(HERE, "raw/2026-07-05_ibc.csv")

# Recovered ToUnicode entries for the 11 broken glyphs. Nine were recovered by
# aligning against known-good names in data/raw.csv (99-100% unanimous); the two
# singletons ('ú' -> تن, 'ù' -> لآ) were read off rendered page images.
GLYPHS = {
    "?": "لا",   # lam-alef
    "_": "ين",   # yeh-noon
    "a": "لم",   # lam-meem
    "p": "لا",   # lam-alef, alternate form
    "x": "لله",  # -llah
    "Ä": "بن",   # beh-noon
    "à": "لأ",   # lam-alef-hamza-above
    "ó": "نن",   # noon-noon
    "õ": "لإ",   # lam-alef-hamza-below
    "ú": "تن",   # teh-noon
    "ù": "لآ",   # lam-alef-madda
}
PH_RE = re.compile("[" + re.escape("".join(GLYPHS)) + "]")

# Arabic and Latin runs in one row sit on slightly different baselines.
ROW_TOL = 4.0

TAIL = re.compile(
    r"^(?P<age>.*?)\s*"
    r"(?P<sex>male|female|unknown)\s*"
    r"(?P<dob>\d{4}-\d{2}-\d{2})\s*"
    r"(?P<id>\d{9})\s*$"
)

SEX = {"male": "m", "female": "f"}


def iter_rows(page):
    """Yield lists of char dicts clustered into visual rows by baseline y."""
    chars = []
    for block in page.get_text("rawdict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                arabic = "Geeza" in span["font"]
                for ch in span["chars"]:
                    ch["_ar"] = arabic
                    chars.append(ch)
    chars.sort(key=lambda c: c["origin"][1])

    group, anchor = [], None
    for ch in chars:
        y = ch["origin"][1]
        if anchor is None:
            anchor = y
        if y - anchor <= ROW_TOL:
            group.append(ch)
        else:
            yield group
            group, anchor = [ch], y
    if group:
        yield group


def build_row(chars):
    """Return (arabic_name, latin_tail) for one visual row, or None."""
    arabic = [c for c in chars if c["_ar"]]
    if not arabic:
        return None
    x0 = min(c["bbox"][0] for c in arabic)
    x1 = max(c["bbox"][2] for c in arabic)

    # Spaces are real U+0020 chars in the Latin font; keep the ones inside the
    # name's x-span so word boundaries survive.
    inside = [c for c in chars if c["c"] == " " and x0 <= c["bbox"][0] <= x1]

    name_chars = sorted(arabic + inside, key=lambda c: -c["bbox"][0])  # RTL
    name = "".join(c["c"] for c in name_chars)
    name = PH_RE.sub(lambda m: GLYPHS[m.group()], name)
    name = " ".join(name.split())

    used = {id(c) for c in name_chars}
    rest = sorted((c for c in chars if id(c) not in used), key=lambda c: c["bbox"][0])
    return name, "".join(c["c"] for c in rest).strip()


def age_to_years(raw):
    """IBC writes sub-year ages as '7 months' / 'Less than a day'; we store 0."""
    return int(raw) if raw.isdigit() else 0


def main():
    doc = fitz.open(PDF)
    rows, bad = [], []
    for pno in range(doc.page_count):
        for chars in iter_rows(doc[pno]):
            built = build_row(chars)
            if not built:
                continue
            name, tail = built
            m = TAIL.match(tail)
            if not m:
                bad.append((pno + 1, name, tail))
                continue
            rows.append(
                {
                    "name_ar_raw": name,
                    "age": age_to_years(m.group("age").strip()),
                    "age_raw": " ".join(m.group("age").split()),
                    "dob": m.group("dob"),
                    "sex": SEX[m.group("sex")],
                    "id": m.group("id"),
                }
            )
        if (pno + 1) % 400 == 0:
            print(f"  page {pno + 1}/{doc.page_count}  rows={len(rows)}", file=sys.stderr)

    ids = {r["id"] for r in rows}
    print(f"rows: {len(rows)}   unique ids: {len(ids)}   unparsed rows: {len(bad)}")
    for p, n, t in bad[:20]:
        print(f"   p{p}: name={n!r} tail={t!r}")
    if len(ids) != len(rows) or bad:
        print("WARNING: parse anomalies present -- inspect before continuing")

    residual = [r for r in rows if PH_RE.search(r["name_ar_raw"])]
    print(f"names with residual placeholder glyphs: {len(residual)}")

    with open(OUT, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["name_ar_raw", "age", "age_raw", "dob", "sex", "id"])
        w.writeheader()
        w.writerows(rows)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
