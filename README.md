# SCADask

GitHub Actions runs `npm ci`, `npm run check`, and `npm run build` on every push and pull request. You can also run it manually from the Actions tab. Successful runs provide a `scadask-site` build artifact, retained for 14 days.

An editorial website for the applied research studio at SCAD. The site has 16 pages, a searchable research library, a shared site search, eight report overviews with original SCAD PDF destinations, a studio introduction, case studies, an event archive, and an interactive SplatGarden guide.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:5173/.

## Edit and build

- `scripts/create-editorial-site.mjs`: page templates, report metadata, and content. Run `npm run generate` after edits.
- `public/site.css`: responsive design, local Gotham fonts, and reduced-motion support.
- `public/polish.css`: shared surface styles, readable typography, comfortable controls, and responsive spacing across all pages.
- `public/site.js`: accessible search dialog, mobile navigation, research search, topic/year filters, and URL state.
- `public/motion.css` and `public/motion.js`: staggered heading entrances, scroll reveals, artwork drift and desktop tilt, hover effects, page/filter transitions, dialog motion, accordion expansion, and a reading progress line. Motion respects the system reduced-motion preference, pauses when the tab is hidden, and keeps keyboard-focused content visible. Native view transitions enhance supported browsers; ordinary navigation and filter updates remain available elsewhere.
- `public/motion-preference.js`: applies the saved motion choice before the first paint and sets page transition preferences before navigation reveals.
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

The animation control beside search allows visitors to play or pause site motion. Without an explicit choice it follows the system reduced-motion preference. A choice is remembered for the current browser session.

The live SplatGarden loads only after the visitor chooses Enter. It requires an internet connection. The original SCAD PDF reports and contributor profiles remain external links. The event listing is an archive; it does not imply registration or future scheduling. No contact submission backend is configured; contact links open an email application.

The previous captured-site styling and implementation remain as historical references in `public/redesign.*`, `public/local-site.js`, `src/`, and `scripts/apply-redesign.mjs`. They are not loaded by the editorial site. The old mirror and reference-preparation commands overwrite generated pages; rerun `npm run generate` if using those commands.
