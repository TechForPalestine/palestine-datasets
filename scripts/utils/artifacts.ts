import { execSync } from "child_process";

const token = process.env.TFP_SHEET_KEY ?? "";

export const calcChecksum = (repoPath: string) => {
  const checksum = execSync(`shasum ${repoPath}`)
    .toString()
    .trim()
    .split(" ")[0];
  console.log(`calcChecksum produced ${checksum} for ${repoPath}`);
  return checksum.trim();
};

/**
 * @param artifactKey string for artifact in saved bucket
 * @param checksum string for expected artifact in bucket
 * @returns true or false for match for artifact by checksum
 */
export const getChecksum = async (artifactKey: string, checksum: string) => {
  const response = await fetch(
    `https://tfp.fediship.workers.dev/artifact/checksum/?key=${encodeURIComponent(
      artifactKey
    )}&chk=${checksum}`,
    {
      headers: { "x-token": token },
    }
  );

  if (response.status === 404) {
    console.log(
      `getChecksum: no object exists for artifact key: ${artifactKey}`
    );
    return false;
  }

  if (!response.ok || response.status !== 200) {
    throw new Error(
      `Unexpected response for getChecksum call: ${response.status} ok=${response.ok}`
    );
  }

  const { match } = await response.json();
  return !!match;
};

export const createArtifact = (artifactName: string, checksum: string) => {
  execSync(
    `tar -czf ${artifactName} --directory=site/src/generated/killed-in-gaza ./`
  );
  console.log(`${artifactName} created, uploading...`);
  execSync(
    `curl "https://tfp.fediship.workers.dev/artifact/?key=${encodeURIComponent(
      artifactName
    )}&chk=${checksum}" -X PUT -H 'x-token: ${token}' --data-binary "@${artifactName}"`
  );
  console.log(`artifact upload call complete for checksum ${checksum}`);
};

export const downloadArtifact = async (
  artifactName: string,
  checksumFileRepoPath: string,
  extractFolder: string
) => {
  const checksum = calcChecksum(checksumFileRepoPath);
  const artifactMatch = await getChecksum(artifactName, checksum);
  if (artifactMatch) {
    console.log("checksum matches available artifact!");
  } else {
    console.warn(
      "⚠️ checksum does not match available artifact, downloading anyway"
    );
  }

  execSync("mkdir -p ci-tmp/killed-in-gaza");
  execSync(`rm -rf ${extractFolder} && mkdir -p ${extractFolder}`);
  execSync(
    `curl "https://tfp.fediship.workers.dev/artifact/?key=${encodeURIComponent(
      artifactName
    )}&chk=${checksum}" --output ci-tmp/${artifactName}`
  );
  execSync(
    `cd ci-tmp && tar -xvf ${artifactName} && rm ${artifactName} && mv ./* ../${extractFolder}/`
  );
  console.log(`completed downloading artifact ${artifactName}`);
};
