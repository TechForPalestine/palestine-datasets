export type SearchPerson = { name: string; count: number; key: string };

const buildNameList = (json: {
  index: string[];
  names: Record<string, string>;
}) => {
  return Object.entries(json.names).reduce((acc, [indexedName, ids]) => {
    const name = indexedName
      .split(" ")
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
