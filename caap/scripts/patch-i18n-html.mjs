/**
 * Legacy: add i18n hooks + lang switch + script to CAAP HTML.
 * Not used while the site is English-only; run strip-i18n-html.mjs if this script is applied by mistake.
 * Run: node caap/scripts/patch-i18n-html.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CAAP_SOURCES = path.join(__dirname, "..", "sources");

function walkHtmlFiles(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkHtmlFiles(p, out);
    else if (ent.name.endsWith(".html") && !ent.name.includes(".template")) out.push(p);
  }
  return out;
}

for (const fp of walkHtmlFiles(CAAP_SOURCES)) {
  let html = fs.readFileSync(fp, "utf8");
  if (html.includes("data-lang-switch")) continue;

  html = html.replace(
    /<a href="#main-content" class="skip-link">Skip to main content<\/a>/,
    '<a href="#main-content" class="skip-link" data-i18n="skipLink">Skip to main content</a>'
  );

  html = html.replace(
    /<span class="caap-brand__tag">Plataforma de Gestão Urbana Inteligente<\/span>/g,
    '<span class="caap-brand__tag" data-i18n="brand.tagline">Plataforma de Gestão Urbana Inteligente</span>'
  );

  html = html.replace(
    /<summary class="caap-nav-mobile__toggle">Menu<\/summary>/g,
    '<summary class="caap-nav-mobile__toggle" data-i18n="nav.menu">Menu</summary>'
  );

  if (html.includes("caap-nav-mobile__panel")) {
    html = html.replace(
      /(<nav class="caap-nav-mobile__panel" aria-label="Primary navigation">)\s*\n/g,
      `$1\n            <div class="lang-switch lang-switch--mobile" data-lang-switch></div>\n`
    );
  }

  if (html.includes("caap-header__cta")) {
    html = html.replace(
      /(\s*)(<a class="btn btn--ink btn--sm caap-header__cta")/,
      `\n        <div class="lang-switch lang-switch--desktop" data-lang-switch></div>$1$2`
    );
  }

  if (!html.includes("js/i18n.js")) {
    html = html.replace(/<\/body>/i, '    <script defer src="js/i18n.js"></script>\n  </body>');
  }

  fs.writeFileSync(fp, html);
  console.log("patched", path.relative(CAAP, fp));
}
