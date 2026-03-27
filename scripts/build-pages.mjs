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

execFileSync(process.execPath, ["caap/build.mjs"], {
  cwd: ROOT,
  env: {
    ...process.env,
    CAAP_OUT: path.join(PUBLIC, "caap"),
    CAAP_BASE_PATH: "/caap",
  },
  stdio: "inherit",
});

const hub = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Nothing to see</title>
  <style>
    @keyframes enter-pop {
      0% {
        opacity: 0;
        transform: scale(0.88) translateY(18px) rotate(-2deg);
      }
      70% {
        opacity: 1;
        transform: scale(1.04) translateY(0) rotate(1deg);
      }
      100% {
        opacity: 1;
        transform: scale(1) translateY(0) rotate(0deg);
      }
    }
    @keyframes drift {
      0%,
      100% {
        transform: translate(0, 0) rotate(0deg);
      }
      25% {
        transform: translate(-4px, -5px) rotate(-0.6deg);
      }
      50% {
        transform: translate(5px, 3px) rotate(0.5deg);
      }
      75% {
        transform: translate(-3px, 4px) rotate(-0.3deg);
      }
    }
    @keyframes sky-shift {
      0% {
        background-position: 0% 40%;
      }
      50% {
        background-position: 100% 60%;
      }
      100% {
        background-position: 0% 40%;
      }
    }
    @keyframes wink {
      0%,
      88%,
      100% {
        transform: scaleY(1);
      }
      90%,
      94% {
        transform: scaleY(0.12);
      }
      92% {
        transform: scaleY(1);
      }
    }
    @keyframes dots {
      0%,
      100% {
        opacity: 0.35;
      }
      50% {
        opacity: 1;
      }
    }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(125deg, #f8fafc, #e0e7ff 35%, #fce7f3 65%, #e2e8f0);
      background-size: 280% 280%;
      animation: sky-shift 14s ease-in-out infinite;
      color: #475569;
    }
    .stage {
      padding: 2rem;
      animation: enter-pop 0.85s cubic-bezier(0.34, 1.45, 0.64, 1) both;
    }
    .msg {
      margin: 0;
      font-size: 1.2rem;
      line-height: 1.65;
      text-align: center;
      max-width: 22rem;
      animation: drift 4.5s ease-in-out infinite;
    }
    .msg .dots span {
      display: inline-block;
      animation: dots 1.2s ease-in-out infinite;
    }
    .msg .dots span:nth-child(2) {
      animation-delay: 0.15s;
    }
    .msg .dots span:nth-child(3) {
      animation-delay: 0.3s;
    }
    .wink {
      display: inline-block;
      animation: wink 3.5s ease-in-out infinite;
      transform-origin: 50% 60%;
    }
    @media (prefers-reduced-motion: reduce) {
      body,
      .stage,
      .msg,
      .wink,
      .msg .dots span {
        animation: none !important;
      }
      .stage {
        opacity: 1;
        transform: none;
      }
    }
  </style>
</head>
<body>
  <div class="stage">
    <p class="msg">
      Well<span class="dots" aria-hidden="true"><span>.</span><span>.</span><span>.</span></span> there is nothing to see here
      <span class="wink" aria-hidden="true">;)</span>
    </p>
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
