import { writeJson } from "../../utils/fs";
import { ApiResource } from "../../../types/api.types";
import { KilledInGaza } from "../../../types/killed-in-gaza.types";
import { kig3FieldIndex, kig3ColMapping } from "./constants";
import { canonicalUpdateCommits } from "../common/killed-in-gaza/constants";

const jsonFileName = "killed-in-gaza-v3.json";
const apiFileName = "killed-in-gaza.json";

const identifierUpdateIndex = new Map<string, number>();

const remapFields = (
  person: Omit<KilledInGaza, "source"> & { update: number }
) => {
  return Object.keys(person).reduce((acc, key) => {
    const keyIndex = kig3ColMapping[key as keyof typeof kig3ColMapping];
    acc[keyIndex] = person[key as keyof typeof kig3ColMapping] ?? null;
    return acc;
  }, new Array(kig3FieldIndex.length));
};

const fetchFileForCommit = async (commit: string) => {
  const response = await fetch(
    `https://raw.githubusercontent.com/TechForPalestine/palestine-datasets/${commit}/killed-in-gaza.json`
  );
  if (!response.ok) {
    throw new Error(
      `Failed to fetch file for commit ${commit}: ${response.statusText}`
    );
  }

  console.log(`Fetched data for commit ${commit} (${response.status})`);

  const body = await response.text();

  try {
    return JSON.parse(body) as Array<{ id?: string }>;
  } catch (e) {
    console.log("failed to parse JSON response from GitHub raw content API");
    console.log("body:", body);
    throw e;
  }
};

const gatherIds = (data: Array<{ id?: string }>, updateIndex: number) => {
  data.forEach((item) => {
    if (item.id && !identifierUpdateIndex.has(item.id)) {
      identifierUpdateIndex.set(item.id, updateIndex + 1);
    }
  });
};

const generateFromV2JSONWithUpdateReference = async () => {
  await canonicalUpdateCommits.reduce(async (chain, commit, index) => {
    await chain;
    const data = await fetchFileForCommit(commit);
    gatherIds(data, index);
  }, Promise.resolve());

  const latestJson = require("../../../killed-in-gaza.min.json").map(
    (person: KilledInGaza) => {
      const { source, ...rest } = person; // exclude `source` field
      return remapFields({
        ...rest,
        update: identifierUpdateIndex.get(person.id) ?? -1,
      });
    }
  );

  writeJson(
    ApiResource.KilledInGazaV3,
    { from: jsonFileName, to: apiFileName },
    [kig3FieldIndex].concat(latestJson)
  );

  console.log(
    `generated JSON file with ${latestJson.length} records: ${jsonFileName}, associated with ${identifierUpdateIndex.size} unique identifiers`
  );
};

generateFromV2JSONWithUpdateReference();
