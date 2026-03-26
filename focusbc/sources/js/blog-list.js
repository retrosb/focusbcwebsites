/**
 * Blog index: filter articles by data-blog-filter to match .blog-filter-btn[data-filter].
 */
document.addEventListener("DOMContentLoaded", () => {
  const bar = document.querySelector(".blog-filter-bar");
  if (!bar) return;

  const buttons = bar.querySelectorAll(".blog-filter-btn[data-filter]");
  const articles = document.querySelectorAll("[data-blog-filter]");
  if (!buttons.length || !articles.length) return;

  function setActive(filter) {
    buttons.forEach((btn) => {
      const isActive = btn.getAttribute("data-filter") === filter;
      btn.classList.toggle("blog-filter-btn--active", isActive);
    });
  }

  function apply(filter) {
    const key = filter === "all" ? null : filter;
    articles.forEach((el) => {
      const fk = el.getAttribute("data-blog-filter");
      const show = key == null || fk === key;
      el.toggleAttribute("hidden", !show);
    });
    setActive(filter);
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => apply(btn.getAttribute("data-filter") || "all"));
  });

  apply("all");
});
