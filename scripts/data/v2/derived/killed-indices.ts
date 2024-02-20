import { execSync } from "child_process";
import { KilledInGaza } from "../../../../types/killed-in-gaza.types";
import { writeOffManifestCsv, writeOffManifestJson } from "../../../utils/fs";
import { addFolderToManifest } from "../../../utils/manifest";
import { ApiResource } from "../../../../types/api.types";
import {
  calcChecksum,
  createArtifact,
  getChecksum,
} from "../../../utils/artifacts";

const sourceFileForDerived = "killed-in-gaza.min.json";
const pagedResourceLimit = 100;

const familyEntry = (
  record: KilledInGaza,
  nameParts: string[]
): [string, string] => {
  const [firstName] = nameParts;
  let age: number | string = record.age;
  if (age === -1) {
    age = "?";
  }
  if (age === 0) {
    age = "<1";
  }
  return [record.id, `${firstName} (${age})`];
};

const appendEntry = (
  existingEntries: [string, string, number],
  entry: [string, string]
): [string, string, number] => {
  return [
    `${existingEntries[0]} & ${entry[0]}`,
    `${existingEntries[1]} & ${entry[1]}`,
    existingEntries[2] + 1,
  ];
};

const generate = () => {
  const killedPersons: KilledInGaza[] = require(`../../../../${sourceFileForDerived}`);

  const arPartMap = new Map<string, number>();
  const enPartMap = new Map<string, number>();

  const partMapper = (dict: Map<string, number>) => (part: string) => {
    const existing = dict.get(part);
    if (existing) {
      return existing;
    }
    const idx = dict.size + 1;
    dict.set(part, idx);
    return idx;
  };

  const validRecordIdForFileName = (id: string) => {
    return !!id && id.length < 255 && !id.includes("/") && !id.includes(":");
  };

  const writePath = "site/src/generated/killed-in-gaza";
  execSync(`mkdir -p ${writePath}`);

  const page: KilledInGaza[] = [];
  let pageCount = 1;

  const indicesInit = {
    english: {} as Record<string, string>,
    arabic: {} as Record<string, string>,
    familiesEnglish: {} as Record<string, [string, string, number]>,
    familiesArabic: {} as Record<string, [string, string, number]>,
  };

  const indices = killedPersons.reduce((acc, record, i): typeof indicesInit => {
    const lastRecord = i >= killedPersons.length - 1;

    // arabic name indexing
    const arParts = record.name.split(" ");
    const arIdxName = arParts.join(" ");
    const existingAr = acc.arabic[arIdxName];

    // english name indexing
    const enParts = record.en_name.split(" ");
    const enIdxName = enParts.map(partMapper(enPartMap)).join(" ");
    const existingEn = acc.english[enIdxName];

    // english family lookup
    const enFamilyName = enParts.slice(1).join(" ");
    const existingEnFamily = acc.familiesEnglish[enFamilyName];
    const enFamilyEntry = familyEntry(record, enParts);

    // arabic family lookup
    const arFamilyName = arParts.slice(1).join(" ");
    const existingArFamily = acc.familiesArabic[arFamilyName];
    const arFamilyEntry = familyEntry(record, arParts);

    page.push(record);
    if (page.length >= pagedResourceLimit || lastRecord) {
      writeOffManifestJson(`${writePath}/page-${pageCount}.json`, page);
      if (!lastRecord) {
        pageCount += 1;
        page.length = 0; // empty array for next page
      }
    }

    // individual record resource writing
    if (validRecordIdForFileName(record.id)) {
      writeOffManifestJson(`${writePath}/${record.id}.json`, record);
    } else {
      console.warn(
        `invalid record ID for file name (skipped write): ${record.id}`
      );
    }

    return {
      ...acc,
      english: {
        ...acc.english,
        [enIdxName]: existingEn ? `${existingEn},${record.id}` : record.id,
      },
      arabic: {
        ...acc.arabic,
        [arIdxName]: existingAr ? `${existingAr},${record.id}` : record.id,
      },
      familiesEnglish: {
        ...acc.familiesEnglish,
        [enFamilyName]: existingEnFamily
          ? appendEntry(existingEnFamily, enFamilyEntry)
          : [...enFamilyEntry, 1],
      },
      familiesArabic: {
        ...acc.familiesArabic,
        [arFamilyName]: existingArFamily
          ? appendEntry(existingArFamily, arFamilyEntry)
          : [...arFamilyEntry, 1],
      },
    };
  }, indicesInit);

  writeOffManifestJson(`${writePath}/page-info.json`, {
    pageSize: pagedResourceLimit,
    pageCount,
  });
  writeOffManifestJson(`${writePath}/name-index-ar.json`, {
    index: Array.from(arPartMap.keys()),
    names: indices.arabic,
  });
  writeOffManifestJson(`${writePath}/name-index-en.json`, {
    index: Array.from(enPartMap.keys()),
    names: indices.english,
  });

  const familyCsvHeader = [
    "family name",
    "names and ages",
    "record IDs",
    "members",
  ].join(",");
  const familyCsv = (lookup: Record<string, [string, string, number]>) => {
    return [familyCsvHeader].concat(
      Object.entries(lookup)
        .filter(
          ([familyName]) =>
            !!familyName.trim() && familyName.includes("?") === false
        )
        .sort((a, b) => b[1][2] - a[1][2])
        .map(([familyName, [recordIds, namesAndAges, count]]) =>
          [familyName, namesAndAges, recordIds, count].join(",")
        )
    );
  };
  writeOffManifestCsv(
    `${writePath}/_families-en.csv`,
    familyCsv(indices.familiesEnglish)
  );
  writeOffManifestCsv(
    `${writePath}/_families-ar.csv`,
    familyCsv(indices.familiesArabic)
  );

  addFolderToManifest(ApiResource.KilledInGazaDerivedV2, writePath);
};

const artifactName = "killed-derived.tar";

const args = process.argv.slice();

const run = async () => {
  const checksum = calcChecksum(sourceFileForDerived);
  const artifactMatch = await getChecksum(artifactName, checksum);
  if (artifactMatch && !args.includes("-f")) {
    console.log("skipping zipfile upload, no change to source JSON");
    return;
  }

  console.log(`generating derived data from ${sourceFileForDerived}...`);
  generate();
  if (process.env.CI) {
    createArtifact(artifactName, checksum);
  }
};

run();
