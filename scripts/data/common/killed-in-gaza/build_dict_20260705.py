"""Rebuild dict_ar_en.csv from IBC's own transliterations already in raw.csv.

The 2026-07-05 IBC release ships Arabic names only, so we have to transliterate
the net-new names ourselves. Rather than fall back on the older hand-built
dictionary (a different romanisation scheme), we mine IBC's own choices out of
data/raw.csv, where name_ar_raw and name_en are both theirs.

Method
------
* 56,828 of the 60,199 rows have matching Arabic/English word counts, so their
  segments zip 1:1. Take the majority English form per Arabic segment.
* A few segments are context-dependent (عبد is "Abdel" before most words but
  "Abd" in عبد ربه -> Abd Rabbo), so we also keep bigram entries that disagree
  with the unigram choice.
* Compound segments that were never seen whole (ابونبهان) are split against
  known segments and emitted to dict_ar_ar.csv, which exists for exactly this.

Held-out validation (80/20 split, see the docstring in translate_20260705.py)
reproduces IBC's exact English on 99.05% of names it can fully render.

Writes:
    data/dict_ar_en.csv                    merged; mined entries win on conflict
    data/dict_ar_ar.csv                    plus newly discovered compound splits
    data/dict_bigrams_20260705.csv         context-dependent segment pairs
    data/unknown_segments_20260705.csv     segments needing manual work
    output/dict_conflicts_20260705.csv     mined value != previous value

Usage:
    source ./venv/bin/activate
    python3 build_dict_20260705.py
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
CONFLICTS = os.path.join(HERE, "output/dict_conflicts_20260705.csv")

CRLF = "\r\n"
TASHKEEL = re.compile(r"[ً-ْـ]")

# Prefixes that legitimately start a compound family name; splits on these are
# preferred over arbitrary ones.
PREFIXES = ["ابو", "أبو", "عبد", "ام", "أم", "بن", "ابن", "نور", "سيف", "بيت"]


def norm_ar(s):
    """Fallback key only -- never used when writing dictionary keys, because
    dict_ar_en.csv deliberately carries both composed and decomposed forms."""
    s = unicodedata.normalize("NFKC", s)
    s = TASHKEEL.sub("", s)
    for a, b in [("أ", "ا"), ("إ", "ا"), ("آ", "ا"), ("ٱ", "ا"),
                 ("ى", "ي"), ("ة", "ه"), ("ؤ", "و"), ("ئ", "ي")]:
        s = s.replace(a, b)
    return s


def read_rows(path):
    with open(path, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_pairs(path, header, pairs):
    """Match the repo's existing CSV shape: CRLF rows, no trailing newline."""
    lines = [",".join(header)] + [f"{a},{b}" for a, b in pairs]
    with open(path, "w", encoding="utf-8", newline="") as f:
        f.write(CRLF.join(lines))


def mine(raw):
    uni = collections.defaultdict(collections.Counter)
    big = collections.defaultdict(collections.Counter)
    aligned = 0
    for r in raw:
        ar, en = r["name_ar_raw"].split(), r["name_en"].split()
        if len(ar) != len(en) or not ar:
            continue
        aligned += 1
        for i, (a, e) in enumerate(zip(ar, en)):
            uni[a][e.lower()] += 1
            if i + 1 < len(ar):
                big[(a, ar[i + 1])][e.lower()] += 1

    unigram = {a: c.most_common(1)[0][0] for a, c in uni.items()}
    bigram = {}
    for k, c in big.items():
        top, n = c.most_common(1)[0]
        if n >= 2 and top != unigram.get(k[0]):
            bigram[k] = top
    return unigram, bigram, uni, aligned


def main():
    raw = read_rows(RAW)
    new = read_rows(NEW)
    unigram, bigram, counts, aligned = mine(raw)

    fallback = {}
    for a, e in unigram.items():
        fallback.setdefault(norm_ar(a), e)

    print(f"raw.csv rows {len(raw)}   word-count aligned {aligned}")
    print(f"mined unigrams {len(unigram)}   context bigrams {len(bigram)}")

    def lookup(seg):
        return unigram.get(seg) or fallback.get(norm_ar(seg))

    # --- net-new names and their unknown segments ------------------------
    known_ids = {r["id"] for r in raw}
    net_new = [r for r in new if r["id"] not in known_ids]
    missing = collections.Counter()
    for r in net_new:
        for seg in r["name_ar_raw"].split():
            if not lookup(seg):
                missing[seg] += 1
    print(f"net-new names {len(net_new)}   unknown segments {len(missing)} "
          f"({sum(missing.values())} tokens)")

    # --- resolve compounds by splitting against known segments -----------
    norm_prefixes = {norm_ar(p) for p in PREFIXES}
    splits = {}
    for seg in list(missing):
        best = None
        for i in range(2, len(seg) - 1):
            head, tail = seg[:i], seg[i:]
            if lookup(head) and lookup(tail):
                score = (norm_ar(head) in norm_prefixes, len(head))
                if best is None or score > best[0]:
                    best = (score, head, tail)
        if best:
            splits[seg] = f"{best[1]} {best[2]}"
    still = {s: n for s, n in missing.items() if s not in splits}
    print(f"resolved by compound split {len(splits)}   still unknown {len(still)} "
          f"({sum(still.values())} tokens)")

    covered = sum(
        all(lookup(s) or s in splits for s in r["name_ar_raw"].split()) for r in net_new
    )
    print(f"net-new names fully covered: {covered}/{len(net_new)} "
          f"({100 * covered / len(net_new):.2f}%)")

    # --- merge into dict_ar_en.csv ---------------------------------------
    prev_rows = [r for r in csv.reader(open(DICT_AR_EN, encoding="utf-8")) if len(r) >= 2]
    prev = {r[0]: r[1] for r in prev_rows}
    conflicts = [
        (a, prev[a], unigram[a], sum(counts[a].values()))
        for a in unigram
        if a in prev and prev[a] != unigram[a]
    ]
    merged = dict(prev)
    merged.update(unigram)  # mined IBC values win
    # keep the leading empty row and ar,en header the file already has
    body = [(a, merged[a]) for a in sorted(merged) if a not in ("", "ar")]
    write_pairs(DICT_AR_EN, ["", ""], [("ar", "en")] + body)
    print(f"\ndict_ar_en.csv: {len(prev)} -> {len(body)} entries "
          f"(+{len(body) - len(prev)}), {len(conflicts)} overwritten")

    # --- append compound splits to dict_ar_ar.csv ------------------------
    ar_ar_rows = [r for r in csv.reader(open(DICT_AR_AR, encoding="utf-8")) if len(r) >= 2]
    header, ar_ar_body = ar_ar_rows[0], ar_ar_rows[1:]
    existing = {r[0] for r in ar_ar_body}
    added = [(s, splits[s]) for s in sorted(splits) if s not in existing]
    write_pairs(DICT_AR_AR, header, [(r[0], r[1]) for r in ar_ar_body] + added)
    print(f"dict_ar_ar.csv: {len(ar_ar_body)} -> {len(ar_ar_body) + len(added)} entries "
          f"(+{len(added)} compound splits)")

    write_pairs(DICT_BIGRAM, ["ar_pair", "en"],
                [(f"{a} {b}", e) for (a, b), e in sorted(bigram.items())])
    print(f"dict_bigrams_20260705.csv: {len(bigram)} entries")

    # Worklist: segments with no IBC evidence at all, plus segments only the
    # older hand-built dictionary can resolve (its romanisation scheme differs
    # and some entries are poor -- ابولبن -> "abolbn"), so both get eyes on them.
    # Every record we will actually translate: net-new, plus existing records
    # whose Arabic changed enough that the old English no longer describes it.
    by_id = {r["id"]: r for r in raw}
    retranslated = [
        r for r in new
        if r["id"] not in by_id
        or norm_ar(by_id[r["id"]]["name_ar_raw"]) != norm_ar(r["name_ar_raw"])
    ]
    legacy_used = {}
    mined_norm = {norm_ar(a) for a in unigram}
    for r in retranslated:
        for seg in r["name_ar_raw"].split():
            for part in splits.get(seg, seg).split():
                if part in unigram or norm_ar(part) in mined_norm:
                    continue
                if part in prev:
                    legacy_used[part] = prev[part]

    worklist = [(a, n, "", "no-evidence") for a, n in
                sorted(still.items(), key=lambda kv: (-kv[1], kv[0]))
                if a not in legacy_used]
    worklist += [(a, missing.get(a, 0), e, "legacy-unreviewed")
                 for a, e in sorted(legacy_used.items())]
    with open(UNKNOWN, "w", encoding="utf-8", newline="") as f:
        f.write(CRLF.join(["ar,count,current_en,note,en"] +
                          [f"{a},{n},{e},{note}," for a, n, e, note in worklist]))
    print(f"unknown_segments_20260705.csv: {len(worklist)} segments to fill in "
          f"({len(legacy_used)} legacy-unreviewed)")

    with open(CONFLICTS, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["ar", "previous_en", "mined_en", "occurrences"])
        w.writerows(sorted(conflicts, key=lambda c: -c[3]))
    print(f"dict_conflicts_20260705.csv: {len(conflicts)} rows")


if __name__ == "__main__":
    main()
