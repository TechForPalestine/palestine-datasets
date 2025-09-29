import { closest, distance } from "fastest-levenshtein";

const maxSuggestions = 15;
const levenshteinThreshold = 2;

export const minimumSearchTermLength = 3;

export const suggestSearch = (
  names: Set<string>,
  search: string,
  accepted: Set<string>
) => {
  const searchParts = search
    .split(/\s+/)
    .filter((part) => !accepted.has(part))
    .reverse();
  const lastPart = searchParts.find(
    (part) => part.length >= minimumSearchTermLength
  );

  if (!lastPart) {
    return;
  }

  const lowercasedSearch = lastPart.toLowerCase();
  const uniqueNames = Array.from(names);
  const main = closest(lowercasedSearch, uniqueNames);
  const others: [string, number][] = [];
  uniqueNames.forEach((name) => {
    if (name === main || name === lastPart) {
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

export const replaceSearchPart = (
  currentSearch: string,
  acceptedPart: string
) => {
  if (!currentSearch.trim()) {
    return acceptedPart;
  }

  const currentParts = currentSearch.split(/\s+/);
  const lastPart = currentParts[currentParts.length - 1];
  if (distance(lastPart, acceptedPart) <= levenshteinThreshold) {
    return [...currentParts.slice(0, -1), acceptedPart].join(" ");
  }

  return currentSearch + ` ${acceptedPart}`;
};
