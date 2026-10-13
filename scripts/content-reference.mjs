import {readFile} from 'node:fs/promises';

export const reference=JSON.parse(await readFile('source/content-reference.json','utf8'));
export const clientReference=JSON.parse(await readFile('source/client-content-reference.json','utf8'));
const manifest=JSON.parse(await readFile('source/site-manifest.json','utf8'));
const contentMedia=JSON.parse(await readFile('source/content-media-map.json','utf8'));
export const localAsset=url=>contentMedia[url.split('?')[0]] || manifest.assets[url] || Object.entries(manifest.assets).find(([remote])=>remote.split('?')[0]===url.split('?')[0])?.[1] || url;
export const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export const sourcePage=name=>reference.pages[name];
export const sourceBlocks=name=>{
  const blocks=sourcePage(name).blocks;
  const footer=blocks.findIndex(block=>block.text==='Bring your question.');
  return blocks.slice(0,footer<0?blocks.length:footer);
};
export const sourceParagraphs=name=>sourceBlocks(name).filter(block=>block.tag==='p').map(block=>block.text);
export function sourceHref(href,name='home'){
  const url=new URL(href,reference.origin+'/'+(name==='home'?'':name));
  if(url.origin===reference.origin)return url.pathname+url.search+url.hash;
  return url.href;
}
export function sourceCard(name,report){
  const link=sourcePage(name).links.find(link=>sourceHref(link.href,name)==='/'+report.slug);
  if(!link || !link.paragraphs.length)return report;
  const categories=link.paragraphs.filter(text=>/^(Creativity|Commerce|Culture|Technology|Business)$/.test(text));
  const season=link.paragraphs.find(text=>/^(Spring|Summer|Fall|Winter) \d{4}$/.test(text));
  const summary=link.paragraphs.at(-1);
  const title=link.heading || link.paragraphs.find(text=>text!==summary && !categories.includes(text) && text!==season) || report.title;
  return {...report,title,summary:summary.length>50?summary:report.summary,category:categories[0] || report.category,categories:categories.length?categories:[report.category],season:season || report.season,image:link.images[0]?localAsset(link.images[0].src):report.image};
}
export function sourceMarkup(block,name){
  // The collector removes runtime classes/styles, retaining inline semantics.
  return (block.html || escape(block.text)).replace(/href="([^"]+)"/g,(match,href)=>{
    const destination=sourceHref(href,name);
    return `href="${escape(destination)}"${destination.startsWith('https:')?' target="_blank" rel="noopener"':''}`;
  });
}
export function reportAwards(name){
  const awards=sourcePage(name).links.filter(link=>/awards?\.com|amcpros\.com/.test(link.href));
  if(!awards.length)return '';
  return `<section class="wrap report-recognition"><p class="eyebrow">AWARDS & RECOGNITION</p><div class="report-awards">${awards.map(link=>{
    const label=link.href.includes('titan')?'Titan Brand Awards':link.href.includes('hermes')?'Hermes Creative Awards':link.href.includes('litadvertising')?'LIT Advertising Awards':'MUSE Creative Awards';
    const image=link.images[0];
    return `<a href="${escape(link.href)}" target="_blank" rel="noopener">${image?`<img src="${escape(localAsset(image.src))}" alt="" width="120" height="120" loading="lazy">`:''}<span>${label} ↗</span></a>`;
  }).join('')}</div></section>`;
}
