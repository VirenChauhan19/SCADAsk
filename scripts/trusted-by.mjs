import {readFile} from 'node:fs/promises';
const {logos}=JSON.parse(await readFile('public/brand/trusted/source.json','utf8'));
const {awards}=JSON.parse(await readFile('public/brand/awards/source.json','utf8'));
export function renderTrustedBy(){
 const group=duplicate=>`<div class="trust-group" ${duplicate?'aria-hidden="true"':''}>${logos.map(x=>`<div class="trust-logo"><img src="${x.src}" alt="${duplicate?'':x.name}" width="${x.width}" height="${x.height}" loading="lazy"></div>`).join('')}</div>`;
 return `<section class="trusted-by wrap" aria-labelledby="trusted-title"><div class="trust-heading"><h2 id="trusted-title">Trusted by</h2></div><div class="trust-window"><div class="trust-track">${group(false)}${group(true)}</div></div></section>`;
}
export function renderAwards(){return `<div class="award-strip"><h2>Awards</h2><div>${awards.map(x=>`<a href="${x.href}" target="_blank" rel="noopener noreferrer"><img src="${x.src}" alt="${x.name}" width="${x.width}" height="${x.height}" loading="lazy"></a>`).join('')}</div></div>`;}
