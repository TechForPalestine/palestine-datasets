export type SearchPerson = { name: string; count: number; key: string };

/**
 * buildNameList does a simple replace of name parts from the response `index` key
 * into the indexed names in the `names` object so we can search by name for records
 *
 * @param json search index json response
 * @returns list of people with string name, count of matching records and a string key (comma-delimited record IDs)
 */
const buildNameList = (json: {
  index: string[];
  names: Record<string, string>;
}) => {
  return Object.entries(json.names).reduce((acc, [indexedName, ids]) => {
    const name = indexedName
      .split(" ")
      // minus one for use with zero-based array
      .map((index) => json.index[+index - 1])
      .join(" ");
    return acc.concat({
      name,
      count: ids.split(",").length,
      key: ids,
    });
  }, [] as Array<SearchPerson>);
};

export type LangOption = "ar" | "en";

export const fetchIndex = async (lang: LangOption) => {
  const response = await fetch(
    `/api/v2/killed-in-gaza/name-index-${lang}.json`
  );
  if (response.ok) {
    const json = await response.json();
    return buildNameList(json);
  }
};
