# Daily Dose of Tech

A static site for Daily Dose of Tech. It is a bright, small learning hub with pages for daily tips, PC building, and tech insights. Martin supplies the tips, build steps, and insights. Those lists ship empty until then.

Live URL (placeholder, not yet published): `https://<owner>.github.io/daily-dose-of-tech/`

There is no custom domain and no CNAME. GitHub Pages will serve the site from the `/daily-dose-of-tech/` project path once the repository is published and Pages is turned on.

## Run locally

```sh
npm ci
npm run dev
```

Open [http://127.0.0.1:43123/daily-dose-of-tech/](http://127.0.0.1:43123/daily-dose-of-tech/). The dev server uses the same base path as GitHub Pages.

```sh
npm run build
npm run preview
```

`npm run build` typechecks with strict TypeScript, then writes `dist/`.

## Pages and routing

The site is five real HTML entries, not a client-side router:

| Page | File | URL under the base path |
| --- | --- | --- |
| Home | `index.html` | `/daily-dose-of-tech/` |
| Daily Tech Tips | `daily-tech-tips/index.html` | `/daily-dose-of-tech/daily-tech-tips/` |
| PC Building | `pc-building/index.html` | `/daily-dose-of-tech/pc-building/` |
| Tech Insights / Learning Hub | `insights/index.html` | `/daily-dose-of-tech/insights/` |
| About | `about/index.html` | `/daily-dose-of-tech/about/` |

Each file is a normal page, so a direct visit or a reload works on GitHub Pages without a 404 fallback. Vite `base` is `/daily-dose-of-tech/`.

## Content files

All copy lives in typed modules under `src/content/`.

| File | Export | Shape |
| --- | --- | --- |
| `src/content/site.ts` | `site`, `navItems`, `heroFeatures` | Page titles, intros, and navigation. This is the sourced site copy. |
| `src/content/tips.ts` | `tips: Tip[]` | `Tip { title, summary, tag? }` |
| `src/content/pc-build-steps.ts` | `buildSteps: BuildStep[]` | `BuildStep { title, body }`. Order is the array position. |
| `src/content/insights.ts` | `insights: Insight[]` | `Insight { title, summary, group: "software" \| "hardware" }` |

`tips`, `buildSteps`, and `insights` are empty on purpose. Each file has a `CONTENT NEEDED: supplied by Martin` comment and a shape to follow.

### Add a tip

Edit `src/content/tips.ts` and append an object:

```ts
export const tips: Tip[] = [
  {
    title: "Short tip title",
    summary: "One or two sentences.",
    tag: "Windows",
  },
]
```

`tag` is optional. When the array is empty, Daily Tech Tips shows its intro and one note: "Content is coming." When it has items, each tip is a card.

### Add a PC build step

Edit `src/content/pc-build-steps.ts`. Put the first thing the reader does at the top. The page renders an ordered list (`<ol>`), so do not add a step number field.

```ts
export const buildSteps: BuildStep[] = [
  {
    title: "Step title",
    body: "What to do in this step.",
  },
]
```

### Add an insight

Edit `src/content/insights.ts`. Set `group` to `"software"` or `"hardware"`. The insights page splits the list into those two groups.

```ts
export const insights: Insight[] = [
  {
    title: "Insight title",
    summary: "One or two sentences.",
    group: "software",
  },
]
```

Do not invent stats, testimonials, contact details, or certification material. Page intros in `site.ts` come from the current Daily Dose of Tech site, with certification and template lines removed.

## Theme

The first visit follows the operating system color scheme. The header toggle stores `theme` in `localStorage` (`light` or `dark`). An inline script in each HTML file applies that choice before paint.

## Checks

```sh
npm run verify          # pages, links, empty content, fixture rendering
npm run contrast        # WCAG AA pairs for both themes
npm run browser-checks  # headless Chrome against vite preview
```

Evidence is written to `build-checks/`. Screenshots from the browser check land in `screenshots/`.

## Deploy

`.github/workflows/deploy.yml` builds on a push to `main` (and on manual dispatch) and deploys `dist/` to GitHub Pages. Do not add a CNAME. The workflow is in the repo and has not been run from this workspace.
