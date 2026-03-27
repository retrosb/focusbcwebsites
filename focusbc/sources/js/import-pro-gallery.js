/**
 * Replace Wix pro-gallery markup in imported blog/case-study bodies with a simple carousel:
 * main image, prev/next, thumbnail strip. Runs once on DOMContentLoaded.
 */
(function () {
  function normalizeSrc(src) {
    if (!src || !src.trim()) return "";
    try {
      return new URL(src, window.location.href).href;
    } catch {
      return src.trim();
    }
  }

  /** Wix loads a blurred placeholder + full image in separate .az4bu nodes; prefer the sharp asset. */
  function pickGalleryImage(item) {
    const imgs = [...item.querySelectorAll(".gallery-item-content img[src], .image-item img[src]")];
    if (imgs.length === 0) return item.querySelector("img[src]");
    const noBlur = imgs.find((el) => !/blur[_\d,]/i.test(String(el.getAttribute("src") || "")));
    return noBlur || imgs[imgs.length - 1];
  }

  function collectSlides(root) {
    const items = root.querySelectorAll(".gallery-item-container");
    const out = [];
    const seen = new Set();
    items.forEach((item) => {
      const img = pickGalleryImage(item);
      if (!img) return;
      const src = normalizeSrc(img.getAttribute("src"));
      if (!src || seen.has(src)) return;
      seen.add(src);
      out.push({
        src,
        alt: (img.getAttribute("alt") || "").trim(),
      });
    });
    if (out.length === 0) {
      root.querySelectorAll("img[src]").forEach((img) => {
        const src = normalizeSrc(img.getAttribute("src"));
        if (!src || seen.has(src)) return;
        seen.add(src);
        out.push({
          src,
          alt: (img.getAttribute("alt") || "").trim(),
        });
      });
    }
    return out;
  }

  function buildGallery(slides) {
    const wrap = document.createElement("div");
    wrap.className = "import-pro-gallery";
    wrap.setAttribute("role", "region");
    wrap.setAttribute("aria-label", "Image gallery");
    wrap.setAttribute("tabindex", "0");

    const main = document.createElement("div");
    main.className = "import-pro-gallery__main";

    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "import-pro-gallery__nav import-pro-gallery__nav--prev";
    prev.setAttribute("aria-label", "Previous image");
    prev.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>';

    const frame = document.createElement("div");
    frame.className = "import-pro-gallery__frame";

    const mainImg = document.createElement("img");
    mainImg.className = "import-pro-gallery__img";
    mainImg.width = 1200;
    mainImg.height = 675;
    mainImg.loading = "eager";
    mainImg.decoding = "async";
    mainImg.alt = slides[0]?.alt || "";

    const next = document.createElement("button");
    next.type = "button";
    next.className = "import-pro-gallery__nav import-pro-gallery__nav--next";
    next.setAttribute("aria-label", "Next image");
    next.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>';

    const thumbs = document.createElement("div");
    thumbs.className = "import-pro-gallery__thumbs";
    thumbs.setAttribute("role", "tablist");
    thumbs.setAttribute("aria-label", "Gallery thumbnails");

    frame.appendChild(mainImg);
    main.appendChild(prev);
    main.appendChild(frame);
    main.appendChild(next);
    wrap.appendChild(main);
    wrap.appendChild(thumbs);

    let index = 0;
    const n = slides.length;

    function setIndex(i) {
      index = ((i % n) + n) % n;
      const s = slides[index];
      mainImg.src = s.src;
      mainImg.alt = s.alt;
      thumbButtons.forEach((btn, j) => {
        const on = j === index;
        btn.classList.toggle("import-pro-gallery__thumb--active", on);
        btn.setAttribute("aria-selected", on ? "true" : "false");
        btn.tabIndex = on ? 0 : -1;
      });
      const single = n <= 1;
      prev.hidden = single;
      next.hidden = single;
      prev.disabled = single;
      next.disabled = single;
    }

    const thumbButtons = slides.map((s, j) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "import-pro-gallery__thumb";
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-label", `Image ${j + 1} of ${n}`);
      const t = document.createElement("img");
      t.src = s.src;
      t.alt = "";
      t.width = 160;
      t.height = 90;
      t.loading = "lazy";
      t.decoding = "async";
      btn.appendChild(t);
      btn.addEventListener("click", () => setIndex(j));
      thumbs.appendChild(btn);
      return btn;
    });

    prev.addEventListener("click", () => setIndex(index - 1));
    next.addEventListener("click", () => setIndex(index + 1));

    wrap.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIndex(index - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setIndex(index + 1);
      }
    });

    setIndex(0);
    return wrap;
  }

  function upgrade() {
    const roots = document.querySelectorAll(
      '.case-study-import-body .pro-gallery[id^="pro-gallery-"], .blog-post-page-body .pro-gallery[id^="pro-gallery-"]'
    );
    roots.forEach((root) => {
      const slides = collectSlides(root);
      if (slides.length === 0) return;
      const gallery = buildGallery(slides);
      root.replaceWith(gallery);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", upgrade);
  } else {
    upgrade();
  }
})();
