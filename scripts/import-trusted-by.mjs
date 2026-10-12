import {mkdir,writeFile} from 'node:fs/promises';
import {load} from 'cheerio';
const response=await fetch('https://www.scadask.com/');
if(!response.ok)throw new Error(`Original site returned ${response.status}`);
const $=load(await response.text());
const ticker=$('[data-framer-name="Colored Ticker"]').first();
const logos=[];
const names=['Netflix','Deloitte','NVIDIA','Autodesk','Jewelers Mutual','USA TODAY','Fast Company','Paste','Associated Press','Yahoo! Finance','California Business Journal'];
await mkdir('public/brand/trusted',{recursive:true});
for(const element of ticker.find('[data-framer-component-type="SVG"]').toArray()){
  const name=$(element).attr('data-framer-name')||`brand-${logos.length+1}`;
  const match=$(element).attr('style')?.match(/background-image:url\('(data:image\/svg\+xml,[^']*)'\)/);
  if(!match)throw new Error(`Missing SVG for ${name}`);
  const svg=decodeURIComponent(match[1].slice('data:image/svg+xml,'.length));
  if(!svg.trim().endsWith('</svg>'))throw new Error(`Incomplete SVG for ${name}`);
  const viewBox=svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  const file=name.replace(/Logo$/i,'').replace(/[^a-z0-9]+/gi,'-').toLowerCase()+'.svg';
  const src='/brand/trusted/'+file;
  await writeFile('public'+src,svg);
  logos.push({name:names[logos.length],src,width:viewBox[2],height:viewBox[3]});
}
if(logos.length!==11)throw new Error(`Expected the original 11 logos; found ${logos.length}`);
await writeFile('public/brand/trusted/source.json',JSON.stringify({source:'https://www.scadask.com/',logos},null,2)+'\n');
console.log(JSON.stringify(logos));
