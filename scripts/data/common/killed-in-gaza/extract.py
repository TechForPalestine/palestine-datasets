"""Normalise an IBC release export into the CSV shape diff_lists.ts expects.

Replaces the extract_<date>.py copy-per-update scripts, which differed only in
two hardcoded path strings.

Expects raw/<date>_ibc.csv to already have the normalised header
(index,name_en,name_ar_raw,age,dob,sex,id) -- see README for the xlsx -> CSV
steps that produce it.

Usage:
    source ./venv/bin/activate
    python3 extract.py 2025-07-31
"""

import sys

import pandas as pd


def extract(date):
    ibc_path = f"raw/{date}_ibc.csv"
    output_path = f"output/{date}.csv"

    df = pd.read_csv(ibc_path)
    # ages arrive as floats, blanks, and occasional text ("7 months") -> int
    df["age"] = pd.to_numeric(df["age"], errors="coerce").fillna(0).astype(int)
    df["source"] = "u"
    df.to_csv(output_path, index=False)

    # utils.ts readCsv splits on "\n" without dropping a trailing blank line, so a
    # final newline crashes diff_lists.ts. This used to be a manual README step.
    with open(output_path, encoding="utf-8", newline="") as f:
        text = f.read()
    with open(output_path, "w", encoding="utf-8", newline="") as f:
        f.write(text.rstrip("\r\n"))

    print(f"wrote {output_path} ({len(df)} rows)")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: python3 extract.py <date>   e.g. python3 extract.py 2025-07-31")
    extract(sys.argv[1])
