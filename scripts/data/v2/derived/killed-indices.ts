import { execSync } from "child_process";
import { KilledInGaza } from "../../../../types/killed-in-gaza.types";
import { writeOffManifestJson } from "../../../utils/fs";
import { addFolderToManifest } from "../../../utils/manifest";
import { ApiResource } from "../../../../types/api.types";
<<<<<<< HEAD

const generate = () => {
  const killedPersons: KilledInGaza[] = require("../../../../killed-in-gaza.json");
=======
import {
  calcChecksum,
  createArtifact,
  getChecksum,
} from "../../../utils/artifacts";

const sourceFileForDerived = "killed-in-gaza.min.json";
const pagedResourceLimit = 100;

const generate = () => {
  const killedPersons: KilledInGaza[] = require(`../../../../${sourceFileForDerived}`);
>>>>>>> main

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

  const indices = killedPersons.reduce(
    (acc, record, i) => {
      const lastRecord = i >= killedPersons.length - 1;

      // arabic name indexing
      const arParts = record.name.split(" ").map(partMapper(arPartMap));
      const arIdxName = arParts.join(" ");
      const existingAr = acc.arabic[arIdxName];

      // english name indexing
      const enParts = record.en_name.split(" ").map(partMapper(enPartMap));
      const enIdxName = enParts.join(" ");
      const existingEn = acc.english[enIdxName];

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
      };
    },
    {
      english: {} as Record<string, string>,
      arabic: {} as Record<string, string>,
    }
  );

<<<<<<< HEAD
=======
  writeOffManifestJson(`${writePath}/page-info.json`, {
    pageSize: pagedResourceLimit,
    pageCount,
  });
>>>>>>> main
  writeOffManifestJson(`${writePath}/name-index-ar.json`, {
    index: Array.from(arPartMap.keys()),
    names: indices.arabic,
  });
  writeOffManifestJson(`${writePath}/name-index-en.json`, {
    index: Array.from(enPartMap.keys()),
    names: indices.english,
  });

  addFolderToManifest(ApiResource.KilledInGazaDerivedV2, writePath);
};

<<<<<<< HEAD
// const zipFiles = () => {
//   const [checksum] = execSync("shasum killed-in-gaza.json")
//     .toString()
//     .split(" ");
//   const archiveName = `killed-${checksum}.tar`;
//   console.log(`creating archive: ${archiveName}`);
//   execSync(
//     `tar -czf ${archiveName} --directory=site/src/generated/killed-in-gaza ./`
//   );
// };

const run = async () => {
  generate();
=======
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
>>>>>>> main
};

run();
