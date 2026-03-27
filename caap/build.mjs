/**
 * Static site build: reads HTML/CSS/JS from caap/sources/, copies assets from caap/, writes to CAAP_OUT (default public/caap).
 * Mirrors focusbc/build.mjs layout (sources → build script at package root, locales + media + data beside sources).
 *
 * Run from repo root: node caap/build.mjs
 * Or: npm run build:caap
 *
 * Env:
 *   CAAP_OUT       — output directory (default: ../public/caap)
 *   CAAP_BASE_PATH — subpath when deployed under hub (default: /caap when writing under public/caap)
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CAAP_ROOT = __dirname;
const SOURCES = path.join(CAAP_ROOT, "sources");

const ROOT = process.env.CAAP_OUT ? path.resolve(process.env.CAAP_OUT) : path.join(CAAP_ROOT, "..", "public", "caap");
const baseEnv = process.env.CAAP_BASE_PATH;
let BASE = baseEnv !== undefined ? String(baseEnv).replace(/\/$/, "") : "";
if (BASE === "" && baseEnv === undefined && /[/\\]public[/\\]caap$/i.test(ROOT)) {
  BASE = "/caap";
}

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function copyFile(from, to) {
  ensureDir(path.dirname(to));
  fs.copyFileSync(from, to);
}

function copyTree(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.cpSync(src, dest, { recursive: true });
}

function injectBaseTag(html) {
  if (/<base\s/i.test(html)) return html;
  return html.replace(/<head(\s[^>]*)?>/i, `<head$1>\n    <base href="${BASE || "/caap"}/" />`);
}

/** Emit CSS to styles/styles.css and fix link in HTML (same pattern as Focus BC output). */
function rewriteStylesheetHref(html) {
  return html.replace(/href="styles\.css"/g, 'href="styles/styles.css"');
}

function promoteHtmlFiles(rootDir) {
  if (!fs.existsSync(rootDir)) return;
  const files = [];
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name.endsWith(".html") && ent.name !== "index.html") files.push(p);
    }
  }
  walk(rootDir);
  files.sort((a, b) => b.length - a.length);
  for (const filePath of files) {
    const baseName = path.basename(filePath, ".html");
    const destDir = path.join(path.dirname(filePath), baseName);
    ensureDir(destDir);
    fs.renameSync(filePath, path.join(destDir, "index.html"));
  }
}

function injectBaseAllHtml(rootDir) {
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name.endsWith(".html")) {
        /* promoteHtmlFiles may have renamed this path; readdir can still list stale names on some FS. */
        if (!fs.existsSync(p)) continue;
        let html = fs.readFileSync(p, "utf8");
        html = injectBaseTag(html);
        fs.writeFileSync(p, html);
      }
    }
  }
  walk(rootDir);
}

/* Prefer shell rm on Unix (see focusbc/build.mjs): fs.rmSync can hang on APFS + duplicate dirs. */
if (fs.existsSync(ROOT)) {
  if (process.platform === "win32") {
    try {
      fs.rmSync(ROOT, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    } catch {
      /* last resort */
    }
  } else {
    try {
      execFileSync("/bin/rm", ["-rf", ROOT], { stdio: "inherit" });
    } catch {
      fs.rmSync(ROOT, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    }
  }
}
ensureDir(ROOT);

/* Locales, data, media (same roles as focusbc/locales + focusbc/media) */
const localesDir = path.join(CAAP_ROOT, "locales");
if (fs.existsSync(localesDir)) copyTree(localesDir, path.join(ROOT, "locales"));
const dataDir = path.join(CAAP_ROOT, "data");
if (fs.existsSync(dataDir)) copyTree(dataDir, path.join(ROOT, "data"));
const mediaDir = path.join(CAAP_ROOT, "media");
if (fs.existsSync(mediaDir)) copyTree(mediaDir, path.join(ROOT, "media"));

const fav = path.join(SOURCES, "favicon.png");
if (fs.existsSync(fav)) copyFile(fav, path.join(ROOT, "favicon.png"));

/* JS from sources */
const jsSrc = path.join(SOURCES, "js");
if (fs.existsSync(jsSrc)) copyTree(jsSrc, path.join(ROOT, "js"));

/* CSS → styles/styles.css */
ensureDir(path.join(ROOT, "styles"));
const cssSrc = path.join(SOURCES, "styles.css");
if (fs.existsSync(cssSrc)) {
  let css = fs.readFileSync(cssSrc, "utf8");
  if (BASE) {
    css = css.replace(/url\(\s*(["']?)(\/media\/)/g, (_, quote, mediaPath) => `url(${quote}${BASE}${mediaPath}`);
  }
  fs.writeFileSync(path.join(ROOT, "styles", "styles.css"), css);
}

/* Copy HTML tree from sources, rewriting stylesheet href */
function walkCopyHtml(dir, destBase) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    const out = path.join(destBase, ent.name);
    if (ent.isDirectory()) {
      ensureDir(out);
      walkCopyHtml(p, out);
    } else if (ent.name.endsWith(".html")) {
      let html = fs.readFileSync(p, "utf8");
      html = rewriteStylesheetHref(html);
      fs.writeFileSync(out, html);
    }
  }
}

walkCopyHtml(SOURCES, ROOT);

for (const f of ["blog-post.template.html", "case-study.template.html"]) {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

promoteHtmlFiles(ROOT);
injectBaseAllHtml(ROOT);

fs.writeFileSync(
  path.join(ROOT, "robots.txt"),
  `# Preview / staging — replace with production rules before launch
User-agent: *
Disallow: /
`
);

console.log(`OK: ${ROOT} (from caap/sources/, assets from caap/).`);
