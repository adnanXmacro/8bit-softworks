# AGENTS.md — 8BiT Softworks store

Notes for any AI agent (or human) working on this repository. Read this before changing anything.

## What this project is

A static, framework-free GitHub Pages app catalog for **8BiT Softworks**. It lists Android
apps and links to their APK downloads hosted on GitHub. There is no backend, no build step,
and no package manager — the files in this folder are served as-is.

- Site root: this repository (GitHub Pages, branch `main`, `/ (root)`).
- Live URL: `https://adnanxmacro.github.io/8bit-softworks/`
- Hosting target of the downloadable APKs: external GitHub repos, not this one.

## File map

```
index.html            Home page. Mounts the catalog into [data-store].
404.html              Not-found page with big gradient "404".
favicon.svg           Site icon (red/black 8B monogram).
apps.json             THE datastore. Only source of app listings.
css/store.css         Entire design system (tokens + all components).
js/store.js           Catalog rendering + public-site interactivity (ES modules).
js/admin.js           Admin gate + GitHub Contents API client (ES modules).
admin/index.html      Admin editor UI (password gate + JSON form).
app/quiz-chaos/index.html   App detail shell; slug from URL path.
app/open-tube/index.html    App detail shell; slug from URL path.
test/store.test.mjs   Tests for js/store.js and apps.json.
test/admin.test.mjs   Tests for js/admin.js.
sitemap.xml, robots.txt, .nojekyll   SEO / Pages plumbing.
```

## How it works

### Data flow
`apps.json` is the single datastore. Pages fetch it at runtime and render with plain JS:

- `appsJsonUrl()` (in `js/store.js`) resolves the correct relative path to `apps.json`
  depending on whether the page is at the root, under `/app/<slug>/`, or under `/admin/`.
  If you add a new page depth, update this function.
- `loadApps(fetchImpl, url)` fetches and validates that the payload is an array.
  It never throws — it returns `{ ok:false, message, apps: [] }` on any failure.
- Home: `mountCatalog(root)` reads `apps.json`, renders `renderStore(apps)`, then wires up
  search, category chips, and the grid/list toggle using `data-*` attributes on the cards.
- App pages: `mountAppPage(root, slug)` finds the app by slug and renders `renderAppPage(app)`,
  then attaches the screenshot lightbox.

### Escaping and security
- Every interpolated value goes through `escapeHtml()`. Keep it that way — the data is
  user-editable via the admin panel.
- `renderAppPage` only enables the Install button when `apkUrl` matches `^https://`.
  Anything else renders a disabled button. Do not loosen this.
- The admin password check and the GitHub token are **not real auth**. The password only
  unhides the form in the browser (`ADMIN_PASSWORD` in `js/admin.js` is visible in source).
  The token is held in memory only for the tab (`tokenStorage`); `persistTo()` is a no-op
  and must stay a no-op. Never write the token to `localStorage`, `apps.json`, or the repo.

### Rendering helpers (js/store.js)
- `renderCatalog(apps)` — cards only (used by tests).
- `renderStore(apps)` — featured hero + toolbar + cards + empty state (used by the home page).
- `renderFeatured(app)` — the highlighted "Editor's pick" banner.
- `renderAppPage(app)` — full app detail markup including stats, tags, gallery, install steps.
- `renderToolbar(apps)` — search box, category chips, grid/list toggle.
- `collectCategories(apps)` / `filterApps(apps, {query, category})` — pure helpers, testable.
- `statsMarkup(app)` — rating / downloads / updated badges.
- Icons are inline SVG strings in the `ICONS` map. Add new ones there rather than in HTML.

## Features that exist today

- Dark **black + red** theme driven entirely by CSS custom properties in `:root`
  (`css/store.css`). Change `--red-*`, `--bg*`, `--surface*`, `--text*`, `--grad-red` there
  to re-theme the whole site.
- Redesigned brand: "8B" monogram badge (inline SVG, duplicated in each page header and
  exported as `favicon.svg`). If you change the mark, update **all** copies
  (`index.html`, `404.html`, `admin/index.html`, both `app/**/index.html`, `favicon.svg`).
- Featured app hero (driven by `featured: true` in `apps.json`; falls back to the first app).
- Live search filtering (name, developer, blurb, description, category, tags).
- Category filter chips (categories are auto-derived from the data).
- Grid / list layout toggle.
- Stats badges: rating, downloads, last-updated date.
- Screenshot gallery with a click-to-open lightbox (Esc or click-outside to close).
- Empty/loading states (shimmer skeleton) and a graceful "Apps unavailable" state.
- Responsive layout down to mobile; respects `prefers-reduced-motion`.

## apps.json schema

Each entry supports:

| field         | type     | notes                                                        |
|---------------|----------|--------------------------------------------------------------|
| `slug`        | string   | URL segment; must match the folder under `app/<slug>/`.      |
| `name`        | string   | Display name.                                                |
| `developer`   | string   | Displayed as "by <developer>" on the detail page.            |
| `blurb`       | string   | One-line summary shown on cards and the featured hero.       |
| `description` | string   | Long text on the detail page.                                |
| `iconUrl`     | string   | Absolute URL to the app icon.                                |
| `apkUrl`      | string   | Must be `https://` for the Install button to be active.      |
| `version`     | string   | Shown as a stat pill.                                        |
| `size`        | string   | Shown as a stat pill (e.g. "APK" or "12 MB").                |
| `category`    | string   | Drives the filter chips.                                     |
| `tags`        | string[] | Extra chips on the detail page; also searchable.             |
| `rating`      | number   | 0–5; shown with a star. Optional.                            |
| `downloads`   | string   | Free-form, e.g. "38K+". Optional.                            |
| `updatedAt`   | string   | `YYYY-MM-DD`; rendered as "Oct 2, 2026". Optional.           |
| `featured`    | boolean  | Marks the home-page hero app.                                |
| `screenshots` | string[] | Absolute URLs. Empty array renders a placeholder, not a break. |
| `installSteps`| string[] | Optional override of the default 4 install steps.            |

When you add an app, you must also create `app/<slug>/index.html` (copy an existing one and
change the fallback slug in its inline script).

## Tests

No dependencies. Run with Node's built-in runner:

```
node --test test/store.test.mjs test/admin.test.mjs
```

All 26 tests must pass before committing. The suite asserts, among other things:
- the exact install URLs in `apps.json`,
- that Install is disabled when `apkUrl` is empty,
- that the default 4 install steps render,
- search/category filtering, featured rendering, toolbar presence,
- that the GitHub token never leaks into result messages or storage.

If you change markup the tests match on, update the tests in the same commit.

## Committing / deploying

- Pages deploys from `main` at repo root; there is no build output to commit.
- Keep `apps.json` valid JSON with a trailing newline (the admin save path writes one).

## Local preview

Any static server works:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.
