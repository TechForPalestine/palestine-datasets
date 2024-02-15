import shuffle from "lodash/shuffle";
import type { PersonIconType } from "./PersonIcon";
import type {
  KilledInGaza,
  MarqueePerson,
} from "../../../../types/killed-in-gaza.types";

export type MarqueeRow = {
  people: Array<
    Omit<MarqueePerson, "sex" | "age"> & {
      age: string;
      icon: PersonIconType;
      rtl: boolean;
    }
  >;
};
export type SplitNameRows = { even: MarqueeRow[]; odd: MarqueeRow[] };

const rows = 10;
const getNameRows = (
  englishNames: MarqueePerson[],
  arabicNames: MarqueePerson[]
): SplitNameRows => {
  if (englishNames.length !== arabicNames.length) {
    throw new Error("getNameRows expects two lists of equal length");
  }
  const peoplePerRow = Math.floor(englishNames.length / rows);
  return Array.from(new Array(rows)).reduce(
    (acc: SplitNameRows, _, i): SplitNameRows => {
      const side = i % 2 ? "even" : "odd";
      const offset = i * peoplePerRow;
      const page = side === "even" ? arabicNames : englishNames;
      const rtl = side === "even" ? true : false;
      const rowPeople = page.slice(offset, peoplePerRow + offset);

      return {
        ...acc,
        [side]: acc[side].concat({
          people: rowPeople.map((person) => ({
            id: person.id,
            icon: iconType(person),
            name: person.name,
            age: formatAge(person),
            rtl,
          })),
        }),
      };
    },
    { even: [], odd: [] } as SplitNameRows
  );
};

const iconType = (person: MarqueePerson): PersonIconType => {
  if (person.age >= 65) {
    return person.sex === "f" ? "elderly-woman" : "elderly-man";
  }

  if (person.age <= 18) {
    return person.sex === "f" ? "girl" : "boy";
  }

  return person.sex === "f" ? "woman" : "man";
};

const formatAge = (person: MarqueePerson) => {
  if (person.age === -1) {
    return null;
  }

  if (person.age === 0) {
    return ", <1";
  }

  return `, ${person.age}`;
};

export const getMarqueeRowsFromPage = (personPage: KilledInGaza[]) => {
  const filteredPeople = shuffle(
    personPage.filter((person) => person.en_name.includes("?") === false)
  );
  const englishNames = filteredPeople.map(({ id, en_name, age, sex }) => ({
    id,
    name: en_name,
    age,
    sex,
  }));
  const arabicNames = filteredPeople.map(({ id, name, age, sex }) => ({
    id,
    name,
    age,
    sex,
  }));

  return getNameRows(englishNames, arabicNames);
};
