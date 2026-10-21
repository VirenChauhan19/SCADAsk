import {renderTrustedBy,renderAwards} from './trusted-by.mjs';
import {podcastPreview} from './podcast.mjs';
import {sourceCard,sourceParagraphs,escape} from './content-reference.mjs';
export function publicationHome({reports,assets,card,button,arrow,meta,topicLinks}){
  return `<section class="home-hero cinematic-hero"><video class="hero-atmosphere" autoplay muted loop playsinline preload="metadata" aria-hidden="true" tabindex="-1" poster="/mirror/5753c869da17-pL934KOHQA1Rr8juoAnYV1PKEW4.jpg"><source src="/mirror/b8a4dd3fa3d8-P2jTll2ZTpEr5jep4802rW1AOLA.mp4" type="video/mp4"></video><div class="hero-copy">
    <p class="eyebrow">SCADASK / APPLIED RESEARCH</p>
    <h1>Research designed for what’s next</h1>
    <div class="hero-note"><p>${escape(sourceParagraphs('home').find(text=>text.startsWith('Last updated:')))}</p></div>
    <p class="hero-description">Reports, events, and conversations on where creativity, commerce, culture, and technology are headed — from SCAD, the University for Creative Careers.</p>
    <div class="hero-actions">${button('/research','Explore research')}<a class="text-link" href="/aboutus">About SCADask ${arrow}</a></div>
    ${renderAwards()}
    </div></section>
    ${renderTrustedBy()}
    <section class="topics-section"><div class="wrap"><div class="topics-intro"><p class="eyebrow">RESEARCH AREAS</p><p>Browse by subject</p></div>${topicLinks()}</div></section>
    <section class="section wrap publication-selection"><div class="section-heading"><div><p class="eyebrow">RESEARCH LIBRARY</p><h2>Research and publications</h2></div><a class="text-link" href="/research">All publications ${arrow}</a></div><a class="hero-feature" href="/ai-insights-2026"><div class="feature-art"><img src="${assets.ai}" alt="Cloud, light, and blue ink form three abstract columns" width="2048" height="1152" fetchpriority="high"><span class="feature-label">NEW REPORT</span></div><div class="feature-copy">${meta(reports[0])}<h2>AI Insights 2026</h2><p class="feature-deck">${escape(sourceCard('home',reports[0]).summary)}</p><div class="feature-bottom"><span>Read the overview</span><span class="circle-arrow" aria-hidden="true">↗</span></div></div></a><div class="report-grid">${reports.slice(1,6).map(report=>card(report,'home')).join('')}</div></section>
    <section class="wrap case-section editorial-case"><div class="section-heading"><div><p class="eyebrow">CASE STUDY / SPRING 2026</p><h2>SplatGarden</h2></div><a class="text-link" href="/casestudies">All case studies ${arrow}</a></div><a href="/splatgarden" class="case-banner"><img src="${assets.garden}" alt="SplatGarden's interactive environment rendered as a luminous cloud of points" loading="lazy" width="2048" height="1158"><div class="case-copy"><p class="eyebrow">INTERACTIVE DESIGN</p><h2>A student portfolio,<br>built as a place.</h2><p>${escape(sourceParagraphs('casestudies')[0])}</p><span class="button light">Explore the project ${arrow}</span></div></a></section>
    ${podcastPreview(arrow)}
    <section class="section wrap studio-intro"><div><p class="eyebrow">THE STUDIO</p><h2>Applied research at SCAD.</h2></div><div><p>SCADask is based at the Savannah College of Art and Design. The studio works with students, faculty, and industry on original research, published reports, and experiments in emerging technology.</p><a class="text-link" href="/aboutus">About our work ${arrow}</a></div></section>`;
}
