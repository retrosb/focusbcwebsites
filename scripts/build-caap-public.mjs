/**
 * Copy caap/ to public/caap/, promote flat *.html pages into folders with index.html, inject base URL for /caap/.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "caap");
const DEST = path.join(ROOT, "public", "caap");

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function copyCaap() {
  fs.rmSync(DEST, { recursive: true, force: true });
  ensureDir(DEST);
  fs.cpSync(SRC, DEST, { recursive: true });
  for (const f of ["blog-post.template.html", "case-study.template.html"]) {
    const p = path.join(DEST, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
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

function injectBaseTag(html) {
  if (/<base\s/i.test(html)) return html;
  return html.replace(/<head(\s[^>]*)?>/i, `<head$1>\n    <base href="/caap/" />`);
}

function injectBaseAllHtml(rootDir) {
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name.endsWith(".html")) {
        let html = fs.readFileSync(p, "utf8");
        html = injectBaseTag(html);
        fs.writeFileSync(p, html);
      }
    }
  }
  walk(rootDir);
}

copyCaap();
promoteHtmlFiles(DEST);
injectBaseAllHtml(DEST);
console.log("OK: public/caap/ (from caap/).");
