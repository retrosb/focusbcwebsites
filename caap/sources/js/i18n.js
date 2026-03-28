/**
 * Client-side i18n for City as a Platform (CaaP) static pages.
 * Locales: /caap/locales/{locale}.json (path derived from this script URL).
 */
(function () {
  "use strict";

  var STORAGE_KEY = "caap.i18n.locale";
  var SUPPORTED = [
    { code: "en", label: "English" },
    { code: "pt", label: "Português" },
  ];

  function getAssetBase() {
    var scripts = document.getElementsByTagName("script");
    for (var i = scripts.length - 1; i >= 0; i--) {
      var s = scripts[i].src;
      if (s && /\/js\/i18n\.js(\?|$)/.test(s)) {
        try {
          var u = new URL(s, window.location.href);
          return u.pathname.replace(/\/js\/i18n\.js$/, "") || "";
        } catch (e) {
          return "";
        }
      }
    }
    return "";
  }

  function normalizeLang(tag) {
    if (!tag || typeof tag !== "string") return "";
    var primary = String(tag).split(",")[0].trim().split(";")[0].toLowerCase();
    if (primary.startsWith("pt")) return "pt";
    if (primary.startsWith("en")) return "en";
    return "";
  }

  function resolveInitialLocale() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED.some(function (x) { return x.code === saved; })) return saved;
    } catch (e) {}
    var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
    for (var i = 0; i < list.length; i++) {
      var n = normalizeLang(list[i]);
      if (n && SUPPORTED.some(function (x) { return x.code === n; })) return n;
    }
    return "pt";
  }

  function flatten(obj, prefix) {
    var out = {};
    prefix = prefix || "";
    for (var k in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
      var v = obj[k];
      var key = prefix ? prefix + "." + k : k;
      if (v !== null && typeof v === "object" && !Array.isArray(v)) {
        Object.assign(out, flatten(v, key));
      } else {
        out[key] = v;
      }
    }
    return out;
  }

  var cache = {};
  var currentLocale = resolveInitialLocale();
  var flatMessages = {};

  function localeUrl(code) {
    var base = getAssetBase();
    return base + "/locales/" + code + ".json";
  }

  function loadLocale(code) {
    if (cache[code]) return Promise.resolve(cache[code]);
    return fetch(localeUrl(code), { credentials: "same-origin" })
      .then(function (r) {
        if (!r.ok) throw new Error("locale " + code);
        return r.json();
      })
      .then(function (data) {
        cache[code] = flatten(data);
        return cache[code];
      });
  }

  function getByPath(flat, path) {
    return flat[path];
  }

  function applyToDom(flat) {
    document.documentElement.lang = currentLocale === "pt" ? "pt-PT" : "en";
    try {
      window.__caapI18n = { locale: currentLocale, flat: flat };
    } catch (e) {}

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (!key) return;
      var val = getByPath(flat, key);
      if (val == null) return;
      el.textContent = String(val);
    });

    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-html");
      if (!key) return;
      var val = getByPath(flat, key);
      if (val == null) return;
      el.innerHTML = String(val);
    });

    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      var spec = el.getAttribute("data-i18n-attr");
      if (!spec) return;
      var parts = spec.split(":");
      var attr = parts[0];
      var key = parts[1];
      if (!attr || !key) return;
      var val = getByPath(flat, key);
      if (val == null) return;
      el.setAttribute(attr, String(val));
    });
  }

  function mountLangSwitches() {
    var roots = document.querySelectorAll("[data-lang-switch]");
    if (!roots.length) return;

    function render() {
      roots.forEach(function (root) {
        root.innerHTML = "";
        var details = document.createElement("details");
        details.className = "lang-switch__details";
        var sum = document.createElement("summary");
        sum.className = "lang-switch__summary";
        var langAria = getByPath(flatMessages, "lang.menuAria") || "Language";
        sum.setAttribute("aria-label", langAria);
        sum.innerHTML =
          '<svg class="lang-switch__globe" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
        var current = SUPPORTED.find(function (x) { return x.code === currentLocale; });
        var curSpan = document.createElement("span");
        curSpan.className = "lang-switch__current";
        curSpan.textContent = current ? current.label : currentLocale;
        sum.appendChild(curSpan);
        details.appendChild(sum);

        var panel = document.createElement("div");
        panel.className = "lang-switch__panel";
        panel.setAttribute("role", "listbox");
        SUPPORTED.forEach(function (opt) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "lang-switch__option";
          btn.setAttribute("role", "option");
          btn.setAttribute("aria-selected", opt.code === currentLocale ? "true" : "false");
          btn.dataset.locale = opt.code;
          btn.textContent = opt.label;
          if (opt.code === currentLocale) btn.classList.add("is-active");
          btn.addEventListener("click", function () {
            if (opt.code === currentLocale) {
              details.open = false;
              return;
            }
            currentLocale = opt.code;
            try {
              localStorage.setItem(STORAGE_KEY, currentLocale);
            } catch (e) {}
            loadLocale(currentLocale).then(function (f) {
              flatMessages = f;
              applyToDom(flatMessages);
              mountLangSwitches();
              window.dispatchEvent(new CustomEvent("caap:i18n", { detail: { locale: currentLocale } }));
            });
            details.open = false;
          });
          panel.appendChild(btn);
        });
        details.appendChild(panel);
        root.appendChild(details);
      });
    }

    render();
  }

  function run() {
    loadLocale(currentLocale)
      .catch(function () {
        currentLocale = "en";
        return loadLocale("en");
      })
      .then(function (f) {
        if (!f) return;
        flatMessages = f;
        applyToDom(flatMessages);
        mountLangSwitches();
        try {
          window.dispatchEvent(new CustomEvent("caap:i18n", { detail: { locale: currentLocale } }));
        } catch (e) {}
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
