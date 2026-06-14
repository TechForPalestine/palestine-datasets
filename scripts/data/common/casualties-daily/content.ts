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

/**
 * Fills derivable cumulative fields so contributors don't have to enter them.
 * For each [daily, cum] pair, when the cumulative is absent we compute it from
 * the previous day's cumulative plus the entered daily value. When a value is
 * present (all of backfilled history, or a manual correction) it is respected
 * as-is, which keeps regenerated history byte-identical.
 */
export const deriveCumulatives = (
  records: DailyRecord[],
  pairs: [string, string][],
): DailyRecord[] => {
  const prevCum: Record<string, number> = {};
  for (const record of records) {
    for (const [dailyKey, cumKey] of pairs) {
      const cumValue = getPath(record, cumKey);
      const dailyValue = getPath(record, dailyKey);
      if ((cumValue === undefined || cumValue === null) && typeof dailyValue === "number") {
        setPath(record, cumKey, (prevCum[cumKey] ?? 0) + dailyValue);
      }
      const resolved = getPath(record, cumKey);
      if (typeof resolved === "number") {
        prevCum[cumKey] = resolved;
      }
    }
  }
  return records;
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
