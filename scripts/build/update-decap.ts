/**
 * Points decap-cms.json at a release of our Decap CMS fork: downloads that
 * release's bundle, checks it against the release's published checksum, and
 * records the tag and sha256 that vendor-decap verifies at build time.
 *
 * Usage:
 *   bun run update-decap            # latest release
 *   bun run update-decap <tag>      # a specific release, e.g. fork-v3.16.3-3c7ff8c
 *
 * Set GITHUB_TOKEN to avoid GitHub API rate limits (CI does this).
 */
import pin from "./decap-cms.json";
import { assetName, download, releaseAssetUrl, runScript, sha256, writePin } from "./decap-release";

type Release = {
  tag_name: string;
  html_url: string;
  assets: { name: string; browser_download_url: string }[];
};

runScript(async () => {
  const tag = process.argv[2];
  const repo = pin.repo;
  const releasePath = tag ? `tags/${encodeURIComponent(tag)}` : "latest";

  const headers: Record<string, string> = { accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) {
    headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(`https://api.github.com/repos/${repo}/releases/${releasePath}`, {
    headers,
  });
  if (!response.ok) {
    throw new Error(`No ${tag ?? "latest"} release found for ${repo}: ${response.status}`);
  }
  const release: Release = await response.json();

  const asset = release.assets.find((a) => a.name === assetName);
  if (!asset) {
    throw new Error(`Release ${release.tag_name} has no ${assetName} asset (${release.html_url})`);
  }

  const bundle = await download(releaseAssetUrl({ repo, tag: release.tag_name }));
  const checksum = sha256(bundle);

  // the release workflow publishes `sha256sum` output next to the bundle
  const checksumAsset = release.assets.find((a) => a.name === `${assetName}.sha256`);
  if (checksumAsset) {
    const published = new TextDecoder()
      .decode(await download(checksumAsset.browser_download_url))
      .split(/\s+/)[0];
    if (published !== checksum) {
      throw new Error(
        `${assetName} in ${release.tag_name} has sha256 ${checksum}, but the release lists ${published}`,
      );
    }
  }

  if (release.tag_name === pin.tag && checksum === pin.sha256) {
    console.log(`decap-cms.json already pins ${repo}@${release.tag_name}`);
  } else {
    writePin({ repo, tag: release.tag_name, sha256: checksum });
    console.log(`decap-cms.json: ${pin.tag} -> ${release.tag_name}`);
  }
});
