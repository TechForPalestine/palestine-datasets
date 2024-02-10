import fs from "fs";

export const sortCsv = (repoFilePath: string) => {
  const csv = fs.readFileSync(repoFilePath).toString();
  const sortedRows = csv.split("\n").sort((a, b) => {
    return a.localeCompare(b);
  });

  fs.writeFileSync(repoFilePath, sortedRows.join("\n"));
};
