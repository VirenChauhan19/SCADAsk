import {writeFile,mkdir} from 'node:fs/promises';
import {load} from 'cheerio';
const get=async route=>{const r=await fetch('https://www.scadask.com/'+route);if(!r.ok)throw new Error(`Original site returned ${r.status}`);return r.text();};
const home=load(await get(''));
const podcastHtml=await get('podcast');
const podcast=load(podcastHtml);
await mkdir('public/brand/awards',{recursive:true});
const awards=[];
for(const [i,e] of home('[data-framer-name="Awards"]').first().find('a[href]').toArray().entries()){
 const img=home(e).find('img');const src=`/brand/awards/award-${i+1}.png`;
 const response=await fetch(img.attr('src'));if(!response.ok)throw new Error('Award download failed');
 await writeFile('public'+src,new Uint8Array(await response.arrayBuffer()));
 awards.push({name:img.attr('alt')||'MUSE Creative Awards logo',src,href:home(e).attr('href'),width:Number(img.attr('width')),height:Number(img.attr('height'))});
}
await writeFile('public/brand/awards/source.json',JSON.stringify({source:'https://www.scadask.com/',awards},null,2)+'\n');
const links=podcast('a[href]').map((i,e)=>({label:podcast(e).text().trim(),href:podcast(e).attr('href')})).get().filter(x=>['Watch on YouTube','Apple Podcast','Spotify','Amazon Music'].includes(x.label));
await writeFile('public/brand/podcast-source.json',JSON.stringify({source:'https://www.scadask.com/podcast',links:[...new Map(links.map(x=>[x.label,x])).values()]},null,2)+'\n');
const artwork=['dboKTSzqmMi1zdACctnIZMtSs.png','qStEvR69ZRzFKLC9hnE68EdXmdQ.png','51qSvHHI6snIW9FbSzRa8XkcfY.png'];
for(const [i,name] of artwork.entries()){const r=await fetch('https://framerusercontent.com/images/'+name);if(!r.ok)throw new Error('Podcast artwork download failed');await writeFile(`public/brand/podcast-${i}.png`,new Uint8Array(await r.arrayBuffer()));}
await writeFile('source/pages/podcast.html',podcastHtml);
console.log('Imported four original award logos and SCAD Signal artwork and listening links.');
