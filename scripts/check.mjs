import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {load} from 'cheerio';
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
  assert.equal($('nav[aria-label]').length,1,`Missing navigation: ${route}`);
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
const home=load(await readFile('public/pages/home.html','utf8'));
assert.equal(home('.trust-group:not([aria-hidden]) img').length,11,'Keep all original Trusted by logos');
assert(home('.trust-group[aria-hidden] img').toArray().every(e=>home(e).attr('alt')===''),'Duplicated marquee logos must be decorative');
assert.equal(home('.award-strip a').length,4,'Keep the four original award destinations');
const podcast=load(await readFile('public/pages/podcast.html','utf8'));
assert.equal(podcast('.podcast-platforms a').length,4,'Keep every original podcast listening platform');
console.log(`Verified all ${routes.length} pages, ${reportCount} report PDFs, ${imageCount} image placements, navigation, search index, fonts, and garden films.`);
