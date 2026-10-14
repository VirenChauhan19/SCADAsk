import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {load} from 'cheerio';
import {renderFooter} from './footer.mjs';
import {publicationHome} from './publication-home.mjs';
import {podcastPage} from './podcast.mjs';
import {aboutPage} from './about.mjs';
import {eventsPage} from './events.mjs';
import {aiReportArticle} from './report-content.mjs';
import {sourcePage,sourceBlocks,sourceParagraphs,sourceCard,sourceHref,sourceMarkup,reportAwards,localAsset,clientReference} from './content-reference.mjs';
import {restorePageContent,legalContent} from './restore-page-content.mjs';

// The published captures remain untouched in source/pages. This is the editable site.
const manifest = JSON.parse(await readFile('source/site-manifest.json', 'utf8'));
const reportsOnly = process.argv.includes('--reports-only');
const localize = value => {
  for (const [remote, local] of Object.entries(manifest.assets)) value = value.replaceAll(remote, local);
  return value;
};
const original = async name => load(localize(await readFile(`source/pages/${name}.html`, 'utf8')));
const esc = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const arrowSvg = (direction='diagonal') => {
  const paths = {diagonal:'M6 18 18 6M6 6h12v12',right:'M5 12h14m-6-6 6 6-6 6',down:'M12 5v14m-6-6 6 6 6-6',up:'M12 19V5m-6 6 6-6 6 6',left:'M19 12H5m6-6-6 6 6 6'};
  return `<svg class="ui-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="${paths[direction]}" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
};
const arrow = `<span aria-hidden="true">${arrowSvg()}</span>`;
const assets = {
  ai:'/mirror/5753c869da17-pL934KOHQA1Rr8juoAnYV1PKEW4.jpg',
  dream:'/mirror/38451ca2c5ae-iQecxR0Zt2WewUDhFad5g12LMiw.png',
  museum:'/mirror/bce36144ed0f-7TxstsjOUUL93uO7dKjH6iXHzo.png',
  luxury:'/mirror/8d2c5616da95-acpaNzkDx2EBJuhR75AZNVZNM.png',
  fashion:'/mirror/8642188854c2-KbuihszjGKv5bozY37LfoZuE8no.png',
  sneaker:'/mirror/a5b32eeb74fa-5KkK4YaNPrOSDjolsI9amUNuI.png',
  ai2025:'/mirror/61215d1d1dd1-fagSLaNknehspbr0bSMj39646AI.png',
  ai2024:'/mirror/818a44fe61cb-i6ANQXpX2dtG8rp4qQzvbUrJEMI.png',
  garden:'/mirror/24aa90fc33b5-h4vANWyA617zy5Anzcc8z1kZ0w.jpg'
};
const reports = [
  {slug:'ai-insights-2026',title:'AI Insights 2026',category:'Technology',season:'Spring 2026',image:assets.ai,question:'What makes creative work valuable when AI can produce it?',summary:'As AI changes how work gets made, creative value is shifting toward direction, judgment, and the human decisions behind the output.'},
  {slug:'from-collections-to-communities',title:'From Collections to Communities',category:'Culture',season:'Spring 2026',image:assets.museum,question:'What does a museum need to mean to its community?',summary:'How museums are rethinking participation, trust, and technology to connect the collections they preserve with the communities they serve.'},
  {slug:'the-future-of-luxury-experiences',title:'The Future of Luxury Experiences',category:'Commerce',season:'Spring 2026',image:assets.luxury,question:'What will the next generation expect from luxury?',summary:'An exploration of changing expectations around trust, exclusivity, and the experiences that define the high-end consumer.'},
  {slug:'the-future-of-american-dreams',title:'The Future of American Dreams',category:'Culture',season:'Winter 2026',image:assets.dream,question:'Who gets to participate in the American Dream?',summary:'Four scenarios for 2040 explore how choices in technology, policy, and opportunity could shape shared prosperity or deepen exclusion.'},
  {slug:'the-evolution-of-fashion',title:'The Evolution of Fashion Resale and Retail',category:'Creativity',season:'Fall 2025',image:assets.fashion,question:'How is resale reshaping the way fashion works?',summary:'As reuse becomes part of the fashion experience, provenance, community, and new buying habits are changing how brands create value.'},
  {slug:'from-tech-to-pack',title:'From Tech to Track: The New Era of Sneaker Innovation',category:'Creativity',season:'Spring 2025',image:assets.sneaker,question:'What can a sneaker do beyond performance?',summary:'A look at how sustainable design, recovery technology, and identity are turning footwear into a platform for innovation.'},
  {slug:'ai-insights-2025',title:'AI Insights 2025',category:'Technology',season:'Winter 2025',image:assets.ai2025,question:'How are creative leaders putting AI into practice?',summary:'Perspectives from business, education, and the arts on the changing relationship between creative workflows, aesthetics, and authorship.'},
  {slug:'ai-insights-2024',title:'AI Insights 2024',category:'Technology',season:'Spring 2024',image:assets.ai2024,question:'How is AI transforming the creative process?',summary:'Explore the early shifts in design practice as artificial intelligence becomes part of the creative toolkit.'}
];
for (const report of reports) {
  const $ = await original(report.slug);
  const blocks=sourceBlocks(report.slug);
  const title=blocks.find(block=>/^h/.test(block.tag));
  report.title=title?.text || report.title;
  report.heroSummary=blocks.find(block=>block.tag==='p' && block.text.length>60)?.text || report.summary;
  report.heroCategory=blocks.find(block=>/^(Technology|Culture|Business|Commerce|Creativity)$/.test(block.text))?.text || report.category;
  report.summary=sourceCard('research',report).summary;
  const cover=sourcePage(report.slug).media.find(item=>item.context.includes('Hero main'));
  if(cover)report.image=localAsset(cover.src);
  report.pdf = sourcePage(report.slug).links.find(link=>link.href.includes('.pdf'))?.href || $('a[href]').map((i,e)=>$(e).attr('href')).get().find(h=>h.includes('.pdf'));
}
const reportThemes = {
  'ai-insights-2026':['Where AI brings efficiency to research and content generation','The growing value of creative direction and human judgment','How designers adapt their workflows and skills'],
  'from-collections-to-communities':['Community participation and the changing role of museums','Trust and relevance alongside collection preservation','Technology choices under financial constraints'],
  'the-future-of-luxury-experiences':['Changing expectations of exclusivity','Trust between luxury brands and their audiences','Experiences for the next generation of high-end consumers'],
  'the-future-of-american-dreams':['Four possible scenarios for the American Dream in 2040','The effects of demographic, technological, and economic change','The choices that shape access to opportunity'],
  'the-evolution-of-fashion':['The growing role of reuse and resale','Provenance, scarcity, and access as parts of brand value','The buying habits of Gen Z and Gen Alpha'],
  'from-tech-to-pack':['Sustainable design in the footwear market','Recovery technology and new expectations of performance','Sneakers as expressions of identity and community'],
  'ai-insights-2025':['How creative leaders are using emerging AI tools','Changes to workflows and visual aesthetics','Questions around authorship and creative practice'],
  'ai-insights-2024':['AI’s role in the evolving design landscape','Changes to the creative process','New possibilities for the creative toolkit']
};
const navItems = [['Research','/research'],['Podcast','/podcast'],['Case studies','/casestudies'],['Events','/events'],['About','/aboutus']];
const headerLogo=sourcePage('home').media.find(item=>item.context.includes('ScadaskLogo') && item.anchor==='./');
const whiteLogo=sourcePage('home').media.find(item=>item.context.includes('ScadaskLogo') && !item.anchor);
const brand = `<img class="brand-logo" src="${localAsset(headerLogo.src)}" alt="SCADask" width="4096" height="709">`;
const footerBrand = `<img class="brand-logo" src="${localAsset(whiteLogo.src)}" alt="SCADask" width="182" height="32">`;
function baseShell(title, description, route, body, extra='') {
  if (route === '/events') extra += '<link rel="stylesheet" href="/events.css">';
  if (reports.some(r=>'/'+r.slug===route)) extra += '<link rel="stylesheet" href="/reports.css">';
  if (route === '/ai-insights-2026') extra += '<script defer src="/reports.js"></script>';
  if (route === '/podcast') extra += '<script defer src="/podcast.js"></script>';
  const active = reports.some(r=>'/'+r.slug===route) ? '/research' : route === '/splatgarden' ? '/casestudies' : route;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#f7f6f2"><title>${esc(title)} — SCADask</title><link rel="icon" href="/favicon.png" type="image/png" sizes="192x192"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="stylesheet" href="/site.css"><script defer src="/site.js"></script>${extra}</head><body data-page="${esc(route)}"><a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="header-inner"><a class="brand" href="/" aria-label="SCADask home">${brand}</a><nav id="primary-nav" aria-label="Main navigation">${navItems.map(([name,href])=>`<a href="${href}" ${href===active?'aria-current="page"':''}>${name}</a>`).join('')}</nav><div class="header-actions"><button class="search-open icon-button" aria-label="Search site"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="1.6"/><path d="m16 16 5 5" stroke="currentColor" stroke-width="1.6"/></svg></button><a class="header-contact" href="mailto:research@scad.edu">Let’s talk ${arrow}</a><button class="menu-toggle icon-button" aria-expanded="false" aria-controls="primary-nav" aria-label="Open navigation"><span></span><span></span></button></div></div></header><main id="main">${body}</main><footer class="site-footer"><div class="wrap"><div class="footer-top"><div><p class="eyebrow">START WITH A QUESTION</p><h2>What are you<br><em>curious about?</em></h2></div><div class="footer-contact"><p>Let’s turn your next question into<br>research you can act on.</p><a href="mailto:research@scad.edu" class="footer-email">research@scad.edu ${arrow}</a></div></div><div class="footer-links"><a class="brand" href="/" aria-label="SCADask home">${brand}</a><p>Applied research.<br>From the University for Creative Careers.</p><div>${navItems.map(([name,href])=>`<a href="${href}">${name}</a>`).join('')}</div><a href="https://www.scad.edu/" target="_blank" rel="noopener">Discover SCAD ${arrow}</a></div><div class="footer-bottom"><p>© 2026 Savannah College of Art and Design</p><div><a href="/privacy">Privacy</a><a href="/terms">Terms of use</a><a href="#main">Back to top ↑</a></div></div></div></footer><dialog class="search-dialog" aria-labelledby="search-title"><div class="search-heading"><h2 id="search-title">Find your next insight.</h2><button class="search-close icon-button" aria-label="Close search">×</button></div><form role="search" class="site-search"><label class="sr-only" for="site-search">Search reports and pages</label><input type="search" id="site-search" placeholder="Try AI, fashion, museums…" autocomplete="off"><button type="submit" aria-label="Search">→</button></form><p class="search-status" role="status"></p><div class="search-results"></div><p class="search-hint">Search research, case studies, and the studio. Esc to close.</p></dialog></body></html>`;
}
const shell = (...args) => baseShell(...args)
  .replace('</head>','<link rel="stylesheet" href="/content.css"></head>')
  .replace('<link rel="stylesheet" href="/site.css">', '<style id="page-transitions">@view-transition { navigation: auto; }</style><script src="/motion-preference.js"></script><link rel="stylesheet" href="/site.css"><link rel="stylesheet" href="/polish.css"><link rel="stylesheet" href="/motion.css">')
  .replace('<script defer src="/site.js"></script>', '<script defer src="/site.js"></script><script defer src="/motion.js"></script><script defer src="/ask.js"></script>')
  .replace('<p class="search-status"', '<div class="search-suggestions" aria-label="Suggested searches"><span>Try a topic</span><button type="button" data-search-term="AI">AI</button><button type="button" data-search-term="Culture">Culture</button><button type="button" data-search-term="Design">Design</button></div><p class="search-status"')
  .replace('<p id="result-count" role="status">8 reports</p>', '<div class="library-actions"><p id="result-count" role="status">8 reports</p><button class="reset-link" data-reset-filters hidden>Reset filters</button></div>')
  .replace('id="reset-filters"', 'data-reset-filters')
  .replace('<link rel="stylesheet" href="/polish.css">', '<link rel="stylesheet" href="/polish.css"><link rel="stylesheet" href="/palette.css">')
  .replace('content="#f7f6f2"', 'content="#f7f5ef"')
  .replace('<link rel="stylesheet" href="/motion.css">', '<link rel="stylesheet" href="/motion.css"><link rel="stylesheet" href="/editorial.css"><link rel="stylesheet" href="/ask.css">')
  .replace('Find your next insight.', 'Search SCADask')
  .replace('A fresh perspective<br><em>starts here.</em>', 'Research<br><em>& publications.</em>')
  .replace('Explore the ideas shaping the creative economy. Find a question, follow a topic, and take a closer look.', 'Reports on creative practice, consumer behavior, cultural institutions, and emerging technology. Search by topic or filter by subject and year.')
  .replace('Curiosity is<br><em>our starting point.</em>', 'Applied research.<br><em>From inside SCAD.</em>')
  .replace('Ideas become<br><em>experiences.</em>', 'Research<br><em>in practice.</em>')
  .replace('Good questions<br><em>bring us together.</em>', 'Events &<br><em>conversations.</em>')
  .replace('Questions become possibilities.', 'The studio’s work.')
  .replace('A university’s perspective.<br>A studio’s approach.', 'Based at SCAD.<br>Working with industry.')
  .replace('Understand what’s changing.', 'Research for clients.')
  .replace('Make insight accessible.', 'Reports on industry change.')
  .replace('Bring ideas into practice.', 'Summits, podcasts, and prototypes.')
  .replace('A different question?', 'No matching reports')
  .replace('A connected view of the future.', 'Research areas.')
  .replace('Another question to consider.', 'Related publications.')
  .replace('Your question.<br><em>Our next exploration.</em>', 'Commission research<br><em>with SCADask.</em>')
  .replace(/<footer class="site-footer">[\s\S]*?<\/footer>/, renderFooter({navItems,footerBrand,arrow}))
  .replaceAll('↗', arrowSvg()).replaceAll('→', arrowSvg('right')).replaceAll('↓', arrowSvg('down'))
  .replaceAll('↑', arrowSvg('up')).replaceAll('←', arrowSvg('left'));
const button = (href,text,style='') => `<a class="button ${style}" href="${href}">${text} ${arrow}</a>`;
const meta = r => `<div class="report-meta"><div class="report-tags">${(r.categories || [r.category]).map(category=>`<span class="category category-${category.toLowerCase()}">${category}</span>`).join('')}</div><span>${r.season}</span></div>`;
function card(r, context='research') { r=sourceCard(typeof context==='string'?context:'research',r); return `<article class="report-card" data-category="${r.category}" data-year="${r.season.slice(-4)}" data-search="${esc([r.title,r.summary,r.question,r.category].join(' ').toLowerCase())}"><a href="/${r.slug}" class="report-link"><div class="report-image"><img src="${r.image}" alt="" loading="lazy" width="800" height="450"><span class="card-arrow" aria-hidden="true">↗</span></div><div class="report-body">${meta(r)}<h3>${esc(r.title)}</h3><p>${esc(r.summary)}</p><span class="read-link">Explore report <span aria-hidden="true">↗</span></span></div></a></article>`; }
const sectionHead = (eyebrow,title,href,label) => `<div class="section-heading"><div><p class="eyebrow">${eyebrow}</p><h2>${title}</h2></div>${href?`<a class="text-link" href="${href}">${label} ${arrow}</a>`:''}</div>`;
const topics = [
  ['Creativity','Creative practice.','Design, craft, and the changing creative process.'],
  ['Commerce','Brands & markets.','Consumer behavior, retail, and experiences.'],
  ['Culture','People & institutions.','Museums, communities, and shared opportunity.'],
  ['Technology','Emerging technology.','AI, creative tools, and their impact on work.']
];
const topicLinks = () => `<div class="topic-grid">${topics.map(([name,headline,copy],i)=>`<a href="/research?category=${name.toLowerCase()}" class="topic"><div class="topic-top"><span>0${i+1} / ${name.toUpperCase()}</span>${arrow}</div><h3>${headline}</h3><p>${copy}</p></a>`).join('')}</div>`;
const caseBanner = () => `<a href="/splatgarden" class="case-banner"><img src="${assets.garden}" alt="A digital garden rendered as a luminous cloud of points" loading="lazy" width="2048" height="1158"><div class="case-copy"><p class="eyebrow">IN PRACTICE / INTERACTIVE 3D</p><h2>A portfolio you<br>can step inside.</h2><p>SplatGarden brings student work to life in a living, interactive 3D environment.</p><span class="button light">Explore SplatGarden ${arrow}</span></div><span class="case-index">CASE STUDY 01 / SPRING 2026</span></a>`;

const research = `<section class="page-intro wrap"><p class="eyebrow">THE RESEARCH LIBRARY</p><h1>A fresh perspective<br><em>starts here.</em></h1><p>Explore the ideas shaping the creative economy. Find a question, follow a topic, and take a closer look.</p></section><section class="wrap library"><form class="library-controls" role="search"><div class="library-search"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="1.6"/><path d="m16 16 5 5" stroke="currentColor" stroke-width="1.6"/></svg><label class="sr-only" for="research-search">Search research</label><input id="research-search" type="search" placeholder="Search by topic or question…" autocomplete="off"></div><label class="year-select">Year <select id="research-year"><option value="all">All years</option><option>2026</option><option>2025</option><option>2024</option></select></label></form><div class="library-toolbar"><div class="filter-list" role="group" aria-label="Filter research by topic">${['All','Creativity','Commerce','Culture','Technology'].map(t=>`<button type="button" data-filter="${t}" aria-pressed="${t==='All'}">${t}</button>`).join('')}</div><p id="result-count" role="status">8 reports</p></div><div class="report-grid library-grid">${reports.map(card).join('')}</div><div class="empty-state" hidden><span aria-hidden="true">↗</span><h2>A different question?</h2><p>No reports match these filters. Try another topic or a broader search.</p><button class="button" id="reset-filters">Clear filters</button></div></section>`;
const about = aboutPage({arrow,button,topicLinks,sectionHead});
const cases = `<section class="page-intro wrap"><p class="eyebrow">CASE STUDIES</p><h1>Ideas become<br><em>experiences.</em></h1><p>See what happens when research, creative practice, and emerging technology come together.</p></section><section class="wrap case-section">${caseBanner()}</section><section class="section wrap studio-intro"><div><p class="eyebrow">FROM QUESTION TO EXPLORATION</p><h2>What could<br>your idea become?</h2></div><div><p>Our case studies show creative research in practice. SplatGarden explores how a portfolio can become an environment, inviting visitors to interact with the work and discover how it was made.</p><a class="text-link" href="/research">Explore the research ${arrow}</a></div></section>`;
const events = eventsPage({reports,card,arrow});

function reportBody(r) {
  const other = reports.filter(x=>x.slug!==r.slug);
  const related = other;
  return `<section class="report-hero wrap"><a class="back-link" href="/research">← Back to research</a><div class="report-hero-grid"><div>${meta({...r,category:r.heroCategory})}<h1>${esc(r.title)}</h1><p class="report-summary">${esc(r.heroSummary)}</p><a class="button" href="${esc(r.pdf)}" target="_blank" rel="noopener">Read the full report <span aria-hidden="true">↗</span></a><p class="pdf-note">PDF · Opens on scad.edu</p></div><div class="report-cover"><img src="${r.image}" alt="${esc(r.title)} report artwork" width="800" height="450"></div></div></section>${reportAwards(r.slug)}<section class="report-overview wrap"><div class="overview-label"><p class="eyebrow">THE QUESTION</p></div><div><h2>${esc(r.question)}</h2><p>${esc(r.summary)}</p><p>The full SCADask report brings together research and industry perspectives to explore this question in depth.</p><a class="text-link" href="${esc(r.pdf)}" target="_blank" rel="noopener">Explore the complete findings ${arrow}</a></div></section>${r.slug==='ai-insights-2026'?'__AI_ARTICLE__':''}<section class="section wrap">${sectionHead('KEEP EXPLORING','Explore More Research','/research','All research')}<div class="report-grid">${related.map(x=>card(x,r.slug)).join('')}</div></section>`;
}

// Preserve the complete 2026 article, including the original survey graphics.
const aiSource = await original('ai-insights-2026');
const aiArticle = aiReportArticle(aiSource);

const gardenSource = await original('splatgarden');
// Preserve the original asset-making, pipeline, and contributor content as semantic blocks.
function plainSection(node) {
  const root = load(gardenSource(node).html() || '');
  root('script,style,svg').remove();
  const blocks=[]; const known=new Set();
  root('.ssr-variant').each((i,e)=>{if(root(e).siblings('.ssr-variant').length && root(e).prevAll('.ssr-variant').length)root(e).remove();});
  root('h1,h2,h3,h4,p,li,video,img,div').each((i,e)=>{
    if(e.tagName==='div' && (root(e).children().length || !root(e).text().trim()))return;
    if(e.tagName==='video') {
      // Keep the production explanation; the four experience demos already
      // show the project without another set of embedded video players.
      return;
    }
    if(e.tagName==='img') {
      const src=root(e).attr('src')?.split('?')[0];
      if(!src || known.has(src))return;known.add(src);
      blocks.push(`<figure class="production-figure"><img src="${esc(src)}" alt="${esc(root(e).attr('alt') || 'SplatGarden asset creation and production process')}" loading="lazy"></figure>`);return;
    }
    const t=root(e).text().replace(/\s+/g,' ').trim();
    if(!t||known.has(t))return; known.add(t);
    const tag=/^h/.test(e.tagName)|| (e.tagName==='div' && t.length<55)?'h3':'p';
    blocks.push(`<${tag}>${esc(t.replace('Assest Creation','Asset creation'))}</${tag}>`);
  });
  return blocks.join('');
}
const production = gardenSource('[data-framer-name="Asset Creation"]').first();
const pipeline = gardenSource('[data-framer-name="Pipeline"]').first();
const contributors = gardenSource('.contributors-component').first();
const creditLinks=people=>`<div class="credit-list">${people.map(person=>`<a href="${esc(person.href)}" target="_blank" rel="noopener"><strong>${esc(person.name)}</strong><span>${esc(person.detail)}</span>${arrow}</a>`).join('')}</div>`;
const creditBlocks='<h3>Team</h3>'+creditLinks(clientReference.splatgarden.contributors.slice(0,-1))+'<h3>Supervising Professor</h3>'+creditLinks(clientReference.splatgarden.contributors.slice(-1));
const pipelineBlocks=clientReference.splatgarden.pipeline.map((stage,index)=>`<h3>0${index+1} / ${esc(stage.title)}</h3>${stage.paragraphs.map(text=>`<p>${esc(text)}</p>`).join('')}${(stage.layers || []).map(layer=>`<h3>${esc(layer.title)}</h3><p>${esc(layer.text)}</p>`).join('')}`).join('');
const garden = `<section class="page-intro wrap garden-intro"><a class="back-link" href="/casestudies">← Back to case studies</a><p class="eyebrow">CASE STUDY / SPRING 2026</p><h1>A living garden.<br><em>A new kind of portfolio.</em></h1><p>SplatGarden turns student work into a place you can explore. Walk through a real-time 3D environment, shape the scene, and discover the craft behind each asset.</p><div class="garden-tags"><span>Gaussian splatting</span><span>Interactive design</span><span>AI tools</span></div></section><section class="wrap garden-experience framer-14xmokj"><div class="section-heading"><div><p class="eyebrow">STEP INTO THE WORK</p><h2>Inside SplatGarden.</h2></div><a href="https://splatgarden.com/" class="text-link" target="_blank" rel="noopener">Open the live garden ${arrow}</a></div></section><section class="section wrap studio-intro"><div><p class="eyebrow">THE EXPLORATION</p><h2>What if a portfolio<br>was a place?</h2></div><div><p>The garden combines procedural plant growth, effects simulation, AI stylization, and vertex animation textures. Visitors can experience the work in context, then explore how each piece was built.</p><p>Gaussian splatting transforms photographs into a 3D scene that can be viewed from different perspectives in real time. Here, the technique becomes an accessible, interactive showcase.</p></div></section><section class="wrap making-section"><p class="eyebrow">BEHIND THE SCENE</p><h2>How the garden grows.</h2><details><summary>Asset creation <span aria-hidden="true">+</span></summary><div class="making-content">${plainSection(production)}</div></details><details><summary>The production pipeline <span aria-hidden="true">+</span></summary><div class="making-content">${plainSection(pipeline)}</div></details><details><summary>Contributors <span aria-hidden="true">+</span></summary><div class="making-content">${plainSection(contributors)}</div></details></section>`;

const pages = [
  ['home','/', 'Research designed for what’s next', 'Reports, events, and conversations on where creativity, commerce, culture, and technology are headed from SCAD, the University for Creative Careers.',publicationHome({reports,assets,card,button,arrow,meta,topicLinks})],
  ['podcast','/podcast','SCAD Signal podcast','Conversations with industry insiders, including Brooke Hopper on changing responsibilities of designers.',podcastPage(arrow)],
  ['research','/research','Research library','Explore and search SCADask reports by topic and year.',research],
  ['aboutus','/aboutus','About the studio','Meet SCADask, the applied research studio at the Savannah College of Art and Design.',about],
  ['casestudies','/casestudies','Case studies','Explore creative research in practice, starting with the interactive SplatGarden.',cases],
  ['events','/events','Events and conversations','Explore SCADask conversations and research events.',events],
  ['splatgarden','/splatgarden','SplatGarden','Explore a living interactive 3D portfolio and the creative process behind it.',garden]
];
await mkdir('public/pages',{recursive:true});
for (let [name,route,title,description,body] of (reportsOnly ? [] : pages)) {
  if(name==='home')body=body.replace('<span class="feature-number">01 / 08</span>','');
  if(name==='splatgarden')body=body.replace(plainSection(pipeline),pipelineBlocks).replace(plainSection(contributors),creditBlocks);
  body=restorePageContent(name,body,reports);
  await writeFile(`public/pages/${name}.html`,shell(title,description,route,body,name==='splatgarden'?'<script defer src="/garden.js"></script>':name==='home'?'<script defer src="/trusted-by.js"></script>':''));
}
for (const r of reports) {
  const body=reportBody(r).replace('__AI_ARTICLE__',aiArticle);
  await writeFile(`public/pages/${r.slug}.html`,shell(r.title,r.summary,'/'+r.slug,body));
}
// Give each overview useful signposts instead of repeating its opening summary.
for (const r of reports) {
  const path=`public/pages/${r.slug}.html`;
  let html=await readFile(path,'utf8');
  const repeated=`<p>${esc(r.summary)}</p><p>The full SCADask report brings together research and industry perspectives to explore this question in depth.</p>`;
  html=html.replace(repeated,`<p class="eyebrow overview-subtitle">WHAT YOU’LL EXPLORE</p><ul class="report-themes">${reportThemes[r.slug].map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`);
  await writeFile(path,html);
}
if (reportsOnly) {
  console.log(`Created ${reports.length} report pages with original charts and PDF destinations.`);
  process.exit(0);
}
for (const name of ['privacy','terms']) {
  await writeFile(`public/pages/${name}.html`,shell(name==='privacy'?'Privacy policy':'Terms of use','SCAD '+(name==='privacy'?'privacy policy':'terms of use'),'/' + name,`<section class="legal-page wrap"><a class="back-link" href="/">← Home</a><div class="article-prose">${legalContent(name)}</div></section>`));
}
await writeFile('index.html', await readFile('public/pages/home.html','utf8'));
await writeFile('public/search-data.json',JSON.stringify([...reports.map(r=>({title:r.title,description:r.summary,category:r.category,url:'/'+r.slug})),{title:'SCAD Signal podcast',description:'Brooke Hopper on design judgment and changing responsibilities of designers.',category:'Podcast',url:'/podcast'},{title:'SplatGarden',description:'Explore the interactive 3D garden and its production process.',category:'Case study',url:'/splatgarden'},{title:'About SCADask',description:'Meet the applied research studio and discuss custom research.',category:'Studio',url:'/aboutus'},{title:'Events and conversations',description:'Explore the event archive and ask about upcoming conversations.',category:'Events',url:'/events'}]));
console.log(`Created ${manifest.routes.length} editorial pages with local media and original PDF destinations.`);
