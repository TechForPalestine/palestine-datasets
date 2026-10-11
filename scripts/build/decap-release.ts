/**
 * The Decap CMS bundle is built from our fork (sterlingwes/decap-cms) and
 * attached to its GitHub releases rather than published to npm. The release
 * we serve is pinned, with the bundle's sha256, in decap-cms.json.
 */
import { createHash } from "crypto";
import { writeFileSync } from "fs";

export type DecapPin = {
  repo: string;
  tag: string;
  sha256: string;
};

export const pinPath = "scripts/build/decap-cms.json";
export const assetName = "decap-cms.js";

export const releaseAssetUrl = (pin: Pick<DecapPin, "repo" | "tag">) =>
  `https://github.com/${pin.repo}/releases/download/${pin.tag}/${assetName}`;

export const sha256 = (data: Uint8Array) => createHash("sha256").update(data).digest("hex");

export const writePin = (pin: DecapPin) => {
  writeFileSync(pinPath, JSON.stringify(pin, null, 2) + "\n");
};

export const runScript = (main: () => Promise<void>) => {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
};

export const download = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  return new Uint8Array(await response.arrayBuffer());
};
