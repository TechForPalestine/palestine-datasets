import { canonicalUpdateCommits } from "../../../scripts/data/common/killed-in-gaza/constants";

export const KilledNamesUpdateSourceLink = ({ update }: { update: number }) => {
  const commit = canonicalUpdateCommits[update - 1];
  if (!commit) {
    return;
  }

  const csvLink = `https://github.com/TechForPalestine/palestine-datasets/blob/${commit}/scripts/data/common/killed-in-gaza/data/raw.csv`;
  const jsonLink = `https://github.com/TechForPalestine/palestine-datasets/blob/${commit}/killed-in-gaza.json`;

  return (
    <span>
      (
      <a href={csvLink} target="_blank" style={{ display: "inline-block" }}>
        CSV
      </a>{" "}
      /{" "}
      <a href={jsonLink} target="_blank" style={{ display: "inline-block" }}>
        JSON
      </a>
      )
    </span>
  );
};
