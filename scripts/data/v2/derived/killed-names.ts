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

const getPersonGroup = (person: KilledInGaza) => {
  if (person.age >= 0 && person.age <= 18) {
    return person.sex === "f" ? "girl" : "boy";
  }

  return person.sex === "f" ? "woman" : "man";
};

const gatherUniqueFirstNames = (
  killedPersons: KilledInGaza[]
): KilledFirstNameCounts => {
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

  return Object.keys(counts).reduce(
    (acc, groupKey) => ({
      ...acc,
      [groupKey]: (
        Array.from(counts[groupKey].entries()) as NameCountRank
      ).sort((a, b) => b[1] - a[1]),
    }),
    {} as Record<keyof typeof counts, [string, number][]>
  );
};

const writePath = "site/src/generated/killed-in-gaza";

const generate = () => {
  const killedPersons: KilledInGaza[] = require(`../../../../${sourceFileForDerived}`);
  const killedFirstNames = gatherUniqueFirstNames(killedPersons);
  writeOffManifestJson(`${writePath}/name-freq-en.json`, killedFirstNames);
};

generate();
