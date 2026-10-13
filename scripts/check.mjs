import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {load} from 'cheerio';
import {createMatcher} from '../public/ask-engine.js';
const {routes} = JSON.parse(await readFile('source/site-manifest.json','utf8'));
let imageCount=0;let reportCount=0;
for(const route of routes) {
  const name=route==='/'?'home':route.slice(1).replaceAll('/','--');
  const html=await readFile(`public/pages/${name}.html`,'utf8');
  const $=load(html);
  assert.equal($('main').length,1,`One main landmark required: ${route}`);
  assert.equal($('h1').length,1,`One page title required: ${route}`);
  assert($('h1').text().trim(),`Empty title: ${route}`);
  assert($('meta[name=description]').attr('content'),`Missing description: ${route}`);
  assert.equal($('header.site-header nav[aria-label="Main navigation"]').length,1,`Missing navigation: ${route}`);
  assert.equal($('dialog[aria-labelledby]').length,1,`Missing search: ${route}`);
  const ids=$('[id]').map((i,e)=>$(e).attr('id')).get();
  assert.equal(new Set(ids).size,ids.length,`Duplicate IDs: ${route}`);
  for(const e of $('a[href]').toArray()) {
    const href=$(e).attr('href');
    if(href.startsWith('#'))assert(ids.includes(href.slice(1)),`Missing anchor ${href}: ${route}`);
    if(href.startsWith('/'))assert(routes.includes(href.split(/[?#]/)[0]),`Missing route ${href}: ${route}`);
    if($(e).attr('target')==='_blank')assert(/noopener/.test($(e).attr('rel')),`Unsafe external target: ${href}`);
  }
  for(const e of $('img,video,script[src],link[href]').toArray()) {
    const src=$(e).attr('src')||$(e).attr('href');
    if(!src?.startsWith('/'))continue;
    const s=await stat('public'+src);assert(s.size>0,`Empty asset ${src}: ${route}`);
    if(e.tagName==='img'){assert('alt' in e.attribs,`Missing image alternative: ${route}`);imageCount++;}
  }
  if($('.report-hero').length) {
    const pdf=$('.report-hero .button').attr('href');
    assert(pdf.startsWith('https://www.scad.edu/')&&pdf.includes('.pdf'),`Missing original report PDF: ${route}`);reportCount++;
    assert.equal($('iframe').length,0,`Report PDFs should open in a new tab, without an embedded reader: ${route}`);
    for(const link of $('a[href]').toArray())if($(link).attr('href').includes('.pdf'))assert.equal($(link).attr('target'),'_blank',`PDF links must open in a new tab: ${route}`);
  }
}
const css=await readFile('public/site.css','utf8');
for(const match of css.matchAll(/url\(['"]?(\/[^)'"\s]+)/g))assert((await stat('public'+match[1])).size>0,`Missing font: ${match[1]}`);
const garden=await readFile('public/garden.js','utf8');
for(const match of garden.matchAll(/['"]([a-z0-9]{12}-[^'"\s]+\.mp4)['"]/g))assert((await stat('public/mirror/'+match[1])).size>0,`Missing garden film: ${match[1]}`);
const search=JSON.parse(await readFile('public/search-data.json','utf8'));
assert.equal(search.length,12,'Every report, studio, event, podcast, and case study should be searchable');
for(const item of search)assert(routes.includes(item.url),`Search result has missing route: ${item.url}`);
assert.equal(reportCount,8,'All eight report pages need a PDF destination');
const ai=load(await readFile('public/pages/ai-insights-2026.html','utf8'));
const aiOriginal=load(await readFile('source/pages/ai-insights-2026.html','utf8'));
const originalSections=aiOriginal('.aii-root').first().find('section[id]');
assert.equal(ai('.report-finding').length,5,'Preserve all five AI report findings');
originalSections.each((i,section)=>{
  const id=aiOriginal(section).attr('id');
  const restored=ai(`.report-finding[id="${id}"]`);
  assert.equal(restored.find('[data-chart-item]').length,aiOriginal(section).find('[data-chart-item]').length,`Preserve chart marks: ${id}`);
  for(const block of aiOriginal(section).find('p,cite').toArray()) {
    const text=aiOriginal(block).text().trim();
    assert(restored.text().includes(text),`Preserve caption or quote: ${id}: ${text}`);
  }
  for(const block of restored.find('[style]').toArray())assert(!/(?:^|;)\s*(?:opacity\s*:\s*0|transform\s*:|transition\s*:)/.test(ai(block).attr('style')),`Chart content must be visible without Framer: ${id}: ${ai(block).attr('style')}`);
});
assert.equal(ai('#transformation [data-chart-item]').length,100,'Time-saved waffle chart has 100 respondents');
assert.equal(ai('#transformation [data-chart-item]').filter((i,e)=>ai(e).attr('style').includes('background:#1D338F')).length,63,'Time-saved chart highlights exactly 63 percent');
assert.equal(ai('#emergence .chart-legend li').length,5,'Efficiency chart labels must be visible');
assert.equal(ai('.report-index nav a').length,5,'All report sections have working index links');
assert(ai('#horizon .chart-legend').text().includes('15% Creative AI Co-authorship'),'Small bubble categories must have visible labels');
for(const row of ai('.creative-output-row').toArray())assert(ai(row).children('div').first().attr('style').includes(`width:${ai(row).children('span').first().text()}`),'Creative output bar widths must reflect their percentages');
const {items:answers}=JSON.parse(await readFile('public/ask-answers.json','utf8'));
assert(answers.length>=40,'The Ask chat needs its pre-written answers (npm run ask:answers)');
for(const item of answers){
  assert(item.q&&item.a&&Array.isArray(item.alt)&&Array.isArray(item.kw),`Incomplete Ask answer: ${item.id}`);
  assert(item.sources.length,`Ask answer without a source: ${item.id}`);
  for(const source of item.sources){
    assert(routes.includes(source.url),`Ask answer links a missing route ${source.url}: ${item.id}`);
    if(source.pdf)assert(source.pdf.startsWith('https://www.scad.edu/'),`Ask answer links an unexpected PDF: ${item.id}`);
  }
}
const askScript=await readFile('public/ask.js','utf8');
const matcher=createMatcher(answers);
for(const answer of answers) assert.equal(matcher.answer(answer.q).text,answer.a,`Ask must recognize its own question: ${answer.q}`);
const latest=matcher.answer('What does AI Insights 2026 find?');
const suggestionHistory=[{role:'user',text:'What does AI Insights 2026 find?'},{role:'assistant',...latest}];
const nextSuggestions=matcher.answer('tell me more',latest,suggestionHistory).related;
assert(nextSuggestions.length,'Continue offering fresh questions while answers remain');
assert(nextSuggestions.every(q=>!latest.related.includes(q) && q!=='What does AI Insights 2026 find?'),'Suggestions must skip displayed and answered questions');
assert.equal(matcher.suggest(null,[],answers.flatMap(a=>[a.q,...a.alt])).length,0,'Exhausted suggestions must not recycle old options');
assert.equal(matcher.answer('What is this studio?',latest).text,matcher.answer('What is SCADask?').text,'Known studio question must start a new topic');
assert.equal(matcher.answer('tell me more',latest).sources[0].url,'/ai-insights-2026','Ask follow-ups must stay on topic');
assert(matcher.answer('where can I download it?',latest).sources?.some(s=>s.url==='/ai-insights-2026' && s.pdf),'Contextual download must keep the report year');
assert(!matcher.answer('AI').answerId,'Broad AI query should offer choices');
assert(!matcher.answer('Who won the football game?').answerId,'Unrelated queries must not receive a research answer');
assert(!matcher.answer('tell me more').answerId,'Follow-up without context must ask for a topic');
assert(!matcher.answer('AI Insights 2099').answerId,'Unknown report years must not match a different year');
for(const match of askScript.matchAll(/const starters = \[([^\]]+)\]/g))for(const q of match[1].match(/'[^']+'/g))assert(answers.some(a=>a.q===q.slice(1,-1)),`Starter question has no answer: ${q}`);
const home=load(await readFile('public/pages/home.html','utf8'));
assert.equal(home('.trust-group:not([aria-hidden]) img').length,11,'Keep all original Trusted by logos');
assert(home('.trust-group[aria-hidden] img').toArray().every(e=>home(e).attr('alt')===''),'Duplicated marquee logos must be decorative');
assert.equal(home('.award-strip a').length,4,'Keep the four original award destinations');
const podcast=load(await readFile('public/pages/podcast.html','utf8'));
assert.equal(podcast('.podcast-platforms a').length,4,'Keep every original podcast listening platform');
assert.equal(podcast('audio[controls]').length,1,'Keep the original podcast audio player');
const gardenPage=load(await readFile('public/pages/splatgarden.html','utf8'));
assert.equal(gardenPage('.garden-gallery video').length,4,'Keep four original garden demo films in static HTML');
assert.equal(gardenPage('.credit-list a').length,8,'Keep all seven student profiles and the supervising professor');
console.log(`Verified all ${routes.length} pages, ${reportCount} report PDFs, ${imageCount} image placements, navigation, search index, fonts, and garden films.`);
