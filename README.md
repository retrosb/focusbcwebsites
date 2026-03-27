# Websites

Static sites for local preview and Cloudflare Pages deployment.

## Layout convention (same for Focus BC and CAAP)

Each site lives in its own folder (`focusbc/`, `caap/`). Inside that folder there are **two layers**:

### 1. `sources/` — what you edit for the visible static site

- HTML pages, `styles.css`, `js/`, and **`favicon.png`** — these are what **`build.mjs`** turns into `public/{site}/` (the favicon is copied to the output root next to `index.html`).
- Use this for normal pages, shared CSS, client-side scripts, and the site icon.

### 2. Package root of that site — *outside* `sources/` (by design)

These files are **not** “missing” from `sources/`; they play different roles:

| Location | Purpose |
|----------|---------|
| **`build.mjs`** | Build entrypoint for this site (reads `sources/`, copies assets, writes `public/`). |
| **`blog-post.template.html`**, **`case-study.template.html`** | **Templates for the local Node server only** — `server.mjs` fills placeholders from `data/*.json` for dynamic blog/case-study URLs. They are **not** static pages in `sources/` and are not meant to be edited as if they were the homepage. |
| **`media/`**, **`locales/`**, **`data/`** | Assets and JSON (too large or structured to live inside `sources/`). |
| **`scripts/`** (under each site) | Per-site maintenance (import JSON, sync content, patches). Distinct from repo-root **`scripts/`**. |
| **Focus BC only:** `blog-built/`, `case-studies-built/` | Optional pre-built HTML merged by the Focus BC build. |

**Cursor:** see `.cursor/rules/static-sites-layout.mdc` for the same rules for AI assistance.

## Repository layout (mirrored for both sites)

| Area | Focus BC | City as a Platform (CAAP) |
|------|----------|---------------------------|
| Page/CSS/JS sources (+ `favicon.png`) | `focusbc/sources/` | `caap/sources/` |
| Media assets | `focusbc/media/` | `caap/media/` |
| i18n JSON | `focusbc/locales/` | `caap/locales/` |
| Structured data | `focusbc/data/` | `caap/data/` |
| Build entrypoint | `focusbc/build.mjs` | `caap/build.mjs` |
| Server HTML templates (not static pages) | `focusbc/blog-post.template.html`, `case-study.template.html` | `caap/blog-post.template.html`, `case-study.template.html` |
| Maintenance scripts | `focusbc/scripts/` | `caap/scripts/` |
| Pre-built article HTML (Focus only) | `focusbc/blog-built/`, `case-studies-built/` | — |

## Build output

Run `npm run build`. Generated files go under **`public/`** (gitignored):

| Path | Site |
|------|------|
| `public/index.html` | Hub landing page |
| `public/focusbc/` | Focus BC |
| `public/caap/` | City as a Platform |

- **Focus BC:** `node focusbc/build.mjs` — reads `focusbc/sources/`, writes `FOCUSBC_OUT` (default `public/focusbc`). Set `FOCUSBC_BASE_PATH=/focusbc` when using the hub layout.
- **CAAP:** `node caap/build.mjs` — reads `caap/sources/`, copies `caap/media`, `caap/locales`, `caap/data`, writes `CAAP_OUT` (default `public/caap`). Set `CAAP_BASE_PATH=/caap` when using the hub layout (the unified `npm run build` sets both).

Convenience scripts: `npm run build:focusbc`, `npm run build:caap` (same as `build:caap-public`).

## Local server

- `npm run serve:server` — serves `public/` when present; CAAP and Focus BC can fall back to unbuilt source trees for development (see `server.mjs`).

Use `public/` as the deployable tree; there is no separate legacy output folder.
