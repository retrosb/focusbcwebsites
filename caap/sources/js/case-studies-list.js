(function () {
  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function t(key, fallback) {
    const flat = typeof window !== "undefined" && window.__caapI18n && window.__caapI18n.flat;
    if (flat && flat[key] != null) return String(flat[key]);
    return fallback;
  }

  function localeTag() {
    const loc = typeof window !== "undefined" && window.__caapI18n && window.__caapI18n.locale;
    return loc === "en" ? "en-GB" : "pt-PT";
  }

  function formatDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(localeTag(), {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function titleOf(s) {
    return s.headline || s.title || "";
  }

  function slugHref(slug) {
    return "casos-estudo/" + encodeURIComponent(slug);
  }

  function thumbBlock(s, aspectClass, gradBase) {
    const t = titleOf(s);
    if (s.image) {
      return `<div class="${aspectClass} media-thumb-cover" role="img" aria-label="${esc(s.imageAlt || t)}"><img src="${esc(s.image)}" alt="${esc(s.imageAlt || t)}" loading="lazy" width="960" height="540" /></div>`;
    }
    const g = ((gradBase || s.slug.length) % 6) + 1;
    return `<div class="${aspectClass} media-gradient-${g}" role="img" aria-label=""></div>`;
  }

  function cardHtml(s, featured) {
    const t0 = titleOf(s);
    const readLbl = t("caseStudies.minRead", "min de leitura");
    const readStudy = t("caseStudies.readStudy", "Ler caso de estudo");
    const featEyebrow = t("caseStudies.featuredEyebrow", "Caso de estudo em destaque");
    const inner = featured
      ? `<div class="p-8 sm-p-10">
          <p class="eyebrow">${esc(featEyebrow)}</p>
          <h2 class="mt-3 h2">${esc(t0)}</h2>
          <p class="text-muted mt-4 text-sm-tight">${esc(s.excerpt)}</p>
          <div class="meta-row mt-6">
            <span>${esc(s.category)}</span>
            <span aria-hidden="true">•</span>
            <span>${s.readMinutes} ${esc(readLbl)}</span>
          </div>
          <a href="${slugHref(s.slug)}" class="link-arrow mt-8 inline-block">${esc(readStudy)}</a>
        </div>`
      : `<div class="p-6">
          <p class="eyebrow eyebrow--small">${esc(s.category)}</p>
          <h3 class="mt-3 h3">${esc(t0)}</h3>
          <p class="text-muted mt-3 text-sm-tight">${esc(s.excerpt)}</p>
          <p class="text-muted mt-2 text-sm-tight">${formatDate(s.lastmod)}</p>
          <a href="${slugHref(s.slug)}" class="link-arrow mt-5 inline-block">${esc(readStudy)}</a>
        </div>`;

    if (featured) {
      return `<article class="card card--flush">
        ${thumbBlock(s, "media-16-9", 0)}
        ${inner}
      </article>`;
    }
    return `<article class="card card--flush">
      ${thumbBlock(s, "media-16-10", s.slug.length)}
      ${inner}
    </article>`;
  }

  function smallCardHtml(s) {
    if (!s) return "";
    const t0 = titleOf(s);
    const readStudy = t("caseStudies.readStudy", "Ler caso de estudo");
    return `<article class="card">
      <p class="eyebrow eyebrow--small">${esc(s.category)}</p>
      <h3 class="mt-3 h3">${esc(t0)}</h3>
      <p class="text-muted mt-3 text-sm-tight">${esc(s.excerpt)}</p>
      <a href="${slugHref(s.slug)}" class="link-arrow mt-5 inline-block">${esc(readStudy)}</a>
    </article>`;
  }

  let studiesCache = null;

  async function run() {
    const rootFeatured = document.getElementById("case-studies-featured-mount");
    const rootGrid = document.getElementById("case-studies-archive-grid");
    if (!rootFeatured || !rootGrid) return;

    let data;
    try {
      if (!studiesCache) {
        const r = await fetch("data/case-studies.json", { credentials: "same-origin" });
        if (!r.ok) throw new Error(String(r.status));
        studiesCache = await r.json();
      }
      data = studiesCache;
    } catch {
      studiesCache = null;
      rootFeatured.innerHTML = `<p class="text-muted">${t(
        "caseStudies.loadError",
        'Não foi possível carregar os casos de estudo. Abra o site através do servidor local (por exemplo <code class="caap-code">/caap/casos-estudo</code>).'
      )}</p>`;
      return;
    }

    const studies = (data.studies || []).slice().sort((a, b) => b.lastmod.localeCompare(a.lastmod));
    if (!studies.length) return;

    const [first, second, third, ...rest] = studies;

    rootFeatured.innerHTML = `<div class="grid-blog-featured">
      ${cardHtml(first, true)}
      <div class="grid gap-lg">
        ${smallCardHtml(second)}
        ${smallCardHtml(third)}
      </div>
    </div>`;

    rootGrid.innerHTML = rest.map((s) => cardHtml(s, false)).join("");
  }

  function boot() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", run);
    } else {
      run();
    }
    window.addEventListener("caap:i18n", run);
  }

  boot();
})();
