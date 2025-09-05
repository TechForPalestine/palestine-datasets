import { writeJson } from "../../utils/fs";
import { ApiResource } from "../../../types/api.types";
import { KilledInGaza } from "../../../types/killed-in-gaza.types";
import { kig3FieldIndex, kig3ColMapping } from "./constants";

const jsonFileName = "killed-in-gaza-v3.json";
const apiFileName = "killed-in-gaza.json";

const identifierUpdateIndex = new Map<string, number>();

const canonicalUpdateCommits = [
  "389c0b4db80d8765039579f06f40b434efb129c8", // 1: Feb 2024
  "408b08baea1446d75d41e4d1e9fd2f7493d5b4a7", // 2: April 2024
  "57ca16478b6ea15502a2366bb70584f9f0db85c3", // 3: May 2024
  "9f7e93dbff3aa5101c37be40b69045d5ce77d410", // 4: June/July 2024
  "8ef255407d7cb9d77a8d5e70094c29c6ccebbace", // 5: August/September 2024
  "9f628a0b779fba1b4b87ce5f50925accdad24494", // 6: March-May 2025 (IBC)
  "b936c35ff3556d31df0833815456b9820b4882c8", // 7: June/July 2025 (IBC)
  "4e95d05d79fffe232d7e551a89e3913199addf46", // 8: July 2025 (IBC)
  "68a207a49227514b0822f8816add4415718ec172", // 9: August 2025 (IBC)
];

const remapFields = (
  person: Omit<KilledInGaza, "source"> & { update: number }
) => {
  return Object.keys(person).reduce((acc, key) => {
    const keyIndex = kig3ColMapping[key as keyof typeof kig3ColMapping];
    acc[keyIndex] = person[key as keyof typeof kig3ColMapping] || null;
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
