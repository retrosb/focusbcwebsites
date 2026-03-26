/**
 * Case studies index: filter by data-case-study-filter to match .blog-filter-btn[data-filter].
 * Buttons: all | smart-cities | sports-events. Items tagged "other" only appear when All is selected.
 */
document.addEventListener("DOMContentLoaded", () => {
  const bar = document.querySelector(".case-studies-filter-bar");
  if (!bar) return;

  const buttons = bar.querySelectorAll(".blog-filter-btn[data-filter]");
  const articles = document.querySelectorAll("[data-case-study-filter]");
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
      const fk = el.getAttribute("data-case-study-filter");
      const show = key == null ? true : fk === key;
      el.toggleAttribute("hidden", !show);
    });
    setActive(filter);
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => apply(btn.getAttribute("data-filter") || "all"));
  });

  apply("all");
});
