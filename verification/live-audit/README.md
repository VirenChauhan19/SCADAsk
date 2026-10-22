# SCADask live content audit

Audited October 21, 2026 against https://www.scadask.com and https://virenchauhan19.github.io/SCADAsk/.

## Result

The replica preserves the core research content, but does not contain every item on the current original website. A new podcast feature is missing, the original header logo asset has changed, and several media sections were deliberately omitted in the redesign.

## Coverage

- Fetched all 21 URLs in the current original sitemap. All returned HTTP 200.
- Compared the 17 SCAD routes with local generated HTML and the deployed GitHub Pages replica. All 17 replica routes returned HTTP 200 and their normalized body text matched local generated HTML.
- Compared original server-rendered copy, link destinations, media sources, and AI Insights 2026 chart marks. Typography and three documented wording/spelling equivalents were normalized. Original external link query parameters were retained in comparison; local privacy/terms pages were treated as equivalents of the original footer's scad.edu links.
- Checked browser-loaded SplatGarden contributor profiles and all three expanded pipeline panels against the supplemental reference. Seven student profiles, the supervising professor, and pipeline copy matched; the existing content check confirms they are in the replica.
- Original privacy/terms responses contain no server-rendered article. Checked their browser-rendered paragraphs separately: no missing legal paragraphs found. Deployed replica text matches local text on these pages.
- Inspected the other four sitemap URLs in the browser. They contain Velora portfolio template samples rather than SCAD research pages.

## Missing current content

### Podcast feature — substantive gap

Source: https://www.scadask.com/podcast
Replica: https://virenchauhan19.github.io/SCADAsk/podcast/

The original now includes a second feature block with:

- E1 · Latest / Episode 1
- Publishing Outside the Academy with Dr. Priya Nair
- September 16, 2026
- 54 min
- A description about scholars building audiences through independent publishing without sacrificing rigor.
- Episode artwork: https://framerusercontent.com/images/UEiLoUWGa1hLuugjGChgXz7ak.png

This entire feature is absent from local and deployed replicas. The original still has the Brooke Hopper episode above it, which the replica preserves along with all four listening destinations. The new feature's platform names are displayed as text in the original, without additional anchor destinations; do not invent episode links.

### Header logo asset — brand difference

The live original uses 3CiaY96iRzUNcoKSNeCOdjldM.png (4167 × 736). The replica uses the previously captured Khhb83bGGL83EZUZkbpUdHkox0E.png (4096 × 709). The brand is present, but the image asset is not the current original. This audit does not assert a visual change from the URL difference alone.

## Deliberate omissions still absent

These are documented in scripts/content-selection.mjs. They are visible differences, even though the existing content check accepts them.

| Page | Omitted content |
| --- | --- |
| Home | Original overview video and alternate AI Insights 2026 cover image |
| Research | Duplicate featured report artwork; the report remains in the library |
| About | Studio summary artwork |
| Events | QS event banner; event copy and destination remain |
| SplatGarden | Hero overview video and image, five production-tool logos, ten asset-creation/production videos |
| SplatGarden | Four short benefit headings: No installation, no reel; Work in context; Interactive by design; Opens in a browser. Related descriptive text remains with documented wording changes. |

The four SplatGarden experience demo videos remain. Removing ten production videos loses the visual demonstrations even though production descriptions and credits are retained. Decorative social gradient imagery and repeated brand marquee artwork are also replaced or omitted.

## Content retained

- All eight research report pages and original report-PDF destinations.
- Report summaries, categories, season/year metadata, awards, related links, and all five AI Insights 2026 findings.
- All five AI Insights 2026 charts: mark counts match (5, 5, 100, 5, 5) and their displayed mark text/values match the original.
- Research library, event archive copy, About content, SplatGarden descriptions, contributor links, pipeline details, and legal article paragraphs.
- Original anchor destinations on all 15 server-rendered SCAD content pages, accounting for the replica's local legal-page equivalents. Contributor links were checked separately through the browser and existing checks.

## Four extra original sitemap routes

/zenith, /nexa, /aether, /horizon are absent from the replica. Live browser inspection confirms generic Velora template portfolio content (WanderEase, CircleConnect, PeakFit, TrendCommerce). The /zenith heading is currently “new podcast” but its remaining text is generic portfolio copy. Include these only if literal route-for-route parity is required.

## Validation and limits

npm run check passes, but its source/content-reference.json was captured October 13, 2026. It cannot detect the new podcast feature or current header-logo source, and it intentionally excludes the listed media/heading omissions. Passing that check is not proof of current, complete parity.

This was a content-presence audit. Media URLs and PDF destinations were compared; every external file was not downloaded or playback-tested. No site content or deployment was changed. Only the audit script and evidence/report files were added; the existing check was run.

Evidence: results.json, legal-browser-check.json, and fresh original HTML captures in this directory. Re-run the server-rendered comparison with node scripts/audit-live-content.mjs; browser-loaded checks must be repeated separately.
