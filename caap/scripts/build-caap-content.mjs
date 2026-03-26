/**
 * Fetches https://www.city-platform.com/blog-posts-sitemap.xml and writes
 * caap/data/blog-posts.json and caap/data/case-studies.json.
 * Case-study slugs are split into case-studies.json; blog JSON lists all posts.
 *
 * Run: node caap/scripts/build-caap-content.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CAAP_ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(CAAP_ROOT, "data");
const SITEMAP_URL = "https://www.city-platform.com/blog-posts-sitemap.xml";
const POST_PREFIX = "https://www.city-platform.com/post/";

const CASE_SLUGS = new Set([
  "gira-emel-bike-realtime",
  "geoestrela-incident-management",
  "lisbon-traffic-closures-solution",
  "infralobo-smart-resort",
  "urban-planning-and-management-platform",
  "city-of-lisbon-floods-data-catalogue-case-study",
  "b-smart-famalicao-case-study-smart-city-management-solution",
  "vila-do-bispo-case-study-incident-management",
]);

const TITLE_BY_SLUG = {
  "infralobo-smart-resort": "Infralobo Case Study — Smart Resort Management",
  "gira-emel-bike-realtime": "GIRA Case Study — First Shared Bike Service in Lisbon",
  "geoestrela-incident-management": "GeoEstrela Case Study — Smart City Management Solution",
  "lisbon-traffic-closures-solution": "Lisbon Case Study — Traffic Closures Solution",
  "urban-planning-and-management-platform": "Lagos Case Study — Urban Planning and Management Platform",
  "city-of-lisbon-floods-data-catalogue-case-study": "Lisbon Case Study — Floods Data Catalogue",
  "b-smart-famalicao-case-study-smart-city-management-solution":
    "B-Smart Famalicão Case Study — Smart City Management Solution",
  "vila-do-bispo-case-study-incident-management": "Vila do Bispo Case Study — Incident Management",
  "city-as-a-platform-at-smart-city-expo-world-congress-2025":
    "City as a Platform at Smart City Expo World Congress 2025",
  "a-new-version-of-city-as-a-platform-incident-manager-hits-the-streets":
    "A new version of City as a Platform Incident Manager hits the streets",
  "cidades-inteligentes-by-google-cloud-visits-portugal": "Cidades Inteligentes by Google Cloud visits Portugal",
  "city-as-a-platform-present-at-smart-city-expo-world-congress-2023":
    "City as a Platform at Smart City Expo World Congress 2023",
  "city-as-a-platform-present-at-smart-city-expo-world-congress-in-barcelona":
    "City as a Platform at Smart City Expo World Congress in Barcelona",
  "city-as-a-platform-update-august-4": "City as a Platform update — August 4",
  "city-as-a-platform-wins-wsa-portugal-and-will-represent-portugal-on-the-global-stage":
    "City as a Platform wins WSA Portugal and will represent Portugal on the global stage",
  "7-smart-cities-examples-we-can-learn-from": "7 smart cities examples we can learn from",
  "city-as-a-platform-attends-the-smart-city-expo-world-congress-2024":
    "City as a Platform at Smart City Expo World Congress 2024",
  "city-as-a-platform-at-b-smart-famalicão-week": "City as a Platform at B-Smart Famalicão Week",
  "city-as-a-platform-user-meetup-2024-in-vila-nova-de-famalicão":
    "City as a Platform user meetup 2024 in Vila Nova de Famalicão",
  "data-colab-becomes-partners-with-city-as-a-platform": "Data CoLAB becomes partners with City as a Platform",
  "city-as-a-platform-update-september-21": "City as a Platform update — September 21",
  "1ª-edição-evento-de-clientes-city-as-a-platform-em-albufeira":
    "1ª edição: evento de clientes City as a Platform em Albufeira",
  "city-as-a-platform-present-at-portugal-smart-cities-summit-2022":
    "City as a Platform at Portugal Smart Cities Summit 2022",
  "city-as-a-platform-present-at-portugal-smart-cities-summit-2023":
    "City as a Platform at Portugal Smart Cities Summit 2023",
};

function titleFromSlug(slug) {
  if (TITLE_BY_SLUG[slug]) return TITLE_BY_SLUG[slug];
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .replace(/ª/g, "ª");
}

function categoryForSlug(slug) {
  if (CASE_SLUGS.has(slug)) return "Case studies";
  if (
    /expo|summit|meetup|week|albufeira|congress|famalicão-week/i.test(slug) ||
    slug.includes("cidades-inteligentes")
  ) {
    return "Events";
  }
  if (/update|version|incident-manager|hits-the-streets/.test(slug)) return "Product updates";
  if (slug.includes("data-colab") || slug.includes("partners")) return "Partnerships";
  return "News";
}

function excerptFor(slug, title) {
  if (CASE_SLUGS.has(slug)) {
    return `How City as a Platform supported this project — full narrative on the public site.`;
  }
  return `Update from City as a Platform: ${title}.`;
}

function readMinutesFor(slug) {
  if (slug.includes("floods") || slug.includes("b-smart")) return 3;
  if (slug.includes("vila-do-bispo")) return 2;
  return 2;
}

function parseSitemapXml(xml) {
  const urls = [];
  const blocks = xml.split(/<\/url>/i);
  for (const block of blocks) {
    const locM = block.match(/<loc>\s*([^<\s]+)\s*<\/loc>/i);
    if (!locM) continue;
    const loc = locM[1].trim();
    if (!loc.startsWith(POST_PREFIX)) continue;
    const slug = decodeURIComponent(loc.slice(POST_PREFIX.length).replace(/\/$/, ""));
    const lastmodM = block.match(/<lastmod>\s*([^<]+)\s*<\/lastmod>/i);
    const lastmod = lastmodM ? lastmodM[1].trim() : "1970-01-01";
    const imgLocM = block.match(/<image:loc>\s*([^<]+)\s*<\/image:loc>/i);
    const imgTitleM = block.match(/<image:title>\s*([^<]*)\s*<\/image:title>/i);
    urls.push({
      slug,
      lastmod,
      image: imgLocM ? imgLocM[1].trim() : "",
      imageAlt: imgTitleM ? imgTitleM[1].trim() : "",
    });
  }
  return urls;
}

function enrich(row) {
  const { slug, lastmod, image, imageAlt } = row;
  const title = titleFromSlug(slug);
  const category = categoryForSlug(slug);
  return {
    slug,
    lastmod,
    title,
    excerpt: excerptFor(slug, title),
    category,
    readMinutes: readMinutesFor(slug),
    image: image || "",
    imageAlt: imageAlt || title,
  };
}

function toCaseStudy(post) {
  const headline = post.title;
  return {
    slug: post.slug,
    lastmod: post.lastmod,
    headline,
    title: headline,
    excerpt: post.excerpt,
    category: post.category,
    readMinutes: post.readMinutes,
    image: post.image,
    imageAlt: post.imageAlt || headline,
  };
}

async function main() {
  const res = await fetch(SITEMAP_URL);
  if (!res.ok) throw new Error(`Sitemap HTTP ${res.status}`);
  const xml = await res.text();
  const raw = parseSitemapXml(xml);
  if (!raw.length) throw new Error("No post URLs parsed from sitemap");

  const posts = raw.map(enrich).sort((a, b) => b.lastmod.localeCompare(a.lastmod));
  const caseRows = posts.filter((p) => CASE_SLUGS.has(p.slug));
  if (caseRows.length !== CASE_SLUGS.size) {
    console.warn(
      `Expected ${CASE_SLUGS.size} case studies, got ${caseRows.length}. Check slugs vs sitemap.`
    );
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(DATA_DIR, "blog-posts.json"),
    JSON.stringify({ source: SITEMAP_URL, posts }, null, 2),
    "utf8"
  );
  fs.writeFileSync(
    path.join(DATA_DIR, "case-studies.json"),
    JSON.stringify(
      { source: SITEMAP_URL, studies: caseRows.map(toCaseStudy) },
      null,
      2
    ),
    "utf8"
  );
  console.log(`Wrote ${posts.length} blog rows and ${caseRows.length} case studies to ${DATA_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
