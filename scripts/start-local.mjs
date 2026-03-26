/**
 * Local preview: ensures public/index.html exists, then serves the site on PORT (default 8888).
 * Root URL serves the hub at public/index.html; /focusbc/ and /caap/ need a successful build.
 */
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const HUB = path.join(ROOT, "public", "index.html");

process.chdir(ROOT);

if (!fs.existsSync(HUB)) {
  console.log("public/index.html not found — running npm run build…");
  execFileSync(process.execPath, ["scripts/build-pages.mjs"], {
    stdio: "inherit",
    env: process.env,
  });
}

const port = process.env.PORT || "8888";
console.log(`Open http://localhost:${port}/ (hub: public/index.html)`);

const child = spawn(process.execPath, ["server.mjs"], {
  stdio: "inherit",
  env: { ...process.env, PORT: port },
});

child.on("exit", (code) => process.exit(code ?? 0));
