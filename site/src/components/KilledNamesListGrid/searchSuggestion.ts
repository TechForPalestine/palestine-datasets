import { closest } from "fastest-levenshtein";

export const suggestSearch = (names: Set<string>, search: string) => {
  const searchParts = search.split(/\s+/);
  if (!searchParts[0] || !/^[a-zA-Z]/.test(searchParts[0])) {
    return;
  }

  return closest(searchParts[0].toLowerCase(), Array.from(names));
};
