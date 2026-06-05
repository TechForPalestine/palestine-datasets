import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { PersonRow } from "../types";
import { recordCols } from "../getColumnConfig";
import { updateDates } from "../../../../../scripts/data/common/killed-in-gaza/constants";

const lastUpdate = updateDates[updateDates.length - 1];

const formatAge = (age: unknown) =>
  typeof age === "number" && age >= 0 ? String(age) : "—";

const formatSex = (sex: unknown) => {
  if (sex === "m") return "M";
  if (sex === "f") return "F";
  return "—";
};

const formatDob = (dob: unknown) =>
  typeof dob === "string" && dob ? dob : "—";

export const PrintSurface = React.memo(
  ({
    records,
    filtered,
    totalLoaded,
    onReady,
  }: {
    records: PersonRow[];
    filtered: boolean;
    totalLoaded: number;
    onReady?: () => void;
  }) => {
    useEffect(() => {
      // useEffect fires after commit; rAF lets the browser lay out the
      // (potentially huge) table before we trigger window.print()
      const raf = requestAnimationFrame(() => onReady?.());
      return () => cancelAnimationFrame(raf);
    }, [onReady]);

    if (typeof document === "undefined") return null;

    const enIdx = recordCols.en_name as number;
    const arIdx = recordCols.ar_name as number;
    const ageIdx = recordCols.age as number;
    const sexIdx = recordCols.sex as number;
    const dobIdx = recordCols.dob as number;

    return createPortal(
      <div className="tfp-print-surface" aria-hidden="true">
        <header>
          <h1>Killed in Gaza</h1>
          <p>
            {records.length.toLocaleString()}{" "}
            {filtered
              ? `filtered names (of ${totalLoaded.toLocaleString()} loaded)`
              : "names"}
            {" · "}List current through {lastUpdate.includesUntil}
            {" · "}Source: data.techforpalestine.org
          </p>
        </header>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>الاسم</th>
              <th>Sex</th>
              <th>Age</th>
              <th>Date of Birth</th>
            </tr>
          </thead>
          <tbody>
            {records.map((row, i) => (
              <tr key={i}>
                <td>{row[enIdx]}</td>
                <td dir="rtl" lang="ar">
                  {row[arIdx]}
                </td>
                <td>{formatSex(row[sexIdx])}</td>
                <td>{formatAge(row[ageIdx])}</td>
                <td>{formatDob(row[dobIdx])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
      document.body
    );
  }
);
