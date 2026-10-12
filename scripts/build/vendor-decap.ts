/**
 * Downloads the pinned Decap CMS bundle into the static admin folder so the CMS
 * is served from our own deploy instead of a third-party CDN (unpkg). The
 * bundle comes from the release of our fork named in decap-cms.json, and its
 * sha256 must match the pin, so a build only ever ships the reviewed file. The
 * copied file is generated (gitignored) and produced at build time by
 * scripts/build/pre-build.sh.
 *
 * Bump the pin with `bun run update-decap` (see docs/decap-cms-setup.md).
 *
 * Usage: bun run vendor-decap
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import pin from "./decap-cms.json";
import { download, releaseAssetUrl, runScript, sha256 } from "./decap-release";

const dest = "site/static/admin/decap-cms.js";

runScript(async () => {
  if (existsSync(dest) && sha256(new Uint8Array(readFileSync(dest))) === pin.sha256) {
    console.log(`Decap CMS bundle ${pin.tag} is already vendored at ${dest}`);
  } else {
    const url = releaseAssetUrl(pin);
    const bundle = await download(url);
    const checksum = sha256(bundle);
    if (checksum !== pin.sha256) {
      throw new Error(
        `Decap CMS bundle from ${url} has sha256 ${checksum}, expected ${pin.sha256} (decap-cms.json)`,
      );
    }

    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, bundle);
    console.log(`vendored Decap CMS bundle: ${url} -> ${dest}`);
  }
});
