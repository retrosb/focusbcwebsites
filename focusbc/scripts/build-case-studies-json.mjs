/**
 * Builds focusbc/data/case-studies.json from published case study posts (Wix /post/...).
 * Run: node focusbc/scripts/build-case-studies-json.mjs
 *
 * pillarGroup orders the index: smart-cities and sports-events lead; then operations-mobility, geospatial-data.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, "../data/case-studies.json");

/** @typedef {"smart-cities" | "sports-events" | "operations-mobility" | "geospatial-data"} Pillar */

/** @type {Array<{
 *   slug: string;
 *   lastmod: string;
 *   image: string;
 *   imageAlt: string;
 *   headline: string;
 *   category: string;
 *   readMinutes: number;
 *   pillarGroup: Pillar;
 *   clientType: string;
 *   challenge: string;
 *   solution: string;
 *   outcome: string;
 *   relatedOffer: "caap" | "virtual-venue" | "both";
 * }>} */
const CASES = [
  {
    slug: "b-smart-famalicao-case-study-smart-city-management-solution",
    lastmod: "2026-03-24",
    image: "media/wix/69b615_471e7059a3d34592abc924df6b97aba6~mv2.png",
    imageAlt:
      "Famalicão city logo displayed over a view of a town square with historic buildings, leafless trees, and flowers in the foreground.",
    headline: "B-Smart Famalicão Case Study - Smart City Management Solution",
    category: "Smart Cities",
    readMinutes: 2,
    pillarGroup: "smart-cities",
    clientType: "Municipality (Famalicão)",
    challenge: "Coordinate urban management and citizen-facing services across departments.",
    solution: "City-scale operational platform for territorial intelligence and workflows.",
    outcome: "More integrated city operations and a stronger base for digital services.",
    relatedOffer: "caap",
  },
  {
    slug: "lisbon-case-study-floods-data-catalogue",
    lastmod: "2026-03-24",
    image: "media/wix/69b615_205cad9909d04cefa41fb19b401fe3f0~mv2.png",
    imageAlt:
      "Aerial view of Lisbon’s Praça do Comércio and the Tagus River with the Lisboa Câmara Municipal logo centered over the image.",
    headline: "Lisbon Case Study - Floods Data Catalogue",
    category: "Smart Cities",
    readMinutes: 3,
    pillarGroup: "geospatial-data",
    clientType: "City government (Lisbon)",
    challenge: "Make flood-related data discoverable and usable across teams and systems.",
    solution: "Structured data catalogue and geospatial-oriented access for operational use.",
    outcome: "Better visibility into flood datasets to support planning and response.",
    relatedOffer: "caap",
  },
  {
    slug: "urban-planning-and-management-platform",
    lastmod: "2026-03-25",
    image: "media/wix/d0f2e4_cb49acb79a7b403ea61a4aa4e0241de8~mv2.jpg",
    imageAlt: "Turquoise water between rocky sea cliffs in Lagos, Portugal.",
    headline: "Lagos Case Study - Urban Planning and Management Platform",
    category: "Smart Cities",
    readMinutes: 2,
    pillarGroup: "smart-cities",
    clientType: "Municipality (Lagos)",
    challenge: "Support planning and management with a coherent view of the territory.",
    solution: "Urban planning and management platform integrated with operational data.",
    outcome: "Stronger alignment between planning, permits, and day-to-day management.",
    relatedOffer: "caap",
  },
  {
    slug: "renault-smart-factory",
    lastmod: "2026-03-25",
    image: "media/wix/d0f2e4_83a79c09a8a8431882f422f076f04442~mv2_d_2356_1566_s_2.jpg",
    imageAlt: "Industrial factory interior with metal walkways, machinery, and warm overhead lighting.",
    headline: "Groupe Renault Case Study - Smart Factory Incident Management",
    category: "Operations & Mobility",
    readMinutes: 1,
    pillarGroup: "operations-mobility",
    clientType: "Industrial operator",
    challenge: "Respond faster to incidents across a complex factory environment.",
    solution: "Operational tooling for incident visibility, coordination, and follow-up.",
    outcome: "Clearer incident handling and less friction between teams on the ground.",
    relatedOffer: "both",
  },
  {
    slug: "gira-emel-bike-realtime",
    lastmod: "2026-03-24",
    image: "media/wix/d0f2e4_5e3845e9c4b2423e99fb67fa3751f1cc~mv2_d_1806_1203_s_2.jpg",
    imageAlt:
      "EMEL logo overlaid on a city street scene featuring a parked bicycle and a pedestrian walking on a cobblestone sidewalk.",
    headline: "GIRA Case Study - First Shared Bike Service in Lisbon",
    category: "Smart Cities",
    readMinutes: 1,
    pillarGroup: "smart-cities",
    clientType: "Urban mobility authority (EMEL, Lisbon)",
    challenge: "Operate a shared bike fleet with reliable real-time visibility.",
    solution: "Data and operations integration for fleet status and city coordination.",
    outcome: "Improved service reliability and operational awareness for GIRA.",
    relatedOffer: "caap",
  },
  {
    slug: "choicecar-routing-optimization",
    lastmod: "2026-03-24",
    image: "media/wix/d0f2e4_6254484e8c7b40b2b10847f46f223ccd~mv2_d_1652_1238_s_2.jpg",
    imageAlt: "Choice Car logo overlaid on an aerial view of a highway interchange surrounded by green trees.",
    headline: "Choice Car Case Study - Routing Optimization Solution",
    category: "Operations & Mobility",
    readMinutes: 1,
    pillarGroup: "operations-mobility",
    clientType: "Mobility / fleet operator",
    challenge: "Reduce cost and delay from suboptimal routing across the network.",
    solution: "Routing optimization using geospatial and operational constraints.",
    outcome: "More efficient routes and better use of vehicles and drivers.",
    relatedOffer: "both",
  },
  {
    slug: "lisbon-traffic-closures-solution",
    lastmod: "2026-03-24",
    image: "media/wix/d0f2e4_25ec4a7d402244fcac680eb785031a77~mv2_d_4608_3072_s_4_2.jpg",
    imageAlt:
      "Lisbon City Hall logo overlaid on Praça do Comércio in Lisbon, with people walking across the square under a bright blue sky.",
    headline: "Lisbon Case Study - Traffic Closures Solution",
    category: "Smart Cities",
    readMinutes: 1,
    pillarGroup: "smart-cities",
    clientType: "City government (Lisbon)",
    challenge: "Communicate and manage traffic closures with less confusion and rework.",
    solution: "Operational workflows and maps-based clarity for closures and detours.",
    outcome: "Clearer public and internal coordination around road and event closures.",
    relatedOffer: "caap",
  },
  {
    slug: "infralobo-smart-resort",
    lastmod: "2026-03-24",
    image: "media/wix/d0f2e4_38381c480c4041f895a4042114db0ec3~mv2_d_4888_2951_s_4_2.jpg",
    imageAlt: "Scenic coastal golf course, with a golfer mid-swing overlooking the ocean.",
    headline: "Infralobo Case Study - Smart Resort Management",
    category: "Operations & Mobility",
    readMinutes: 1,
    pillarGroup: "operations-mobility",
    clientType: "Resort / large-site operator",
    challenge: "Run a large resort territory with consistent operations and services.",
    solution: "Integrated resort management and spatial awareness for teams.",
    outcome: "Better coordination across facilities, public space, and maintenance.",
    relatedOffer: "caap",
  },
  {
    slug: "delta-cafes-salesforce-optimization",
    lastmod: "2026-03-24",
    image: "media/wix/d0f2e4_fea0f72424ea4385889fab1030ca8781~mv2_d_3100_1550_s_2.jpg",
    imageAlt: "Close-up of an espresso being poured into a cup from a coffee machine.",
    headline: "Delta Case Study - Salesforce Optimization in Traditional Retail",
    category: "Operations & Mobility",
    readMinutes: 1,
    pillarGroup: "operations-mobility",
    clientType: "Retail / FMCG",
    challenge: "Align field operations and distribution with commercial systems.",
    solution: "Process and tooling optimization connected to Salesforce and operations.",
    outcome: "Smoother retail operations and fewer bottlenecks in the field network.",
    relatedOffer: "both",
  },
  {
    slug: "chronopost-pickup-optimization",
    lastmod: "2026-03-24",
    image: "media/wix/d0f2e4_6fc0a8d1ecba44d988d01d3298a3b009~mv2_d_3000_1698_s_2.jpg",
    imageAlt:
      "Chronopost logo centered over a warehouse interior with tall storage racks filled with boxes and pallets labeled by rack numbers.",
    headline: "Chronopost Case Study - Pickup Network Optimization",
    category: "Operations & Mobility",
    readMinutes: 1,
    pillarGroup: "operations-mobility",
    clientType: "Logistics / parcel network",
    challenge: "Improve pickup point coverage and efficiency across the network.",
    solution: "Network optimization with geospatial and capacity constraints.",
    outcome: "Better pickup performance and more efficient use of points.",
    relatedOffer: "both",
  },
  {
    slug: "geoestrela-incident-management",
    lastmod: "2026-03-24",
    image: "media/wix/d0f2e4_cfac90e79aee4ccdb7d87d3117e6c11f~mv2_d_1806_1203_s_2.jpg",
    imageAlt:
      "Estrela parish logo overlaid on a Lisbon street scene with traditional tiled façades and colorful buildings.",
    headline: "GeoEstrela Case Study - Smart City Management Solution",
    category: "Smart Cities",
    readMinutes: 1,
    pillarGroup: "smart-cities",
    clientType: "Civil parish (Lisbon)",
    challenge: "Manage incidents and requests with limited staff and many stakeholders.",
    solution: "Lightweight smart-city management workflows with map-centric views.",
    outcome: "Faster triage and clearer accountability for parish operations.",
    relatedOffer: "caap",
  },
];

function excerptFrom(alt, headline) {
  const t = (alt || "").trim() || `Case study: ${headline}`;
  return t.length > 220 ? `${t.slice(0, 217)}…` : t;
}

const PILLAR_ORDER = ["smart-cities", "sports-events", "operations-mobility", "geospatial-data"];

const studies = CASES.map((c) => ({
  slug: c.slug,
  headline: c.headline,
  title: c.headline,
  lastmod: c.lastmod,
  category: c.category,
  pillarGroup: c.pillarGroup,
  clientType: c.clientType,
  challenge: c.challenge,
  solution: c.solution,
  outcome: c.outcome,
  relatedOffer: c.relatedOffer,
  image: c.image || null,
  imageAlt: (c.imageAlt || "").trim() || c.headline,
  excerpt: excerptFrom(c.imageAlt, c.headline),
  readMinutes: c.readMinutes,
})).sort((a, b) => {
  const pa = PILLAR_ORDER.indexOf(a.pillarGroup);
  const pb = PILLAR_ORDER.indexOf(b.pillarGroup);
  if (pa !== pb) return pa - pb;
  return b.lastmod.localeCompare(a.lastmod);
});

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(
  out,
  JSON.stringify(
    {
      generated: new Date().toISOString().slice(0, 10),
      pillarLabels: {
        "smart-cities": "Smart Cities",
        "sports-events": "Sports Events",
        "operations-mobility": "Operations & Mobility",
        "geospatial-data": "Geospatial & Data",
      },
      studies,
    },
    null,
    2
  )
);
console.log(`Wrote ${studies.length} case studies to ${out}`);
