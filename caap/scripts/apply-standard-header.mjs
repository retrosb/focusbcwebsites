/**
 * Replaces the caap-header block in every caap HTML file
 * with the canonical site header (logo only, full primary nav).
 *
 * Run from repo root: node caap/scripts/apply-standard-header.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CAAP_ROOT = path.join(__dirname, "..", "sources");

const STANDARD_HEADER = `
    <header class="caap-header">
      <div class="container caap-header__inner">
        <a class="caap-brand" href="./">
          <img src="media/caap-logo.webp" alt="City as a Platform" width="48" height="48" />
        </a>
        <details class="caap-nav-mobile">
          <summary class="caap-nav-mobile__toggle" data-i18n="nav.menu">Menu</summary>
          <nav class="caap-nav-mobile__panel" aria-label="Primary navigation">
            <div class="lang-switch lang-switch--mobile" data-lang-switch></div>
            <p class="caap-nav-mobile__label" data-i18n="nav.solutions">Solutions</p>
            <a href="solutions/public-space" data-i18n="nav.publicSpace">Public space maintenance</a>
            <a href="solutions/mobility" data-i18n="nav.mobility">Mobility</a>
            <a href="solutions/tourism" data-i18n="nav.tourism">Tourism</a>
            <a href="solutions/environment" data-i18n="nav.environment">Environment &amp; sustainability</a>
            <a href="solutions/urban-planning" data-i18n="nav.urbanPlanning">Urban planning</a>
            <a href="solutions/governance" data-i18n="nav.governance">Governance &amp; digital transparency</a>
            <a href="solutions/sensors" data-i18n="nav.sensors">Sensors &amp; monitoring</a>
            <p class="caap-nav-mobile__label" data-i18n="nav.products">Products</p>
            <a href="products/incident-management" data-i18n="nav.incidentManagement">Incident management</a>
            <a href="products/urban-management" data-i18n="nav.urbanManagement">Urban management</a>
            <a href="products/traffic-restrictions" data-i18n="nav.trafficRestrictions">Traffic restrictions</a>
            <a href="products/urban-hygiene" data-i18n="nav.urbanHygiene">Urban hygiene</a>
            <a href="products/app-builder" data-i18n="nav.appBuilder">App Builder</a>
            <a href="products/mapify" data-i18n="nav.mapify">Mapify</a>
            <p class="caap-nav-mobile__label" data-i18n="nav.company">Company</p>
            <a href="casestudies" data-i18n="nav.clientsCaseStudies">Clients &amp; case studies</a>
            <a href="partners" data-i18n="nav.partners">Partners</a>
            <a href="blog" data-i18n="nav.blog">Blog</a>
            <a href="about" data-i18n="nav.about">About us</a>
            <a href="#contact" data-i18n="nav.contact">Contact</a>
            <a href="https://www.city-platform.com" rel="noopener noreferrer" data-i18n="nav.login">Log in</a>
          </nav>
        </details>
        <nav class="caap-nav-desktop" aria-label="Primary navigation">
          <div class="caap-dropdown-wrap">
            <button type="button" class="caap-nav-trigger" aria-expanded="false" aria-haspopup="true" data-i18n="nav.solutions">
              Solutions
            </button>
            <div class="caap-dropdown-panel" role="menu">
              <a href="solutions/public-space" role="menuitem" data-i18n="nav.publicSpace">Public space maintenance</a>
              <a href="solutions/mobility" role="menuitem" data-i18n="nav.mobility">Mobility</a>
              <a href="solutions/tourism" role="menuitem" data-i18n="nav.tourism">Tourism</a>
              <a href="solutions/environment" role="menuitem" data-i18n="nav.environment">Environment &amp; sustainability</a>
              <a href="solutions/urban-planning" role="menuitem" data-i18n="nav.urbanPlanning">Urban planning</a>
              <a href="solutions/governance" role="menuitem" data-i18n="nav.governance">Governance &amp; digital transparency</a>
              <a href="solutions/sensors" role="menuitem" data-i18n="nav.sensors">Sensors &amp; monitoring</a>
            </div>
          </div>
          <div class="caap-dropdown-wrap">
            <button type="button" class="caap-nav-trigger" aria-expanded="false" aria-haspopup="true" data-i18n="nav.products">
              Products
            </button>
            <div class="caap-dropdown-panel" role="menu">
              <a href="products/incident-management" role="menuitem" data-i18n="nav.incidentManagement">Incident management</a>
              <a href="products/urban-management" role="menuitem" data-i18n="nav.urbanManagement">Urban management</a>
              <a href="products/traffic-restrictions" role="menuitem" data-i18n="nav.trafficRestrictions">Traffic restrictions</a>
              <a href="products/urban-hygiene" role="menuitem" data-i18n="nav.urbanHygiene">Urban hygiene</a>
              <a href="products/app-builder" role="menuitem" data-i18n="nav.appBuilder">App Builder</a>
              <a href="products/mapify" role="menuitem" data-i18n="nav.mapify">Mapify</a>
            </div>
          </div>
          <a href="casestudies" data-i18n="nav.clients">Clients</a>
          <a href="partners" data-i18n="nav.partners">Partners</a>
          <a href="blog" data-i18n="nav.blog">Blog</a>
          <a href="about" data-i18n="nav.about">About us</a>
          <a href="#contact" data-i18n="nav.contact">Contact</a>
          <a href="https://www.city-platform.com" rel="noopener noreferrer" data-i18n="nav.login">Log in</a>
        </nav>
        <div class="lang-switch lang-switch--desktop" data-lang-switch></div>
        <a class="btn btn--ink btn--sm caap-header__cta" href="#contact" data-i18n="cta.contactUs">Contact us</a>
      </div>
    </header>`;

function walkHtmlFiles(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkHtmlFiles(p, out);
    else if (ent.name.endsWith(".html")) out.push(p);
  }
  return out;
}

function main() {
  const files = walkHtmlFiles(CAAP_ROOT).filter((p) => !p.includes(`${path.sep}scripts${path.sep}`));
  const re = /\s*<header class="caap-header">[\s\S]*?<\/header>/;
  let n = 0;
  for (const filePath of files) {
    let html = fs.readFileSync(filePath, "utf8");
    if (!re.test(html)) continue;
    html = html.replace(re, STANDARD_HEADER);
    fs.writeFileSync(filePath, html);
    n++;
  }
  console.log(`Updated ${n} HTML file(s) under caap/sources/`);
}

main();
