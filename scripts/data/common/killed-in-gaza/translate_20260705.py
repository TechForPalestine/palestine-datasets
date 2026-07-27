"""Assemble output/2026-07-05.csv: the 72,835-record list with name_en filled.

Policy
------
* Records whose id is already in data/raw.csv keep IBC's existing name_en -- it
  is their own authoritative transliteration, so we never regenerate it. The
  Arabic is taken from the new PDF, which fixes a number of typos in our data
  (جهادد -> جهاد, يوسفسف -> يوسف).
* If the Arabic changed materially for an existing id, the English is
  regenerated, since the old transliteration no longer describes the name.
* Net-new records are generated from the mined dictionary.

Casing follows IBC ("Al-Najjar", not translate.ts's "al-Najjar") because the
generated rows sit alongside 59,957 of IBC's own. fixStandaloneAllah is NOT
applied here -- generate_killed_list.ts already applies it downstream, and
raw.csv is expected to hold the pre-fix form ("Ata Allah").

Held-out validation (80/20 on the aligned rows of raw.csv):
    renderable 97.83%   exact 96.89%   exact-given-renderable 99.05%

Any name still containing Arabic after translation is written to
output/untranslated_20260705.csv rather than silently shipped.

Usage:
    source ./venv/bin/activate
    python3 translate_20260705.py
"""

import collections
import csv
import os
import re
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))

RAW = os.path.join(HERE, "data/raw.csv")
NEW = os.path.join(HERE, "raw/2026-07-05_ibc.csv")
DICT_AR_EN = os.path.join(HERE, "data/dict_ar_en.csv")
DICT_AR_AR = os.path.join(HERE, "data/dict_ar_ar.csv")
DICT_BIGRAM = os.path.join(HERE, "data/dict_bigrams_20260705.csv")
UNKNOWN = os.path.join(HERE, "data/unknown_segments_20260705.csv")
OUT = os.path.join(HERE, "output/2026-07-05.csv")
UNTRANSLATED = os.path.join(HERE, "output/untranslated_20260705.csv")

TASHKEEL = re.compile(r"[ً-ْـ]")
ARABIC = re.compile(r"[؀-ۿ]")


def norm_ar(s):
    s = unicodedata.normalize("NFKC", s)
    s = TASHKEEL.sub("", s)
    for a, b in [("أ", "ا"), ("إ", "ا"), ("آ", "ا"), ("ٱ", "ا"),
                 ("ى", "ي"), ("ة", "ه"), ("ؤ", "و"), ("ئ", "ي")]:
        s = s.replace(a, b)
    return " ".join(s.split())


def read_pairs(path, skip=1):
    with open(path, encoding="utf-8") as f:
        return [r for r in csv.reader(f) if len(r) >= 2][skip:]


def strip_trailing_newline(path):
    with open(path, encoding="utf-8", newline="") as f:
        text = f.read()
    with open(path, "w", encoding="utf-8", newline="") as f:
        f.write(text.rstrip("\r\n"))


def fallback_rank(key):
    """Order dictionary keys that share a normalized form, deterministically.

    Several Arabic spellings collapse to one normalized key (179 of them here),
    and the source PDF sometimes writes hamza decomposed (ا + U+0654) where the
    dictionary only has it composed (U+0623), so those names resolve through the
    fallback. Picking the first row in file order is not stable: CI's
    sort-list-csvs rewrites dict_ar_en.csv on every push, and reordering it
    silently flipped إيهم Ayham->Aihm and أسيد Aseed->Asaid -- in both cases to a
    legacy hand-dictionary entry with no IBC evidence behind it, while the
    composed key carried IBC's own value. So prefer the NFC-composed spelling,
    then the key itself, and never let file order decide.
    """
    return (unicodedata.normalize("NFC", key) != key, key)


def case_word(w):
    if w.startswith("al-") and len(w) > 3:
        return "Al-" + w[3].upper() + w[4:]
    return w[0].upper() + w[1:] if len(w) > 1 else w.upper()


def case_seg(seg):
    """IBC style: capitalise the word, and the noun after an 'al-' article.

    A dictionary value may be several English words (compounds such as
    ابوزنيد -> "abu zneid"), so each word is cased independently.
    """
    return " ".join(case_word(w) for w in seg.split())


def main():
    ar_en_pairs = [(a, e) for a, e in read_pairs(DICT_AR_EN, skip=1)
                   if a not in ("", "ar")]
    ar_en = dict(ar_en_pairs)
    # A repeated key with two different values means whichever row lands last
    # decides -- that is file order again, so say so rather than pick silently.
    seen = collections.defaultdict(set)
    for a, e in ar_en_pairs:
        seen[a].add(e)
    ambiguous = {a: v for a, v in seen.items() if len(v) > 1}
    if ambiguous:
        print(f"WARNING: {len(ambiguous)} duplicate keys with conflicting values "
              f"in dict_ar_en.csv: " + ", ".join(f"{a}={sorted(v)}"
                                                 for a, v in list(ambiguous.items())[:5]))
    ar_ar = dict(read_pairs(DICT_AR_AR, skip=1))
    bigram = {tuple(k.split()): v for k, v in read_pairs(DICT_BIGRAM, skip=1)
              if len(k.split()) == 2}

    # Manually-filled transliterations take precedence over anything mined.
    manual = {}
    if os.path.exists(UNKNOWN):
        with open(UNKNOWN, encoding="utf-8") as f:
            for row in csv.DictReader(f):
                if row.get("en", "").strip():
                    manual[row["ar"]] = row["en"].strip().lower()
    print(f"dict_ar_en {len(ar_en)}   dict_ar_ar {len(ar_ar)}   "
          f"bigrams {len(bigram)}   manual {len(manual)}")

    fallback = {}
    for a in sorted(ar_en, key=fallback_rank):
        fallback.setdefault(norm_ar(a), ar_en[a])

    def lookup(seg):
        return manual.get(seg) or ar_en.get(seg) or fallback.get(norm_ar(seg))

    def translate(name_ar):
        # dict_ar_ar splits/joins compounds before segment lookup
        segs = []
        for seg in name_ar.split():
            segs.extend(ar_ar.get(seg, seg).split())
        out, ok = [], True
        for i, seg in enumerate(segs):
            en = bigram.get((seg, segs[i + 1])) if i + 1 < len(segs) else None
            en = en or lookup(seg)
            if en is None:
                ok = False
                out.append(seg)
            else:
                out.append(case_seg(en))
        return " ".join(out), ok

    old = {r["id"]: r for r in csv.DictReader(open(RAW, encoding="utf-8"))}
    new = list(csv.DictReader(open(NEW, encoding="utf-8")))

    rows, untranslated = [], []
    stats = collections.Counter()
    for i, r in enumerate(new, 1):
        prev = old.get(r["id"])
        if prev and norm_ar(prev["name_ar_raw"]) == norm_ar(r["name_ar_raw"]):
            name_en, ok = prev["name_en"], True
            stats["kept existing IBC name_en"] += 1
        elif prev:
            name_en, ok = translate(r["name_ar_raw"])
            stats["regenerated (arabic changed)"] += 1
        else:
            name_en, ok = translate(r["name_ar_raw"])
            stats["generated (net-new record)"] += 1
        if not ok:
            untranslated.append((r["id"], r["name_ar_raw"], name_en))
        rows.append({
            "index": i,
            "name_en": name_en,
            "name_ar_raw": r["name_ar_raw"],
            "age": r["age"],
            "dob": r["dob"],
            "sex": r["sex"],
            "id": r["id"],
            "source": "u",
        })

    print()
    for k, v in stats.most_common():
        print(f"  {k:32s} {v}")
    print(f"\nrows {len(rows)}   with untranslated segments {len(untranslated)} "
          f"({100 * len(untranslated) / len(rows):.2f}%)")

    residual = [r for r in rows if ARABIC.search(r["name_en"])]
    print(f"name_en still containing Arabic: {len(residual)}")

    # utils.ts readCsv splits on "\n" without dropping a trailing blank line, so
    # a final newline crashes diff_lists.ts. Match raw.csv: no trailing newline.
    with open(OUT, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["index", "name_en", "name_ar_raw",
                                          "age", "dob", "sex", "id", "source"])
        w.writeheader()
        w.writerows(rows)
    strip_trailing_newline(OUT)
    print(f"wrote {OUT}")

    with open(UNTRANSLATED, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["id", "name_ar_raw", "name_en_partial"])
        w.writerows(untranslated)
    print(f"wrote {UNTRANSLATED}")


if __name__ == "__main__":
    main()
