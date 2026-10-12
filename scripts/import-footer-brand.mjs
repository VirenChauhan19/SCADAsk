import {mkdir,writeFile} from 'node:fs/promises';
import {load} from 'cheerio';
const response=await fetch('https://www.scadask.com/');
if(!response.ok)throw new Error(`Source website returned ${response.status}`);
const $=load(await response.text());
const links=new Map();
for(const link of $('a[href]').toArray()){
  const href=$(link).attr('href');
  if(/^https:\/\/www\.(instagram|linkedin)\.com\//i.test(href)){
    const label=/instagram/i.test(href)?'Instagram':'LinkedIn';
    links.set(href,{href,label,iconUrl:$(link).find('[data-framer-name="Image"] img').first().attr('src')});
  }
}
const logo=$('[data-framer-name="logo"][data-framer-component-type="SVG"]').filter((i,e)=>$(e).closest('a').attr('href')==='https://www.scad.edu/').first();
const match=logo.attr('style')?.match(/background-image:url\('(data:image\/svg\+xml,[^']*)'\)/);
if(!match)throw new Error('Original footer SCAD SVG not found');
const svg=decodeURIComponent(match[1].slice('data:image/svg+xml,'.length));
if(!svg.trim().endsWith('</svg>'))throw new Error('Incomplete SCAD logo SVG');
await mkdir('public/brand',{recursive:true});
await writeFile('public/brand/scad-university.svg',svg);
const socials=[];
for(const {href,label,iconUrl} of links.values()){
  const icon=await fetch(iconUrl);
  if(!icon.ok)throw new Error(`Social icon returned ${icon.status}`);
  const path=`/brand/${label.toLowerCase()}.png`;
  await writeFile('public'+path,new Uint8Array(await icon.arrayBuffer()));
  socials.push({href,label,icon:path});
}
await writeFile('public/brand/footer-source.json',JSON.stringify({source:'https://www.scadask.com/',socials},null,2)+'\n');
console.log(JSON.stringify(socials));
console.log(`Saved original SCAD logo (${svg.length} characters).`);
