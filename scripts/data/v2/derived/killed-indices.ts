import { execSync } from "child_process";
import { KilledInGaza } from "../../../../types/killed-in-gaza.types";
import { writeOffManifestJson } from "../../../utils/fs";
import { addFolderToManifest } from "../../../utils/manifest";
import { ApiResource } from "../../../../types/api.types";
import {
  calcChecksum,
  createArtifact,
  getChecksum,
} from "../../../utils/artifacts";

const sourceFileForDerived = "killed-in-gaza.min.json";
const pagedResourceLimit = 100;

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
    families: {} as Record<
      string,
      { family_en: string; family_ar: string; members: KilledInGaza[] }
    >,
  };

  const indices = killedPersons.reduce((acc, record, i): typeof indicesInit => {
    const lastRecord = i >= killedPersons.length - 1;

    // arabic name indexing
    const arParts = record.name.split(" ");
    const arIdxName = arParts.map(partMapper(arPartMap)).join(" ");
    const existingAr = acc.arabic[arIdxName];

    // english name indexing
    const enParts = record.en_name.split(" ");
    const enIdxName = enParts.map(partMapper(enPartMap)).join(" ");
    const existingEn = acc.english[enIdxName];

    const enFamilyName = enParts.slice(1).join(" ").trim();
    const arFamilyName = arParts.slice(1).join(" ").trim();
    const familyGroup = acc.families[enFamilyName] ?? {
      family_en: enFamilyName,
      family_ar: arFamilyName,
      members: [] as KilledInGaza[],
    };

    page.push(record);
    if (page.length >= pagedResourceLimit || lastRecord) {
      writeOffManifestJson(`${writePath}/page-${pageCount}.json`, page);
      if (!lastRecord) {
        pageCount += 1;
        page.length = 0; // empty array for next page
      }
    }

    const recordPageId = `${pageCount}.${page.length - 1}`;

    return {
      ...acc,
      english: {
        ...acc.english,
        [enIdxName]: existingEn
          ? `${existingEn},${recordPageId}`
          : recordPageId,
      },
      arabic: {
        ...acc.arabic,
        [arIdxName]: existingAr
          ? `${existingAr},${recordPageId}`
          : recordPageId,
      },
      families: {
        ...acc.families,
        [enFamilyName]: {
          ...familyGroup,
          members: familyGroup.members.concat(record),
        },
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

  writeOffManifestJson(
    `${writePath}/families-list.json`,
    Object.values(indices.families)
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
