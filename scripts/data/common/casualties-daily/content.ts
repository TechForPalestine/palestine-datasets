/**
 * Reads/writes the markdown-with-frontmatter "content" files that back the
 * Gaza and West Bank daily casualties datasets. Each report date is a single
 * markdown file: numeric figures live in YAML front matter and the markdown
 * body holds original source material for historical reference.
 *
 * Bun ships a YAML parser (Bun.YAML), so no extra dependency is required. We
 * write the front matter ourselves to keep full control over key ordering,
 * which lets the generated JSON stay byte-identical to the previous pipeline.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export type DailyRecord = Record<string, any>;

// only files named like a report date (YYYY-MM-DD.md) are treated as data
const dailyFilePattern = /^\d{4}-\d{2}-\d{2}\.md$/;
const frontmatterDelim = "---";

const yamlParse = (yaml: string): DailyRecord =>
  yaml.trim() ? ((globalThis as any).Bun.YAML.parse(yaml) as DailyRecord) : {};

export const parseFrontmatter = (raw: string): { data: DailyRecord; body: string } => {
  const lines = raw.split(/\r?\n/);
  if (lines[0]?.trim() !== frontmatterDelim) {
    return { data: {}, body: raw };
  }
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === frontmatterDelim) {
      end = i;
      break;
    }
  }
  if (end === -1) {
    return { data: {}, body: raw };
  }
  const data = yamlParse(lines.slice(1, end).join("\n"));
  const body = lines
    .slice(end + 1)
    .join("\n")
    .replace(/^\n+/, "");
  return { data, body };
};

const serializeValue = (value: number | string | boolean): string => {
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  // quote strings (incl. report_date) so they never parse as numbers/dates
  return JSON.stringify(value);
};

export const serializeFrontmatter = (data: DailyRecord): string => {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) {
      continue;
    }
    if (typeof value === "object") {
      const childLines = Object.entries(value)
        .filter(([, childValue]) => childValue !== undefined && childValue !== null)
        .map(([childKey, childValue]) => `  ${childKey}: ${serializeValue(childValue as any)}`);
      if (childLines.length === 0) {
        continue;
      }
      lines.push(`${key}:`);
      lines.push(...childLines);
    } else {
      lines.push(`${key}: ${serializeValue(value)}`);
    }
  }
  return lines.join("\n");
};

export const serializeReport = (data: DailyRecord, body: string): string =>
  `---\n${serializeFrontmatter(data)}\n${frontmatterDelim}\n\n${body.trim()}\n`;

/**
 * Drops empty values so an editor leaving optional fields blank (which Decap
 * may serialize as "", null, or an empty object) never changes the JSON shape.
 * Backfilled history has no empty values, so this is a no-op there.
 */
const sanitizeRecord = (record: DailyRecord): DailyRecord => {
  const cleaned: DailyRecord = {};
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    if (typeof value === "object" && !Array.isArray(value)) {
      const child = sanitizeRecord(value);
      if (Object.keys(child).length > 0) {
        cleaned[key] = child;
      }
      continue;
    }
    cleaned[key] = value;
  }
  return cleaned;
};

export const readDailyReports = (dir: string): DailyRecord[] => {
  if (!existsSync(dir)) {
    throw new Error(`content directory does not exist: ${dir}`);
  }
  const records = readdirSync(dir)
    .filter((file) => dailyFilePattern.test(file))
    .map((file) => sanitizeRecord(parseFrontmatter(readFileSync(join(dir, file), "utf8")).data));
  // dataset JSON is ordered oldest-first
  records.sort((a, b) => String(a.report_date).localeCompare(String(b.report_date)));
  return records;
};

// front matter keys that are editorial metadata, not part of the published dataset
export const metadataFields = ["editorial_notes"];

export const stripMetadata = (records: DailyRecord[]): DailyRecord[] =>
  records.map((record) => {
    const copy = { ...record };
    for (const field of metadataFields) {
      delete copy[field];
    }
    return copy;
  });

const getPath = (obj: DailyRecord, path: string) => {
  if (!path.includes(".")) {
    return obj[path];
  }
  const [parent, child] = path.split(".");
  return obj[parent]?.[child];
};

const setPath = (obj: DailyRecord, path: string, value: number) => {
  if (!path.includes(".")) {
    obj[path] = value;
    return;
  }
  const [parent, child] = path.split(".");
  obj[parent] = { ...(obj[parent] ?? {}), [child]: value };
};

const isNumber = (value: unknown): value is number => typeof value === "number";
const isBlank = (value: unknown) => value === undefined || value === null;

export type CarryForwardRule = { ext: string; reported: string };
export type DeltaRule = { daily: string; cum: string };

/**
 * Computes the extended (ext_) continuous series that downstream consumers rely
 * on, from the manually entered as-reported figures. Contributors enter the
 * reported numbers; the ext_ series is derived here so it never has to be typed:
 *
 *  - carry-forward: each ext_*_cum follows its reported *_cum, carried forward
 *    across days with no fresh report.
 *  - delta: each ext_ daily (ext_killed, ext_injured) is the day-over-day
 *    difference of its ext_*_cum.
 *
 * A value that is already present (all of backfilled history, which embeds prior
 * editorial gap-filling decisions, or a manual override) is always respected
 * as-is. Only blanks are filled, so regenerating history stays byte-identical
 * while new entries get their ext_ series for free.
 */
export const deriveExtendedSeries = (
  records: DailyRecord[],
  carryForward: CarryForwardRule[],
  deltas: DeltaRule[],
): DailyRecord[] => {
  const prevExtCum: Record<string, number> = {};
  const prevDeltaCum: Record<string, number> = {};
  for (const record of records) {
    for (const { ext, reported } of carryForward) {
      if (isBlank(getPath(record, ext))) {
        const reportedValue = getPath(record, reported);
        const filled = isBlank(reportedValue) ? prevExtCum[ext] : reportedValue;
        if (!isBlank(filled)) {
          setPath(record, ext, filled);
        }
      }
      const resolved = getPath(record, ext);
      if (isNumber(resolved)) {
        prevExtCum[ext] = resolved;
      }
    }
    for (const { daily, cum } of deltas) {
      const cumValue = getPath(record, cum);
      if (isBlank(getPath(record, daily)) && isNumber(cumValue)) {
        setPath(record, daily, cumValue - (prevDeltaCum[cum] ?? 0));
      }
      if (isNumber(cumValue)) {
        prevDeltaCum[cum] = cumValue;
      }
    }
  }
  return records;
};

export type ReportingDiscrepancy = {
  report_date: string;
  field: string;
  reported: number;
  expectedFromCum: number;
  hasNote: boolean;
};

/**
 * Flags days where a reported daily figure disagrees with the day-over-day
 * change in its reported cumulative — the editorial cases where, per project
 * policy, the cumulative is trusted and the daily is reconciled to match. These
 * are surfaced (not blocked) so a reviewer can confirm the decision; recording
 * an `editorial_notes` value marks the discrepancy as acknowledged.
 */
export const findReportingDiscrepancies = (
  records: DailyRecord[],
  pairs: DeltaRule[],
): ReportingDiscrepancy[] => {
  const discrepancies: ReportingDiscrepancy[] = [];
  const prevCum: Record<string, number> = {};
  for (const record of records) {
    for (const { daily, cum } of pairs) {
      const dailyValue = getPath(record, daily);
      const cumValue = getPath(record, cum);
      if (isNumber(dailyValue) && isNumber(cumValue) && prevCum[cum] !== undefined) {
        const expectedFromCum = cumValue - prevCum[cum];
        if (expectedFromCum !== dailyValue) {
          discrepancies.push({
            report_date: String(record.report_date),
            field: daily,
            reported: dailyValue,
            expectedFromCum,
            hasNote: !isBlank(record.editorial_notes),
          });
        }
      }
      if (isNumber(cumValue)) {
        prevCum[cum] = cumValue;
      }
    }
  }
  return discrepancies;
};

export const writeReportFile = (
  dir: string,
  data: DailyRecord,
  body: string,
  overwrite = false,
) => {
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${data.report_date}.md`);
  if (!overwrite && existsSync(file)) {
    return false;
  }
  writeFileSync(file, serializeReport(data, body));
  return true;
};
