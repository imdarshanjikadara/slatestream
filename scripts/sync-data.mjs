// Copies the study's generated site data into public/data.
// The data is produced in the study repository by scripts/build_web.py from its results/ folder;
// nothing here edits a number. Usage: npm run sync-data -- <path to slateq-recsim-study checkout>
import { cpSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const study = process.argv[2] ?? "../slateq-recsim-study";
const src = join(study, "web", "data");
if (!existsSync(src)) { console.error(`Not found: ${src}`); process.exit(1); }
const files = readdirSync(src).filter((f) => f.endsWith(".json"));
for (const f of files) cpSync(join(src, f), join("public", "data", f));
console.log(`Copied ${files.length} files from ${src} to public/data`);
