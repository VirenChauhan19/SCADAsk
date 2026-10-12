import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {load} from 'cheerio';

const origin='https://www.scadask.com';
const root=path.resolve('public');
await mkdir('source/pages',{recursive:true});
await mkdir('source/modules',{recursive:true});
await mkdir(path.join(root,'mirror'),{recursive:true});
await mkdir(path.join(root,'pages'),{recursive:true});
const pages=new Map(), assets=new Map(), pending=[];
const assetPattern=/https:\/\/framerusercontent\.com\/[^\s"'<>`\\)]+/g;
const modulePattern=/(?:from\s*|import\s*\(|import\s*|export[^;]*?from\s*)["'](\.[^"']+\.(?:mjs|js)(?:\?[^"']*)?)["']/g;
const cmsPattern=/new URL\((["'`])([^"'`]+\.framercms)\1,\s*(["'`])([^"'`]+)\3\)\.href\.replace\(["'`]\/modules\/["'`],["'`]\/cms\/["'`]\)/g;
const routeKey=url=>new URL(url,origin).pathname.replace(/\/$/,'')||'/';
function register(url){
  url=url.replace(/&amp;/g,'&');
  if(!assets.has(url)){
    const u=new URL(url),name=path.basename(u.pathname);
    const local='/mirror/'+createHash('sha256').update(url).digest('hex').slice(0,12)+'-'+name;
    assets.set(url,local);pending.push(url);
  }
  return assets.get(url);
}
async function download(url){
  let error;
  for(let attempt=0;attempt<3;attempt++)try{
    const response=await fetch(url,{signal:AbortSignal.timeout(120000)});
    if(!response.ok)throw new Error(`${response.status}: ${url}`);
    return Buffer.from(await response.arrayBuffer());
  }catch(e){error=e;}
  throw error;
}
const sitemap=await readFile('source/sitemap.xml','utf8');
const routes=[...new Set(['/',...Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g),m=>routeKey(m[1]))])];
// Crawl public in-site links, including reports and case-study detail pages.
while(routes.length){
  const route=routes.shift();if(pages.has(route))continue;
  const raw=route==='/'?await readFile('source/live-home.html','utf8'):(await download(origin+route)).toString();
  const $=load(raw);pages.set(route,raw);
  await writeFile(`source/pages/${route==='/'?'home':route.slice(1).replaceAll('/','--')}.html`,raw);
  $('a[href]').each((i,e)=>{
    const href=$(e).attr('href');
    try{const u=new URL(href,origin+'/');if(['www.scadask.com','scadask.com'].includes(u.hostname)&&!path.extname(u.pathname)){
      const key=routeKey(u.href);if(!pages.has(key)&&!routes.includes(key))routes.push(key);
    }}catch{}
  });
  for(const match of raw.matchAll(assetPattern))register(match[0]);
  console.log(`Captured ${route}; ${routes.length} routes queued`);
}
// Save all modules and their transitive imports, plus media referenced by modules.
const texts=new Map();let done=0;
while(pending.length){
  const batch=pending.splice(0,8);
  await Promise.all(batch.map(async url=>{
    const local=assets.get(url),file=path.join(root,local);
    let data;
    const isCode=/\.(mjs|js|css)(?:\?|$)/.test(url);
    const cache=isCode?path.join('source/modules',path.basename(local)):file;
    try{data=await readFile(cache);}catch{data=await download(url);await writeFile(cache,data);if(isCode)await writeFile(file,data);}
    if(/\.(mjs|js|css)(?:\?|$)/.test(url)){
      const raw=data.toString();texts.set(url,raw);
      for(const match of raw.matchAll(cmsPattern))register(new URL(match[2],match[4]).href.replace('/modules/','/cms/'));
      for(const match of raw.matchAll(assetPattern))register(match[0]);
      for(const match of raw.matchAll(modulePattern))register(new URL(match[1],url).href);
      // Compiled Framer chunks also use URL() and dynamic import helpers.
      for(const match of raw.matchAll(/["'`](\.\/?[^"'`\s]+\.mjs)["'`]/g))register(new URL(match[1],url).href);
    }
    done++;
  }));
  console.log(`Saved ${done} assets; ${pending.length} queued`);
}
function rewrite(raw,base){
  if(base)raw=raw.replace(cmsPattern,(full,q,relative,q2,absolute)=>`new URL(${JSON.stringify(assets.get(new URL(relative,absolute).href.replace('/modules/','/cms/')))},import.meta.url).href`);
  raw=raw.replace(assetPattern,url=>assets.get(url.replace(/&amp;/g,'&'))||url);
  if(base)raw=raw.replace(/(["'`])(\.\/?[^"'`\s]+\.mjs)\1/g,(full,q,url)=>q+(assets.get(new URL(url,base).href)||url)+q);
  return raw;
}
for(const [url,raw]of texts)await writeFile(path.join(root,assets.get(url)),rewrite(raw,url));
for(const [route,raw]of pages){
  const $=load(rewrite(raw));
  // Tracking and editor scripts are unrelated to the site's visible behavior.
  $('script').each((i,e)=>{const s=$(e);if(/googletagmanager|events\.framer\.com/.test(s.attr('src')||s.text())||s.text().includes('__framer_force_showing_editorbar_since'))s.remove();});
  $('noscript').remove();
  $('video').each((i,e)=>{if(/P2jTll2ZTpEr5jep4802rW1AOLA/.test($(e).attr('src')||''))$(e).attr({autoplay:'',muted:'',loop:'',playsinline:'',preload:'auto'});});
  $('link[rel="canonical"],meta[property="og:url"]').remove();
  $('a[href]').each((i,e)=>{const s=$(e),href=s.attr('href');try{const u=new URL(href,origin+'/');if(['scadask.com','www.scadask.com'].includes(u.hostname))s.attr('href',routeKey(u.href)+u.search+u.hash);}catch{}});
  $('head').prepend('<script src="/asset-map.js"></script><script src="/local-site.js"></script>');
  const html=$.html();
  await writeFile(`public/pages/${route==='/'?'home':route.slice(1).replaceAll('/','--')}.html`,html);
  if(route==='/')await writeFile('index.html',html);
}
await writeFile('source/site-manifest.json',JSON.stringify({origin,routes:[...pages.keys()],assets:Object.fromEntries(assets)},null,2));
await writeFile('public/asset-map.js','window.__scadAssets='+JSON.stringify(Object.fromEntries(assets))+';');
console.log(`Complete: ${pages.size} pages, ${assets.size} assets.`);
