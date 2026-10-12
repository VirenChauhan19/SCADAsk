import {renderTrustedBy,renderAwards} from './trusted-by.mjs';
import {podcastPreview} from './podcast.mjs';
export function publicationHome({reports,assets,card,button,arrow,meta,topicLinks}){
  return `<section class="home-hero wrap"><div class="hero-copy">
    <p class="eyebrow">SCADASK / APPLIED RESEARCH</p>
    <h1>Research for<br><em>the creative economy.</em></h1>
    <p class="hero-description">How are AI, consumer behavior, and cultural change reshaping creative industries? SCADask brings together research from students, faculty, and industry to examine these shifts.</p>
    <div class="hero-actions">${button('/research','Browse publications')}<a class="text-link" href="/aboutus">About the studio ${arrow}</a></div>
    <div class="hero-note"><p>From the Savannah College<br>of Art and Design.</p></div>${renderAwards()}
    </div><a class="hero-feature" href="/ai-insights-2026"><div class="feature-art"><img src="${assets.ai}" alt="Cloud, light, and blue ink form three abstract columns" width="2048" height="1152" fetchpriority="high"><span class="feature-label">NEW REPORT</span></div><div class="feature-copy">${meta(reports[0])}<h2>AI Insights 2026</h2><p class="feature-deck">AI is changing how creative work gets made. This report examines the value of human judgment, direction, and authorship.</p><div class="feature-bottom"><span>Read the overview</span><span class="circle-arrow" aria-hidden="true">↗</span></div></div></a></section>
    ${renderTrustedBy()}
    <section class="topics-section"><div class="wrap"><div class="topics-intro"><p class="eyebrow">RESEARCH AREAS</p><p>Browse by subject</p></div>${topicLinks()}</div></section>
    <section class="section wrap publication-selection"><div class="section-heading"><div><p class="eyebrow">RESEARCH / 2026</p><h2>Recent publications.</h2></div><a class="text-link" href="/research">All publications ${arrow}</a></div><div class="report-grid">${reports.slice(1,4).map(card).join('')}</div></section>
    <section class="wrap case-section editorial-case"><div class="section-heading"><div><p class="eyebrow">CASE STUDY / SPRING 2026</p><h2>SplatGarden</h2></div><a class="text-link" href="/casestudies">All case studies ${arrow}</a></div><a href="/splatgarden" class="case-banner"><img src="${assets.garden}" alt="SplatGarden's interactive environment rendered as a luminous cloud of points" loading="lazy" width="2048" height="1158"><div class="case-copy"><p class="eyebrow">INTERACTIVE DESIGN</p><h2>A student portfolio,<br>built as a place.</h2><p>Walk through a real-time 3D garden and explore how its student-made assets were produced.</p><span class="button light">Explore the project ${arrow}</span></div></a></section>
    ${podcastPreview(arrow)}
    <section class="section wrap studio-intro"><div><p class="eyebrow">THE STUDIO</p><h2>Applied research at SCAD.</h2></div><div><p>SCADask is based at the Savannah College of Art and Design. The studio works with students, faculty, and industry on original research, published reports, and experiments in emerging technology.</p><a class="text-link" href="/aboutus">About our work ${arrow}</a></div></section>`;
}
