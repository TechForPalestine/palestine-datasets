import { ArabicClass } from "arabic-utils";
import { readCsv, readCsvToDict, writeCsv } from "../../../utils/csv";
import { arToArAssertKey } from "./constants";

const pwd = "scripts/data/common/killed-in-gaza";
const arRawNameColumnLabel = "name_ar_raw";
const arEnNameColumnLabel = "name_en";

export const normalizeArabic = (arabic: string) =>
  new ArabicClass(arabic).normalize();

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
export const replaceWholeNameSegments = (
  name: string,
  dict: Record<string, string>
) => {
  return name
    .split(/\s+/)
    .map((segment, i) => properCase(dict[segment] ?? segment, i === 0))
    .join(" ");
};

export const replaceBySubstring = (
  name: string,
  dict: Record<string, string>
) => {
  return Object.keys(dict).reduce((prior, key) => {
    return prior.replaceAll(key, dict[key]);
  }, name);
};
