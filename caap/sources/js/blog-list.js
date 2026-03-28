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

  function slugHref(slug) {
    return "blog/" + encodeURIComponent(slug);
  }

  function thumbBlock(p, aspectClass, gradIdx) {
    if (p.image) {
      return `<div class="${aspectClass} media-thumb-cover" role="img" aria-label="${esc(p.imageAlt || p.title)}"><img src="${esc(p.image)}" alt="${esc(p.imageAlt || p.title)}" loading="lazy" width="960" height="540" /></div>`;
    }
    const g = ((gradIdx || p.slug.length) % 6) + 1;
    return `<div class="${aspectClass} media-gradient-${g}" role="img" aria-label=""></div>`;
  }

  function cardHtml(p, featured) {
    const readLbl = t("blog.minRead", "min de leitura");
    const readArticle = t("blog.readArticle", "Ler artigo");
    const featEyebrow = t("blog.featuredEyebrow", "Artigo em destaque");
    const inner = featured
      ? `<div class="p-8 sm-p-10">
          <p class="eyebrow">${esc(featEyebrow)}</p>
          <h2 class="mt-3 h2">${esc(p.title)}</h2>
          <p class="text-muted mt-4 text-sm-tight">${esc(p.excerpt)}</p>
          <div class="meta-row mt-6">
            <span>${esc(p.category)}</span>
            <span aria-hidden="true">•</span>
            <span>${p.readMinutes} ${esc(readLbl)}</span>
          </div>
          <a href="${slugHref(p.slug)}" class="link-arrow mt-8 inline-block">${esc(readArticle)}</a>
        </div>`
      : `<div class="p-6">
          <p class="eyebrow eyebrow--small">${esc(p.category)}</p>
          <h3 class="mt-3 h3">${esc(p.title)}</h3>
          <p class="text-muted mt-3 text-sm-tight">${esc(p.excerpt)}</p>
          <p class="text-muted mt-2 text-sm-tight">${formatDate(p.lastmod)}</p>
          <a href="${slugHref(p.slug)}" class="link-arrow mt-5 inline-block">${esc(readArticle)}</a>
        </div>`;

    if (featured) {
      return `<article class="card card--flush">
        ${thumbBlock(p, "media-16-9", 0)}
        ${inner}
      </article>`;
    }
    return `<article class="card card--flush">
      ${thumbBlock(p, "media-16-10", p.slug.length)}
      ${inner}
    </article>`;
  }

  function smallCardHtml(p) {
    if (!p) return "";
    const readArticle = t("blog.readArticle", "Ler artigo");
    return `<article class="card">
      <p class="eyebrow eyebrow--small">${esc(p.category)}</p>
      <h3 class="mt-3 h3">${esc(p.title)}</h3>
      <p class="text-muted mt-3 text-sm-tight">${esc(p.excerpt)}</p>
      <a href="${slugHref(p.slug)}" class="link-arrow mt-5 inline-block">${esc(readArticle)}</a>
    </article>`;
  }

  let postsCache = null;

  async function run() {
    const rootFeatured = document.getElementById("blog-featured-mount");
    const rootGrid = document.getElementById("blog-archive-grid");
    if (!rootFeatured || !rootGrid) return;

    let data;
    try {
      if (!postsCache) {
        const r = await fetch("data/blog-posts.json", { credentials: "same-origin" });
        if (!r.ok) throw new Error(String(r.status));
        postsCache = await r.json();
      }
      data = postsCache;
    } catch {
      postsCache = null;
      rootFeatured.innerHTML = `<p class="text-muted">${t(
        "blog.loadError",
        'Não foi possível carregar os artigos. Abra o site através do servidor local (por exemplo <code class="caap-code">/caap/blog</code>).'
      )}</p>`;
      return;
    }

    const posts = (data.posts || []).slice().sort((a, b) => b.lastmod.localeCompare(a.lastmod));
    if (!posts.length) return;

    const [first, second, third, ...rest] = posts;

    rootFeatured.innerHTML = `<div class="grid-blog-featured">
      ${cardHtml(first, true)}
      <div class="grid gap-lg">
        ${smallCardHtml(second)}
        ${smallCardHtml(third)}
      </div>
    </div>`;

    rootGrid.innerHTML = rest.map((p) => cardHtml(p, false)).join("");
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
