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

- **Focus BC:** `node focusbc/build.mjs` — reads `focusbc/sources/`, writes `FOCUSBC_OUT` (default `public/focusbc`). Set `FOCUSBC_BASE_PATH=/focusbc` when using the hub layout. **Do not** point `FOCUSBC_OUT` at a repo-root folder like `focusbc-output/`; nothing in this repo expects that path, and such folders are leftovers only.
- **Blog index — featured slugs (optional):** `focusbc/data/blog-featured.json` with `{ "slugs": ["post-slug-1", "post-slug-2"] }` pins up to **two** curated posts for the “Featured stories” block. Empty or omitted slugs are filled deterministically so featured and “All articles” do not overlap; a future backoffice can write this file.

### Focus BC: media URLs and the hub path (`/focusbc/`)

The hub serves Focus BC under **`/focusbc/`**. Root-relative URLs like **`/media/...`** resolve to the **host** root (`https://example.com/media/...`), **not** under `/focusbc/`, so images break when you only prefix HTML with `<base>` or when the path is wrong.

**Rules:**

1. **`focusbc/build.mjs`** — For any **injected** HTML (blog index cards, case-study index cards, etc.), use **`blogAssetSrc()`** (or **`absUrl()`**) for `/media/` paths in `src`/`href`. Do not concatenate raw `"/media/" + path` in template strings without going through those helpers.
2. **Second pass** — After replacing the featured/archive mounts, the build runs **`applyBasePrefix()`** again on the full page so any stray `/media/` attributes still get prefixed.
3. **Unified build** — Prefer **`npm run build`** (see `scripts/build-pages.mjs`), which sets **`FOCUSBC_BASE_PATH=/focusbc`** and **`FOCUSBC_OUT`**. If you run `node focusbc/build.mjs` alone, the script still defaults `BASE` to `/focusbc` when the output dir is `public/focusbc`; custom `FOCUSBC_OUT` requires **`FOCUSBC_BASE_PATH`** to match your preview URL.
4. **CSS `url(/media/...)`** — The build rewrites these in emitted `styles.css` when `BASE` is set.

Changing list card markup without keeping (1)–(2) is the usual cause of “broken images” on `/focusbc/blog/` and similar routes.
- **CAAP:** `node caap/build.mjs` — reads `caap/sources/`, copies `caap/media`, `caap/locales`, `caap/data`, writes `CAAP_OUT` (default `public/caap`). Set `CAAP_BASE_PATH=/caap` when using the hub layout (the unified `npm run build` sets both).

Convenience scripts: `npm run build:focusbc`, `npm run build:caap` (same as `build:caap-public`).

## Local server

- `npm run serve:server` — serves `public/` when present; CAAP and Focus BC can fall back to unbuilt source trees for development (see `server.mjs`).

Use **`public/`** as the only deployable tree. There is no second official output directory. If you see **`focusbc-output/`** at the repo root, it is not produced by `npm run build` or `scripts/build-pages.mjs` — remove it; it is listed in `.gitignore` so it cannot be committed by mistake.
