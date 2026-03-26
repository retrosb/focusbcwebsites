/**
 * Downloads static.wixstatic.com/media/* assets referenced in Focus BC and CAAP
 * data (and Focus BC build sources), saves under each site's media/wix/, and
 * rewrites those files to use media/wix/<filename>.
 *
 * Run from anywhere: node focusbc/scripts/download-wix-static-media.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEBSITES = path.resolve(__dirname, "../..");

const WIX_RE = /https:\/\/static\.wixstatic\.com\/media\/([^"'\s\\)]+)/g;

const PROJECTS = [
  {
    dir: path.join(WEBSITES, "focusbc"),
    relFiles: [
      "data/case-studies.json",
      "data/blog-posts.json",
      "scripts/build-case-studies-json.mjs",
      "scripts/build-blog-posts-json.mjs",
    ],
  },
  {
    dir: path.join(WEBSITES, "caap"),
    relFiles: ["data/case-studies.json", "data/blog-posts.json"],
  },
];

function fileNameFromUrl(url) {
  const part = url.split("/media/")[1]?.split("?")[0] || "";
  return decodeURIComponent(part);
}

function collectUrls(text) {
  const set = new Set();
  let m;
  const re = new RegExp(WIX_RE.source, "g");
  while ((m = re.exec(text)) !== null) {
    set.add(`https://static.wixstatic.com/media/${m[1]}`);
  }
  return set;
}

function safeName(name) {
  if (!name || name.includes("..") || path.isAbsolute(name)) return null;
  return name;
}

async function downloadFile(url, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
    return "skipped (exists)";
  }
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  return "downloaded";
}

async function main() {
  for (const proj of PROJECTS) {
    const mediaDir = path.join(proj.dir, "media", "wix");
    const urls = new Set();
    const targets = [];

    for (const rel of proj.relFiles) {
      const fp = path.join(proj.dir, rel);
      if (!fs.existsSync(fp)) {
        console.warn("missing:", fp);
        continue;
      }
      const text = fs.readFileSync(fp, "utf8");
      collectUrls(text).forEach((u) => urls.add(u));
      targets.push(fp);
    }

    console.log(`\n${path.basename(proj.dir)}: ${urls.size} unique asset(s)`);

    /** @type {Map<string, boolean>} */
    const urlOk = new Map();

    for (const url of urls) {
      const base = safeName(fileNameFromUrl(url));
      if (!base) {
        console.warn("skip unsafe name:", url);
        urlOk.set(url, false);
        continue;
      }
      const dest = path.join(mediaDir, base);
      try {
        const status = await downloadFile(url, dest);
        console.log(`  ${status}: ${base}`);
        urlOk.set(url, fs.existsSync(dest) && fs.statSync(dest).size > 0);
      } catch (e) {
        console.error(`  FAIL ${base}:`, e.message);
        urlOk.set(url, false);
      }
    }

    for (const fp of targets) {
      let text = fs.readFileSync(fp, "utf8");
      const original = text;
      for (const url of urls) {
        if (!urlOk.get(url)) continue;
        const base = safeName(fileNameFromUrl(url));
        if (!base) continue;
        const local = `media/wix/${base}`;
        text = text.split(url).join(local);
      }
      if (text !== original) {
        fs.writeFileSync(fp, text, "utf8");
        console.log("  rewritten:", path.relative(WEBSITES, fp));
      }
    }
  }
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
