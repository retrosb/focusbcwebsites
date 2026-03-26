/**
 * Convert PNG/JPEG to WebP and delete the source file after a successful write.
 *
 * Scopes:
 * - focusbc/media/{blog,case-studies,wix}
 * - caap/media (logos, wix, etc.)
 *
 * Run: npm run convert:blog-case-webp
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const RASTER = /\.(png|jpe?g)$/i;
const MAX_WIDTH = 2400;

/** e.g. .../focusbc/media/blog/x/1.png → blog/x/1.png */
function mediaRelativeKey(absPath) {
  const s = absPath.replace(/\\/g, "/");
  const m = s.match(/\/(?:focusbc|caap)\/media\/(.+)$/);
  return m ? m[1] : null;
}

function walkRasterFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkRasterFiles(p, out);
    else if (RASTER.test(ent.name)) out.push(p);
  }
  return out;
}

async function convertOne(absPath) {
  const relKey = mediaRelativeKey(absPath);
  if (!relKey) throw new Error(`Not under */media/: ${absPath}`);
  const ext = path.extname(absPath);
  const base = absPath.slice(0, -ext.length);
  const outPath = `${base}.webp`;
  const meta = await sharp(absPath).metadata();
  const pipeline =
    meta.width && meta.width > MAX_WIDTH
      ? sharp(absPath).resize(MAX_WIDTH, null, { withoutEnlargement: true, fit: "inside" })
      : sharp(absPath);
  await pipeline.webp({ quality: 82, effort: 6, smartSubsample: true }).toFile(outPath);
  fs.unlinkSync(absPath);
  const toKey = relKey.replace(/\.(png|jpe?g)$/i, ".webp");
  return { fromM: `media/${relKey}`, toM: `media/${toKey}` };
}

async function main() {
  const dirs = [
    ...["blog", "case-studies", "wix"].map((s) => path.join(ROOT, "focusbc", "media", s)),
    path.join(ROOT, "caap", "media"),
  ];
  const files = [];
  for (const d of dirs) {
    files.push(...walkRasterFiles(d));
  }
  if (!files.length) {
    console.log("No PNG/JPEG left under focusbc/media/{blog,case-studies,wix} or caap/media.");
    return;
  }

  console.log(`Converting ${files.length} files to WebP (originals removed after each write)…`);
  const replacements = [];
  for (const f of files) {
    try {
      replacements.push(await convertOne(f));
    } catch (e) {
      console.error(`Failed: ${f}`, e.message);
      process.exitCode = 1;
    }
  }

  const uniq = [];
  const seen = new Set();
  for (const r of replacements.sort((a, b) => b.fromM.length - a.fromM.length)) {
    if (seen.has(r.fromM)) continue;
    seen.add(r.fromM);
    uniq.push(r);
  }

  const patchTargets = [
    path.join(ROOT, "focusbc", "build.mjs"),
    path.join(ROOT, "focusbc", "sources", "index.html"),
    path.join(ROOT, "focusbc", "scripts", "build-blog-posts-json.mjs"),
    path.join(ROOT, "focusbc", "scripts", "build-case-studies-json.mjs"),
    ...fs.readdirSync(path.join(ROOT, "focusbc", "data"))
      .filter((n) => n.endsWith(".json"))
      .map((n) => path.join(ROOT, "focusbc", "data", n)),
    ...fs.readdirSync(path.join(ROOT, "focusbc", "blog-built"))
      .filter((n) => n.endsWith(".html"))
      .map((n) => path.join(ROOT, "focusbc", "blog-built", n)),
    ...fs.readdirSync(path.join(ROOT, "focusbc", "case-studies-built"))
      .filter((n) => n.endsWith(".html"))
      .map((n) => path.join(ROOT, "focusbc", "case-studies-built", n)),
    ...fs.readdirSync(path.join(ROOT, "caap", "data"))
      .filter((n) => n.endsWith(".json"))
      .map((n) => path.join(ROOT, "caap", "data", n)),
    ...walkCaapHtmlCss(),
  ];

  let patched = 0;
  for (const filePath of patchTargets) {
    if (!fs.existsSync(filePath)) continue;
    let s = fs.readFileSync(filePath, "utf8");
    const before = s;
    for (const { fromM, toM } of uniq) {
      s = s.split(fromM).join(toM);
    }
    if (s !== before) {
      fs.writeFileSync(filePath, s);
      patched++;
    }
  }

  console.log(`OK: ${replacements.length} images → WebP (sources deleted), ${patched} text files updated.`);
}

function walkCaapHtmlCss() {
  const out = [];
  const caap = path.join(ROOT, "caap");
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name.endsWith(".html") || ent.name === "styles.css") out.push(p);
    }
  }
  walk(caap);
  return out;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
