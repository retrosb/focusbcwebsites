/**
 * Unified Cloudflare Pages output: public/index.html hub + public/focusbc + public/caap.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");

fs.mkdirSync(PUBLIC, { recursive: true });

execFileSync(process.execPath, ["focusbc/build.mjs"], {
  cwd: ROOT,
  env: {
    ...process.env,
    FOCUSBC_OUT: path.join(PUBLIC, "focusbc"),
    FOCUSBC_BASE_PATH: "/focusbc",
  },
  stdio: "inherit",
});

execFileSync(process.execPath, ["scripts/build-caap-public.mjs"], {
  cwd: ROOT,
  stdio: "inherit",
});

const hub = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sites</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 36rem; margin: 3rem auto; padding: 0 1rem; }
    h1 { font-size: 1.5rem; font-weight: 600; }
    .actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1.5rem; }
    a.btn { display: inline-block; padding: 0.6rem 1rem; border-radius: 6px; text-decoration: none; font-weight: 500; }
    a.focusbc { background: #0f172a; color: #fff; }
    a.caap { background: #0369a1; color: #fff; }
  </style>
</head>
<body>
  <h1>Choose a site</h1>
  <div class="actions">
    <a class="btn focusbc" href="/focusbc/">Focus BC</a>
    <a class="btn caap" href="/caap/">City as a Platform</a>
  </div>
</body>
</html>
`;

fs.writeFileSync(path.join(PUBLIC, "index.html"), hub);

/* Cloudflare Pages / Netlify-style redirects: canonical URLs with trailing slash */
fs.writeFileSync(
  path.join(PUBLIC, "_redirects"),
  `# ictum.ai/focusbc and /caap — match directory index routes
/focusbc  /focusbc/  308
/caap     /caap/     308
`
);

console.log("OK: public/index.html (hub), public/_redirects.");

/* Cloudflare Pages: https://developers.cloudflare.com/pages/platform/limits/ — 25 MiB per file */
const CF_PAGES_MAX_BYTES = 25 * 1024 * 1024;
function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(p, out);
    else out.push(p);
  }
  return out;
}
const oversized = [];
for (const f of walkFiles(PUBLIC)) {
  const { size } = fs.statSync(f);
  if (size > CF_PAGES_MAX_BYTES) oversized.push({ f, size });
}
if (oversized.length) {
  console.error("Build output exceeds Cloudflare Pages per-file limit (25 MiB):");
  for (const { f, size } of oversized) {
    console.error(`  ${(size / 1024 / 1024).toFixed(2)} MiB  ${path.relative(ROOT, f)}`);
  }
  process.exit(1);
}
