/**
 * Blog index: filter archive grid only (featured is curated and not filtered).
 */
document.addEventListener("DOMContentLoaded", () => {
  const bar = document.querySelector(".blog-filter-bar");
  const grid = document.getElementById("blog-archive-grid");
  if (!bar || !grid) return;

  const buttons = bar.querySelectorAll(".blog-filter-btn[data-filter]");
  const articles = grid.querySelectorAll("[data-blog-filter]");
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
