# Daily Dose of Tech — done criteria

Approved by Martin on Nov 20, 2026. The brief’s “approval draft” header is stale and was ignored. The attached brief file was not on disk in this workspace, so these 13 criteria are the approved decisions in the build request. Copy comes from the live site at dailydoseoftech.net (captured Nov 21, 2026), with certification and real-estate template lines removed.

The logo file named in the request was also missing from disk. `src/assets/logo.png` and `public/favicon.png` are the live 375×437 logo, copied byte for byte and not edited. PNG IHDR is 375×437, indexed color, and the first palette entry is fully transparent.

## QA fixes

Three defects from the first review are fixed in this draft. Content arrays, the base path, and the Pages workflow are unchanged. The workflow was not run, and nothing was published.

1. Contrast. The About kicker no longer uses `text-secondary`. That token is a fill (`#115e59` in dark mode) and was 2.62:1 on `#09090b`. Kicker text now uses `--kicker`: `#0f766e` in light and `#5eead4` in dark. No other `text-secondary` remains. `marker:text-primary` and the link color stay text uses of tokens that pass on the page background. `secondary` is only a fill, paired with `secondary-foreground`.
2. Home heading. The only `h1` is “Daily Dose of Tech”. “Empower Your Tech Journey” is the line above it. The words are unchanged.
3. Color. The home hero and every other page header sit on the primary band (raspberry `#be185d` with white text in light, pink `#f9a8d4` with `#18181b` text in dark). Feature cards have teal, yellow, and primary headers, plus a filled primary button labeled with that card’s title. The Learn More block is the teal fill. Section headings on the inner pages use the same fills.

Kicker ratios from `build-checks/contrast.json` (all pass, minimum 4.5):

| Pair | Light | Dark |
| --- | --- | --- |
| kicker on background | 5.24 (`#0f766e` on `#fafafa`) | 13.45 (`#5eead4` on `#09090b`) |
| kicker on card | 5.47 (`#0f766e` on `#ffffff`) | 11.98 (`#5eead4` on `#18181b`) |
| kicker on muted | 4.98 (`#0f766e` on `#f4f4f5`) | 10.07 (`#5eead4` on `#27272a`) |
| primary on background | 5.78 (`#be185d` on `#fafafa`) | 10.97 (`#f9a8d4` on `#09090b`) |
| primary on card | 6.04 (`#be185d` on `#ffffff`) | 9.77 (`#f9a8d4` on `#18181b`) |

The theme toggle wraps `localStorage.getItem` and `localStorage.setItem` in try/catch. The inline head script already did. The toggle still changes the document class when storage is blocked.

## 1. Stack

Done. Vite 8, React 19, TypeScript strict (`strict: true` in `tsconfig.app.json`), Tailwind 4, shadcn/ui.

- `components.json` sets `"style": "new-york"`, `"baseColor": "zinc"`, and `"cssVariables": true`.
- The `@/` alias is in `tsconfig.json`, `tsconfig.app.json`, and `vite.config.ts`.
- Components added: button, card, badge, separator, navigation-menu.

shadcn’s New York components also install `radix-ui`, `class-variance-authority`, `cn`, and `lucide-react` (the menu chevron and the theme icons). `puppeteer-core` is a dev dependency so the headless checks can drive the Chrome already on this machine. No router library.

## 2. GitHub Pages base and workflow

Done, and the workflow has not been run.

- `vite.config.ts` sets `base` to `/daily-dose-of-tech/`.
- `.github/workflows/deploy.yml` runs on push to `main` and `workflow_dispatch`. It runs `npm ci`, `npm run build`, uploads `dist` with `actions/upload-pages-artifact@v3`, and deploys with `actions/deploy-pages@v4`.
- Permissions include `pages: write` and `id-token: write` (plus `contents: read` so checkout can read the repo).
- No CNAME and no custom domain.

## 3. Routing

Done. Choice: **Vite multi-page HTML entries**.

Each page is its own `index.html`, and every entry loads the same React app. The app reads `window.location.pathname` (with the base stripped) and renders that page. Direct visits and reloads work on GitHub Pages because the server has a real file for each URL. Hash routing would also survive reloads, but the pages would not exist as files. A `404.html` copy of the app returns HTTP 404. Multi-page entries avoid both of those.

| Page | Built file |
| --- | --- |
| Home | `dist/index.html` |
| Daily Tech Tips | `dist/daily-tech-tips/index.html` |
| PC Building | `dist/pc-building/index.html` |
| Tech Insights / Learning Hub | `dist/insights/index.html` |
| About | `dist/about/index.html` |

`scripts/verify-build.tsx` confirms all five files exist and that the header on every page links to all five URLs under `/daily-dose-of-tech/`.

## 4. Five pages, header, toggle, footer

Done. The header has the logo on a light rounded badge, a nav to Home, Daily Tech Tips, PC Building, Tech Insights / Learning Hub, and About, and the light/dark toggle. The footer repeats the name, the “Your Tech Learning Hub” line, and the same five links.

## 5. About page

Done. About keeps the live about-us lines that are not certification or template copy:

- “Daily Tech Tips for IT Enthusiasts and Learners”
- “Daily Dose of Tech”
- “Empowering you with IT knowledge and PC building insights for everyday success.” (the CompTIA exam-prep clause is removed)
- Daily Tech Tips, Daily Guides (“Ranging From Software to Hardware & MUCH MORE!”), and Build Your Dream Gaming PC

The “15+ Expert Guides” stat is not on the page. The “50+ Study Materials” stat sat on the certification block and is gone with it. `mit-evaluating-performance` is not in the repo.

## 6. Certification and real-estate text removed

Done. `scripts/verify-build.tsx` scans `src/` and `dist/` text files and filenames for CompTIA, `A+`, exam-prep, exam preparation, Sunshine Bay, Bridgewater Joy, Pleasantview Gem Inn, and residences. Result: clean (`build-checks/verify.json`, check “banned template and certification text is absent”).

`A+` is matched with a capital A so the certification token is caught. The production bundle still contains ordinary JavaScript `a+` concatenation from React; that is not the certification string.

There is no `/applications` page and no CompTIA page.

## 7. Content modules

Done. Page intros live in `src/content/site.ts`. Lists live in:

- `src/content/tips.ts` — `Tip { title, summary, tag? }`, array empty
- `src/content/pc-build-steps.ts` — `BuildStep { title, body }`, order is array position, array empty
- `src/content/insights.ts` — `Insight { title, summary, group: "software" | "hardware" }`, array empty

Each empty array has `// CONTENT NEEDED: supplied by Martin` and a shape comment. The verifier asserts all three lengths are 0. Fixtures are created inside `scripts/verify-build.tsx` only and are not written into `src/` or `dist/`.

Light edits, all to drop certification wording:

- Home lead and the insights intro drop “IT exam tips”.
- The “Learn More” paragraph drops the CompTIA A+ clause.
- The about lead drops “CompTIA exam prep”.
- The about meta description drops “CompTIA A+ exam preparation”.

No tips, build steps, insights, bios, contact details, stats, or testimonials were added.

## 8. Empty states and populated rendering

Done.

- Empty Daily Tech Tips, PC Building, and Insights pages render the sourced intro plus one note: “Content is coming.”
- Empty PC Building does not render an `<ol>`. Empty Insights does not render Software or Hardware groups.
- With fixtures, `BuildStepList` renders `<ol class="... list-decimal">` and the three titles in array order.
- With fixtures, `InsightGroups` renders Software (Soft One, then Soft Two) and then Hardware (Hard One).

Both fixture checks passed in `build-checks/verify.json`.

## 9. Design, contrast, focus, motion, layout

Done.

- Zinc neutrals with raspberry (`#be185d` / `#f9a8d4`), teal, and yellow (`#fde047`) accents. The active nav item and the “Your Tech Learning Hub” chip use the yellow with `#18181b` text.
- `build-checks/contrast.json`: 46 pairs, all pass WCAG 2.1 AA. Lowest text pair is the light kicker on muted, 4.98:1 (minimum 4.5). Lowest UI pair is the light border, 4.63:1 (minimum 3). Black logo artwork on the white badge is 21:1 in both themes.
- The logo sits on `bg-logo-badge` (`#ffffff`) in both themes, so the black artwork stays visible in dark mode.
- Links and controls use `:focus-visible` outlines. Headless Chrome tabbed through the skip link, nav, theme toggle, and a feature card and recorded a visible outline or ring (`build-checks/browser.json`).
- The hero uses a 480ms rise. `prefers-reduced-motion: reduce` forces animation and transition durations to 0.01ms. The browser check saw 480ms with motion allowed and at most 0.05s with motion reduced.
- No horizontal overflow at 390, 768, and 1440 in both themes, on all five pages.

## 10. Theme

Done.

- First visit with no `localStorage` key follows `prefers-color-scheme`. Checked for both light and dark. Stored value was null and `data-theme` matched the OS preference.
- The toggle writes `theme` to `localStorage`. That value survived a real navigation to About and a reload, in both directions (light to dark, and dark to light).
- Each HTML file runs an inline script as the first thing in `<head>`. It sets the `dark` class, `color-scheme`, and the background before paint. Samples taken at first paint and after did not show the opposite theme (`no flash of the wrong theme` checks in `build-checks/browser.json`).

## 11. README

Done. `README.md` lists the content files, the `Tip`, `BuildStep`, and `Insight` shapes, and how to append a tip, a build step, or an insight. The live URL is the placeholder `https://<owner>.github.io/daily-dose-of-tech/` and is marked not yet published.

## 12. Proof

Done. Commands were run in `/agent/repos/tmp-3185f49920692193`. Exit codes are also in `build-checks/*.exit`.

`npm ci` exit 0. stdout:

```
added 151 packages, and audited 158 packages in 3s

21 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

stderr was empty.

`npm run build` exit 0. `tsc -b` reported no errors. stdout:

```
> daily-dose-of-tech@0.0.0 build
> tsc -b && vite build

vite v8.3.8 building client environment for production...
transforming...
✓ 2263 modules transformed.
rendering chunks...
computing gzip size...
dist/pc-building/index.html        1.38 kB │ gzip:  0.66 kB
dist/insights/index.html           1.43 kB │ gzip:  0.70 kB
dist/index.html                    1.44 kB │ gzip:  0.69 kB
dist/about/index.html              1.47 kB │ gzip:  0.71 kB
dist/daily-tech-tips/index.html    1.50 kB │ gzip:  0.73 kB
dist/assets/logo-CcA_M6Lb.png     29.72 kB
dist/assets/main-Dd7R7B6b.css     35.16 kB │ gzip:  6.97 kB
dist/assets/main-DXwiFWFp.js     306.69 kB │ gzip: 98.12 kB

✓ built in 288ms
```

stderr was empty.

`node scripts/run-module.mjs scripts/verify-build.tsx` exit 0. 21 checks, all pass. See `build-checks/verify.json`.

`node scripts/run-module.mjs scripts/contrast.ts` exit 0. See `build-checks/contrast.json`.

`node scripts/run-module.mjs scripts/browser-checks.ts` exit 0 against `vite preview` at `http://127.0.0.1:43219/daily-dose-of-tech/`. 64 checks, all pass. See `build-checks/browser.json`.

Screenshots, light and dark at 1440 and 390, for all five pages: `home`, `tips`, `pc`, `insights`, and `about` (20 files in `screenshots/`).

## 13. Live URL verified

Pending release. Nothing has been published. The workflow file is in the repo and was not dispatched. There is no CNAME. The public URL is still the placeholder in the README.

## Open content

- `src/content/tips.ts` — tips, supplied by Martin
- `src/content/pc-build-steps.ts` — build steps, supplied by Martin
- `src/content/insights.ts` — software and hardware insights, supplied by Martin
- GitHub owner name for `https://<owner>.github.io/daily-dose-of-tech/`
- Turn on GitHub Pages after the repository exists. Do not add a custom domain unless that decision changes.
