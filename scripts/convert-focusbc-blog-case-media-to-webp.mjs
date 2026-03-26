/**
 * Convert PNG/JPEG assets under focusbc/media/{blog,case-studies,wix} to WebP and
 * update references in data, built HTML, build.mjs, and sources.
 *
 * Run: node scripts/convert-focusbc-blog-case-media-to-webp.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const MEDIA = path.join(ROOT, "focusbc", "media");
const SUBDIRS = ["blog", "case-studies", "wix"];

const RASTER = /\.(png|jpe?g)$/i;
const MAX_WIDTH = 2400;

function walkRasterFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkRasterFiles(p, out);
    else if (RASTER.test(ent.name)) out.push(p);
  }
  return out;
}

function relMedia(p) {
  return path.relative(MEDIA, p).split(path.sep).join("/");
}

async function convertOne(absPath) {
  const ext = path.extname(absPath);
  const base = absPath.slice(0, -ext.length);
  const outPath = `${base}.webp`;
  let pipeline = sharp(absPath);
  const meta = await pipeline.metadata();
  if (meta.width && meta.width > MAX_WIDTH) {
    pipeline = sharp(absPath).resize(MAX_WIDTH, null, { withoutEnlargement: true, fit: "inside" });
  } else {
    pipeline = sharp(absPath);
  }
  await pipeline.webp({ quality: 82, effort: 6, smartSubsample: true }).toFile(outPath);
  fs.unlinkSync(absPath);
  return {
    from: relMedia(absPath),
    to: relMedia(outPath),
  };
}

async function main() {
  const files = [];
  for (const sub of SUBDIRS) {
    files.push(...walkRasterFiles(path.join(MEDIA, sub)));
  }
  if (!files.length) {
    console.log("No PNG/JPEG files found under blog, case-studies, wix.");
    return;
  }

  console.log(`Converting ${files.length} files to WebP…`);
  const pairs = [];
  for (const f of files) {
    try {
      pairs.push(await convertOne(f));
    } catch (e) {
      console.error(`Failed: ${f}`, e.message);
      process.exitCode = 1;
    }
  }

  const replacements = pairs
    .map(({ from, to }) => ({
      fromM: `media/${from}`,
      toM: `media/${to}`,
    }))
    .sort((a, b) => b.fromM.length - a.fromM.length);

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
  ];

  let patched = 0;
  for (const filePath of patchTargets) {
    if (!fs.existsSync(filePath)) continue;
    let s = fs.readFileSync(filePath, "utf8");
    const before = s;
    for (const { fromM, toM } of replacements) {
      s = s.split(fromM).join(toM);
    }
    if (s !== before) {
      fs.writeFileSync(filePath, s);
      patched++;
    }
  }

  console.log(`OK: ${pairs.length} images → WebP, ${patched} text files updated.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
