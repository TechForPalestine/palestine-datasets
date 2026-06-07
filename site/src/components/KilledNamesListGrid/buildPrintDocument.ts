import { PersonRow } from "./types";
import { recordCols } from "./getColumnConfig";

export const PRINT_TRANCHE_SIZE = 15000;

const escapeHtml = (value: unknown) => {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const formatAge = (age: unknown) =>
  typeof age === "number" && age >= 0 ? String(age) : "—";

const formatSex = (sex: unknown) => {
  if (sex === "m") return "M";
  if (sex === "f") return "F";
  return "—";
};

const formatDob = (dob: unknown) =>
  typeof dob === "string" && dob ? dob : "—";

const buildCompactBody = ({
  records,
  enIdx,
  ageIdx,
  startNumber,
}: {
  records: PersonRow[];
  enIdx: number;
  ageIdx: number;
  startNumber: number;
}) =>
  `<div class="list">${records
    .map(
      (row, i) =>
        `<div class="entry"><span class="num">${(
          startNumber + i
        ).toLocaleString()}</span><span class="name">${escapeHtml(
          row[enIdx],
        )}, ${row[ageIdx]}</span></div>`,
    )
    .join("")}</div>`;

const buildDetailedBody = ({
  records,
  startNumber,
  enIdx,
  arIdx,
  ageIdx,
  sexIdx,
  dobIdx,
}: {
  records: PersonRow[];
  startNumber: number;
  enIdx: number;
  arIdx: number;
  ageIdx: number;
  sexIdx: number;
  dobIdx: number;
}) => {
  const rows = records
    .map(
      (row, i) =>
        `<tr><td class="num">${(startNumber + i).toLocaleString()}</td>` +
        `<td>${escapeHtml(row[enIdx])}</td>` +
        `<td dir="rtl" lang="ar">${escapeHtml(row[arIdx])}</td>` +
        `<td>${escapeHtml(formatSex(row[sexIdx]))}</td>` +
        `<td>${escapeHtml(formatAge(row[ageIdx]))}</td>` +
        `<td>${escapeHtml(formatDob(row[dobIdx]))}</td></tr>`,
    )
    .join("");
  return `<table>
  <thead>
    <tr><th class="num">#</th><th>Name</th><th>الاسم</th><th>Sex</th><th>Age</th><th>Date of Birth</th></tr>
  </thead>
  <tbody>${rows}</tbody>
</table>`;
};

export const buildPrintDocument = ({
  records,
  filtered,
  totalLoaded,
  lastUpdate,
  startNumber,
  totalInSet,
  detailed,
}: {
  records: PersonRow[];
  filtered: boolean;
  totalLoaded: number;
  lastUpdate: string;
  // 1-based global position of records[0] in the user's current view
  startNumber: number;
  // total size of the current view (filtered set or full set)
  totalInSet: number;
  detailed: boolean;
}) => {
  const enIdx = recordCols.en_name as number;
  const arIdx = recordCols.ar_name as number;
  const ageIdx = recordCols.age as number;
  const sexIdx = recordCols.sex as number;
  const dobIdx = recordCols.dob as number;

  const body = detailed
    ? buildDetailedBody({
        records,
        startNumber,
        enIdx,
        arIdx,
        ageIdx,
        sexIdx,
        dobIdx,
      })
    : buildCompactBody({ records, enIdx, ageIdx, startNumber });

  const endNumber = startNumber + records.length - 1;
  const isTranche = records.length < totalInSet;
  const setLabel = filtered ? "filtered names" : "names";
  const subtitle = isTranche
    ? `Names ${startNumber.toLocaleString()}–${endNumber.toLocaleString()} of ${totalInSet.toLocaleString()} ${setLabel}` +
      (filtered ? ` (of ${totalLoaded.toLocaleString()} loaded)` : "")
    : filtered
    ? `${records.length.toLocaleString()} filtered names (of ${totalLoaded.toLocaleString()} loaded)`
    : `${records.length.toLocaleString()} names`;

  const layoutCss = detailed
    ? `
  table { width: 100%; border-collapse: collapse; font-size: 9pt; }
  thead { display: table-header-group; }
  th, td { border-bottom: 1px solid #ccc; padding: 3px 6px; text-align: left; vertical-align: top; }
  th { border-bottom: 2px solid #000; background: #f0f0f0; }
  td.num, th.num { text-align: right; color: #666; font-variant-numeric: tabular-nums; width: 1%; white-space: nowrap; }
`
    : `
  .list { column-count: 2; column-gap: 24px; column-rule: 1px solid #ddd; font-size: 10pt; }
  .entry { display: flex; gap: 8px; padding: 2px 0; line-height: 1.3; }
  .num { color: #666; font-variant-numeric: tabular-nums; min-width: 3.5em; text-align: right; flex-shrink: 0; }
  .name { flex: 1; }
`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Killed in Gaza — ${escapeHtml(subtitle)}</title>
<style>
  html, body { background: white; color: black; margin: 0; padding: 0; }
  body { font-family: sans-serif; padding: 12px; }
  header h1 { font-size: 18pt; margin: 0 0 4px 0; }
  header p { font-size: 9pt; margin: 0 0 12px 0; color: #333; }
  @page { margin: 0.5in; }
${layoutCss}</style>
</head>
<body>
<header>
  <h1>Killed in Gaza</h1>
  <p>${escapeHtml(subtitle)} · List current through ${escapeHtml(
    lastUpdate,
  )} · Source: data.techforpalestine.org</p>
</header>
${body}
<script>
  window.addEventListener("load", function () {
    setTimeout(function () { window.print(); }, 50);
  });
</script>
</body>
</html>`;
};
