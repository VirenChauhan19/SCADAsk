# SCADask

Live website: https://VirenChauhan19.github.io/SCADAsk/

The Publish website workflow deploys every push to `main` to GitHub Pages. Set `SITE_BASE_PATH=/SCADAsk` when building locally to reproduce the hosted paths.

GitHub Actions runs `npm ci`, `npm run check`, and `npm run build` on every push and pull request. You can also run it manually from the Actions tab. Successful runs provide a `scadask-site` build artifact, retained for 14 days.

An editorial website for the applied research studio at SCAD. The site has 17 pages, a searchable research library, a shared site search, eight report pages with original SCAD PDFs that open in a new tab, a studio introduction, case studies, an event archive, and an interactive SplatGarden guide. AI Insights 2026 also preserves all five detailed findings, survey charts, statistic captions, and contributor quotes directly in HTML.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:5173/.

## Edit and build

- `scripts/create-editorial-site.mjs`: page templates, report metadata, and content. Run `npm run generate` after edits.
- `source/content-reference.json`: live capture of text, destinations, chart values, and media across all 17 original pages. `source/client-content-reference.json` records the seven student profiles, supervising professor, and expanded garden pipeline collected from the loaded original website.
- `scripts/content-reference.mjs` and `scripts/restore-page-content.mjs`: restore page-specific publication descriptions, metadata, awards, original media, complete studio and event copy, and full legal text inside the existing layout.
- `npm run capture:content`: refresh the server-rendered reference and import missing original media. Browser-loaded contributor and accordion content is retained separately and should be checked in the browser when refreshing it.
- `npm run check:content`: compare all generated pages with the reference. This also runs as part of `npm run check`. Results are written to `verification/content-coverage.json`. Responsive wording alternatives are matched to their canonical equivalent; decorative assets and deliberate editorial omissions recorded in `scripts/content-selection.mjs` are excluded from coverage. Preserve useful content without requiring every original media asset or layout section.
- `scripts/report-content.mjs` and `public/reports.css`: full AI Insights 2026 article, original survey graphics, responsive section index, and visible chart keys. Chart content works without JavaScript or the original Framer runtime. Full report links open PDFs in new tabs.
- `public/reports.js`: coordinated chart entrances, diagonal waffle waves, radar expansion, settling bubbles, and statistic count-ups. Charts play once on entering view. Hover or keyboard focus isolates a category and displays its exact value. Final data stays visible without JavaScript; active animation and counters finish when the tab is hidden.
- Run `node scripts/create-editorial-site.mjs --reports-only` to regenerate report pages without rewriting other pages.
- `scripts/about.mjs`: studio introduction, services, recognition, and research areas; the official university logo appears in the shared footer.
- `scripts/events.mjs` and `public/events.css`: event archive with a featured panel, readable date and venue details, an upcoming-event contact link, and related AI research.
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
- `source/pages/` and `source/modules/`: preserved original captures. Used to recover the original 2026 chart markup and garden production media. Current copy, links, and loaded component details are verified against the newer content references.
- `public/content.css`: responsive layouts for awards, production imagery, compact garden highlights, podcast playback, and complete text. Redundant About artwork, Events banner, Research feature, and garden overview film and tool logos are omitted. SplatGarden keeps four experience demos, with production explanations and credits in expandable sections.
- `public/podcast.js`: public-platform fallback if the original Dropbox episode file requires authentication or cannot play. The original audio source is preserved alongside all four listening destinations.

```sh
npm run generate
npm run check
npm run build
npm run preview
```

The build provides both directory `index.html` and `.html` versions of every route. Content is rendered in HTML; essential navigation and reports work without JavaScript. Research filters are reflected in the URL for bookmarking and sharing.

Responsive layouts use available browser width, including the effective width produced by browser zoom. Phone forms use 16 px input text; footer links have 44 px minimum touch height. All 17 routes were checked at 320, 360, 430, and 820 px, with the main layouts additionally checked at 600, 768, 1024, 1280, 1920, and 2560 px. No horizontal page or header overflow was found. Phone navigation and search were verified in the browser; these are viewport checks, not a physical-device certification.

Site animations are explicitly enabled for this design. Offscreen sections reveal once over 320 ms, starting before they enter the viewport. Initial content is immediately visible. The Trusted by row scrolls automatically; publication and podcast links use short hover and keyboard feedback. Animations stop when the tab is hidden; content remains available without JavaScript.

The live SplatGarden loads only after the visitor chooses Enter. It requires an internet connection. Full report links open original publications from scad.edu in a new tab. AI Insights 2026's HTML article and charts are local. Contributor profiles remain external links. The event listing is an archive; it does not imply registration or future scheduling. No contact submission backend is configured; contact links open an email application.

## Ask chat

Every page has a floating **Ask** chat in the bottom-right corner (`public/ask.js`, `public/ask.css`). It answers from `public/ask-answers.json`: about 80 pre-written questions and answers about the site, each linking its source pages and report PDFs. The chat matches a visitor's question to the closest answer in the browser. Nothing is sent to a server, and no API key is in the site. Questions it cannot match get related suggestions and the studio email; unrelated questions are declined. The conversation lasts for the browser tab, across pages.

The chat has an introductory screen, readable source links, related questions, and a new-conversation control. `public/ask-engine.js` handles local matching: exact question matches take priority, report years are respected, broad questions offer choices, and short follow-ups stay with the previous answer's topic. It retrieves pre-written answers rather than generating live responses. `npm run check` verifies every primary question and regression cases for follow-ups, downloads, ambiguous queries, and unrelated questions.

The answers were written with OpenAI from the site's page text, using only that text. Regenerate them after content changes:

```sh
npm run generate
npm run ask:answers                                        # all sections (about 15 API calls)
node scripts/build-ask-answers.mjs --only=essentials       # just the must-have questions, merged in
npm run check
```

`scripts/build-ask-answers.mjs` reads `OPENAI_API_KEY` from the environment or from `.env` (ignored by git) and uses `OPENAI_MODEL` (default `gpt-6-astra`). Must-have questions, including the chat's three starter buttons, are listed in `essentials` in that script; `npm run check` fails if a starter question has no answer or an answer links a missing page. To improve matching for a question, add phrasings to its `alt` list in the JSON file.

The previous captured-site styling and implementation remain as historical references in `public/redesign.*`, `public/local-site.js`, `src/`, and `scripts/apply-redesign.mjs`. They are not loaded by the editorial site. The old mirror and reference-preparation commands overwrite generated pages; rerun `npm run generate` if using those commands.
