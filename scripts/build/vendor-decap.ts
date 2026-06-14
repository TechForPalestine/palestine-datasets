/**
 * Copies the pinned Decap CMS bundle out of node_modules into the static admin
 * folder so the CMS is served from our own deploy instead of a third-party CDN
 * (unpkg). The version is owned via the `decap-cms` devDependency pin in
 * site/package.json. The copied file is generated (gitignored) and produced at
 * build time by scripts/build/pre-build.sh.
 *
 * Usage: bun run vendor-decap
 */
import { copyFileSync, mkdirSync } from "fs";
import { dirname } from "path";

const source = require.resolve("decap-cms/dist/decap-cms.js");
const dest = "site/static/admin/decap-cms.js";

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(source, dest);
console.log(`vendored Decap CMS bundle: ${source} -> ${dest}`);
