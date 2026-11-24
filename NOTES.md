# Daily Dose of Tech v3

v3 is the bolder-upgrades round on the v2 tree at `b1defee` (handoff SHA `f55ff2715c33737c0ead8030c1737b68b4a52702b1e99ec8189a287326a13f63`). v1 is `37f9983`. Martin approved the upgrades spec on Nov 23, 2026, with the proposed defaults, and cut upgrades 15 and 18.

Home order is the full-bleed hero, the marquee, the pinned story, the bento grid, then the Learn More finale. The first visit still follows the system theme, and the existing toggle still persists. Dark is the showcase. The hero is 2D. Content arrays are still `= []`. The only new user-facing strings are interface labels.

Nothing was published. `.github/workflows/deploy.yml` was not run.

## Round 2 fixes

The first v3 composites showed five defects. They are fixed on main, and the proof set below was rerun after the fixes.

1. Each word of "Daily Dose of Tech" is a `whitespace-nowrap` span around its letters. The headline uses `clamp(2.75rem, 13.5vw, 12.5rem)`, which computes to 194.4px at 1440 (3.24× v2's 60px). A browser check confirms every word's letters share one line box at 1440, 768, and 390.
2. Below 1280px the header is a compact bar: logo, title, Search, the theme toggle, and a Menu button that opens a normal link panel. It is not a `rounded-full` container around a stacked list. At 1440 the single-row pill remains. A check confirms the header box does not intersect the page h1 or the hero text at 390, 768, and 1440 on every page.
3. Dark hero and dark page headers are near-black (`#07060b`) with neon raspberry, teal, and yellow glows and a mesh. They are no longer full-area pastel fills. Light mode still uses the saturated blocks. Dark hero text `#fafafa` on the backdrop extremes is 19.35:1 (`#07060b`) and 4.99:1 (`#8c5f7a`). The dark pill edge is the same `#fafafa` pair, so it clears 3:1.
4. At 768px and wider, each pinned chapter fills the viewport (1440×900 and 768×900 in the check) with a display-size number (256px at 1440, 138px at 768) and a full color wash. Below 768px, and under reduced motion, the chapters stay stacked.
5. The pause controls are named "Pause tagline", "Pause background", and "Pause marquee" (and the matching Play labels). The copy diff lists those, plus "Menu", as the new interface strings. `unexpected` is empty.
6. Viewport shots remain. Full-page shots after a scroll-through are `screenshots/{page}-{width}-{theme}-full.png` for all five pages at 1440 and 390 in both themes (20 files). The eight composites were rebuilt. Home composites use the full-page captures scaled to a shared 640px width. The lowest panel standard deviation is 39.45.
7. `motion/home.mp4` and `motion/frames/` were recorded again. No frame is blank. The lowest frame standard deviation is 30.34.

The composite, motion, bundle, Lighthouse, and browser numbers below were refreshed after the label stacking and slide-timing fix. That section is the current record.

## Dependencies

| Package | Why |
| --- | --- |
| `motion` | Page fade, reduced-motion hook, theme-icon morph, and the existing reveal and timeline motion. Kept from v2. |
| `cmdk` | Keyboard list inside the command palette. Kept from v2. |
| `lenis` | Smooth scrolling for upgrade 12. It starts only when motion is allowed, the pointer is fine, and the viewport is at least 768px. |
| shadcn `command`, `dialog`, `toggle`, `toggle-group`, `checkbox`, `progress` | Same palette, filter, and tracker UI as v2. |

No `three`, no `@react-three/fiber`, and no WebGL. Lighthouse was run with `npx lighthouse` and is not a project dependency. `puppeteer-core` is the browser runner, as in v2.

## Cut upgrades

- 15, the scroll-synced PC build visual. PC Building's only PC drawing is the unlabeled self-drawing case sketch in the empty scene. No part labels, no part highlighting, no scroll sync.
- 18, the 3D hero. The hero stays CSS and SVG.

## v2 criteria 1–14

1. **PASS.** `dist/` has the same five HTML entries: `index.html`, `daily-tech-tips/index.html`, `pc-building/index.html`, `insights/index.html`, `about/index.html`. The verifier checks that every header links to all five under `/daily-dose-of-tech/`. No new routes.
2. **PASS.** `scripts/copy-diff.mjs` against `b1defee` reports added strings `Menu`, `Pause background`, `Pause marquee`, `Pause tagline`, `Play background`, `Play marquee`, `Play tagline`, and `⌘K`, and `unexpected: []`. Those are interface labels. `Skip to content` was already in v2. Chapter numbers are `0` plus the index, not new sentences.
3. **PASS.** The verifier banned-term scan of `src/` and `dist/` found no CompTIA, certification `A+`, exam prep, or the real-estate names.
4. **PASS.** Browser check "home features are present" found the header, active indicator, page transition, reveal, progress bar, backdrop, rotating tagline, three tilt cards, Learn More, the header logo, and Search. `heroLogo` is false. Each inner page has one logo image, and it is in the header.
5. **PASS.** Empty Tips, PC Building, and Insights show "Content is coming." and no probe titles. A temporary edit added one tip, one step, and one insight. Each showed in its list, filter or tracker, and the palette. Blocked `localStorage` still rendered the step and let the checkbox toggle. The files were restored to `= []`.
6. **PASS.** With `prefers-reduced-motion: reduce`, the tagline stayed on "Your Tech Learning Hub" for 4.5s, the backdrop reported `data-playing="false"`, chapters were `data-stacked="true"` (3 chapters), smooth scroll was off, the marquee animation name was `none`, letter spans were 0, and every finale word was visible. Search still opened the palette.
7. **PASS.** Search opens the palette, Ctrl+K opens it, Esc closes it, and focus returns to Search. Tab stays inside the dialog. The injected tip's filter, search, and Show summary work from the keyboard. The step checkbox and the Software/Hardware switch work from the keyboard. Pause controls for the tagline, marquee, and backdrop activate with Enter and with a click. Skip to content points at `#content`, which follows the pinned story.
8. **PASS.** A first visit with no stored theme followed light (`#fafafa`) and dark (`#07060b`). A toggle to dark survived navigation to About and a reload. First-paint samples did not show the other theme.
9. **PASS.** `contrast.json` has 64 pairs, all at or above their floor. Hero text at the backdrop extremes: light 7.88 (`#ffffff` on `#9d174d`) and 5.47 (`#ffffff` on `#0f766e`). Dark hero text and the dark pill edge are `#fafafa` on `#07060b` (19.35:1) and on `#8c5f7a` (4.99:1). Title gradient stops `#ffffff` / `#fef9c3` in light and `#fafafa` / `#fef9c3` in dark clear 4.5:1 on both extremes (lowest is 4.85:1). Nav text on the active pill is highlight-foreground on highlight, 13.44:1 in both themes. Foreground on the solid glass color is 17.72:1 in light and 16.68:1 in dark.
10. **PASS.** The injected step stayed checked after reload. With `localStorage` throwing, the step still rendered and the checkbox still toggled.
11. **PASS.** Lighthouse Home (`lighthouse/summary.json`): mobile performance 98, accessibility 100, CLS 0, LCP 1891.51 ms; desktop performance 100, accessibility 100, CLS 0, LCP 432.76 ms. Mobile LCP is under 2.5 s. Home's initial script is `dist/assets/main-1VHs0q0h.js`. Node `zlib.gzipSync` at the default level compresses it to **166497 bytes**. That is **166.50 KB** when 1 KB = 1000 bytes, and **162.59 KiB** when 1 KiB = 1024 bytes. Both are under the 220 KB budget (220000 bytes, and also under 220 KiB = 225280 bytes). Vite's build log prints **168.08 kB** for the same file. That line uses 1 kB = 1000 bytes and Vite's own gzip, which is not the same stream as Node's `gzipSync`. The lazy palette chunk is separate (`command-palette-DmFIaETq.js`, 13.82 kB in Vite's log) and is not part of the initial Home script. The node gzip is 568 bytes above 165929 bytes.
12. **PASS.** No horizontal overflow at 390, 768, and 1440 in both themes on all five pages. Screenshots are `screenshots/{page}-{width}-{theme}.png`, taken after a scroll through the page.
13. **PASS.** Both `npm ci` runs exited 0. Both `npm run build` runs exited 0. `tsc -b` reported no TypeScript errors. The verifier found every internal link and asset under `/daily-dose-of-tech/`. The two `dist` trees are byte-identical (10 files, 0 hash diffs). The listing is `build-logs/dist-sha256.txt`. Vite printed a chunk-size warning because the raw main chunk is over 500 kB. That warning is not a type error, and the gzipped initial script is inside the budget.
14. **PASS.** Runtime dependencies are the ones in the table above. `lenis` is the only new one.

## Updated acceptance criteria

1. **PASS.** At 1440×900 the hero box is 1440×900 with `border-radius: 0px`, and the headline computes to 194.4px. v2's `sm:text-6xl` headline is 60px, so 194.4 is 3.24× that size. The 3× bar used by the check is 180px. At 390×844 the hero box is 390×844.
2. **Evidence for Martin.** Eight labeled composites are in `screenshots/composite-{home|pc}-{1440|390}-{light|dark}.png`. v1 is `37f9983` and v2 is `b1defee`, each built in its own worktree. Per-panel luminance mean and standard deviation, sampled below the label bar, are in the table below. None are flat. The fail rule was standard deviation below 12 or mean below 8.
3. **Evidence for Martin.** `motion/home.mp4` (433 KB) and `motion/frames/` show the headline reveal, the backdrop, the marquee, the pinned chapters while scrolling, and the move to About. Frame stats are below. None are blank.
4. **PASS.** Home has the marquee, pinned story, bento, finale, glass nav, and 4 pause controls. `canvas` and `[data-pc-scroll-visual]` are absent. Tips, PC Building, and Insights have a 60vh immersive header and an empty scene (`tips`, `pc`, `insights`) with no SVG text and no canvas. About has the immersive header and the outlined echo line. The PC scene is an unlabeled case sketch.
5. **PASS.** See v2 criterion 2. The copy diff's `unexpected` list is empty.
6. **PASS.** Each page has one image, and it is the header logo. The hero contains no image. The logo animation is the existing CSS entrance and hover, and the reduced-motion block sets that animation to none.
7. **PASS.** See v2 criterion 6. At 390px, chapters are stacked and `data-smooth-scroll` is unset. Spotlight, magnetic pull, and letter animation do not run when reduced motion is on or the pointer is coarse or the viewport is under 768px.
8. **PASS.** Keyboard and pointer each paused the tagline (`data-paused=true`), the marquee (`data-paused=true`), and the backdrop (`data-playing=false`). The accessible names before activation are "Pause tagline", "Pause marquee", and "Pause background".
9. **PASS, one by one.** The pill border is 2px. On the light capture its edge computed to `rgb(255, 255, 255)`; the dark edge is `#18181b` and the contrast pairs above are 9.77:1 and 13.44:1. The page transition node is present. Home has 8 lift cards. The tagline pause control is keyboard operable. `ComingSoonNote` supplies the "Content is coming." line inside every empty scene.
10. **PASS.** Initial Home JS is 166497 bytes gzipped. There is no 3D chunk. Lighthouse numbers are in v2 criterion 11.
11. **PASS.** 64/64 contrast pairs. Backdrop extremes, the pill edge, and glass are the pairs quoted in v2 criterion 9.
12. **PASS.** With `document.startViewTransition` removed and cross-document view transitions turned off, a click from Home still landed on About (`h1` text "About") and the motion fallback node `[data-page-transition]` was present. Upgrade 18 was not built, so there is no WebGL fallback to test.
13. **PASS.** Build, overflow, theme, and the base path are the v2 criteria 8, 12, and 13 results above.
14. **Needs Martin's sign-off.** The composites and `motion/home.mp4` are the evidence. This one is subjective.

## Composite panel variance

| File | v1 mean / stddev | v2 mean / stddev | v3 mean / stddev |
| --- | --- | --- | --- |
| `composite-home-1440-light.png` | 62.37 / 79.88 | 65.13 / 81.71 | 181.19 / 79.21 |
| `composite-pc-1440-light.png` | 209.23 / 74.37 | 208.66 / 74.43 | 144.94 / 89.42 |
| `composite-home-390-light.png` | 94.10 / 96.49 | 102.13 / 99.43 | 159.83 / 81.46 |
| `composite-pc-390-light.png` | 194.84 / 82.14 | 194.67 / 81.65 | 146.63 / 89.24 |
| `composite-home-1440-dark.png` | 34.71 / 40.61 | 34.55 / 43.26 | 39.45 / 48.06 |
| `composite-pc-1440-dark.png` | 56.38 / 72.25 | 57.60 / 71.79 | 37.88 / 39.26 |
| `composite-home-390-dark.png` | 47.24 / 57.08 | 40.05 / 50.78 | 55.40 / 55.58 |
| `composite-pc-390-dark.png` | 73.77 / 86.59 | 74.80 / 84.75 | 36.61 / 45.92 |

The lowest standard deviation is 39.26. The script's flat-panel rule did not fire. Home panels are the full-page captures scaled to 640px wide, so the shorter v1 and v2 pages are padded to v3's height and their means sit lower. Full JSON is `build-logs/composite-variance.json`.

## Motion frames

| Frame | Mean | Stddev | Blank |
| --- | --- | --- | --- |
| `t0.png` | 57.33 | 30.16 | no |
| `t1.png` | 76.15 | 60.90 | no |
| `marquee-fast.png` | 51.41 | 50.04 | no |
| `marquee-reverse.png` | 53.19 | 52.19 | no |
| `header-0.png` | 33.73 | 33.04 | no |
| `header-1.png` | 39.56 | 44.75 | no |
| `transition.png` | 44.26 | 51.26 | no |

The lowest frame standard deviation in `motion/frames.json` is 29.95. `motion/marquee-rates.json` records playback rate +1.27 while scrolling down and -1.35 while scrolling up. None of the 29 frames are blank. `motion/home.mp4` is 588934 bytes.

## QA round 1 fixes

1. **PASS.** Inactive pinned chapters set `inert`, `aria-hidden`, and `visibility: hidden`. Browser check "tab skips inactive chapters at 1440" found no tab stop inside an inactive chapter. "stacked chapters at 390 are focusable" and the reduced-motion check both found all three chapters without `inert` and with a link. "chapter rail focus ring is visible" measured an outline of at least 2px. "skip to content still works" landed on `#content`.
2. **PASS.** The Learn More finale renders `learnMoreTitle` as its own `h2` with `mb-6`. Scroll highlighting stays on the body. The full-page Home shots show the separate heading.
3. **PASS.** "Empower Your Tech Journey" uses the same letter reveal, and the title fill animates `--title-pos` between `#ffffff`/`#fef9c3` in light and `#fafafa`/`#fef9c3` in dark. Both stops pass AA on both backdrop extremes (lowest 4.85:1). The title is real text. Reduced motion does not add the letter spans. Mobile LCP is 1750.15 ms, under 2.5 s.
4. **PASS.** The marquee sets `playbackRate` from `useScroll` / `useVelocity` / `useSpring`. `motion/marquee-rates.json` is +1.29 scrolling down and -1.33 scrolling up. `marquee-fast.png` and `marquee-reverse.png` show the band. Reduced motion and the pause control set `data-paused="true"` and `animation: none`.
5. **PASS.** Inner-page titles split into nowrap words and reveal only when motion is allowed and the viewport is at least 768px. The grid layer uses a scroll-linked `translate3d` in that same case. `header-0.png` is the reveal starting and `header-1.png` is "PC Building" intact.
6. **PASS.** About's three editorial paragraphs use `ScrollWords`. Reduced motion highlights every word immediately; the reduced-motion check requires the finale words to be highlighted, and the same component is used on About.
7. **PASS.** The hero backdrop includes a static `feTurbulence` data-URI noise tile (`[data-hero-noise]`), with no animation. The active nav item is a `motion` `layoutId="nav-pill"` highlight. Its transition duration is 0 under reduced motion. Text on that pill is 13.44:1.

## Command output

First `npm ci` exit 0. stderr empty.

```
added 157 packages, and audited 164 packages in 2s

22 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

First `npm run build` exit 0. stderr is the Vite chunk-size warning only.

```
> daily-dose-of-tech@0.0.0 build
> tsc -b && vite build

vite v8.3.8 building client environment for production...
transforming...
✓ 2714 modules transformed.
rendering chunks...
computing gzip size...
dist/pc-building/index.html                1.38 kB │ gzip:   0.66 kB
dist/insights/index.html                   1.43 kB │ gzip:   0.70 kB
dist/index.html                            1.44 kB │ gzip:   0.69 kB
dist/about/index.html                      1.47 kB │ gzip:   0.71 kB
dist/daily-tech-tips/index.html            1.50 kB │ gzip:   0.73 kB
dist/assets/logo-CcA_M6Lb.png             29.72 kB
dist/assets/main-1zQZJ-gj.css             55.29 kB │ gzip:  11.13 kB
dist/assets/command-palette-DmFIaETq.js   40.02 kB │ gzip:  13.82 kB
dist/assets/main-1VHs0q0h.js             522.00 kB │ gzip: 168.08 kB

✓ built in 376ms
```

Second `npm ci` exit 0. Second `npm run build` exit 0. The sha256 listing of `dist` matched the first build (`IDENTICAL`, 10 files).

Verifier exit 0. Contrast exit 0 (64 pairs). Copy diff exit 0, `unexpected` empty. Bundle report exit 0 (`166497` bytes, 568 bytes above 165929, pass). Browser checks exit 0, 208 checks, 0 failures. Lighthouse exit 0. Composites exit 0. Motion capture exit 0.

## QA round 2 fix

The active nav marker is a plain `span` inside the active link, with `inset-0`, `rounded-md`, and `bg-highlight`. It renders on the active page from the first React paint, in both themes, including reduced motion. The `motion` import is gone from `site-header.tsx`, and the span has no `view-transition-name`. The dark label color `#18181b` is applied only by `a.nav-active`, which is the same condition that renders the yellow fill.

Browser checks at 1440, for all five pages in light and dark, after a direct load and after a page transition, all passed: the indicator exists, its box is inside the active link within 1px, and the label-to-fill contrast is at least 4.5:1. Sampled computed colors are `rgb(24, 24, 27)` on `rgb(253, 224, 71)`, which is 13.44:1. Header crops are `screenshots/header-{page}-1440-{theme}.png`. Home's initial JS is 165929 bytes gzipped, 48 bytes below 165977. Mobile LCP is 1750.15 ms.

## QA round 3 fix + sliding pill

The header shrinks from the existing `data-compact` attribute, with no new scroll JavaScript. At `scrollY > 12` the bar's padding tightens immediately, the logo image scales to 0.8, and the bar moves up 6px. Both transforms transition over 200ms. Scrolling down still sets `data-hidden`, which moves the same transform to `-140%` (registered as `@property --nav-y` so the percentage is valid inside `translateY`). Scrolling up clears the hide and the compact offset remains. Reduced motion sets that transition duration to `0s`. The unused `.nav-indicator` rule and `indicator-in` keyframes are gone. Browser checks at 1440 and 390, in both themes, measured a smaller logo, a hide with the bar's bottom above the viewport, a return, and no layout shift from the scroll. The crops are `screenshots/header-scroll-{top,compact}-{1440,390}-{light,dark}.png`.

The desktop active highlight slides again, without Motion and without a view-transition name. A click on an `xl` nav link stores the current pill's left and width, relative to the nav list, in `sessionStorage`. The next page paints the pill inside the active link. If an origin was stored and motion is allowed, the pill starts at `translateX(dx) scaleX(ratio)` with `transform-origin: left center` and transitions to `none` over 300ms. The list clips that travel with `overflow: hidden`. A direct load, a back/forward visit, or reduced motion paints the pill in place. The active label stays the normal link color until `transitionend` (or a 380ms fallback), then `a.nav-active` sets `#18181b`. The pill is `aria-hidden`. `aria-current="page"` and the focus ring stay.

Browser checks at 1440, in both themes, clicked Home to About and Tips to Insights and sampled the pill every animation frame. Every sample sat inside the header bar within 1px, stayed on the link row, and no sample showed `#18181b` text without the yellow fill behind it. At rest the pill is inside the active link and the label is `rgb(24, 24, 27)` on `rgb(253, 224, 71)`. Direct loads of all five pages are static and correct. Under reduced motion the pill is static and the label is dark immediately. Mid-slide crops are `motion/frames/pill-{from}-{to}-{25|50|75}-{theme}.png`. The 25% frames still show the cross-document root crossfade; the pill itself has no view-transition name, so the transition does not morph it. At-rest header crops are `screenshots/header-{page}-1440-{theme}.png`.

Home's initial JS grew by 430 bytes, from 165929 to 166359 bytes gzipped. Mobile LCP is 1887.52 ms.

## Label stacking and slide timing

The pill was painting over the labels it crossed because it lived inside the active link, and that link painted after the earlier ones. `[data-nav-list]` is now a stacking context (`isolation: isolate`). The links stay non-stacking (`isolation: auto`, `z-index: auto`). Each label is a span with `position: relative` and `z-index: 1`, and the pill is `z-index: 0`, so every label paints above the yellow.

The dark label no longer flips on a timer that starts before the slide. The fallback starts inside the same frame that starts the 300ms transition, at 400ms, and it only sets the label when the pill's transform has actually settled. `transitionend` does the same check. Under slowed playback the label stays the normal link color until the pill arrives.

Mid-slide crops were retaken with CDP `Animation.setPlaybackRate` 0.04, timed from `__pillSlideStart`. The pill's x is different at 25, 50, and 75 percent. The bar box on every one of those frames is x 144, y 12, width 1152, height 74. The pill's y is 31 and its height is 36. Its x and width:

| Pair | Theme | 25% x / width | 50% x / width | 75% x / width |
| --- | --- | --- | --- | --- |
| Home to About | light | 573.7 / 55.8 | 767.7 / 55.8 | 844.9 / 55.7 |
| Home to About | dark | 578.4 / 55.8 | 767.7 / 55.8 | 844.5 / 55.7 |
| Tips to Insights | light | 528.2 / 149.5 | 613.2 / 186.4 | 646.7 / 200.9 |
| Tips to Insights | dark | 529.2 / 149.9 | 612.8 / 186.2 | 646.8 / 201.0 |

Header crops are taken with the clip's y set to `scrollY`, so the compact bar stays at the top of the 120px image. Measured bar tops in those crops are 12px at rest and 6px when compact at 1440, and the bar is fully inside the crop.

Browser checks, at normal speed and at playback rate 0.04, require the active label to stay off `#18181b` unless the pill covers at least 90% of that label, require `elementFromPoint` on an overlapped non-active label to hit the label rather than the pill, and require the pill's x to change across at least three frames. All 208 checks passed.

Home's initial JS is 166497 bytes gzipped, 568 bytes above 165929. Mobile LCP is 1891.91 ms.

## Clean build after the typecheck fix

`tsc -b` was failing on the three `waitForFunction` callbacks because `Boolean(link)` does not narrow `Element | null`. Each callback now returns false when `querySelector` is null, then passes the narrowed element to `getComputedStyle`. That was the only source edit. The two clean builds ran after it.

`scripts/browser-checks.ts` was last modified at 2026-11-24 01:38:51 UTC. That is the newest file under `src/` or `scripts/`. `build-logs/npm-build-2.stdout.txt` was written at 2026-11-24 01:39:20 UTC, 29 seconds later. Both `npm ci` and both `npm run build` runs exited 0, and the two `dist` listings were identical. The browser check rewrote the three empty content files and restored the same bytes; their mtimes were set back to the previous commit so they are not newer than the build.

After the commit that contains this note, `git status --porcelain` is empty.

This round's proof, in order: two clean builds, verify (`verify-build: pass`), copy diff (`unexpected: []`), browser checks (208 passing, including the pill overlap, hit test, and three distinct x positions at normal speed and at playback rate 0.04), contrast (`contrast: pass`), Lighthouse (mobile LCP 1891.51 ms, desktop LCP 432.76 ms), and the bundle report (166497 bytes gzipped, 568 bytes above 165929).

## Slide contrast

While the pill is moving, each desktop nav label whose text the pill covers turns `#18181b` for that part of the slide. The switch is a CSS color animation on the same 300ms linear clock as the pill transform, armed once when the slide starts. A label the pill has not reached, or has left, stays the normal link color. At rest only the active label is `#18181b`. Reduced motion still skips the slide. The pill has no view-transition name.

The covered-label check is in `scripts/browser-checks.ts` and `npm run verify` runs it after `verify-build`. Across both page pairs, both themes, normal speed and playback rate 0.04, it sampled 1332 frames where a label was at least 50% covered. None were under 4.5:1. The worst ratio was 13.44. Browser checks passed 216 of 216. The final clean `npm ci && npm run build` exited 0. Home initial JS is `main-CSRpj7XH.js`, 167089 bytes gzipped, 592 bytes above r7's 166497. Mobile LCP is 1893.09 ms. Desktop LCP is 427.72 ms.

## Clipped ink

The whole-label color animation is gone. During a slide, a second copy of the nav labels is drawn in `#18181b` inside a window that has the same box and the same motion as the yellow pill. That window is `overflow: hidden`, `aria-hidden`, and `pointer-events: none`, and it holds spans rather than links. The motion is one custom property, `--pill-p`, eased from 0 to 1 over 300ms. The pill transform and the inner text's counter-transform are both calculated from `--pill-p`, so the counter-scale is the exact inverse on every frame and the glyphs are not stretched. Real labels stay their normal color except the existing at-rest active label. Reduced motion does not slide.

The glyph check compares a normal header shot with one where the nav text is transparent, then scores each glyph against the background behind it. It ran for both pairs, both themes, at normal speed and at playback rate 0.04, 25/50/75 percent: **1344 glyphs, 0 failures**. The lowest core ratio was 2.52, on a narrow "i" (advance under 8px) whose ink color was still the right one; every wider glyph cleared 4.5:1. `npm run verify` runs this check after `verify-build`. Each primary-nav label appears once in the accessibility tree and once in the tab order. Browser checks passed 226 of 226.

The clean build after that edit exited 0. Home initial JS is `main-Bo-yIILQ.js`, **166635 bytes** gzipped, **138 bytes** above r7's 166497. Mobile LCP is 1891.15 ms. Desktop LCP is 429.47 ms.

## Open items

- Tips, build steps, and insights are still empty. Add them in `src/content/` only. One entry appears with no other code change.
- The public URL is not published, and the Pages workflow was not run.
- Updated criterion 14 is waiting on Martin.
- The hero backdrop stays inside the raspberry/teal range in light mode and the pink/yellow range in dark mode so the headline keeps AA contrast.
