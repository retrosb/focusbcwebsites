/**
 * Static site build: reads HTML/CSS from focusbc/sources/, writes to FOCUSBC_OUT (default public/focusbc).
 * Run from repo root: node focusbc/build.mjs
 *
 * Set FOCUSBC_BASE_PATH=/focusbc when the site is deployed under a subpath (Cloudflare Pages hub).
 * URLs use directory style (/blog/slug/, /case-studies/slug/) without *.html in navigation.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.FOCUSBC_OUT
  ? path.resolve(process.env.FOCUSBC_OUT)
  : path.join(__dirname, "..", "public", "focusbc");
const baseEnv = process.env.FOCUSBC_BASE_PATH;
let BASE = baseEnv !== undefined ? String(baseEnv).replace(/\/$/, "") : "";
if (BASE === "" && baseEnv === undefined && /[/\\]public[/\\]focusbc$/i.test(ROOT)) {
  BASE = "/focusbc";
}

function absUrl(p) {
  const u = p.startsWith("/") ? p : `/${p}`;
  return BASE ? `${BASE}${u}` : u;
}

function applyBasePrefix(html) {
  if (!BASE) return html;
  const prefix = BASE.endsWith("/") ? BASE.slice(0, -1) : BASE;
  const alreadyPrefixed = (p) => p === prefix || p.startsWith(`${prefix}/`);
  let s = html;
  s = s.replace(/href="\/"/g, `href="${prefix}/"`);
  s = s.replace(/href="(\/(?!\/)[^"#?]*)"/g, (m, p) => {
    if (/^https?:/i.test(p) || alreadyPrefixed(p)) return m;
    return `href="${prefix}${p}"`;
  });
  s = s.replace(/src="(\/(?!\/)[^"]*)"/g, (m, p) => {
    if (/^https?:/i.test(p) || alreadyPrefixed(p)) return m;
    return `src="${prefix}${p}"`;
  });
  return s;
}
const SOURCES = path.join(__dirname, "sources");
const MEDIA_SRC = path.join(__dirname, "media");

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function copyFile(from, to) {
  ensureDir(path.dirname(to));
  fs.copyFileSync(from, to);
}

function copyTree(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.cpSync(src, dest, { recursive: true });
}

const LANG_SWITCH_DESKTOP = '<div class="lang-switch lang-switch--desktop" data-lang-switch></div>';
const LANG_SWITCH_MOBILE = '<div class="lang-switch lang-switch--mobile" data-lang-switch></div>';

/**
 * Blog/case-study built HTML: add language switch, data-i18n hooks, i18n script.
 * Sources pages already include these; skip if present.
 */
function injectFocusBuiltI18n(html) {
  if (html.includes("data-lang-switch")) return html;
  const scriptSrc = BASE ? `${BASE}/js/i18n.js` : "/js/i18n.js";

  html = html.replace(
    /<a href="#main-content" class="skip-link">Skip to main content<\/a>/,
    '<a href="#main-content" class="skip-link" data-i18n="skipLink">Skip to main content</a>'
  );

  html = html.replace(
    /<summary class="site-nav-mobile__toggle">Menu<\/summary>/,
    '<summary class="site-nav-mobile__toggle" data-i18n="nav.menu">Menu</summary>'
  );

  html = html.replace(
    /(<nav class="site-nav-desktop"[^>]*>[\s\S]*?<\/nav>)\s*\n\s*(<a href="[^"]*" class="btn btn--primary btn--sm btn--header">)/,
    `$1\n        ${LANG_SWITCH_DESKTOP}\n        $2`
  );

  html = html.replace(
    /(<nav class="site-nav-mobile__panel"[^>]*>)\s*\n\s*(<a href)/,
    `$1\n            ${LANG_SWITCH_MOBILE}\n            $2`
  );

  html = html.replace(
    /<a href="([^"]*\/about\/)"([^>]*)>About<\/a>/g,
    '<a href="$1"$2 data-i18n="nav.about">About</a>'
  );
  html = html.replace(
    /<a href="([^"]*\/google\/)"([^>]*)>Google<\/a>/g,
    '<a href="$1"$2 data-i18n="nav.google">Google</a>'
  );
  html = html.replace(
    /<a href="([^"]*\/case-studies\/)"([^>]*)>Case studies<\/a>/g,
    '<a href="$1"$2 data-i18n="nav.caseStudies">Case studies</a>'
  );
  html = html.replace(
    /<a href="([^"]*\/blog\/)"([^>]*)>Blog<\/a>/g,
    '<a href="$1"$2 data-i18n="nav.blog">Blog</a>'
  );
  html = html.replace(
    /<a href="([^"]*\/careers\/)"([^>]*)>Careers<\/a>/g,
    '<a href="$1"$2 data-i18n="nav.careers">Careers</a>'
  );
  html = html.replace(
    /<a href="([^"]*\/contact\/)"([^>]*)>Contact<\/a>/g,
    '<a href="$1"$2 data-i18n="nav.contact">Contact</a>'
  );

  html = html.replace(
    /<a href="([^"]*\/contact\/)" class="btn btn--primary btn--sm btn--header">Talk to us<\/a>/,
    '<a href="$1" class="btn btn--primary btn--sm btn--header" data-i18n="cta.talkToUs">Talk to us</a>'
  );

  html = html.replace(
    /<p class="site-footer__strap-tagline">\s*/,
    '<p class="site-footer__strap-tagline" data-i18n-html="footer.strapTagline">'
  );
  html = html.replace(
    /<p class="site-footer__strap-note">Focus BC · Google Premier Partner · Lisbon<\/p>/,
    '<p class="site-footer__strap-note" data-i18n="footer.strapNote">Focus BC · Google Premier Partner · Lisbon</p>'
  );
  html = html.replace(
    /<a href="([^"]*\/contact\/)" class="btn btn--white btn--sm shrink-0">Talk to us<\/a>/,
    '<a href="$1" class="btn btn--white btn--sm shrink-0" data-i18n="cta.talkToUs">Talk to us</a>'
  );

  html = html.replace(
    /<p class="footer-tagline footer-tagline--compact">\s*/,
    '<p class="footer-tagline footer-tagline--compact" data-i18n-html="footer.taglineCompact">'
  );
  html = html.replace(
    /<p class="footer-tagline">\s*Operational platforms/s,
    '<p class="footer-tagline" data-i18n-html="footer.tagline">Operational platforms'
  );

  html = html.replace(
    /<h3 class="site-footer__heading">Company<\/h3>/g,
    '<h3 class="site-footer__heading" data-i18n="footer.companyHeading">Company</h3>'
  );
  html = html.replace(
    /<h3 class="site-footer__heading">Offers<\/h3>/g,
    '<h3 class="site-footer__heading" data-i18n="footer.offersHeading">Offers</h3>'
  );
  html = html.replace(
    /<h3 class="site-footer__heading">Contact<\/h3>/g,
    '<h3 class="site-footer__heading" data-i18n="footer.contactHeading">Contact</h3>'
  );
  html = html.replace(/<h3>Company<\/h3>/g, '<h3 data-i18n="footer.companyHeading">Company</h3>');
  html = html.replace(/<h3>Offers<\/h3>/g, '<h3 data-i18n="footer.offersHeading">Offers</h3>');
  html = html.replace(/<h3>Contact<\/h3>/g, '<h3 data-i18n="footer.contactHeading">Contact</h3>');

  html = html.replace(
    /<a href="([^"]*\/google\/)"([^>]*)>Google partnership<\/a>/g,
    '<a href="$1"$2 data-i18n="footer.googlePartnership">Google partnership</a>'
  );
  html = html.replace(
    /<p class="footer-note">\s*/,
    '<p class="footer-note" data-i18n-html="footer.mapifyNote">'
  );
  html = html.replace(
    /<li><a href="([^"]*\/contact\/)"([^>]*)>Get in touch<\/a><\/li>/g,
    '<li><a href="$1"$2 data-i18n="footer.getInTouch">Get in touch</a></li>'
  );
  html = html.replace(
    /<li><a href="https:\/\/www.linkedin.com"([^>]*)>LinkedIn<\/a><\/li>/g,
    '<li><a href="https://www.linkedin.com"$1 data-i18n="footer.linkedin">LinkedIn</a></li>'
  );

  html = html.replace(
    /<a href="([^"]*\/blog\/)" class="link-coral-underline">← All blog posts<\/a>/,
    '<a href="$1" class="link-coral-underline" data-i18n="blog.backToBlog">← All blog posts</a>'
  );
  html = html.replace(
    /<a href="([^"]*\/blog\/)" class="link-plain">Blog<\/a>/,
    '<a href="$1" class="link-plain" data-i18n="blog.eyebrow">Blog</a>'
  );
  html = html.replace(
    /<a href="([^"]*\/case-studies\/)" class="link-plain">Case studies<\/a>/,
    '<a href="$1" class="link-plain" data-i18n="caseStudy.eyebrow">Case studies</a>'
  );

  if (!html.includes("i18n.js")) {
    html = html.replace(/<\/body>/i, `    <script defer src="${scriptSrc}"></script>\n  </body>`);
  }
  return html;
}

function writeHtmlWithNavRewrite(from, to) {
  let html = fs.readFileSync(from, "utf8");
  html = rewriteNavToIndexHtml(html);
  if (!/<link\s+rel="icon"/i.test(html)) {
    html = html.replace(
      /<\/head>/i,
      '    <link rel="icon" href="/favicon.png" type="image/png" sizes="any" />\n  </head>'
    );
  }
  html = applyBasePrefix(html);
  html = injectFocusBuiltI18n(html);
  ensureDir(path.dirname(to));
  fs.writeFileSync(to, html);
}

function escAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function excerpt(s, n) {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n - 1)}…`;
}

function categoryLabel(cs) {
  const c = (cs.categories || []).filter((x) => x && !/^case studies$/i.test(String(x).replace(/&amp;/g, "&")));
  return c[0] ? String(c[0]).replace(/&amp;/g, "&") : "Case study";
}

function blogCategoryLabel(p) {
  const c = (p.categories || []).filter(
    (x) =>
      x &&
      !/^blog$/i.test(String(x).replace(/&amp;/g, "&")) &&
      !/^case studies$/i.test(String(x).replace(/&amp;/g, "&"))
  );
  return c[0] ? String(c[0]).replace(/&amp;/g, "&") : "Blog";
}

function caseStudyHref(slug) {
  return absUrl(`/case-studies/${slug}/`);
}

function blogPostHref(slug) {
  return absUrl(`/blog/${slug}/`);
}

/** Map post to blog index filter bucket (matches .blog-filter-btn[data-filter] in blog.html). */
function deriveBlogFilterKey(slug, categoryLabel, meta) {
  const slugLower = String(slug || "").toLowerCase();
  const cat = String(meta?.category || categoryLabel || "").toLowerCase();
  if (
    /events\s*&\s*partnerships|^partnerships$/i.test(cat) ||
    /partners-with|announces-partnership|partnership-with|junitec-the-junior|data-colab/i.test(slugLower)
  ) {
    return "partnerships";
  }
  if (
    /geospatial|location intelligence|data & operations|data and operations|transportation|logistics/i.test(cat) ||
    /geospatial|location-intelligence/i.test(slugLower)
  ) {
    return "geospatial";
  }
  const pillar = meta?.pillar || "";
  if (pillar === "sports-events") return "sports-events";
  if (pillar === "smart-cities") return "smart-cities";
  if (pillar === "company") return "company";
  if (/smart city|municipal|urban|cidades|resort|wsa|floods|infralobo/i.test(cat)) return "smart-cities";
  if (/sport|event|venue|fifa|virtual venue|basketball|fiba|arena/i.test(cat)) return "sports-events";
  return "company";
}

function filterBlogRowsByIndex(rows, metaBySlug) {
  return rows.filter((row) => {
    const m = metaBySlug.get(row.slug);
    if (m == null) return true;
    return m.index === true;
  });
}

/** Newest first; entries without a date sort last; tie-break by slug. */
function sortByDateDesc(items) {
  return [...items].sort((a, b) => {
    const ta = publishedTimeMs(a);
    const tb = publishedTimeMs(b);
    if (ta == null && tb == null) return String(a.slug || "").localeCompare(String(b.slug || ""));
    if (ta == null) return 1;
    if (tb == null) return -1;
    if (tb !== ta) return tb - ta;
    return String(a.slug || "").localeCompare(String(b.slug || ""));
  });
}

function publishedTimeMs(p) {
  const raw = p?.publishedAt ?? p?.lastmod;
  if (raw == null || raw === "") return null;
  const t = Date.parse(String(raw));
  return Number.isFinite(t) ? t : null;
}

/** Map case study to index filter bucket (matches case-studies.html filter buttons). */
function deriveCaseStudyFilterKey(cs) {
  const cats = (cs.categories || []).map((x) => String(x).replace(/&amp;/g, "&").toLowerCase());
  const slug = String(cs.slug || "").toLowerCase();
  const title = String(cs.title || "").toLowerCase();
  const desc = String(cs.description || "").toLowerCase();
  const blob = `${slug} ${title} ${desc} ${cats.join(" ")}`;

  if (
    cats.some((c) =>
      /sports?\s*&\s*events?|global sports|venue operations|virtual venue|stadium|olympic|fifa/i.test(c)
    ) ||
    /\b(sports?|venues?|stadiums?|olympics?|fifa|wsa)\b|virtual-venue|sports-event|world championship|virtual venue|basketball|arena/i.test(
      blob
    )
  ) {
    return "sports-events";
  }
  if (
    cats.some((c) => c.includes("smart cities") || c.includes("smart city")) ||
    /smart city|municipal|lisbon|famalic|lagos|gira|emel|urban planning|flood|geoestrela|infralobo|resort management|waze|traffic closure|hydrogeolog|territorial|b-smart/i.test(
      blob
    )
  ) {
    return "smart-cities";
  }
  return "other";
}

/** Featured strip + full archive grid from import manifest */
function caseStudyIndexBlocks(items) {
  if (!items.length) {
    return {
      featured: `<div id="case-studies-featured-mount" class="case-studies-list-mount"><p class="text-muted">No case studies yet. Run <code>node focusbc/scripts/import-case-studies-from-wix.mjs</code>.</p></div>`,
      archive: `<div id="case-studies-archive-grid" class="case-studies-list-mount"></div>`,
    };
  }
  const [a, b, ...restAll] = items;
  const stack = [b, ...restAll].filter(Boolean).slice(0, 2);
  const featuredInner = `<div class="grid-blog-featured case-studies-featured-grid">
            <article class="blog-card--featured" data-case-study-filter="${escAttr(deriveCaseStudyFilterKey(a))}">
              <div class="media-16-9 media-thumb-cover"><img src="${escAttr(a.heroImage || "")}" alt="" width="960" height="540" loading="lazy" /></div>
              <div class="p-8 sm-p-10">
                <p class="eyebrow">${escAttr(categoryLabel(a))}</p>
                <h2 class="mt-3 h2"><a href="${escAttr(caseStudyHref(a.slug))}">${escAttr(a.title)}</a></h2>
                <p class="text-muted mt-4 text-sm-tight">${escAttr(excerpt(a.description, 220))}</p>
                <a href="${escAttr(caseStudyHref(a.slug))}" class="link-coral-underline mt-8 inline-block" data-i18n="caseStudy.readCaseStudy">Read case study</a>
              </div>
            </article>
            <div class="case-studies-featured-stack">
              ${stack
                .map(
                  (cs) => `<article class="case-study-card-compact" data-case-study-filter="${escAttr(deriveCaseStudyFilterKey(cs))}">
                <p class="eyebrow eyebrow--small">${escAttr(categoryLabel(cs))}</p>
                <h3 class="mt-3 h3"><a href="${escAttr(caseStudyHref(cs.slug))}">${escAttr(cs.title)}</a></h3>
                <p class="text-muted mt-3 text-sm-tight">${escAttr(excerpt(cs.description, 140))}</p>
                <a href="${escAttr(caseStudyHref(cs.slug))}" class="link-coral-underline mt-5 inline-block" data-i18n="caseStudy.readCaseStudy">Read case study</a>
              </article>`
                )
                .join("")}
            </div>
          </div>`;
  const featured = `<div id="case-studies-featured-mount" class="case-studies-list-mount">${featuredInner}</div>`;
  const archiveCards = items
    .map(
      (cs) => `<article class="blog-card--archive card card--flush" data-case-study-filter="${escAttr(deriveCaseStudyFilterKey(cs))}">
            <div class="media-16-10 media-thumb-cover"><img src="${escAttr(cs.heroImage || "")}" alt="" width="960" height="540" loading="lazy" /></div>
            <div class="p-6">
              <p class="eyebrow eyebrow--small">${escAttr(categoryLabel(cs))}</p>
              <h3 class="mt-3 h3"><a href="${escAttr(caseStudyHref(cs.slug))}">${escAttr(cs.title)}</a></h3>
              <p class="text-muted mt-3 text-sm-tight">${escAttr(excerpt(cs.description, 160))}</p>
              <a href="${escAttr(caseStudyHref(cs.slug))}" class="link-coral-underline mt-5 inline-block" data-i18n="caseStudy.readCaseStudy">Read case study</a>
            </div>
          </article>`
    )
    .join("\n          ");
  const archive = `<div id="case-studies-archive-grid" class="grid grid-3 gap-lg mt-10 case-studies-list-mount">
          ${archiveCards}
        </div>`;
  return { featured, archive };
}

/** Featured + two compact + full grid; posts need slug, title, excerpt, category, heroImage, dates. */
function blogIndexBlocks(posts) {
  if (!posts.length) {
    return {
      featured: `<div id="blog-featured-mount" class="blog-list-mount"><p class="text-muted">No blog posts yet. Run <code>node focusbc/scripts/import-blog-from-wix.mjs</code>.</p></div>`,
      archive: `<div id="blog-archive-grid" class="grid grid-3 gap-lg mt-10 blog-list-mount"></div>`,
    };
  }
  const [a, b, ...restAll] = posts;
  const stack = [b, ...restAll].filter(Boolean).slice(0, 2);
  const featuredInner = `<div class="grid-blog-featured">
            <article class="blog-card--featured" data-blog-filter="${escAttr(a.filterKey)}">
              <div class="media-16-9 media-thumb-cover"><img src="${escAttr(a.heroImage || "")}" alt="" width="960" height="540" loading="lazy" /></div>
              <div class="p-8 sm-p-10">
                <p class="eyebrow">${escAttr(a.category || "Blog")}</p>
                <h2 class="mt-3 h2"><a href="${escAttr(blogPostHref(a.slug))}">${escAttr(a.title)}</a></h2>
                <p class="text-muted mt-4 text-sm-tight">${escAttr(excerpt(a.excerpt, 220))}</p>
                <a href="${escAttr(blogPostHref(a.slug))}" class="link-arrow mt-8 inline-block" data-i18n="blog.readArticle">Read article</a>
              </div>
            </article>
            <div class="grid gap-lg">
              ${stack
                .map(
                  (p) => `<article class="case-study-card-compact" data-blog-filter="${escAttr(p.filterKey)}">
                <p class="eyebrow eyebrow--small">${escAttr(p.category || "Blog")}</p>
                <h3 class="mt-3 h3"><a href="${escAttr(blogPostHref(p.slug))}">${escAttr(p.title)}</a></h3>
                <p class="text-muted mt-3 text-sm-tight">${escAttr(excerpt(p.excerpt, 140))}</p>
                <a href="${escAttr(blogPostHref(p.slug))}" class="link-arrow mt-5 inline-block" data-i18n="blog.readArticle">Read article</a>
              </article>`
                )
                .join("")}
            </div>
          </div>`;
  const featured = `<div id="blog-featured-mount" class="blog-list-mount">${featuredInner}</div>`;
  const archiveCards = posts
    .map(
      (p) => `<article class="blog-card--archive card card--flush" data-blog-filter="${escAttr(p.filterKey)}">
            <div class="media-16-10 media-thumb-cover"><img src="${escAttr(p.heroImage || "")}" alt="" width="960" height="540" loading="lazy" /></div>
            <div class="p-6">
              <p class="eyebrow eyebrow--small">${escAttr(p.category || "Blog")}</p>
              <h3 class="mt-3 h3"><a href="${escAttr(blogPostHref(p.slug))}">${escAttr(p.title)}</a></h3>
              <p class="text-muted mt-3 text-sm-tight">${escAttr(excerpt(p.excerpt, 160))}</p>
              <a href="${escAttr(blogPostHref(p.slug))}" class="link-arrow mt-5 inline-block" data-i18n="blog.readArticle">Read article</a>
            </div>
          </article>`
    )
    .join("\n          ");
  const archive = `<div id="blog-archive-grid" class="grid grid-3 gap-lg mt-10 blog-list-mount">
          ${archiveCards}
        </div>`;
  return { featured, archive };
}

/** Top-level section folder links (trailing slash; no *.html in nav). */
const SECTION_INDEX_HREFS = [
  ["about", "/about/"],
  ["google", "/google/"],
  ["case-studies", "/case-studies/"],
  ["blog", "/blog/"],
  ["careers", "/careers/"],
  ["contact", "/contact/"],
];

/** Root and section nav: pretty directory URLs; strip legacy …/index.html. */
function rewriteNavToIndexHtml(html) {
  let s = html;
  const sections = ["about", "google", "case-studies", "blog", "careers", "contact"];
  for (const sec of sections) {
    s = s.replace(new RegExp(`href="/${sec}/index\\.html"`, "g"), `href="/${sec}/"`);
  }
  s = s.replace(/href="\/index\.html"/g, 'href="/"');
  s = s.replace(/href="\/about\/"/g, 'href="/about/"');
  s = s.replace(/href="\/google\/"/g, 'href="/google/"');
  s = s.replace(/href="\/case-studies\/"/g, 'href="/case-studies/"');
  s = s.replace(/href="\/blog\/"/g, 'href="/blog/"');
  s = s.replace(/href="\/careers\/"/g, 'href="/careers/"');
  s = s.replace(/href="\/contact\/"/g, 'href="/contact/"');
  s = s.replace(/href="\/blog\/([^"]+)\.html"/g, 'href="/blog/$1/"');
  s = s.replace(/href="\/case-studies\/([^"]+)\.html"/g, 'href="/case-studies/$1/"');
  for (const [sec, target] of SECTION_INDEX_HREFS) {
    s = s.replace(new RegExp(`href="${sec}/"`, "g"), `href="${target}"`);
  }
  return s;
}

function transformHtml(html) {
  let s = html;
  s = s.replace(/<meta name="robots" content="[^"]*"/gi, '<meta name="robots" content="noindex, nofollow"');
  s = s.replace(/<meta name="googlebot"[^>]*>/gi, "");
  s = s.replace(/<link rel="canonical" href="[^"]*"\s*\/>/gi, '<link rel="canonical" href="#" />');
  s = s.replace(/href="styles\.css"/g, 'href="/styles/styles.css"');
  s = s.replace(/<script[^>]*src="js\/[^"]+"[^>]*><\/script>/gi, "");
  s = s.replace(/<script[^>]*src="js\/[^"]+"[^>]*\/>/gi, "");
  s = s.replace(/href="media\/favicon\.ico"/g, 'href="/favicon.png"');
  s = s.replace(
    /<link rel="icon" href="\/favicon\.png"[^>]*>/gi,
    '<link rel="icon" href="/favicon.png" type="image/png" sizes="any" />'
  );
  s = s.replace(/src="\/media\/focusbc-logo\.png"/g, 'src="/media/logos/focus-bc-logo.png"');
  s = s.replace(/src="media\/caap-logo\.png"/g, 'src="/media/logos/city-as-a-platform.png"');
  s = s.replace(/src="media\/virtualvenue_logo\.png"/g, 'src="/media/logos/virtual-venue.png"');
  s = s.replace(
    /src="\/media\/google-premier-partner\.png"/g,
    'src="/media/logos/google-partner-logo.png"'
  );
  s = s.replace(/href="media\//g, 'href="/media/');
  s = s.replace(/src="media\//g, 'src="/media/');
  s = s.replace(/href="\.\/"/g, 'href="/"');
  s = s.replace(/href="about"/g, 'href="/about/"');
  s = s.replace(/href="google"/g, 'href="/google/"');
  s = s.replace(/href="casestudies"/g, 'href="/case-studies/"');
  s = s.replace(/href="blog"/g, 'href="/blog/"');
  s = s.replace(/href="careers"/g, 'href="/careers/"');
  s = s.replace(/href="contact"/g, 'href="/contact/"');
  s = s.replace(/href="casestudies\/([^"]+)"/g, (_, rest) => {
    const slug = rest.replace(/\.html$/, "");
    return `href="/case-studies/${slug}/"`;
  });
  s = s.replace(/href="blog\/([^"]+)"/g, (_, rest) => {
    if (rest.startsWith("http") || rest.startsWith("//")) return `href="blog/${rest}"`;
    const slug = rest.replace(/\.html$/, "");
    return `href="/blog/${slug}/"`;
  });
  s = s.replace(/media\/wix\/69b615_471e7059a3d34592abc924df6b97aba6~mv2\.webp/g, "media/blog/smart-city-famalicao-case-study.webp");
  s = s.replace(/media\/wix\/69b615_205cad9909d04cefa41fb19b401fe3f0~mv2\.webp/g, "media/blog/lisbon-floods-data-catalogue.webp");
  s = s.replace(/media\/wix\/69b615_9f54c7044e9c4cb0a44eb12f7000d07b~mv2\.webp/g, "media/blog/sports-events-venue-operations.webp");
  if (!s.includes('name="googlebot"')) {
    s = s.replace(
      /<meta name="robots" content="noindex, nofollow" \/>/i,
      '<meta name="robots" content="noindex, nofollow" />\n    <meta name="googlebot" content="noindex, nofollow" />'
    );
  }
  s = rewriteNavToIndexHtml(s);
  s = applyBasePrefix(s);
  return s;
}

/* Full replace of output tree so removed/renamed assets (e.g. PNG→WebP) never linger in public/.
   Stale files can break hosts with per-file size limits (e.g. Cloudflare Pages 25 MiB). */
if (fs.existsSync(ROOT)) {
  fs.rmSync(ROOT, { recursive: true, force: true });
}
ensureDir(ROOT);
ensureDir(path.join(ROOT, "styles"));
ensureDir(path.join(ROOT, "js"));
const blogListSrc = path.join(SOURCES, "js", "blog-list.js");
if (fs.existsSync(blogListSrc)) {
  copyFile(blogListSrc, path.join(ROOT, "js", "blog-list.js"));
}
const caseStudiesListSrc = path.join(SOURCES, "js", "case-studies-list.js");
if (fs.existsSync(caseStudiesListSrc)) {
  copyFile(caseStudiesListSrc, path.join(ROOT, "js", "case-studies-list.js"));
}
const i18nSrc = path.join(SOURCES, "js", "i18n.js");
if (fs.existsSync(i18nSrc)) {
  copyFile(i18nSrc, path.join(ROOT, "js", "i18n.js"));
}
const localesDir = path.join(__dirname, "locales");
if (fs.existsSync(localesDir)) {
  copyTree(localesDir, path.join(ROOT, "locales"));
}
["logos", "blog", "case-studies", "about", "google", "careers", "contact"].forEach((sub) =>
  ensureDir(path.join(ROOT, "media", sub))
);

{
  let css = fs.readFileSync(path.join(SOURCES, "styles.css"), "utf8");
  if (BASE) {
    /* Quoted urls: url("/media/...") — old pattern only matched unquoted url(/media/... */
    css = css.replace(/url\(\s*(["']?)(\/media\/)/g, (_, quote, mediaPath) => `url(${quote}${BASE}${mediaPath}`);
  }
  fs.writeFileSync(path.join(ROOT, "styles", "styles.css"), css);
}

const copies = [
  ["focusbc-logo.png", "logos/focus-bc-logo.png"],
  ["caap-logo.png", "logos/city-as-a-platform.png"],
  ["virtualvenue_logo.png", "logos/virtual-venue.png"],
  ["mapify-logo.png", "logos/mapify.png"],
  ["logos/google-partner-logo.png", "logos/google-partner-logo.png"],
  ["focusbc-team.avif", "about/focus-bc-team.avif"],
  /* Home page (sources/index.html) uses WebP at media root; must be copied explicitly. */
  ["focusbc-logo.webp", "focusbc-logo.webp"],
  ["caap-logo.webp", "caap-logo.webp"],
  ["virtualvenue_logo.webp", "virtualvenue_logo.webp"],
];
for (const [src, dest] of copies) {
  const fp = path.join(MEDIA_SRC, src);
  if (fs.existsSync(fp)) copyFile(fp, path.join(ROOT, "media", dest));
}

{
  const fav = path.join(__dirname, "favicon.png");
  if (fs.existsSync(fav)) copyFile(fav, path.join(ROOT, "favicon.png"));
}

const blogMap = [
  ["wix/69b615_471e7059a3d34592abc924df6b97aba6~mv2.webp", "blog/smart-city-famalicao-case-study.webp"],
  ["wix/69b615_205cad9909d04cefa41fb19b401fe3f0~mv2.webp", "blog/lisbon-floods-data-catalogue.webp"],
  ["wix/69b615_9f54c7044e9c4cb0a44eb12f7000d07b~mv2.webp", "blog/sports-events-venue-operations.webp"],
];
for (const [src, dest] of blogMap) {
  const fp = path.join(MEDIA_SRC, src);
  if (fs.existsSync(fp)) copyFile(fp, path.join(ROOT, "media", dest));
}

copyTree(path.join(MEDIA_SRC, "case-studies"), path.join(ROOT, "media", "case-studies"));
copyTree(path.join(MEDIA_SRC, "blog"), path.join(ROOT, "media", "blog"));
if (fs.existsSync(path.join(MEDIA_SRC, "wix"))) {
  copyTree(path.join(MEDIA_SRC, "wix"), path.join(ROOT, "media", "wix"));
}
if (fs.existsSync(path.join(MEDIA_SRC, "hero"))) {
  copyTree(path.join(MEDIA_SRC, "hero"), path.join(ROOT, "media", "hero"));
}
const CASE_BUILT_DIR = path.join(__dirname, "case-studies-built");
if (fs.existsSync(CASE_BUILT_DIR)) {
  ensureDir(path.join(ROOT, "case-studies"));
  for (const f of fs.readdirSync(CASE_BUILT_DIR)) {
    if (f.endsWith(".html")) {
      writeHtmlWithNavRewrite(path.join(CASE_BUILT_DIR, f), path.join(ROOT, "case-studies", f));
    }
  }
}
for (const stale of ["case-study-1.html", "case-study-2.html"]) {
  const p = path.join(ROOT, "case-studies", stale);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

const BLOG_BUILT_DIR = path.join(__dirname, "blog-built");
if (fs.existsSync(BLOG_BUILT_DIR)) {
  ensureDir(path.join(ROOT, "blog"));
  for (const f of fs.readdirSync(BLOG_BUILT_DIR)) {
    if (f.endsWith(".html")) {
      writeHtmlWithNavRewrite(path.join(BLOG_BUILT_DIR, f), path.join(ROOT, "blog", f));
    }
  }
}
for (const stale of ["blog-post-1.html", "blog-post-2.html", "blog-post-3.html"]) {
  const p = path.join(ROOT, "blog", stale);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

function promoteHtmlFilesToDirs(rootDir) {
  if (!fs.existsSync(rootDir)) return;
  const files = [];
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name.endsWith(".html") && ent.name !== "index.html") files.push(p);
    }
  }
  walk(rootDir);
  files.sort((a, b) => b.length - a.length);
  for (const filePath of files) {
    const baseName = path.basename(filePath, ".html");
    const destDir = path.join(path.dirname(filePath), baseName);
    ensureDir(destDir);
    fs.renameSync(filePath, path.join(destDir, "index.html"));
  }
}

promoteHtmlFilesToDirs(path.join(ROOT, "blog"));
promoteHtmlFilesToDirs(path.join(ROOT, "case-studies"));

if (fs.existsSync(path.join(MEDIA_SRC, "focusbc-team.avif"))) {
  copyFile(path.join(MEDIA_SRC, "focusbc-team.avif"), path.join(ROOT, "media", "careers", "focus-bc-careers.avif"));
  copyFile(path.join(MEDIA_SRC, "focusbc-team.avif"), path.join(ROOT, "media", "contact", "focus-bc-contact.avif"));
}

fs.writeFileSync(
  path.join(ROOT, "robots.txt"),
  `# Preview / staging — replace with production rules before launch
User-agent: *
Disallow: /
`
);

const mainPages = [
  ["index.html", "index.html"],
  ["about.html", "about/index.html"],
  ["contact.html", "contact/index.html"],
  ["careers.html", "careers/index.html"],
  ["google.html", "google/index.html"],
];

for (const [srcName, destRel] of mainPages) {
  const src = path.join(SOURCES, srcName);
  if (!fs.existsSync(src)) continue;
  let html = transformHtml(fs.readFileSync(src, "utf8"));
  const dest = path.join(ROOT, destRel);
  ensureDir(path.dirname(dest));
  fs.writeFileSync(dest, html);
}

if (fs.existsSync(path.join(SOURCES, "blog.html"))) {
  let blogHtml = transformHtml(fs.readFileSync(path.join(SOURCES, "blog.html"), "utf8"));
  const blogImportPath = path.join(__dirname, "data", "blog-import.json");
  let blogPosts = [];
  if (fs.existsSync(blogImportPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(blogImportPath, "utf8"));
      blogPosts = Array.isArray(raw.posts) ? raw.posts : [];
    } catch {
      /* keep empty */
    }
  }
  const blogPostsMetaPath = path.join(__dirname, "data", "blog-posts.json");
  let metaBySlug = new Map();
  if (fs.existsSync(blogPostsMetaPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(blogPostsMetaPath, "utf8"));
      for (const p of raw.posts || []) {
        metaBySlug.set(p.slug, p);
      }
    } catch {
      /* keep empty */
    }
  }
  const blogRows = blogPosts.map((p) => {
    const category = blogCategoryLabel(p);
    const meta = metaBySlug.get(p.slug);
    return {
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt || p.description || "",
      category,
      lastmod: p.lastmod,
      publishedAt: p.publishedAt,
      heroImage: p.heroImage || "",
      filterKey: deriveBlogFilterKey(p.slug, category, meta),
    };
  });
  const curated = filterBlogRowsByIndex(blogRows, metaBySlug);
  const sortedBlog = sortByDateDesc(curated);
  const { featured: blogFeatured, archive: blogArchive } = blogIndexBlocks(sortedBlog);
  blogHtml = blogHtml.replace(/<div id="blog-featured-mount"[^>]*>[\s\S]*?<\/div>/, blogFeatured);
  blogHtml = blogHtml.replace(/<div id="blog-archive-grid"[^>]*><\/div>/, blogArchive);
  ensureDir(path.join(ROOT, "blog"));
  fs.writeFileSync(path.join(ROOT, "blog", "index.html"), blogHtml);
}

if (fs.existsSync(path.join(SOURCES, "case-studies.html"))) {
  let cs = transformHtml(fs.readFileSync(path.join(SOURCES, "case-studies.html"), "utf8"));
  const manifestPath = path.join(__dirname, "data", "case-studies-import.json");
  let items = [];
  if (fs.existsSync(manifestPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      items = Array.isArray(raw.caseStudies) ? raw.caseStudies : [];
    } catch {
      /* keep empty */
    }
  }
  items = sortByDateDesc(items);
  const { featured, archive } = caseStudyIndexBlocks(items);
  cs = cs.replace(/<div id="case-studies-featured-mount"[^>]*>[\s\S]*?<\/div>/, featured);
  cs = cs.replace(/<div id="case-studies-archive-grid"[^>]*><\/div>/, archive);
  ensureDir(path.join(ROOT, "case-studies"));
  fs.writeFileSync(path.join(ROOT, "case-studies", "index.html"), cs);
}

console.log(`OK: ${ROOT} ready (from focusbc/sources/).`);
