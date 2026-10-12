# SCADask

Live website: https://VirenChauhan19.github.io/SCADAsk/

The Publish website workflow deploys every push to `main` to GitHub Pages. Set `SITE_BASE_PATH=/SCADAsk` when building locally to reproduce the hosted paths.

GitHub Actions runs `npm ci`, `npm run check`, and `npm run build` on every push and pull request. You can also run it manually from the Actions tab. Successful runs provide a `scadask-site` build artifact, retained for 14 days.

An editorial website for the applied research studio at SCAD. The site has 17 pages, a searchable research library, a shared site search, eight report overviews with original SCAD PDF destinations, a studio introduction, case studies, an event archive, and an interactive SplatGarden guide.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:5173/.

## Edit and build

- `scripts/create-editorial-site.mjs`: page templates, report metadata, and content. Run `npm run generate` after edits.
- `scripts/about.mjs`: studio introduction, services, recognition, and research areas; the official university logo appears in the shared footer.
- `scripts/publication-home.mjs`: homepage with a featured report, varied publication hierarchy, and project overview.
- `scripts/trusted-by.mjs` and `public/trusted-by.js`: original 11 partner and press logos with explicitly enabled automatic scrolling, plus the four original award logos. This row scrolls independently of the page motion preference; it pauses on hover, offscreen, or when the tab is hidden. Without JavaScript, all logos appear in a static layout.
- `scripts/podcast.mjs`: SCAD Signal episode page and homepage feature with original artwork and four verified listening destinations.
- `public/site.css`: responsive design, local Gotham fonts, and reduced-motion support.
- `public/polish.css`: shared surface styles, readable typography, comfortable controls, and responsive spacing across all pages.
- `public/palette.css`: the active brand palette: warm ivory surfaces, navy text, logo-inspired blue actions, and pale blue and sand accents.
- `public/editorial.css`: publication layouts with fine borders, unboxed research, and restrained typography and surfaces.
- `scripts/footer.mjs`: compact shared footer with the original SCAD university logo, verified SCADask social destinations, and SCAD resource links.
- `public/brand/`: original SCADask and SCAD logos, social icons, and footer source metadata. `node scripts/import-footer-brand.mjs` refreshes footer assets from scadask.com.
- `public/site.js`: accessible search dialog, mobile navigation, research search, topic/year filters, and URL state.
- `public/motion.css` and `public/motion.js`: short, one-time scroll reveals and hover feedback, and quick search and filter fades. Initial content appears immediately. Positions are read in a batch; there is no JavaScript scroll handler or reading progress line. Pointer tilt, hero parallax, word-by-word entrances, full-page view transitions, and animated accordion layout were removed to keep interactions responsive.
- `public/motion-preference.js`: enables the requested site animation profile before first paint. No device or browser settings are changed.
- `public/garden.js`: on-demand live garden, keyboard-accessible feature tabs, and four demonstration videos.
- `public/pages/`: generated static pages, available directly through Vite routing.
- `source/pages/` and `source/modules/`: preserved original captures. Used to recover report PDF destinations, the 2026 feature text, legal text, and garden production details and credits.

```sh
npm run generate
npm run check
npm run build
npm run preview
```

The build provides both directory `index.html` and `.html` versions of every route. Content is rendered in HTML; essential navigation and reports work without JavaScript. Research filters are reflected in the URL for bookmarking and sharing.

Responsive layouts use available browser width, including the effective width produced by browser zoom. Phone forms use 16 px input text; footer links have 44 px minimum touch height. All 17 routes were checked at 320, 360, 430, and 820 px, with the main layouts additionally checked at 600, 768, 1024, 1280, 1920, and 2560 px. No horizontal page or header overflow was found. Phone navigation and search were verified in the browser; these are viewport checks, not a physical-device certification.

Site animations are explicitly enabled for this design. Offscreen sections reveal once over 320 ms, starting before they enter the viewport. Initial content is immediately visible. The Trusted by row scrolls automatically; publication and podcast links use short hover and keyboard feedback. Animations stop when the tab is hidden; content remains available without JavaScript.

The live SplatGarden loads only after the visitor chooses Enter. It requires an internet connection. The original SCAD PDF reports and contributor profiles remain external links. The event listing is an archive; it does not imply registration or future scheduling. No contact submission backend is configured; contact links open an email application.

The previous captured-site styling and implementation remain as historical references in `public/redesign.*`, `public/local-site.js`, `src/`, and `scripts/apply-redesign.mjs`. They are not loaded by the editorial site. The old mirror and reference-preparation commands overwrite generated pages; rerun `npm run generate` if using those commands.
