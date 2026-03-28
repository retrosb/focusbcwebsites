/**
 * CAAP v2 chrome: sticky header (mega menus), 4-col footer, body.caap-theme-v2,
 * i18n (data-i18n, language switcher, js/i18n.js).
 * Run: node caap/scripts/apply-standard-header.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CAAP_ROOT = path.join(__dirname, "..", "sources");

const STANDARD_HEADER = `
    <header class="cv2-header">
      <div class="cv2-header__inner">
        <a class="cv2-header__brand" href="./">
          <img src="media/caap-logo.png" alt="CAAP" width="44" height="44" />
        </a>
        <details class="cv2-nav-mobile">
          <summary class="cv2-nav-mobile__toggle" data-i18n="nav.menu">Menu</summary>
          <nav class="cv2-nav-mobile__panel" data-i18n-attr="aria-label:nav.mainAria">
            <div class="lang-switch lang-switch--mobile" data-lang-switch></div>
            <p class="cv2-nav-mobile__label" data-i18n="nav.labels.solutions">Soluções</p>
            <a href="solucoes/" data-i18n="nav.allSolutions">Todas as soluções</a>
            <a href="solucoes/manutencao-dos-espacos-publicos" data-i18n="nav.mega.sol.espacosPublicos.title">Manutenção dos Espaços Públicos</a>
            <a href="solucoes/mobilidade" data-i18n="nav.mega.sol.mobilidade.title">Mobilidade</a>
            <a href="solucoes/turismo" data-i18n="nav.mega.sol.turismo.title">Turismo</a>
            <a href="solucoes/ambiente-e-sustentabilidade" data-i18n="nav.mega.sol.ambiente.title">Ambiente e Sustentabilidade</a>
            <a href="solucoes/planeamento-urbano" data-i18n="nav.mega.sol.planeamento.title">Planeamento Urbano</a>
            <a href="solucoes/governanca-e-transparencia-digital" data-i18n="nav.mega.sol.governanca.title">Governança e Transparência Digital</a>
            <a href="solucoes/sensores-e-monitorizacao" data-i18n="nav.mega.sol.sensores.title">Sensores e Monitorização</a>
            <p class="cv2-nav-mobile__label" data-i18n="nav.labels.modules">Módulos</p>
            <a href="modulos/" data-i18n="nav.allModules">Todos os módulos</a>
            <a href="modulos/gestao-de-ocorrencias" data-i18n="nav.mega.mod.ocorrencias.title">Gestão de Ocorrências</a>
            <a href="modulos/gestao-urbanistica" data-i18n="nav.mega.mod.urbanistica.title">Gestão Urbanística</a>
            <a href="modulos/gestao-de-condicionamentos-de-transito" data-i18n="nav.mega.mod.transito.title">Gestão de Condicionamentos de Trânsito</a>
            <a href="modulos/higiene-urbana" data-i18n="nav.mega.mod.higiene.title">Higiene Urbana</a>
            <a href="modulos/appbuilder" data-i18n="nav.mega.mod.appbuilder.title">AppBuilder</a>
            <a href="modulos/mapify" data-i18n="nav.mega.mod.mapify.title">Mapify</a>
            <p class="cv2-nav-mobile__label" data-i18n="nav.labels.company">Empresa</p>
            <a href="casos-estudo" data-i18n="nav.caseStudies">Casos de Estudo</a>
            <a href="sobre-nos" data-i18n="nav.about">Sobre Nós</a>
            <a href="contactos" data-i18n="nav.contact">Contactos</a>
            <a href="parceiros" data-i18n="nav.partners">Parceiros</a>
            <a href="blog" data-i18n="nav.blog">Blog</a>
            <a href="https://www.city-platform.com" rel="noopener noreferrer" data-i18n="nav.login">Iniciar sessão</a>
          </nav>
        </details>
        <nav class="cv2-nav-desktop" data-i18n-attr="aria-label:nav.mainAria">
          <div class="cv2-mega-wrap">
            <a href="solucoes/" class="cv2-mega-trigger" data-i18n="nav.solutions">Soluções</a>
            <div class="cv2-mega-panel" role="region" data-i18n-attr="aria-label:nav.solutionsRegion">
              <div class="cv2-mega-grid">
                <a href="solucoes/manutencao-dos-espacos-publicos" class="cv2-mega-link">
                  <span class="cv2-mega-link__icon cv2-icon-bg--red" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 7l3-3 3 3-9 9H8v-3l6-6Z"/><path d="M5 19h14"/></svg></span>
                  <span><span class="cv2-mega-link__title" data-i18n="nav.mega.sol.espacosPublicos.title">Manutenção dos Espaços Públicos</span><span class="cv2-mega-link__desc" data-i18n="nav.mega.sol.espacosPublicos.desc">Ocorrências, infraestruturas, higiene urbana e centro de operações.</span></span>
                </a>
                <a href="solucoes/mobilidade" class="cv2-mega-link">
                  <span class="cv2-mega-link__icon cv2-icon-bg--blue" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17h6l3-8h3"/><path d="M9 9h4"/></svg></span>
                  <span><span class="cv2-mega-link__title" data-i18n="nav.mega.sol.mobilidade.title">Mobilidade</span><span class="cv2-mega-link__desc" data-i18n="nav.mega.sol.mobilidade.desc">Via pública, fiscalização, transportes e integrações como Waze.</span></span>
                </a>
                <a href="solucoes/turismo" class="cv2-mega-link">
                  <span class="cv2-mega-link__icon cv2-icon-bg--yellow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9L12 3Z"/></svg></span>
                  <span><span class="cv2-mega-link__title" data-i18n="nav.mega.sol.turismo.title">Turismo</span><span class="cv2-mega-link__desc" data-i18n="nav.mega.sol.turismo.desc">Eventos e serviços ligados ao território.</span></span>
                </a>
                <a href="solucoes/ambiente-e-sustentabilidade" class="cv2-mega-link">
                  <span class="cv2-mega-link__icon cv2-icon-bg--green" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 15c0-5 4-9 9-9 0 5-4 9-9 9Z"/><path d="M7 18c0-3 2-5 5-5 0 3-2 5-5 5Z"/></svg></span>
                  <span><span class="cv2-mega-link__title" data-i18n="nav.mega.sol.ambiente.title">Ambiente e Sustentabilidade</span><span class="cv2-mega-link__desc" data-i18n="nav.mega.sol.ambiente.desc">Dados ambientais e apoio à decisão territorial.</span></span>
                </a>
                <a href="solucoes/planeamento-urbano" class="cv2-mega-link">
                  <span class="cv2-mega-link__icon cv2-icon-bg--ink" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19h16"/><path d="M5 19V9l7-4 7 4v10"/><path d="M9 19v-5h6v5"/></svg></span>
                  <span><span class="cv2-mega-link__title" data-i18n="nav.mega.sol.planeamento.title">Planeamento Urbano</span><span class="cv2-mega-link__desc" data-i18n="nav.mega.sol.planeamento.desc">Instrumentos de ordenamento e informação territorial.</span></span>
                </a>
                <a href="solucoes/governanca-e-transparencia-digital" class="cv2-mega-link">
                  <span class="cv2-mega-link__icon cv2-icon-bg--blue" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4Z"/><path d="M9 12h6"/></svg></span>
                  <span><span class="cv2-mega-link__title" data-i18n="nav.mega.sol.governanca.title">Governança e Transparência Digital</span><span class="cv2-mega-link__desc" data-i18n="nav.mega.sol.governanca.desc">Dashboards públicos e participação cidadã.</span></span>
                </a>
                <a href="solucoes/sensores-e-monitorizacao" class="cv2-mega-link">
                  <span class="cv2-mega-link__icon cv2-icon-bg--green" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 18a6 6 0 1 0-6-6"/><path d="M12 14a2 2 0 1 0-2-2"/><path d="M20 20l-4.5-4.5"/></svg></span>
                  <span><span class="cv2-mega-link__title" data-i18n="nav.mega.sol.sensores.title">Sensores e Monitorização</span><span class="cv2-mega-link__desc" data-i18n="nav.mega.sol.sensores.desc">Redes de sensores e operações em tempo real.</span></span>
                </a>
              </div>
            </div>
          </div>
          <div class="cv2-mega-wrap">
            <a href="modulos/" class="cv2-mega-trigger" data-i18n="nav.modules">Módulos</a>
            <div class="cv2-mega-panel" role="region" data-i18n-attr="aria-label:nav.modulesRegion">
              <div class="cv2-mega-grid">
                <a href="modulos/gestao-de-ocorrencias" class="cv2-mega-link">
                  <span class="cv2-mega-link__icon cv2-icon-bg--red" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/><path d="M11 8v3l2 2"/></svg></span>
                  <span><span class="cv2-mega-link__title" data-i18n="nav.mega.mod.ocorrencias.title">Gestão de Ocorrências</span><span class="cv2-mega-link__desc" data-i18n="nav.mega.mod.ocorrencias.desc">Pedidos priorizados com rastreio até ao fecho — cidadãos informados e equipas com SLA visível.</span></span>
                </a>
                <a href="modulos/gestao-urbanistica" class="cv2-mega-link">
                  <span class="cv2-mega-link__icon cv2-icon-bg--ink" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19h16"/><path d="M6 19V7h12v12"/><path d="M9 10h2m2 0h2m-6 4h2m2 0h2"/></svg></span>
                  <span><span class="cv2-mega-link__title" data-i18n="nav.mega.mod.urbanistica.title">Gestão Urbanística</span><span class="cv2-mega-link__desc" data-i18n="nav.mega.mod.urbanistica.desc">Condicionantes e instrumentos no território — decisões técnicas com contexto, menos retrabalho entre serviços.</span></span>
                </a>
                <a href="modulos/gestao-de-condicionamentos-de-transito" class="cv2-mega-link">
                  <span class="cv2-mega-link__icon cv2-icon-bg--blue" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v18"/><path d="M8 7l4-4 4 4"/><path d="M8 17l4 4 4-4"/></svg></span>
                  <span><span class="cv2-mega-link__title" data-i18n="nav.mega.mod.transito.title">Gestão de Condicionamentos de Trânsito</span><span class="cv2-mega-link__desc" data-i18n="nav.mega.mod.transito.desc">Cortes e desvios no mapa com comunicação imediata — menos fricção para quem circula e para quem opera.</span></span>
                </a>
                <a href="modulos/higiene-urbana" class="cv2-mega-link">
                  <span class="cv2-mega-link__icon cv2-icon-bg--green" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 7h8"/><path d="M9 7V5h6v2"/><path d="M7 7l1 12h8l1-12"/></svg></span>
                  <span><span class="cv2-mega-link__title" data-i18n="nav.mega.mod.higiene.title">Higiene Urbana</span><span class="cv2-mega-link__desc" data-i18n="nav.mega.mod.higiene.desc">Rotas e ordens de serviço coordenadas — mais cobertura com equipas alinhadas no mapa.</span></span>
                </a>
                <a href="modulos/appbuilder" class="cv2-mega-link">
                  <span class="cv2-mega-link__icon cv2-icon-bg--yellow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 6h16v12H4z"/><path d="M9 10h6m-6 4h4"/></svg></span>
                  <span><span class="cv2-mega-link__title" data-i18n="nav.mega.mod.appbuilder.title">AppBuilder</span><span class="cv2-mega-link__desc" data-i18n="nav.mega.mod.appbuilder.desc">Formulários e apps ajustados ao processo municipal — evolução sem ciclos longos de desenvolvimento.</span></span>
                </a>
                <a href="modulos/mapify" class="cv2-mega-link">
                  <span class="cv2-mega-link__icon cv2-mega-link__icon--mapify cv2-icon-bg--mapify" aria-hidden="true"
                    ><img src="media/mapify-logo-white.png" alt="" width="24" height="24" loading="lazy" decoding="async"
                  /></span>
                  <span><span class="cv2-mega-link__title" data-i18n="nav.mega.mod.mapify.title">Mapify</span><span class="cv2-mega-link__desc" data-i18n="nav.mega.mod.mapify.desc">Sensores e regras na mesma camada — alertas e automação antes do incidente escalar.</span></span>
                </a>
              </div>
            </div>
          </div>
          <a href="casos-estudo" data-i18n="nav.caseStudies">Casos de Estudo</a>
          <a href="sobre-nos" data-i18n="nav.about">Sobre Nós</a>
          <a href="contactos" data-i18n="nav.contact">Contactos</a>
        </nav>
        <div class="cv2-header__tail">
          <div class="lang-switch lang-switch--desktop" data-lang-switch></div>
          <a class="cv2-header__cta" href="contactos" data-i18n="cta.demo">Pedir demo</a>
        </div>
      </div>
    </header>`;

const STANDARD_FOOTER = `
    <footer class="cv2-footer">
      <div class="cv2-footer__inner">
        <div>
          <a class="cv2-footer__brand" href="./"><img src="media/caap-logo.png" alt="CAAP" width="44" height="44" /></a>
          <p class="cv2-footer__intro" data-i18n="footer.intro">
            City as a Platform é um produto Focus BC — plataforma operacional para municípios e entidades públicas.
          </p>
          <p class="cv2-footer__intro" style="margin-top: 0.75rem">
            <a href="https://focusbcwebsites.pages.dev/focusbc/" target="_blank" rel="noopener noreferrer" data-i18n="footer.focusBc">Focus BC</a>
          </p>
        </div>
        <div>
          <h3 data-i18n="footer.solutionsHeading">Soluções</h3>
          <ul>
            <li><a href="solucoes/" data-i18n="footer.allSolutions">Todas as soluções</a></li>
            <li><a href="solucoes/manutencao-dos-espacos-publicos" data-i18n="nav.mega.sol.espacosPublicos.title">Manutenção dos Espaços Públicos</a></li>
            <li><a href="solucoes/mobilidade" data-i18n="nav.mega.sol.mobilidade.title">Mobilidade</a></li>
            <li><a href="solucoes/turismo" data-i18n="nav.mega.sol.turismo.title">Turismo</a></li>
            <li><a href="solucoes/ambiente-e-sustentabilidade" data-i18n="nav.mega.sol.ambiente.title">Ambiente e Sustentabilidade</a></li>
            <li><a href="solucoes/planeamento-urbano" data-i18n="nav.mega.sol.planeamento.title">Planeamento Urbano</a></li>
            <li><a href="solucoes/governanca-e-transparencia-digital" data-i18n="footer.governanceShort">Governança Digital</a></li>
            <li><a href="solucoes/sensores-e-monitorizacao" data-i18n="footer.sensorsShort">Sensores</a></li>
          </ul>
        </div>
        <div>
          <h3 data-i18n="footer.modulesHeading">Módulos</h3>
          <ul>
            <li><a href="modulos/" data-i18n="footer.allModules">Todos os módulos</a></li>
            <li><a href="modulos/gestao-de-ocorrencias" data-i18n="nav.mega.mod.ocorrencias.title">Gestão de Ocorrências</a></li>
            <li><a href="modulos/gestao-urbanistica" data-i18n="nav.mega.mod.urbanistica.title">Gestão Urbanística</a></li>
            <li><a href="modulos/gestao-de-condicionamentos-de-transito" data-i18n="footer.trafficShort">Condicionamentos de Trânsito</a></li>
            <li><a href="modulos/higiene-urbana" data-i18n="nav.mega.mod.higiene.title">Higiene Urbana</a></li>
            <li><a href="modulos/appbuilder" data-i18n="nav.mega.mod.appbuilder.title">AppBuilder</a></li>
            <li><a href="modulos/mapify" data-i18n="nav.mega.mod.mapify.title">Mapify</a></li>
          </ul>
          <ul style="margin-top: 1.25rem">
            <li><a href="blog" data-i18n="nav.blog">Blog</a></li>
            <li><a href="parceiros" data-i18n="nav.partners">Parceiros</a></li>
            <li><a href="casos-estudo" data-i18n="nav.caseStudies">Casos de Estudo</a></li>
          </ul>
        </div>
        <div>
          <h3 data-i18n="footer.contactHeading">Contacto</h3>
          <ul>
            <li><a href="contactos" data-i18n="footer.contactDemo">Contactos e demonstração</a></li>
            <li><a href="mailto:joao.barata@focus-bc.com">joao.barata@focus-bc.com</a></li>
            <li><a href="https://www.city-platform.com" rel="noopener noreferrer" data-i18n="footer.login">Iniciar sessão</a></li>
          </ul>
        </div>
      </div>
    </footer>`;

const reHeader = /\s*<header class="(?:caap-header|cv2-header)">[\s\S]*?<\/header>/;
const reFooter = /\s*<footer class="(?:caap-footer|cv2-footer)">[\s\S]*?<\/footer>/;

function ensureBodyTheme(html) {
  if (/\bcaap-theme-v2\b/.test(html.slice(0, 2500))) return html;
  return html.replace(/<body(\s[^>]*)?>/i, (full, attrs = "") => {
    const a = attrs || "";
    if (/\bcaap-theme-v2\b/.test(a)) return full;
    const m = a.match(/class\s*=\s*"([^"]*)"/i);
    if (m) {
      return full.replace(/class\s*=\s*"([^"]*)"/i, (_, c) => `class="${c} caap-theme-v2"`);
    }
    const m2 = a.match(/class\s*=\s*'([^']*)'/i);
    if (m2) {
      return full.replace(/class\s*=\s*'([^']*)'/i, (_, c) => `class='${c} caap-theme-v2'`);
    }
    if (!a.trim()) return `<body class="caap-theme-v2">`;
    return `<body class="caap-theme-v2"${a}>`;
  });
}

function i18nScriptSrc(filePath) {
  const normalized = path.resolve(filePath);
  const srcRoot = path.resolve(CAAP_ROOT);
  if (!normalized.startsWith(srcRoot)) {
    return "js/i18n.js";
  }
  const rel = path.relative(srcRoot, normalized);
  const parts = rel.split(path.sep).filter((p) => p && p !== ".");
  const depth = parts.length - 1;
  if (depth < 0) return "js/i18n.js";
  return depth === 0 ? "js/i18n.js" : `${"../".repeat(depth)}js/i18n.js`;
}

function ensureI18nScript(html, filePath) {
  if (/\/js\/i18n\.js/.test(html)) return html;
  const src = i18nScriptSrc(filePath);
  const tag = `    <script src="${src}" defer></script>\n`;
  const m = html.match(/<body[^>]*>/i);
  if (m) {
    return html.replace(m[0], `${m[0]}\n${tag}`);
  }
  return `${html}\n${tag}`;
}

function ensureSkipLinkI18n(html) {
  return html.replace(
    /<a href="#main-content" class="skip-link"[^>]*>[\s\S]*?<\/a>/,
    '<a href="#main-content" class="skip-link" data-i18n="skipLink">Saltar para o conteúdo</a>'
  );
}

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
  const caapDir = path.join(__dirname, "..");
  const extraTemplates = ["blog-post.template.html", "case-study.template.html"].map((f) => path.join(caapDir, f));
  let n = 0;
  for (const filePath of [...files, ...extraTemplates]) {
    if (!fs.existsSync(filePath)) continue;
    let html = fs.readFileSync(filePath, "utf8");
    let changed = false;
    if (reHeader.test(html)) {
      html = html.replace(reHeader, STANDARD_HEADER);
      changed = true;
    }
    if (reFooter.test(html)) {
      html = html.replace(reFooter, STANDARD_FOOTER);
      changed = true;
    }
    const withSkip = ensureSkipLinkI18n(html);
    if (withSkip !== html) {
      html = withSkip;
      changed = true;
    }
    const withScript = ensureI18nScript(html, filePath);
    if (withScript !== html) {
      html = withScript;
      changed = true;
    }
    const next = ensureBodyTheme(html);
    if (next !== html) {
      html = next;
      changed = true;
    }
    if (changed) {
      fs.writeFileSync(filePath, html);
      n++;
    }
  }
  console.log(`Updated ${n} HTML file(s) (sources + templates).`);
}

main();
