/**
 * Subtle scroll parallax: background layers shift slightly opposite scroll;
 * hero images with data-parallax-img scale and translate inside overflow clips.
 * Respects prefers-reduced-motion.
 */
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const imgs = () => document.querySelectorAll("[data-parallax-img]");
  const bgs = () => document.querySelectorAll("[data-parallax-bg]");

  function tick() {
    const vh = window.innerHeight || 1;
    for (const el of imgs()) {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      const mid = r.top + r.height * 0.5;
      const t = (mid - vh * 0.5) / vh;
      el.style.transform = `translateY(${t * -14}px) scale(1.06)`;
    }
    for (const el of bgs()) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) continue;
      const mid = r.top + r.height * 0.5;
      const t = (mid - vh * 0.5) / vh;
      const shift = t * 22;
      el.style.backgroundPosition = `center calc(50% + ${shift}px)`;
    }
  }

  let raf = 0;
  function onScroll() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", tick);
  } else {
    tick();
  }
})();
