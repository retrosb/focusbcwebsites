/**
 * Server + build: render Focus BC blog post HTML from blog-post.template.html.
 * Optional imported Wix body: extract with extractImportedBlogBodyHtml() from blog-built HTML.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decodeHtmlEntities } from "./decode-html-entities.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FOCUSBC_ROOT = path.join(__dirname, "..");
const BLOG_TEMPLATE = path.join(FOCUSBC_ROOT, "blog-post.template.html");
const BLOG_JSON = path.join(FOCUSBC_ROOT, "data", "blog-posts.json");
const BLOG_DEFAULT_OG = "https://www.focus-bc.com/media/og-blog-post.jpg";

function absoluteFocusbcAssetUrl(rel) {
  if (!rel) return "";
  const s = String(rel).trim();
  if (/^https?:\/\//i.test(s)) return s;
  return `https://www.focus-bc.com/${s.replace(/^\/+/, "")}`;
}

/** Root-relative path for <img src> under /focusbc/blog/slug/. */
function focusbcAssetPath(rel) {
  if (!rel) return "";
  const s = String(rel).trim();
  if (/^https?:\/\//i.test(s)) return s;
  return `/${s.replace(/^\/+/, "")}`;
}

function escapeHtml(s) {
  const t = decodeHtmlEntities(String(s));
  return t
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

function blogDateIso(iso) {
  const s = String(iso || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return "";
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

function pickRelatedPosts(allPosts, currentSlug, n = 2) {
  return allPosts
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
  const src = escapeHtml(focusbcAssetPath(post.image));
  return `<figure class="blog-post-figure">
  <div class="blog-post-figure__media media-thumb-cover" role="img" aria-label="${escapeHtml(alt)}">
    <img src="${src}" alt="${escapeHtml(alt)}" loading="lazy" width="1200" height="600" />
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

function blogRelatedSectionHtml(related) {
  if (!related.length) return "";
  return `<div class="blog-post-related">
  <p class="eyebrow" data-i18n="blog.relatedArticles">Related articles</p>
  <div class="blog-post-related-stack mt-6">${blogRelatedBlock(related)}</div>
</div>`;
}

function blogAsideTopicsRow(post) {
  const raw = focusTopicsForPost(post);
  const t = String(raw || "").trim();
  if (!t) return "";
  return `<li class="mt-2"><strong class="text-ink" data-i18n="blog.asideTopics">Topics:</strong> ${escapeHtml(t)}</li>`;
}

/** Subhead under title: prefer editorial description, not image-alt masquerading as excerpt. */
function blogPostLead(post, metaDesc) {
  const d = String(post.description || "").trim();
  if (d) return truncate(d.replace(/\s+/g, " "), 320);
  const ex = String(post.excerpt || "").trim();
  const alt = String(post.imageAlt || "").trim();
  if (ex && alt && ex === alt) {
    return truncate(metaDesc, 220);
  }
  return truncate((ex || metaDesc).replace(/\s+/g, " "), 320);
}

function loadBlogPostsFromDisk() {
  try {
    const raw = fs.readFileSync(BLOG_JSON, "utf8");
    const j = JSON.parse(raw);
    return Array.isArray(j.posts) ? j.posts : [];
  } catch {
    return [];
  }
}

/**
 * Inner HTML inside the imported Wix prose wrapper (first matching outer div).
 */
export function extractImportedBlogBodyHtml(html) {
  const needle = "case-study-import-body";
  const i = html.indexOf(needle);
  if (i === -1) return null;
  const openStart = html.lastIndexOf("<div", i);
  if (openStart === -1) return null;
  const tagEnd = html.indexOf(">", openStart);
  if (tagEnd === -1) return null;
  let pos = tagEnd + 1;
  let depth = 1;
  const len = html.length;
  while (pos < len && depth > 0) {
    const nextOpen = html.indexOf("<div", pos);
    const nextClose = html.indexOf("</div>", pos);
    if (nextClose === -1) return null;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      pos = nextOpen + 4;
    } else {
      depth--;
      if (depth === 0) {
        return html.slice(tagEnd + 1, nextClose);
      }
      pos = nextClose + 6;
    }
  }
  return null;
}

/**
 * @param {object} post - entry from blog-posts.json
 * @param {{ bodyHtml?: string, allPosts?: object[] }} [options]
 */
export function renderFocusbcBlogPost(post, options = {}) {
  const tpl = fs.readFileSync(BLOG_TEMPLATE, "utf8");
  const canonical = `https://www.focus-bc.com/post/${post.slug}`;
  const ogImage = post.image ? absoluteFocusbcAssetUrl(post.image) : BLOG_DEFAULT_OG;
  const dateStr = formatBlogDate(post.lastmod);
  const dateIso = blogDateIso(post.lastmod);
  const dateHtml = dateIso
    ? `<time datetime="${escapeHtml(dateIso)}">${escapeHtml(dateStr)}</time>`
    : `<span>${escapeHtml(dateStr)}</span>`;
  const summarySource = String(post.description || post.excerpt || post.title).replace(/\s+/g, " ");
  const metaDesc = truncate(summarySource, 155);
  const allPosts = options.allPosts ?? loadBlogPostsFromDisk();
  const related = pickRelatedPosts(allPosts, post.slug, 2);
  const robotsContent = post.index === false ? "noindex, follow" : "index, follow";
  const hasImportedBody =
    options.bodyHtml != null && String(options.bodyHtml).trim() !== "";
  const bodyInner = hasImportedBody
    ? String(options.bodyHtml)
    : blogPlaceholderBody(post, dateStr, canonical);
  const leadHtml = blogPostLead(post, metaDesc);
  const mediaSection = hasImportedBody
    ? ""
    : `<div class="blog-post-page-media">${blogMediaBlock(post)}</div>`;
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
    __CATEGORY__: escapeHtml(post.category),
    __DATE_STR__: escapeHtml(dateStr),
    __DATE_HTML__: dateHtml,
    __READ_MIN__: escapeHtml(String(post.readMinutes ?? 5)),
    __H1__: escapeHtml(post.title),
    __LEAD__: escapeHtml(leadHtml),
    __MEDIA_SECTION__: mediaSection,
    __BODY_HTML__: bodyInner,
    __ASIDE_CAT__: escapeHtml(post.category),
    __READ_TIME_LABEL__: escapeHtml(`${post.readMinutes ?? 5} minutes`),
    __ASIDE_TOPICS_ROW__: blogAsideTopicsRow(post),
    __RELATED_SECTION__: blogRelatedSectionHtml(related),
  };
  let out = tpl;
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    out = out.split(k).join(map[k]);
  }
  return out;
}
