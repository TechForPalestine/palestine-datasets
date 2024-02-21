import { writeOffManifestJson } from "../../../utils/fs";
import { KilledInGaza } from "../../../../types/killed-in-gaza.types";

const sourceFileForDerived = "killed-in-gaza.min.json";

type NameCountRank = [string, number][];
type KilledFirstNameCounts = {
  man: NameCountRank;
  woman: NameCountRank;
  boy: NameCountRank;
  girl: NameCountRank;
};

const topRankListLimit = 20;

const getPersonGroup = (person: KilledInGaza) => {
  if (person.age >= 0 && person.age <= 18) {
    return person.sex === "f" ? "girl" : "boy";
  }

  return person.sex === "f" ? "woman" : "man";
};

const gatherUniqueFirstNames = (
  killedPersons: KilledInGaza[]
): {
  lists: KilledFirstNameCounts;
  totalUniques: Record<string, number>;
  totalPeople: Record<string, number>;
} => {
  const counts = {
    man: new Map<string, number>(),
    woman: new Map<string, number>(),
    boy: new Map<string, number>(),
    girl: new Map<string, number>(),
  };
  killedPersons.forEach((person) => {
    const firstName = person.en_name.split(" ").shift();
    if (!firstName?.trim() || firstName.includes("?")) {
      return;
    }
    const groupCounts = counts[getPersonGroup(person)];
    const existingCount = groupCounts.get(firstName) ?? 0;
    groupCounts.set(firstName, existingCount + 1);
  });

  const totalUniques = {
    man: counts.man.size,
    woman: counts.woman.size,
    boy: counts.boy.size,
    girl: counts.girl.size,
  };
  const totalPeople = {
    man: 0,
    woman: 0,
    boy: 0,
    girl: 0,
  };

  const countGroupKeys = Object.keys(counts) as Array<keyof typeof counts>;
  const lists = countGroupKeys.reduce(
    (acc, groupKey) => ({
      ...acc,
      [groupKey]: (Array.from(counts[groupKey].entries()) as NameCountRank)
        .map((nameCount) => {
          totalPeople[groupKey] += nameCount[1];
          return nameCount;
        })
        .sort((a, b) => b[1] - a[1])
        .slice(0, topRankListLimit),
    }),
    {} as Record<keyof typeof counts, [string, number][]>
  );

  return { lists, totalUniques, totalPeople };
};

const writePath = "site/src/generated/killed-in-gaza";

const generate = () => {
  const killedPersons: KilledInGaza[] = require(`../../../../${sourceFileForDerived}`);
  const killedFirstNames = gatherUniqueFirstNames(killedPersons);
  writeOffManifestJson(`${writePath}/name-freq-en.json`, killedFirstNames);
};

generate();
