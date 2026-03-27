/**
 * Removes client i18n hooks from CAAP static HTML (English-only PoC).
 * Strips data-i18n* attributes, language switcher placeholders, and i18n.js script tags.
 *
 * Run: node caap/scripts/strip-i18n-html.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCES = path.join(__dirname, "..", "sources");

function walkHtml(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkHtml(p, out);
    else if (ent.name.endsWith(".html")) out.push(p);
  }
  return out;
}

function stripI18n(html) {
  let s = html;
  s = s.replace(/\s+data-i18n="[^"]*"/g, "");
  s = s.replace(/\s+data-i18n-attr="[^"]*"/g, "");
  s = s.replace(/\s+data-i18n-html="[^"]*"/g, "");
  s = s.replace(/\s*<div class="lang-switch lang-switch--mobile" data-lang-switch><\/div>\s*/g, "\n");
  s = s.replace(/\s*<div class="lang-switch lang-switch--desktop" data-lang-switch><\/div>\s*/g, "\n");
  s = s.replace(/\s*<script defer src="js\/i18n\.js"><\/script>\s*/g, "\n");
  s = s.replace(/\s*<script src="js\/i18n\.js" defer><\/script>\s*/g, "\n");
  /* Tidy header after removing lang-switch row */
  s = s.replace(
    /(aria-label="Primary navigation">)\s*\n<a href="product">/g,
    "$1\n            <a href=\"product\">"
  );
  s = s.replace(
    /        <\/nav>\n<a class="btn btn--ink btn--sm caap-header__cta"/g,
    "        </nav>\n        <a class=\"btn btn--ink btn--sm caap-header__cta\""
  );
  return s;
}

function main() {
  const files = walkHtml(SOURCES);
  let n = 0;
  for (const filePath of files) {
    const before = fs.readFileSync(filePath, "utf8");
    const after = stripI18n(before);
    if (after !== before) {
      fs.writeFileSync(filePath, after);
      n++;
    }
  }
  console.log(`Stripped i18n from ${n} file(s) under caap/sources/`);
}

main();
