import { closest, distance } from "fastest-levenshtein";

const maxSuggestions = 15;
const levenshteinThreshold = 3;

export const suggestSearch = (names: Set<string>, search: string) => {
  const searchParts = search.split(/\s+/);
  if (!searchParts[0]) {
    return;
  }

  const lowercasedSearch = searchParts[0].toLowerCase();
  const uniqueNames = Array.from(names);
  const main = closest(lowercasedSearch, uniqueNames);
  const others: [string, number][] = [];
  uniqueNames.forEach((name) => {
    if (name === main) {
      return;
    }

    const matchDistance = distance(name, lowercasedSearch);
    if (matchDistance < levenshteinThreshold) {
      others.push([name, matchDistance]);
    }
  });

  return {
    main,
    others: others
      .sort((a, b) => a[1] - b[1])
      .slice(0, maxSuggestions)
      .map((tuple) => tuple[0]),
  };
};
