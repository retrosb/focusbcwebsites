/**
 * Rebuild public/ when focusbc or caap sources change.
 */
import chokidar from "chokidar";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function build() {
  const child = spawn(process.execPath, ["scripts/build-pages.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  child.on("error", (err) => console.error(err));
}

let t;
function schedule() {
  clearTimeout(t);
  t = setTimeout(build, 200);
}

const globs = [
  path.join(ROOT, "focusbc", "sources", "**", "*"),
  path.join(ROOT, "focusbc", "build.mjs"),
  path.join(ROOT, "focusbc", "media", "**", "*"),
  path.join(ROOT, "focusbc", "data", "**", "*.json"),
  path.join(ROOT, "focusbc", "case-studies-built", "**", "*.html"),
  path.join(ROOT, "focusbc", "blog-built", "**", "*.html"),
  path.join(ROOT, "caap", "**", "*.html"),
  path.join(ROOT, "caap", "**", "*.css"),
  path.join(ROOT, "caap", "media", "**", "*"),
];

chokidar
  .watch(globs, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 200 },
  })
  .on("all", schedule);

console.log("Watching focusbc/ and caap/ — rebuilding public/ on change.");
build();
