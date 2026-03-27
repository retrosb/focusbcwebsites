import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8888;

const FOCUSBC = path.join(__dirname, "focusbc");
/** Built Focus BC static tree from `npm run build` → public/focusbc/. */
const FOCUSBC_OUTPUT = path.join(__dirname, "public", "focusbc");
/** CAAP templates & JSON stay in repo caap/; static HTML may be served from public/caap/ after build. */
const CAAP_SOURCE = path.join(__dirname, "caap");
const CAAP_STATIC = fs.existsSync(path.join(__dirname, "public", "caap", "index.html"))
  ? path.join(__dirname, "public", "caap")
  : CAAP_SOURCE;
const BLOG_JSON = path.join(FOCUSBC, "data", "blog-posts.json");
const BLOG_TEMPLATE = path.join(FOCUSBC, "blog-post.template.html");
const DEFAULT_OG = "https://www.focus-bc.com/media/focusbc-logo.png";
const BLOG_DEFAULT_OG = "https://www.focus-bc.com/media/og-blog-post.jpg";
const CASE_STUDY_DEFAULT_OG = "https://www.focus-bc.com/media/og-case-study.jpg";

function absoluteFocusbcAssetUrl(rel) {
  if (!rel) return "";
  const s = String(rel).trim();
  if (/^https?:\/\//i.test(s)) return s;
  return `https://www.focus-bc.com/${s.replace(/^\/+/, "")}`;
}

function focusTopicsForPost(post) {
  if (post.focusTopics && String(post.focusTopics).trim()) {
    return String(post.focusTopics).trim();
  }
  const pillarHints = {
    "smart-cities": "Smart cities, data, operations",
    "sports-events": "Events, venues, partnerships",
    company: "Company, culture, partnerships",
  };
  return pillarHints[post.pillar] || post.category || "";
}

let blogPosts = [];
const blogBySlug = new Map();

function loadBlogIndex() {
  blogPosts = [];
  blogBySlug.clear();
  try {
    const raw = fs.readFileSync(BLOG_JSON, "utf8");
    const j = JSON.parse(raw);
    blogPosts = Array.isArray(j.posts) ? j.posts : [];
    for (const p of blogPosts) {
      if (p && typeof p.slug === "string") blogBySlug.set(p.slug, p);
    }
  } catch {
    /* optional file at dev time */
  }
}

loadBlogIndex();

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(str, n) {
  const t = String(str).trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n - 1)}…`;
}

function formatBlogDate(iso) {
  const [y, m, d] = String(iso).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function pickRelatedPosts(currentSlug, n = 2) {
  return blogPosts
    .filter((p) => p.slug !== currentSlug)
    .sort((a, b) => String(b.lastmod).localeCompare(String(a.lastmod)))
    .slice(0, n);
}

function blogMediaBlock(post) {
  const caption =
    post.imageCaption && String(post.imageCaption).trim()
      ? escapeHtml(String(post.imageCaption).trim())
      : "Article hero visual for product, operations, or workflow context";
  if (!post.image) {
    return `<figure class="blog-post-figure">
  <div class="blog-post-figure__media blog-post-figure__media--placeholder" role="img" aria-label=""></div>
  <figcaption class="blog-post-figure__caption">${caption}</figcaption>
</figure>`;
  }
  const alt = post.imageAlt || post.title;
  return `<figure class="blog-post-figure">
  <div class="blog-post-figure__media media-thumb-cover" role="img" aria-label="${escapeHtml(alt)}">
    <img src="${escapeHtml(post.image)}" alt="${escapeHtml(alt)}" loading="lazy" width="1200" height="600" />
  </div>
  <figcaption class="blog-post-figure__caption">${caption}</figcaption>
</figure>`;
}

function blogPlaceholderBody(post, dateStr, canonical) {
  return `<p class="lead">This page is a <strong>placeholder</strong> while the full article is migrated from the previous Focus BC site.</p>
<p><strong>${escapeHtml(post.title)}</strong> — last updated on the public site: <strong>${escapeHtml(dateStr)}</strong> <span class="text-muted">(${escapeHtml(post.lastmod)})</span>. Category: <strong>${escapeHtml(post.category)}</strong>.</p>
<p>Original location: <a href="${escapeHtml(canonical)}" rel="noopener noreferrer">${escapeHtml(canonical)}</a>.</p>
<h2>What goes here next</h2>
<p>Drop in the long-form narrative, pull quotes, embedded video, and diagrams from your CMS or markdown source. The hero image above comes from the Wix sitemap entry for this post.</p>
<h2>Why this structure exists</h2>
<p>Each slug under <code>/focusbc/blog/&lt;slug&gt;</code> is backed by one object in <code>data/blog-posts.json</code>. Edit that JSON or re-run <code>node focusbc/scripts/build-blog-posts-json.mjs</code> after changing the seed list in <code>focusbc/scripts/build-blog-posts-json.mjs</code>.</p>`;
}

function blogRelatedBlock(related) {
  return related
    .map(
      (r) =>
        `<a href="blog/${encodeURIComponent(r.slug)}" class="blog-related-link"><h3 class="h3 blog-related-link__title">${escapeHtml(r.title)}</h3><p class="blog-related-link__excerpt text-muted mt-1 text-sm-tight">${escapeHtml(truncate(r.excerpt, 140))}</p></a>`
    )
    .join("");
}

function renderFocusbcBlogPost(post) {
  const tpl = fs.readFileSync(BLOG_TEMPLATE, "utf8");
  const canonical = `https://www.focus-bc.com/post/${post.slug}`;
  const ogImage = post.image ? absoluteFocusbcAssetUrl(post.image) : BLOG_DEFAULT_OG;
  const dateStr = formatBlogDate(post.lastmod);
  const metaDesc = truncate(String(post.excerpt || post.title).replace(/\s+/g, " "), 155);
  const related = pickRelatedPosts(post.slug, 2);
  const robotsContent = post.index === false ? "noindex, follow" : "index, follow";
  const map = {
    __ROBOTS_CONTENT__: escapeHtml(robotsContent),
    __META_TITLE__: escapeHtml(`${post.title} | Focus BC`),
    __META_DESC__: escapeHtml(metaDesc),
    __CANONICAL__: escapeHtml(canonical),
    __OG_TITLE__: escapeHtml(`${post.title} | Focus BC`),
    __OG_DESC__: escapeHtml(metaDesc),
    __OG_URL__: escapeHtml(canonical),
    __OG_IMAGE__: escapeHtml(ogImage),
    __TW_TITLE__: escapeHtml(`${post.title} | Focus BC`),
    __TW_DESC__: escapeHtml(metaDesc),
    __TW_IMAGE__: escapeHtml(ogImage),
    __FOCUS_TOPICS__: escapeHtml(focusTopicsForPost(post)),
    __CATEGORY__: escapeHtml(post.category),
    __DATE_STR__: escapeHtml(dateStr),
    __READ_MIN__: escapeHtml(String(post.readMinutes ?? 5)),
    __H1__: escapeHtml(post.title),
    __LEAD__: escapeHtml(post.excerpt || metaDesc),
    __MEDIA_BLOCK__: blogMediaBlock(post),
    __BODY_HTML__: blogPlaceholderBody(post, dateStr, canonical),
    __ASIDE_CAT__: escapeHtml(post.category),
    __READ_TIME_LABEL__: escapeHtml(`${post.readMinutes ?? 5} minutes`),
    __RELATED_BLOCK__: blogRelatedBlock(related),
  };
  let out = tpl;
  for (const [k, v] of Object.entries(map)) {
    out = out.split(k).join(v);
  }
  return out;
}

const CASE_STUDIES_JSON = path.join(FOCUSBC, "data", "case-studies.json");
const CASE_STUDY_TEMPLATE = path.join(FOCUSBC, "case-study.template.html");

let caseStudies = [];
const caseBySlug = new Map();

function loadCaseStudiesIndex() {
  caseStudies = [];
  caseBySlug.clear();
  try {
    const raw = fs.readFileSync(CASE_STUDIES_JSON, "utf8");
    const j = JSON.parse(raw);
    caseStudies = Array.isArray(j.studies) ? j.studies : [];
    for (const s of caseStudies) {
      if (s && typeof s.slug === "string") caseBySlug.set(s.slug, s);
    }
  } catch {
    /* optional */
  }
}

loadCaseStudiesIndex();

function pickRelatedCases(currentSlug, n = 2) {
  return caseStudies
    .filter((s) => s.slug !== currentSlug)
    .sort((a, b) => String(b.lastmod).localeCompare(String(a.lastmod)))
    .slice(0, n);
}

function productAreaFromStudy(study) {
  const ro = study.relatedOffer;
  if (ro === "vv") return "Virtual Venue";
  if (ro === "caap") return "City as a Platform";
  if (ro === "both") return "City as a Platform & Virtual Venue";
  return "Focus BC";
}

function mainFocusForStudy(study) {
  if (study.mainFocus && String(study.mainFocus).trim()) {
    return String(study.mainFocus).trim();
  }
  const ch = String(study.challenge || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!ch) return "—";
  return ch.length <= 140 ? ch : truncate(ch, 137);
}

function asideFocusForStudy(study) {
  if (study.focusTopics && String(study.focusTopics).trim()) {
    return String(study.focusTopics).trim();
  }
  const ch = String(study.challenge || "")
    .replace(/\s+/g, " ")
    .trim();
  return ch ? truncate(ch, 120) : "—";
}

function heroMetaDetailForStudy(study) {
  const c = study.clientType && String(study.clientType).trim();
  if (c) return truncate(c, 72);
  const o = study.outcome && String(study.outcome).trim();
  if (o) return truncate(o, 72);
  const ch = String(study.challenge || "")
    .replace(/\s+/g, " ")
    .trim();
  return ch ? truncate(ch, 72) : "—";
}

function caseStudyRelatedProductHtml(study) {
  const ro = study.relatedOffer;
  const talkBtn = `<a href="contact" class="btn btn--secondary-light btn--sm">Talk to Focus BC</a>`;
  if (ro === "vv") {
    return `<div class="case-study-related-product">
  <p class="eyebrow">Related product</p>
  <h3 class="mt-3 h3">See the platform behind this kind of work</h3>
  <p class="mt-4 text-sm-loose text-muted">Explore how Virtual Venue supports planning, monitoring, reporting, and operational coordination across sports event environments.</p>
  <div class="mt-6 flex flex-wrap gap-3">
    <a href="https://www.virtualvenue-events.com/" class="btn btn--primary btn--sm" target="_blank" rel="noopener noreferrer">Visit Virtual Venue</a>
    ${talkBtn}
  </div>
</div>`;
  }
  if (ro === "caap") {
    return `<div class="case-study-related-product">
  <p class="eyebrow">Related product</p>
  <h3 class="mt-3 h3">See the platform behind this kind of work</h3>
  <p class="mt-4 text-sm-loose text-muted">Explore how City as a Platform brings data, workflows, and operational visibility together for city operations and geospatial teams.</p>
  <div class="mt-6 flex flex-wrap gap-3">
    <a href="https://www.city-platform.com/" class="btn btn--primary btn--sm" target="_blank" rel="noopener noreferrer">Visit City as a Platform</a>
    ${talkBtn}
  </div>
</div>`;
  }
  return `<div class="case-study-related-product">
  <p class="eyebrow">Related products</p>
  <h3 class="mt-3 h2">See how Focus BC products work in practice</h3>
  <p class="mt-4 text-sm-loose text-muted">Explore City as a Platform and Virtual Venue for city operations and sports event environments.</p>
  <div class="mt-6 flex flex-wrap gap-3">
    <a href="https://www.city-platform.com/" class="btn btn--primary btn--sm" target="_blank" rel="noopener noreferrer">City as a Platform</a>
    <a href="https://www.virtualvenue-events.com/" class="btn btn--secondary-light btn--sm" target="_blank" rel="noopener noreferrer">Virtual Venue</a>
    ${talkBtn}
  </div>
</div>`;
}

function caseStudyMediaBlock(study) {
  const caption =
    study.imageCaption && String(study.imageCaption).trim()
      ? escapeHtml(String(study.imageCaption).trim())
      : "Case study hero visual for operational context, planning, or reporting workflow";
  if (!study.image) {
    return `<figure class="blog-post-figure">
  <div class="blog-post-figure__media blog-post-figure__media--placeholder" role="img" aria-label=""></div>
  <figcaption class="blog-post-figure__caption">${caption}</figcaption>
</figure>`;
  }
  const alt = study.imageAlt || study.headline || study.title;
  return `<figure class="blog-post-figure">
  <div class="blog-post-figure__media media-thumb-cover" role="img" aria-label="${escapeHtml(alt)}">
    <img src="${escapeHtml(study.image)}" alt="${escapeHtml(alt)}" loading="lazy" width="1200" height="600" />
  </div>
  <figcaption class="blog-post-figure__caption">${caption}</figcaption>
</figure>`;
}

function caseStudyPlaceholderBody(study, dateStr, canonical) {
  const h = study.headline || study.title;
  return `<p class="lead">This page is a <strong>case study placeholder</strong> while the full story is migrated from the previous Focus BC site.</p>
<p><strong>${escapeHtml(h)}</strong> — last updated on the public site: <strong>${escapeHtml(dateStr)}</strong> <span class="text-muted">(${escapeHtml(study.lastmod)})</span>. Focus: <strong>${escapeHtml(study.category)}</strong>.</p>
<p>Original location: <a href="${escapeHtml(canonical)}" rel="noopener noreferrer">${escapeHtml(canonical)}</a>.</p>
<h2>What goes here next</h2>
<p>Add client context, challenge, solution, results, quotes, and supporting visuals from the live article. The hero image comes from the sitemap entry for this case study.</p>
<h2>Data source</h2>
<p>Each slug under <code>/focusbc/casestudies/&lt;slug&gt;</code> is defined in <code>data/case-studies.json</code>. Regenerate with <code>node focusbc/scripts/build-case-studies-json.mjs</code>.</p>`;
}

function caseStudyRelatedBlock(related) {
  return related
    .map(
      (r) =>
        `<a href="casestudies/${encodeURIComponent(r.slug)}" class="blog-related-link"><h3 class="h3 blog-related-link__title">${escapeHtml(r.headline || r.title)}</h3><p class="blog-related-link__excerpt text-muted mt-1 text-sm-tight">${escapeHtml(truncate(r.excerpt, 140))}</p></a>`
    )
    .join("");
}

function renderFocusbcCaseStudy(study) {
  const tpl = fs.readFileSync(CASE_STUDY_TEMPLATE, "utf8");
  const canonical = `https://www.focus-bc.com/post/${study.slug}`;
  const ogImage = study.image ? absoluteFocusbcAssetUrl(study.image) : CASE_STUDY_DEFAULT_OG;
  const dateStr = formatBlogDate(study.lastmod);
  const headline = study.headline || study.title;
  const metaDesc = truncate(String(study.excerpt || headline).replace(/\s+/g, " "), 155);
  const related = pickRelatedCases(study.slug, 2);
  const robotsContent = study.index === false ? "noindex, follow" : "index, follow";
  const productArea = productAreaFromStudy(study);
  const heroMetaTail = escapeHtml(heroMetaDetailForStudy(study));
  const readMin = study.readMinutes ?? 5;
  const map = {
    __ROBOTS_CONTENT__: escapeHtml(robotsContent),
    __META_TITLE__: escapeHtml(`${headline} | Focus BC`),
    __META_DESC__: escapeHtml(metaDesc),
    __CANONICAL__: escapeHtml(canonical),
    __OG_TITLE__: escapeHtml(`${headline} | Focus BC`),
    __OG_DESC__: escapeHtml(metaDesc),
    __OG_URL__: escapeHtml(canonical),
    __OG_IMAGE__: escapeHtml(ogImage),
    __TW_TITLE__: escapeHtml(`${headline} | Focus BC`),
    __TW_DESC__: escapeHtml(metaDesc),
    __TW_IMAGE__: escapeHtml(ogImage),
    __CATEGORY__: escapeHtml(study.category),
    __H1__: escapeHtml(headline),
    __LEAD__: escapeHtml(study.excerpt || metaDesc),
    __CLIENT_TYPE__: escapeHtml(study.clientType || "—"),
    __MAIN_FOCUS__: escapeHtml(mainFocusForStudy(study)),
    __PRODUCT_AREA__: escapeHtml(productArea),
    __ASIDE_FOCUS__: escapeHtml(asideFocusForStudy(study)),
    __MEDIA_BLOCK__: caseStudyMediaBlock(study),
    __BODY_HTML__: caseStudyPlaceholderBody(study, dateStr, canonical),
    __RELATED_PRODUCT_BLOCK__: caseStudyRelatedProductHtml(study),
    __ASIDE_CAT__: escapeHtml(study.category),
    __RELATED_BLOCK__: caseStudyRelatedBlock(related),
    __DATE_STR__: escapeHtml(dateStr),
    __READ_MIN__: escapeHtml(String(readMin)),
    __READ_TIME_LABEL__: escapeHtml(`${readMin} minutes`),
  };
  let out = tpl;
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    out = out.split(k).join(map[k]);
  }
  /* Hero meta tail: apply after other tokens so it cannot be skipped if the process had an older map shape; safe because placeholder is not used in JSON copy. */
  out = out.split("__HERO_META_DETAIL__").join(heroMetaTail);
  return out;
}

/* ——— City as a Platform (caap) blog & case studies ——— */
const CAAP_BLOG_JSON = path.join(CAAP_SOURCE, "data", "blog-posts.json");
const CAAP_CASE_JSON = path.join(CAAP_SOURCE, "data", "case-studies.json");
const CAAP_BLOG_TEMPLATE = path.join(CAAP_SOURCE, "blog-post.template.html");
const CAAP_CASE_TEMPLATE = path.join(CAAP_SOURCE, "case-study.template.html");
let caapBlogPosts = [];
const caapBlogBySlug = new Map();
let caapCaseStudies = [];
const caapCaseBySlug = new Map();

function loadCaapBlogIndex() {
  caapBlogPosts = [];
  caapBlogBySlug.clear();
  try {
    const raw = fs.readFileSync(CAAP_BLOG_JSON, "utf8");
    const j = JSON.parse(raw);
    caapBlogPosts = Array.isArray(j.posts) ? j.posts : [];
    for (const p of caapBlogPosts) {
      if (p && typeof p.slug === "string") caapBlogBySlug.set(p.slug, p);
    }
  } catch {
    /* optional */
  }
}

function loadCaapCaseStudiesIndex() {
  caapCaseStudies = [];
  caapCaseBySlug.clear();
  try {
    const raw = fs.readFileSync(CAAP_CASE_JSON, "utf8");
    const j = JSON.parse(raw);
    caapCaseStudies = Array.isArray(j.studies) ? j.studies : [];
    for (const s of caapCaseStudies) {
      if (s && typeof s.slug === "string") caapCaseBySlug.set(s.slug, s);
    }
  } catch {
    /* optional */
  }
}

loadCaapBlogIndex();
loadCaapCaseStudiesIndex();

function pickRelatedCaapPosts(currentSlug, n = 2) {
  return caapBlogPosts
    .filter((p) => p.slug !== currentSlug)
    .sort((a, b) => String(b.lastmod).localeCompare(String(a.lastmod)))
    .slice(0, n);
}

function pickRelatedCaapCases(currentSlug, n = 2) {
  return caapCaseStudies
    .filter((s) => s.slug !== currentSlug)
    .sort((a, b) => String(b.lastmod).localeCompare(String(a.lastmod)))
    .slice(0, n);
}

function caapBlogPlaceholderBody(post, dateStr, canonical) {
  return `<p class="lead">This page is a <strong>placeholder</strong> while the full article is migrated from <a href="https://www.city-platform.com/" rel="noopener noreferrer">city-platform.com</a>.</p>
<p><strong>${escapeHtml(post.title)}</strong> — last updated on the public site: <strong>${escapeHtml(dateStr)}</strong> <span class="text-muted">(${escapeHtml(post.lastmod)})</span>. Category: <strong>${escapeHtml(post.category)}</strong>.</p>
<p>Original location: <a href="${escapeHtml(canonical)}" rel="noopener noreferrer">${escapeHtml(canonical)}</a>.</p>
<h2>What goes here next</h2>
<p>Replace this block with the full article body from your CMS or static source. The hero image comes from the Wix sitemap entry for this post.</p>`;
}

function caapCasePlaceholderBody(study, dateStr, canonical) {
  const h = study.headline || study.title;
  return `<p class="lead">This page is a <strong>case study placeholder</strong> while the full story is migrated from <a href="https://www.city-platform.com/" rel="noopener noreferrer">city-platform.com</a>.</p>
<p><strong>${escapeHtml(h)}</strong> — last updated on the public site: <strong>${escapeHtml(dateStr)}</strong> <span class="text-muted">(${escapeHtml(study.lastmod)})</span>. Focus: <strong>${escapeHtml(study.category)}</strong>.</p>
<p>Original location: <a href="${escapeHtml(canonical)}" rel="noopener noreferrer">${escapeHtml(canonical)}</a>.</p>
<h2>What goes here next</h2>
<p>Add client context, challenge, solution, results, and quotes from the live article.</p>`;
}

function caapBlogRelatedBlock(related) {
  return related
    .map(
      (r) =>
        `<a href="blog/${encodeURIComponent(r.slug)}"><h3 class="h3">${escapeHtml(r.title)}</h3><p class="text-muted mt-1 text-sm-tight">${escapeHtml(truncate(r.excerpt, 140))}</p></a>`
    )
    .join("");
}

function caapCaseRelatedBlock(related) {
  return related
    .map(
      (r) =>
        `<a href="casestudies/${encodeURIComponent(r.slug)}"><h3 class="h3">${escapeHtml(r.headline || r.title)}</h3><p class="text-muted mt-1 text-sm-tight">${escapeHtml(truncate(r.excerpt, 140))}</p></a>`
    )
    .join("");
}

function renderCaapBlogPost(post) {
  const tpl = fs.readFileSync(CAAP_BLOG_TEMPLATE, "utf8");
  const canonical = `https://www.city-platform.com/post/${post.slug}`;
  const ogImage = post.image || "media/caap-logo.png";
  const dateStr = formatBlogDate(post.lastmod);
  const metaDesc = truncate(String(post.excerpt || post.title).replace(/\s+/g, " "), 155);
  const related = pickRelatedCaapPosts(post.slug, 2);
  const map = {
    __META_TITLE__: escapeHtml(`${post.title} | City as a Platform`),
    __META_DESC__: escapeHtml(metaDesc),
    __CANONICAL__: escapeHtml(canonical),
    __OG_TITLE__: escapeHtml(`${post.title} | City as a Platform`),
    __OG_DESC__: escapeHtml(metaDesc),
    __OG_URL__: escapeHtml(canonical),
    __OG_IMAGE__: escapeHtml(ogImage),
    __TW_TITLE__: escapeHtml(`${post.title} | City as a Platform`),
    __TW_DESC__: escapeHtml(metaDesc),
    __TW_IMAGE__: escapeHtml(ogImage),
    __CATEGORY__: escapeHtml(post.category),
    __DATE_STR__: escapeHtml(dateStr),
    __READ_MIN__: escapeHtml(String(post.readMinutes ?? 5)),
    __H1__: escapeHtml(post.title),
    __LEAD__: escapeHtml(post.excerpt || metaDesc),
    __MEDIA_BLOCK__: blogMediaBlock(post),
    __BODY_HTML__: caapBlogPlaceholderBody(post, dateStr, canonical),
    __ASIDE_CAT__: escapeHtml(post.category),
    __READ_TIME_LABEL__: escapeHtml(`${post.readMinutes ?? 5} minutes`),
    __RELATED_BLOCK__: caapBlogRelatedBlock(related),
  };
  let out = tpl;
  for (const [k, v] of Object.entries(map)) {
    out = out.split(k).join(v);
  }
  return out;
}

function renderCaapCaseStudy(study) {
  const tpl = fs.readFileSync(CAAP_CASE_TEMPLATE, "utf8");
  const canonical = `https://www.city-platform.com/post/${study.slug}`;
  const ogImage = study.image || "media/caap-logo.png";
  const dateStr = formatBlogDate(study.lastmod);
  const headline = study.headline || study.title;
  const metaDesc = truncate(String(study.excerpt || headline).replace(/\s+/g, " "), 155);
  const related = pickRelatedCaapCases(study.slug, 2);
  const map = {
    __META_TITLE__: escapeHtml(`${headline} | City as a Platform`),
    __META_DESC__: escapeHtml(metaDesc),
    __CANONICAL__: escapeHtml(canonical),
    __OG_TITLE__: escapeHtml(`${headline} | City as a Platform`),
    __OG_DESC__: escapeHtml(metaDesc),
    __OG_URL__: escapeHtml(canonical),
    __OG_IMAGE__: escapeHtml(ogImage),
    __TW_TITLE__: escapeHtml(`${headline} | City as a Platform`),
    __TW_DESC__: escapeHtml(metaDesc),
    __TW_IMAGE__: escapeHtml(ogImage),
    __CATEGORY__: escapeHtml(study.category),
    __DATE_STR__: escapeHtml(dateStr),
    __READ_MIN__: escapeHtml(String(study.readMinutes ?? 5)),
    __H1__: escapeHtml(headline),
    __LEAD__: escapeHtml(study.excerpt || metaDesc),
    __MEDIA_BLOCK__: caseStudyMediaBlock(study),
    __BODY_HTML__: caapCasePlaceholderBody(study, dateStr, canonical),
    __ASIDE_CAT__: escapeHtml(study.category),
    __READ_TIME_LABEL__: escapeHtml(`${study.readMinutes ?? 5} minutes`),
    __RELATED_BLOCK__: caapCaseRelatedBlock(related),
  };
  let out = tpl;
  for (const [k, v] of Object.entries(map)) {
    out = out.split(k).join(v);
  }
  return out;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

function mimeFor(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

/** Ensure resolved path stays under root (no path traversal). */
function underRoot(root, absPath) {
  const r = path.resolve(root) + path.sep;
  const p = path.resolve(absPath);
  return p === root || p.startsWith(r);
}

function injectBase(html, baseHref) {
  if (/<base\s/i.test(html)) return html;
  return html.replace(/<head(\s[^>]*)?>/i, `<head$1>\n    <base href="${baseHref}" />`);
}

/** Map /focusbc/foo.html → canonical path without .html (query string added by caller). */
function focusbcCanonicalFromHtmlRest(rest) {
  if (!rest.endsWith(".html") || rest.includes("/") || rest.includes("..")) return null;
  const name = rest.slice(0, -".html".length);
  if (name === "index") return "/focusbc/";
  if (name === "case-studies") return "/focusbc/casestudies";
  if (name === "case-study") return "/focusbc/casestudies/study";
  if (name === "blog-post") return "/focusbc/blog";
  if (/^[a-z][a-z0-9-]*$/i.test(name)) return `/focusbc/${name}`;
  return null;
}

/**
 * Map URL segments after /focusbc to a file inside public/focusbc/.
 * @returns {string|null} absolute file path or null
 */
function resolveFocusbcFile(segments) {
  if (segments.length === 0) {
    return path.join(FOCUSBC_OUTPUT, "index.html");
  }

  const [a] = segments;

  if (a === "blog") {
    if (segments.length === 1) return path.join(FOCUSBC_OUTPUT, "blog", "index.html");
    if (segments.length === 2 && segments[1]) {
      const slug = segments[1];
      const dirIdx = path.join(FOCUSBC_OUTPUT, "blog", slug, "index.html");
      if (fs.existsSync(dirIdx) && fs.statSync(dirIdx).isFile()) return dirIdx;
      const flat = path.join(
        FOCUSBC_OUTPUT,
        "blog",
        slug.endsWith(".html") ? slug : `${slug}.html`
      );
      if (fs.existsSync(flat) && fs.statSync(flat).isFile()) return flat;
    }
    return null;
  }

  if (a === "casestudies" || a === "case-studies") {
    if (segments.length === 1) return path.join(FOCUSBC_OUTPUT, "case-studies", "index.html");
    return null;
  }

  const single = {
    about: path.join("about", "index.html"),
    careers: path.join("careers", "index.html"),
    google: path.join("google", "index.html"),
    contact: path.join("contact", "index.html"),
  };

  if (segments.length === 1 && single[a]) {
    return path.join(FOCUSBC_OUTPUT, single[a]);
  }

  const rel = path.join(...segments);
  if (rel.includes("..")) return null;
  const candidate = path.join(FOCUSBC_OUTPUT, rel);
  if (!underRoot(FOCUSBC_OUTPUT, candidate)) return null;
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return candidate;
  }

  return null;
}

function resolveCaapFile(segments) {
  if (segments.length === 0) {
    return path.join(CAAP_STATIC, "index.html");
  }
  const [a] = segments;
  if (a === "blog" && segments.length === 1) {
    const dirIdx = path.join(CAAP_STATIC, "blog", "index.html");
    if (fs.existsSync(dirIdx)) return dirIdx;
    const legacy = path.join(CAAP_STATIC, "blog.html");
    if (fs.existsSync(legacy)) return legacy;
    return null;
  }
  if ((a === "casestudies" || a === "case-studies") && segments.length === 1) {
    const dirIdx = path.join(CAAP_STATIC, "case-studies", "index.html");
    if (fs.existsSync(dirIdx)) return dirIdx;
    const legacy = path.join(CAAP_STATIC, "case-studies.html");
    if (fs.existsSync(legacy)) return legacy;
    return null;
  }
  const caapSingle = {
    about: ["about", "index.html"],
    partners: ["partners", "index.html"],
  };
  if (segments.length === 1 && caapSingle[a]) {
    const idx = path.join(CAAP_STATIC, ...caapSingle[a]);
    if (fs.existsSync(idx)) return idx;
    const legacy = path.join(CAAP_STATIC, `${a}.html`);
    if (fs.existsSync(legacy)) return legacy;
    return null;
  }
  /* Case-insensitive top-level folders (Linux servers); blog/casestudies slugs stay as-is. */
  const caapFoldableRoots = new Set(["products", "solutions", "data", "media", "js"]);
  let folded =
    segments[0] && caapFoldableRoots.has(segments[0].toLowerCase())
      ? [segments[0].toLowerCase(), ...segments.slice(1)]
      : segments;
  if (folded[0] === "products" || folded[0] === "solutions") {
    folded = [folded[0], ...folded.slice(1).map((s) => s.toLowerCase())];
  }
  const rel = path.join(...folded);
  if (rel.includes("..")) return null;
  const candidate = path.join(CAAP_STATIC, rel);
  if (!underRoot(CAAP_STATIC, candidate)) return null;
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return candidate;
  }
  if (!path.extname(candidate)) {
    const asIndex = path.join(candidate, "index.html");
    if (fs.existsSync(asIndex) && fs.statSync(asIndex).isFile()) {
      return asIndex;
    }
    const withHtml = `${candidate}.html`;
    if (fs.existsSync(withHtml) && fs.statSync(withHtml).isFile()) {
      return withHtml;
    }
  }
  return null;
}

function sendFile(res, filePath, { injectBaseHref = null } = {}) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end("Internal Server Error");
      return;
    }
    let body = data;
    const ext = path.extname(filePath).toLowerCase();
    if (ext === ".html" && injectBaseHref) {
      body = Buffer.from(injectBase(String(data, "utf8"), injectBaseHref), "utf8");
    }
    res.writeHead(200, {
      "Content-Type": mimeFor(filePath),
      "Content-Length": Buffer.byteLength(body),
    });
    res.end(body);
  });
}

function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405);
    res.end();
    return;
  }

  let url;
  try {
    url = new URL(req.url || "/", `http://localhost:${PORT}`);
  } catch {
    res.writeHead(400);
    res.end("Bad Request");
    return;
  }

  let pathname = decodeURIComponent(url.pathname);
  if (!pathname.startsWith("/")) pathname = "/" + pathname;
  /* Collapse duplicate slashes so /caap//products/foo still routes. */
  pathname = pathname.replace(/\/{2,}/g, "/");

  /* Normalize /CAAP/... → /caap/... so routing always matches (some clients vary case). */
  if (pathname.length >= 6 && pathname.slice(0, 6).toLowerCase() === "/caap/") {
    pathname = "/caap/" + pathname.slice(6);
  }

  // Friendly aliases (hyphenated filename vs extensionless route)
  if (pathname === "/caap/case-studies" || pathname === "/caap/case-studies/") {
    res.writeHead(302, { Location: "/caap/casestudies" + url.search });
    res.end();
    return;
  }
  if (pathname === "/caap/blog.html" || pathname === "/caap/case-studies.html") {
    const loc = pathname.includes("blog") ? "/caap/blog" : "/caap/casestudies";
    res.writeHead(302, { Location: loc + url.search });
    res.end();
    return;
  }

  // Normalize: redirect /focusbc and /caap to trailing slash for consistent relative URLs
  if (pathname === "/focusbc") {
    res.writeHead(302, { Location: "/focusbc/" });
    res.end();
    return;
  }
  if (pathname.toLowerCase() === "/caap") {
    res.writeHead(302, { Location: "/caap/" });
    res.end();
    return;
  }

  /* Site-root /media/… → public/focusbc/media, then focusbc/media, then caap/media. */
  if (pathname.startsWith("/media/")) {
    const rel = pathname.slice("/media/".length);
    if (!rel || rel.includes("..")) {
      res.writeHead(400);
      res.end("Bad Request");
      return;
    }
    const outMedia = path.join(FOCUSBC_OUTPUT, "media");
    const focusMedia = path.join(FOCUSBC, "media");
    const caapMedia = path.join(CAAP_STATIC, "media");
    const fOut = path.join(outMedia, rel);
    const fFocus = path.join(focusMedia, rel);
    const fCaap = path.join(caapMedia, rel);
    const pick =
      fs.existsSync(fOut) && underRoot(outMedia, fOut)
        ? fOut
        : fs.existsSync(fFocus) && underRoot(focusMedia, fFocus)
          ? fFocus
          : fs.existsSync(fCaap) && underRoot(caapMedia, fCaap)
            ? fCaap
            : null;
    if (pick) {
      sendFile(res, pick, {});
      return;
    }
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  /* Root /js/… → Focus BC built scripts (e.g. blog-list.js; pairs with /styles/…). */
  if (pathname.startsWith("/js/")) {
    const rel = pathname.slice("/js/".length);
    if (!rel || rel.includes("..")) {
      res.writeHead(400);
      res.end("Bad Request");
      return;
    }
    const jsRoot = path.join(FOCUSBC_OUTPUT, "js");
    const f = path.join(jsRoot, rel);
    if (fs.existsSync(f) && underRoot(jsRoot, f) && fs.statSync(f).isFile()) {
      sendFile(res, f, {});
      return;
    }
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  /* Bucket-style /styles/… (Focus BC static build uses root-absolute CSS paths). */
  if (pathname.startsWith("/styles/")) {
    const rel = pathname.slice("/styles/".length);
    if (!rel || rel.includes("..")) {
      res.writeHead(400);
      res.end("Bad Request");
      return;
    }
    const stylesRoot = path.join(FOCUSBC_OUTPUT, "styles");
    const f = path.join(stylesRoot, rel);
    if (fs.existsSync(f) && underRoot(stylesRoot, f) && fs.statSync(f).isFile()) {
      sendFile(res, f, {});
      return;
    }
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  if (pathname === "/" || pathname === "") {
    const hubPath = path.join(__dirname, "public", "index.html");
    if (fs.existsSync(hubPath)) {
      sendFile(res, hubPath, {});
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><title>Websites (local)</title></head>
<body style="font-family:system-ui,sans-serif;max-width:40rem;margin:2rem">
  <h1>Local sites</h1>
  <ul>
    <li><a href="/focusbc/">Focus BC</a></li>
    <li><a href="/caap/">City as a Platform</a></li>
  </ul>
  <p>Port ${PORT}</p>
</body>
</html>`);
    return;
  }

  if (pathname.startsWith("/focusbc/")) {
    const rest = pathname.slice("/focusbc/".length);
    const canonical = focusbcCanonicalFromHtmlRest(rest);
    if (canonical) {
      res.writeHead(302, { Location: canonical + url.search });
      res.end();
      return;
    }
    /* Only the first segment is the route alias (case-studies → casestudies). Do not rewrite
       deeper segments or /focusbc/media/case-studies/… breaks (disk uses case-studies/). */
    const parts = rest.split("/").filter(Boolean);
    const segments =
      parts.length === 0 ? [] : [parts[0] === "case-studies" ? "casestudies" : parts[0], ...parts.slice(1)];

    if (segments[0] === "casestudies" && segments.length === 2 && segments[1]) {
      const slug = segments[1];
      /* Prefer npm-built HTML (case-studies-built → public/focusbc/case-studies/) over JSON
         templates: templates use CAAP-relative assets (styles.css, caap-logo.png) and break
         under /focusbc/ even with <base>. */
      const staticCaseDir = path.join(FOCUSBC_OUTPUT, "case-studies", slug, "index.html");
      if (fs.existsSync(staticCaseDir)) {
        if (req.method === "HEAD") {
          res.writeHead(200, { "Content-Type": mimeFor(staticCaseDir) });
          res.end();
          return;
        }
        sendFile(res, staticCaseDir, { injectBaseHref: "/focusbc/" });
        return;
      }
      const staticCasePath = path.join(
        FOCUSBC_OUTPUT,
        "case-studies",
        slug.endsWith(".html") ? slug : `${slug}.html`
      );
      if (fs.existsSync(staticCasePath)) {
        if (req.method === "HEAD") {
          res.writeHead(200, { "Content-Type": mimeFor(staticCasePath) });
          res.end();
          return;
        }
        sendFile(res, staticCasePath, { injectBaseHref: "/focusbc/" });
        return;
      }
      if (slug === "study") {
        const demoPath = path.join(FOCUSBC_OUTPUT, "case-studies", "case-study-1.html");
        if (fs.existsSync(demoPath)) {
          if (req.method === "HEAD") {
            res.writeHead(200, { "Content-Type": mimeFor(demoPath) });
            res.end();
            return;
          }
          sendFile(res, demoPath, { injectBaseHref: "/focusbc/" });
          return;
        }
      }
      const study = caseBySlug.get(slug);
      if (study) {
        if (req.method === "HEAD") {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end();
          return;
        }
        try {
          const html = renderFocusbcCaseStudy(study);
          const body = Buffer.from(injectBase(html, "/focusbc/"), "utf8");
          res.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8",
            "Content-Length": body.length,
          });
          res.end(body);
        } catch {
          res.writeHead(500);
          res.end("Internal Server Error");
        }
        return;
      }
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    if (segments[0] === "blog" && segments.length === 2 && segments[1]) {
      const slug = segments[1];
      if (slug === "post") {
        res.writeHead(302, { Location: "/focusbc/blog" + url.search });
        res.end();
        return;
      }
      const staticBlogDir = path.join(FOCUSBC_OUTPUT, "blog", slug, "index.html");
      if (fs.existsSync(staticBlogDir)) {
        if (req.method === "HEAD") {
          res.writeHead(200, { "Content-Type": mimeFor(staticBlogDir) });
          res.end();
          return;
        }
        sendFile(res, staticBlogDir, { injectBaseHref: "/focusbc/" });
        return;
      }
      const staticBlogPath = path.join(
        FOCUSBC_OUTPUT,
        "blog",
        slug.endsWith(".html") ? slug : `${slug}.html`
      );
      if (fs.existsSync(staticBlogPath)) {
        if (req.method === "HEAD") {
          res.writeHead(200, { "Content-Type": mimeFor(staticBlogPath) });
          res.end();
          return;
        }
        sendFile(res, staticBlogPath, { injectBaseHref: "/focusbc/" });
        return;
      }
      const post = blogBySlug.get(slug);
      if (post) {
        if (req.method === "HEAD") {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end();
          return;
        }
        try {
          const html = renderFocusbcBlogPost(post);
          const body = Buffer.from(injectBase(html, "/focusbc/"), "utf8");
          res.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8",
            "Content-Length": body.length,
          });
          res.end(body);
        } catch (e) {
          res.writeHead(500);
          res.end("Internal Server Error");
        }
        return;
      }
      if (caseBySlug.has(slug)) {
        res.writeHead(302, {
          Location: "/focusbc/casestudies/" + encodeURIComponent(slug) + url.search,
        });
        res.end();
        return;
      }
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    const filePath = resolveFocusbcFile(segments);
    if (!filePath || !fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }
    const send = () => {
      if (req.method === "HEAD") {
        res.writeHead(200, { "Content-Type": mimeFor(filePath) });
        res.end();
        return;
      }
      const inject =
        path.extname(filePath).toLowerCase() === ".html" ? "/focusbc/" : null;
      sendFile(res, filePath, { injectBaseHref: inject });
    };
    send();
    return;
  }

  if (pathname.startsWith("/caap/")) {
    const rest = pathname.slice("/caap/".length);
    if (rest === "index.html") {
      res.writeHead(302, { Location: "/caap/" + url.search });
      res.end();
      return;
    }
    const segments = rest.split("/").filter(Boolean);

    if (segments[0] === "casestudies" && segments.length === 2 && segments[1]) {
      const slug = segments[1];
      const study = caapCaseBySlug.get(slug);
      if (study) {
        if (req.method === "HEAD") {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end();
          return;
        }
        try {
          const html = renderCaapCaseStudy(study);
          const body = Buffer.from(injectBase(html, "/caap/"), "utf8");
          res.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8",
            "Content-Length": body.length,
          });
          res.end(body);
        } catch {
          res.writeHead(500);
          res.end("Internal Server Error");
        }
        return;
      }
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    if (segments[0] === "blog" && segments.length === 2 && segments[1]) {
      const slug = segments[1];
      if (caapCaseBySlug.has(slug)) {
        res.writeHead(302, {
          Location: "/caap/casestudies/" + encodeURIComponent(slug) + url.search,
        });
        res.end();
        return;
      }
      const post = caapBlogBySlug.get(slug);
      if (post) {
        if (req.method === "HEAD") {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end();
          return;
        }
        try {
          const html = renderCaapBlogPost(post);
          const body = Buffer.from(injectBase(html, "/caap/"), "utf8");
          res.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8",
            "Content-Length": body.length,
          });
          res.end(body);
        } catch {
          res.writeHead(500);
          res.end("Internal Server Error");
        }
        return;
      }
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    const filePath = resolveCaapFile(segments);
    if (!filePath) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }
    if (req.method === "HEAD") {
      res.writeHead(200, { "Content-Type": mimeFor(filePath) });
      res.end();
      return;
    }
    const inject =
      path.extname(filePath).toLowerCase() === ".html" ? "/caap/" : null;
    sendFile(res, filePath, { injectBaseHref: inject });
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
}

const server = http.createServer(handler);
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use (another process is listening).\n` +
        `Stop that server first, or from a terminal run:\n` +
        `  lsof -i :${PORT}\n` +
        `  kill <PID>     # use the PID from the LISTEN row\n` +
        `Or: kill $(lsof -ti :${PORT})`
    );
    process.exit(1);
  }
  throw err;
});
server.listen(PORT, () => {
  console.log(`Websites server listening on http://localhost:${PORT}`);
  console.log(`  Focus BC:  http://localhost:${PORT}/focusbc/`);
  console.log(`  CAAP:      http://localhost:${PORT}/caap/`);
});
