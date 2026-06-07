import { PersonType } from "./types";

export const ALL_PERSON_TYPES: PersonType[] = [
  "elderly-man",
  "elderly-woman",
  "man",
  "woman",
  "boy",
  "girl",
];

export type AgeRange = [number, number] | null;

export interface UrlFilterParams {
  excluded: PersonType[];
  search: string;
  ageRange: AgeRange;
}

const isPersonType = (val: string): val is PersonType =>
  (ALL_PERSON_TYPES as readonly string[]).includes(val);

const parseAgeRange = (value: string | null): AgeRange => {
  if (!value) return null;
  const match = value.match(/^(\d+)-(\d+)$/);
  if (!match) return null;
  const min = parseInt(match[1], 10);
  const max = parseInt(match[2], 10);
  if (min > max) return null;
  return [min, max];
};

export const parseUrlFilterParams = (search: string): UrlFilterParams => {
  const params = new URLSearchParams(search);
  const ageRange = parseAgeRange(params.get("ages"));
  const excludedRaw = ageRange ? "" : params.get("excluded") ?? "";
  const excluded = Array.from(
    new Set(
      excludedRaw
        .split("|")
        .filter((v) => v.length > 0)
        .filter(isPersonType)
    )
  );
  return {
    excluded,
    search: params.get("search") ?? "",
    ageRange,
  };
};

export const buildFilterQueryString = ({
  filters,
  search,
  ageRange,
}: {
  filters: PersonType[];
  search: string;
  ageRange: AgeRange;
}): string => {
  const params = new URLSearchParams();
  if (ageRange) {
    params.set("ages", `${ageRange[0]}-${ageRange[1]}`);
  } else {
    const excluded = ALL_PERSON_TYPES.filter((t) => !filters.includes(t));
    if (excluded.length > 0) {
      params.set("excluded", excluded.join("|"));
    }
  }
  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    params.set("search", trimmedSearch);
  }
  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};
