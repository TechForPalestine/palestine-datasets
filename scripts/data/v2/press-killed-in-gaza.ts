/**
 * Builds press_killed_in_gaza.json from the markdown source files in
 * source_data/press-killed/ (one file per journalist, edited via the CMS).
 *
 * Each file is named by its zero-padded sequence number (0001.md, 0002.md, ...)
 * and repeats that number in its `seq` front matter field. The output array is
 * ordered by `seq`, so a new journalist is appended by adding the next number
 * after the current highest. `name` holds the Arabic name exactly as entered;
 * normalisation and the English `name_en` are applied here at build time.
 */
import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { ApiResource } from "../../../types/api.types";
import { writeJson } from "../../utils/fs";
import { parseFrontmatter } from "../common/casualties-daily/content";
import {
  getArToArMap,
  getArToEnMap,
  normalizeArabic,
  replaceBySubstring,
  replaceWholeNameSegments,
} from "../common/killed-in-gaza/translate";

const jsonFileName = "press_killed_in_gaza.json";
const pressKilledContentDir = "source_data/press-killed";

const seqWidth = 4;
const entryFilePattern = /^(\d{4})\.md$/;

type PressRecord = { name: string; name_en: string; notes: string };
type SourceEntry = { file: string; seq: number; name: string; notes: string };

const arToAr = getArToArMap();
const arToEn = getArToEnMap();

const withTranslatedName = (record: PressRecord): PressRecord => {
  const arName = replaceBySubstring(record.name, arToAr);
  const normalizedArName = normalizeArabic(arName);
  record.name = normalizedArName;
  record.name_en = replaceWholeNameSegments(normalizedArName, arToEn);
  return record;
};

const untranslatedParts = new Set<string>();
const validateTranslations = (press: { name_en: string }[]) => {
  press.forEach((journo) => {
    journo.name_en.split(/\s+/).forEach((namePart) => {
      if (/[\u{0600}-\u{06FF}]+/u.test(namePart)) {
        untranslatedParts.add(namePart.trim());
      }
    });
  });
};

// Decap writes the slug field as a string ("0263"); tolerate a bare number too
const parseSeq = (value: unknown): string | undefined => {
  if (typeof value === "number" && Number.isInteger(value)) {
    return String(value).padStart(seqWidth, "0");
  }
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return value.trim().padStart(seqWidth, "0");
  }
  return undefined;
};

const readSourceEntries = (): SourceEntry[] => {
  if (!existsSync(pressKilledContentDir)) {
    throw new Error(`content directory does not exist: ${pressKilledContentDir}`);
  }
  const errors: string[] = [];
  const entries: SourceEntry[] = [];
  for (const file of readdirSync(pressKilledContentDir).sort()) {
    if (!file.endsWith(".md")) {
      continue;
    }
    const fileMatch = entryFilePattern.exec(file);
    if (!fileMatch) {
      errors.push(`${file}: filename must be a ${seqWidth}-digit sequence number, e.g. 0263.md`);
      continue;
    }
    const { data } = parseFrontmatter(readFileSync(join(pressKilledContentDir, file), "utf8"));
    const seq = parseSeq(data.seq);
    if (seq !== fileMatch[1]) {
      errors.push(`${file}: front matter seq (${String(data.seq)}) must match the filename`);
      continue;
    }
    if (typeof data.name !== "string" || !data.name.trim()) {
      errors.push(`${file}: missing name`);
      continue;
    }
    const notes = data.notes;
    if (notes !== undefined && notes !== null && typeof notes !== "string") {
      errors.push(`${file}: notes must be text`);
      continue;
    }
    entries.push({ file, seq: Number(seq), name: data.name, notes: notes ?? "" });
  }
  if (errors.length > 0) {
    console.error(`\n✗ ${pressKilledContentDir}: ${errors.length} invalid file(s):`);
    errors.forEach((error) => console.error(`  ${error}`));
    process.exit(1);
  }
  // filenames are unique and match seq, so this ordering is total
  entries.sort((a, b) => a.seq - b.seq);
  return entries;
};

const generateJsonFromContent = () => {
  const entries = readSourceEntries();
  const jsonArray = entries.map((entry) =>
    withTranslatedName({ name: entry.name, name_en: "", notes: entry.notes }),
  );

  validateTranslations(jsonArray);
  writeJson(ApiResource.PressKilledInGazaV2, jsonFileName, jsonArray);
  console.log(`generated JSON file: ${jsonFileName} from ${entries.length} source files`);
  if (untranslatedParts.size) {
    console.log("untranslated parts:", [...untranslatedParts].join(", "));
  }
};

generateJsonFromContent();
