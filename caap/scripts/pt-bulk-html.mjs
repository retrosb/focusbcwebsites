/**
 * One-off bulk string normalisation for pt-PT static HTML under caap/sources.
 * Run: node caap/scripts/pt-bulk-html.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "sources");

function walkHtml(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkHtml(p, out);
    else if (ent.name.endsWith(".html")) out.push(p);
  }
  return out;
}

const pairs = [
  ["Skip to main content", "Saltar para o conteúdo"],
  [
    "How City as a Platform supported this project — full narrative on the public site.",
    "Como o City as a Platform apoiou este projeto — narrativa completa no site público.",
  ],
  ["<a href=\"./\">Home</a>", "<a href=\"./\">Início</a>"],
  ["Loading articles…", "A carregar artigos…"],
  ["Loading case studies…", "A carregar casos de estudo…"],
];

let changed = 0;
for (const filePath of walkHtml(root)) {
  let s = fs.readFileSync(filePath, "utf8");
  const orig = s;
  for (const [a, b] of pairs) {
    if (s.includes(a)) s = s.split(a).join(b);
  }
  if (s !== orig) {
    fs.writeFileSync(filePath, s);
    changed++;
    console.log(filePath.replace(process.cwd() + "/", ""));
  }
}
console.log(`OK: ${changed} file(s) updated.`);
