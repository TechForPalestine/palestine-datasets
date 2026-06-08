import { ArabicClass } from "arabic-utils";
import { readCsv, readCsvToDict, writeCsv } from "../../../utils/csv";
import { arToArAssertKey } from "./constants";

const pwd = "scripts/data/common/killed-in-gaza";
const arRawNameColumnLabel = "name_ar_raw";
const arEnNameColumnLabel = "name_en";

export const normalizeArabic = (arabic: string) => new ArabicClass(arabic).normalize();

export const getArToArMap = () =>
  readCsvToDict(`${pwd}/data/dict_ar_ar.csv`, {
    assertKey: arToArAssertKey,
  });
export const getArToEnMap = () => readCsvToDict(`${pwd}/data/dict_ar_en.csv`);

const properCase = (segment: string | undefined, firstSegment = false) => {
  if (!segment || segment.length < 2) {
    return segment;
  }

  const [article, noun] = segment.split("-");
  if (article === "al" && noun?.length >= 2) {
    return `${
      firstSegment ? `${article[0].toUpperCase()}${article.slice(1)}` : article
    }-${noun[0].toUpperCase()}${noun.slice(1)}`;
  }

  return `${segment[0].toUpperCase()}${segment.slice(1)}`;
};

/**
 * splits the full name into segments and replaces each segment with
 * matching values from dict, otherwise keeps the unmatched segment
 * @param name full name
 * @param dict lookup used to swap each name segment
 * @returns full name string with replaced segments
 */
export const replaceWholeNameSegments = (name: string, dict: Record<string, string>) => {
  const segments = name.trim().split(/\s+/);

  const unmappedSequence: string[] = [];
  const mapped = segments
    .map((segment, i) => {
      if (!dict[segment]) {
        unmappedSequence.push(segment);
        return segment;
      }
      unmappedSequence.length = 0;
      return properCase(dict[segment], i === 0);
    })
    .join(" ");

  if (unmappedSequence.length && dict[unmappedSequence.join(" ")]) {
    return mapped.replace(
      unmappedSequence.join(" "),
      properCase(dict[unmappedSequence.join(" ")], false) ?? "",
    );
  }

  return mapped;
};

/**
 * Fixes standalone "allah" segments in English name translations.
 * In Arabic, "الله" (allah) can be a separate name segment, but in English
 * transliteration it should be joined with the preceding word.
 * e.g. "Nasr Allah" → "Nasrallah", "Ata Allah" → "Atallah"
 */
const standaloneAllahRegex = /\ballah\b/i;

export const hasStandaloneAllah = (name: string): boolean => standaloneAllahRegex.test(name);

export const fixStandaloneAllah = (name: string): string => {
  const segments = name.split(/\s+/);
  const fixed: string[] = [];
  for (const segment of segments) {
    if (segment.toLowerCase() === "allah" && fixed.length > 0) {
      // Collapse double 'a' when preceding segment ends with 'a'
      // e.g. "Ata Allah" → "Atallah" (not "Ataallah")
      const prev = fixed[fixed.length - 1];
      fixed[fixed.length - 1] = prev.endsWith("a")
        ? prev.slice(0, -1) + segment.toLowerCase()
        : prev + segment.toLowerCase();
    } else {
      fixed.push(segment);
    }
  }
  return fixed.join(" ");
};

export const replaceBySubstring = (name: string, dict: Record<string, string>) => {
  return Object.keys(dict).reduce((prior, key) => {
    return prior.replaceAll(key, dict[key]);
  }, name);
};
