(function () {
  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function formatDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
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
    const inner = featured
      ? `<div class="p-8 sm-p-10">
          <p class="eyebrow">Featured article</p>
          <h2 class="mt-3 h2">${esc(p.title)}</h2>
          <p class="text-muted mt-4 text-sm-tight">${esc(p.excerpt)}</p>
          <div class="meta-row mt-6">
            <span>${esc(p.category)}</span>
            <span aria-hidden="true">•</span>
            <span>${p.readMinutes} min read</span>
          </div>
          <a href="${slugHref(p.slug)}" class="link-arrow mt-8 inline-block">Read article</a>
        </div>`
      : `<div class="p-6">
          <p class="eyebrow eyebrow--small">${esc(p.category)}</p>
          <h3 class="mt-3 h3">${esc(p.title)}</h3>
          <p class="text-muted mt-3 text-sm-tight">${esc(p.excerpt)}</p>
          <p class="text-muted mt-2 text-sm-tight">${formatDate(p.lastmod)}</p>
          <a href="${slugHref(p.slug)}" class="link-arrow mt-5 inline-block">Read article</a>
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
    return `<article class="card">
      <p class="eyebrow eyebrow--small">${esc(p.category)}</p>
      <h3 class="mt-3 h3">${esc(p.title)}</h3>
      <p class="text-muted mt-3 text-sm-tight">${esc(p.excerpt)}</p>
      <a href="${slugHref(p.slug)}" class="link-arrow mt-5 inline-block">Read article</a>
    </article>`;
  }

  async function run() {
    const rootFeatured = document.getElementById("blog-featured-mount");
    const rootGrid = document.getElementById("blog-archive-grid");
    if (!rootFeatured || !rootGrid) return;

    let data;
    try {
      const r = await fetch("data/blog-posts.json", { credentials: "same-origin" });
      if (!r.ok) throw new Error(String(r.status));
      data = await r.json();
    } catch {
      rootFeatured.innerHTML =
        '<p class="text-muted">Could not load articles. Open this site via the local server (e.g. <code class="caap-code">/caap/blog</code>).</p>';
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
