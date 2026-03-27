/**
 * Fetches Wix blog posts (same HTML shape as case studies), downloads images to media/blog/{slug}/,
 * writes static HTML to blog-built/{slug}.html. Skips slugs that are imported as case studies.
 *
 * Slug list: focusbc/data/blog-posts.json (already excludes case studies from ROWS).
 *
 * Run from repo root: node focusbc/scripts/import-blog-from-wix.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decodeHtmlEntities } from "../lib/decode-html-entities.mjs";
import { CASE_STUDY_SLUGS } from "./import-case-studies-from-wix.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FOCUSBC = path.join(__dirname, "..");
const MEDIA_BLOG = path.join(FOCUSBC, "media", "blog");
const OUT_HTML_DIR = path.join(FOCUSBC, "blog-built");
const MANIFEST = path.join(FOCUSBC, "data", "blog-import.json");
const BLOG_POSTS_JSON = path.join(FOCUSBC, "data", "blog-posts.json");

const caseStudySet = new Set(CASE_STUDY_SLUGS);

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function escAttr(s) {
  const t = decodeHtmlEntities(s == null ? "" : String(s));
  return t
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function postUrl(slug) {
  return `https://www.focus-bc.com/post/${encodeURIComponent(slug)}`;
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; FocusBC-static-import/1.0)",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.text();
}

async function downloadFile(url, destPath) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; FocusBC-static-import/1.0)" },
  });
  if (!res.ok) throw new Error(`GET image ${url} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  ensureDir(path.dirname(destPath));
  fs.writeFileSync(destPath, buf);
}

function extFromUrl(u) {
  const lower = u.toLowerCase();
  if (lower.includes(".png")) return "png";
  if (lower.includes(".jpg") || lower.includes(".jpeg")) return "jpg";
  if (lower.includes(".webp")) return "webp";
  if (lower.includes(".gif")) return "gif";
  return "jpg";
}

function extractLdBlogPosting(html) {
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) {
    try {
      const j = JSON.parse(m[1]);
      if (j["@type"] === "BlogPosting" || j["@type"] === "Article") return j;
      if (Array.isArray(j["@graph"])) {
        const node = j["@graph"].find(
          (x) => x && (x["@type"] === "BlogPosting" || x["@type"] === "Article")
        );
        if (node) return node;
      }
    } catch {
      /* next */
    }
  }
  return null;
}

function extractPostDescriptionInner(html) {
  const re =
    /<section class="VQDdIN" data-hook="post-description">([\s\S]*?)<\/section>\s*<footer class="PhCafd B6ltWa" data-hook="post-footer">/;
  const m = html.match(re);
  return m ? m[1] : null;
}

function extractTitle(html) {
  const m = html.match(/<h1 class="H3vOVf" data-hook="post-title">([^<]+)<\/h1>/);
  if (m) return m[1].trim();
  const t = html.match(/<title>([^<]+)<\/title>/i);
  return t ? t[1].trim() : "Blog";
}

function extractMeta(html) {
  const cats = [];
  const catBlock = html.match(/aria-label="Post categories"[^>]*>([\s\S]*?)<\/ul>/);
  if (catBlock) {
    const links = [...catBlock[1].matchAll(/<a[^>]*>([^<]+)<\/a>/g)];
    for (const x of links) cats.push(x[1].trim());
  }
  return { cats };
}

function stripWixChrome(fragment) {
  let s = fragment;
  s = s.replace(/<button[^>]*class="C2hnP"[\s\S]*?<\/button>/g, "");
  s = s.replace(/<\/wow-image>/gi, "");
  s = s.replace(/<wow-image[^>]*>/gi, "");
  return s;
}

function collectPinMediaUrlsInOrder(html) {
  const urls = [];
  const re = /data-pin-media="(https:\/\/static\.wixstatic\.com[^"]+)"/g;
  let m;
  while ((m = re.exec(html))) urls.push(m[1]);
  return urls;
}

function fallbackImageUrlFromImgSrc(src) {
  if (!src || !src.includes("static.wixstatic.com/media")) return null;
  const fileMatch = src.match(/media\/([^/]+~mv2\.(png|jpe?g|webp))/i);
  if (!fileMatch) return null;
  const file = fileMatch[1];
  const base = src.split("/v1/")[0];
  return `${base}/v1/fill/w_1920,h_1080,al_c,q_90,usm_0.66_1.00_0.01/${file}`;
}

function collectFallbackUrlsInOrder(html) {
  const urls = [];
  const re = /<img[^>]+src="(https:\/\/static\.wixstatic\.com\/media[^"]+)"/gi;
  let m;
  while ((m = re.exec(html))) {
    const hi = fallbackImageUrlFromImgSrc(m[1]);
    if (hi) urls.push(hi);
  }
  return urls;
}

function applyLocalImagesToFragment(fragment, localPaths) {
  let i = 0;
  return fragment.replace(/<img\b[^>]*>/gi, (tag) => {
    const altM = tag.match(/\balt="([^"]*)"/i);
    const alt = altM ? altM[1] : "";
    if (i >= localPaths.length) {
      return tag.replace(/\sdata-pin-[^=]*="[^"]*"/g, "").replace(/\sdraggable="[^"]*"/g, "");
    }
    const src = localPaths[i];
    i += 1;
    return `<img src="${src}" alt="${escAttr(alt)}" loading="lazy" width="1200" height="675" class="import-prose-img" />`;
  });
}

function pageShell({ title, description, bodyHtml, slug }) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escAttr(title)} | Focus BC</title>
    <meta name="description" content="${escAttr(description)}" />
    <meta name="robots" content="noindex, nofollow" />
    <meta name="googlebot" content="noindex, nofollow" />
    <link rel="canonical" href="#" />
    <link rel="stylesheet" href="/styles/styles.css" />
  </head>
  <body>
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <header class="site-header">
      <div class="container site-header__inner">
        <a href="/index.html" class="site-logo"><img src="/media/logos/focus-bc-logo.png" alt="Focus BC" width="160" height="40" /></a>
        <details class="site-nav-mobile">
          <summary class="site-nav-mobile__toggle">Menu</summary>
          <nav class="site-nav-mobile__panel" aria-label="Primary navigation">
            <a href="/about/index.html">About</a>
            <a href="/google/index.html">Google</a>
            <a href="/case-studies/index.html">Case studies</a>
            <a href="/blog/index.html">Blog</a>
            <a href="/careers/index.html">Careers</a>
            <a href="/contact/index.html">Contact</a>
          </nav>
        </details>
        <nav class="site-nav-desktop" aria-label="Primary navigation">
          <a href="/about/index.html">About</a>
          <a href="/google/index.html">Google</a>
          <a href="/case-studies/index.html">Case studies</a>
          <a href="/blog/index.html">Blog</a>
          <a href="/careers/index.html">Careers</a>
          <a href="/contact/index.html">Contact</a>
        </nav>
        <a href="/contact/index.html" class="btn btn--primary btn--sm btn--header">Talk to us</a>
      </div>
    </header>

    <main id="main-content" class="case-study-static">
      <article class="container case-study-static__article">
        <p class="eyebrow"><a href="/blog/index.html" class="link-plain">Blog</a></p>
        <h1 class="mt-4 h1 case-study-static__title">${escAttr(title)}</h1>
        <p class="case-study-static__slug text-muted text-sm-tight mt-2">focus-bc.com/post/${escAttr(slug)}</p>
        <div class="prose prose--blog case-study-import-body mt-8">${bodyHtml}</div>
        <p class="mt-10"><a href="/blog/index.html" class="link-coral-underline">← All blog posts</a></p>
      </article>
    </main>

    <footer class="site-footer">
      <div class="site-footer__strap">
        <div class="container site-footer__strap-inner">
          <div>
            <p class="site-footer__strap-tagline">
              Operational platforms for cities and global sports events.<br />
              Built as products. Delivered for operations.
            </p>
            <p class="site-footer__strap-note">Focus BC · Google Premier Partner · Lisbon</p>
          </div>
          <a href="/contact/index.html" class="btn btn--white btn--sm shrink-0">Talk to us</a>
        </div>
      </div>
      <div class="site-footer__body">
        <div class="container site-footer__grid">
          <div>
            <a href="/index.html"><img src="/media/logos/focus-bc-logo.png" alt="Focus BC" width="160" height="40" /></a>
            <p class="footer-tagline">
              Operational platforms for cities and global sports events.<br />
              Built as products. Delivered for operations.
            </p>
          </div>
          <div>
            <h3>Company</h3>
            <ul>
              <li><a href="/about/index.html">About</a></li>
              <li><a href="/case-studies/index.html">Case studies</a></li>
              <li><a href="/blog/index.html">Blog</a></li>
              <li><a href="/careers/index.html">Careers</a></li>
            </ul>
          </div>
          <div>
            <h3>Offers</h3>
            <ul>
              <li><a href="https://www.virtualvenue-events.com/" target="_blank" rel="noopener noreferrer">Virtual Venue</a></li>
              <li><a href="https://www.city-platform.com/" target="_blank" rel="noopener noreferrer">City as a Platform</a></li>
              <li><a href="/google/index.html">Google partnership</a></li>
            </ul>
            <p class="footer-note">
              Mapify powers geospatial and integration capability <strong>inside</strong> City as a Platform.
              <a href="https://www.mapify.ai/" rel="noopener noreferrer">Mapify</a>
            </p>
          </div>
          <div>
            <h3>Contact</h3>
            <ul>
              <li><a href="/contact/index.html">Get in touch</a></li>
              <li><a href="mailto:info@focus-bc.com">info@focus-bc.com</a></li>
              <li><a href="https://www.linkedin.com" rel="noopener noreferrer">LinkedIn</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  </body>
</html>`;
}

async function processSlug(slug, meta) {
  const url = postUrl(slug);
  console.log(`Fetching ${slug}…`);
  const html = await fetchText(url);
  const title = extractTitle(html);
  const ld = extractLdBlogPosting(html);
  const description =
    ld?.description || html.match(/<meta name="description" content="([^"]*)"/)?.[1] || "";
  let inner = extractPostDescriptionInner(html);
  if (!inner) throw new Error(`Could not extract post body for ${slug}`);

  inner = stripWixChrome(inner);
  let pinUrls = collectPinMediaUrlsInOrder(inner);
  if (pinUrls.length === 0) pinUrls = collectFallbackUrlsInOrder(inner);
  const seenUrl = new Set();
  pinUrls = pinUrls.filter((u) => {
    if (seenUrl.has(u)) return false;
    seenUrl.add(u);
    return true;
  });

  const dir = path.join(MEDIA_BLOG, slug);
  ensureDir(dir);

  const localPaths = [];
  let idx = 0;
  for (const remote of pinUrls) {
    idx += 1;
    const ext = extFromUrl(remote);
    const localName = `${String(idx).padStart(2, "0")}.${ext}`;
    const destAbs = path.join(dir, localName);
    const webPath = `/media/blog/${slug}/${localName}`;
    try {
      console.log(`  img ${localName}`);
      await downloadFile(remote, destAbs);
      localPaths.push(webPath);
    } catch (e) {
      console.warn(`  skip image (${e.message})`);
    }
  }

  let bodyHtml = applyLocalImagesToFragment(inner, localPaths);
  bodyHtml = bodyHtml.replace(/\sdata-pin-[^=]*="[^"]*"/g, "");
  bodyHtml = bodyHtml.replace(/\sdata-hook="[^"]*"/g, "");

  const pageHtml = pageShell({ title, description, bodyHtml, slug });
  const outFile = path.join(OUT_HTML_DIR, `${slug}.html`);
  ensureDir(OUT_HTML_DIR);
  fs.writeFileSync(outFile, pageHtml);

  const publishedAt =
    typeof ld?.datePublished === "string" && ld.datePublished.trim() ? ld.datePublished.trim() : null;

  return {
    slug,
    title,
    description,
    url: postUrl(slug),
    heroImage: localPaths[0] || null,
    categories: extractMeta(html).cats,
    publishedAt,
    lastmod: meta?.lastmod || null,
    excerpt: meta?.excerpt || description,
  };
}

async function main() {
  ensureDir(MEDIA_BLOG);
  ensureDir(OUT_HTML_DIR);
  ensureDir(path.dirname(MANIFEST));

  if (!fs.existsSync(BLOG_POSTS_JSON)) {
    console.error(`Missing ${BLOG_POSTS_JSON}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(BLOG_POSTS_JSON, "utf8"));
  const bySlug = new Map((data.posts || []).map((p) => [p.slug, p]));

  const slugs = [...bySlug.keys()].filter((s) => !caseStudySet.has(s));
  if (slugs.length !== bySlug.size) {
    const skipped = [...bySlug.keys()].filter((s) => caseStudySet.has(s));
    if (skipped.length) console.warn("Skipping case study slugs (already imported elsewhere):", skipped.join(", "));
  }

  const results = [];
  for (const slug of slugs) {
    try {
      results.push(await processSlug(slug, bySlug.get(slug)));
    } catch (e) {
      console.error(`FAILED ${slug}: ${e.message}`);
      process.exitCode = 1;
    }
  }

  fs.writeFileSync(MANIFEST, JSON.stringify({ generatedAt: new Date().toISOString(), posts: results }, null, 2));
  console.log(`\nWrote manifest: ${MANIFEST}`);
  console.log(`HTML: ${OUT_HTML_DIR}/`);
  console.log(`Media: ${MEDIA_BLOG}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
