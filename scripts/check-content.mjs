import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {load} from 'cheerio';
import {reference,sourceHref,localAsset,clientReference} from './content-reference.mjs';
import {omittedMediaReason,omittedTextReason} from './content-selection.mjs';

// Ignore typographic punctuation and responsive line breaks, not missing words.
const comparable=text=>text.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]/gu,'');
const ui=new Set(['Scroll down to read','Explore research','About SCADask','View All','Read full report','Index','Privacy','Terms','Try SplatGarden','Back to Top','Download report']);
const variants=new Map([
 ['A real-time Gaussian Splat environment loads from a single URL.','Explore a real-time Gaussian Splat environment with a single URL.'],
 ["Each artist's work sits where it was meant, and built, to live.","Discover each artist's work where it was meant, and built, to live."],
 ['Assest Creation','Asset creation']
]);
const canonical=(href,name)=>{
  let target=sourceHref(href,name);
  if(target==='https://www.scad.edu/privacy')return '/privacy';
  if(target==='https://www.scad.edu/terms-of-use')return '/terms';
  if(target.startsWith('/'))return target.split(/[?#]/)[0].replace(/\/$/,'') || '/';
  const url=new URL(target);url.hostname=url.hostname.replace(/^www\./,'');url.search='';url.hash='';
  return url.href.replace(/\/$/,'');
};
const results=[];
for(const [name,page] of Object.entries(reference.pages)){
  const html=await readFile(`public/pages/${name}.html`,'utf8');
  const $=load(html);$('script,style,dialog').remove();
  const text=comparable($('body').text());
  const required=page.blocks.filter(block=>!ui.has(block.text) && !omittedTextReason(name,block) && !(block.text==='0:00' && $('audio[controls]').length));
  const missing=required.filter(block=>!text.includes(comparable(variants.get(block.text)||block.text))).map(block=>block.text);
  const destinations=new Set($('a[href]').map((i,e)=>canonical($(e).attr('href'),name)).get());
  const missingLinks=page.links.filter(link=>!destinations.has(canonical(link.href,name))).map(link=>link.href);
  const presentMedia=new Set($('img,video,audio').map((i,e)=>$(e).attr('src')?.split('?')[0]).get());
  $('[poster]').each((i,e)=>presentMedia.add($(e).attr('poster').split('?')[0]));
  // These assets carry no additional information: a social-button gradient
  // and the repeated decorative brand SVGs used in the original marquee.
  const decorative=media=>media.src.includes('Cri9oignLymHIoKuJ114OYpkc') || media.context.includes('Horizontal animation');
  const expectedMedia=page.media.filter(media=>!decorative(media) && !omittedMediaReason(name,media));
  const missingMedia=expectedMedia.filter(media=>!presentMedia.has(localAsset(media.src).split('?')[0])).map(media=>media.src);
  for(const chart of page.charts || []){
    const restored=$(`.report-finding[id="${chart.id}"]`);
    if(restored.find('[data-chart-item]').length!==chart.marks.length)missing.push(`Chart mark count: ${chart.id}`);
    const chartText=comparable(restored.text());
    for(const mark of chart.marks)if(mark.text && !chartText.includes(comparable(mark.text)))missing.push(`Chart value: ${chart.id}: ${mark.text}`);
  }
  if(name==='splatgarden'){
    const clientTexts=clientReference.splatgarden.contributors.flatMap(person=>[person.name,person.detail]).filter(Boolean).concat(clientReference.splatgarden.pipeline.flatMap(stage=>[stage.title,...stage.paragraphs,...(stage.layers || []).flatMap(layer=>[layer.title,layer.text])]));
    missing.push(...clientTexts.filter(value=>!text.includes(comparable(value))));
    missingLinks.push(...clientReference.splatgarden.contributors.filter(person=>!destinations.has(canonical(person.href,name))).map(person=>person.href));
  }
  results.push({page:page.route,source:page.source,checkedTextBlocks:required.length,checkedMedia:expectedMedia.length,excludedDecorativeMedia:page.media.filter(decorative).map(media=>({src:media.src,reason:media.context.includes('Horizontal animation')?'Repeated decorative brand SVG in original marquee':'Decorative social-button gradient'})),editorialOmissions:[...page.media.filter(media=>omittedMediaReason(name,media)).map(media=>({src:media.src,reason:omittedMediaReason(name,media)})),...page.blocks.filter(block=>omittedTextReason(name,block)).map(block=>({text:block.text,reason:omittedTextReason(name,block)}))],missingText:missing,missingLinks,missingMedia});
}
await writeFile('verification/content-coverage.json',JSON.stringify({referenceCapturedAt:reference.capturedAt,results},null,2)+'\n');
for(const result of results){
  if(result.missingText.length||result.missingLinks.length||result.missingMedia.length)console.log(JSON.stringify(result,null,2));
}
const missing=results.reduce((count,result)=>count+result.missingText.length+result.missingLinks.length+result.missingMedia.length,0);
assert.equal(missing,0,`${missing} original text blocks, destinations, or media references need restoration; see verification/content-coverage.json`);
console.log(`Verified original text, link, and substantive media coverage on all ${results.length} pages against the live reference captured ${reference.capturedAt}, including loaded garden contributors and expanded pipeline panels.`);
