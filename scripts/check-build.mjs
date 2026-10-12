import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {load} from 'cheerio';
const base=(process.env.SITE_BASE_PATH||'').replace(/\/$/,'');
const {routes}=JSON.parse(await readFile('source/site-manifest.json','utf8'));
async function checkUrl(url){
  if(!url?.startsWith('/')||url.startsWith('//'))return;
  assert(url.startsWith(base+'/'),`URL outside deployment path: ${url}`);
  const path=url.slice(base.length).split(/[?#]/)[0];
  const destination='dist'+path;
  const info=await stat(destination);
  assert((info.isDirectory()?await stat(destination+'/index.html'):info).size>0,`Missing build destination: ${url}`);
}
for(const route of routes){
  const path=route==='/'?'dist/index.html':`dist${route}/index.html`;
  const $=load(await readFile(path,'utf8'));
  for(const element of $('[href],[src],[poster]').toArray()){
    for(const attr of ['href','src','poster'])await checkUrl($(element).attr(attr));
  }
}
for(const item of JSON.parse(await readFile('dist/search-data.json','utf8')))await checkUrl(item.url);
const script=await readFile('dist/site.js','utf8');
assert(script.includes(`fetch('${base}/search-data.json')`),'Search must fetch from the deployment path');
const css=await readFile('dist/site.css','utf8');
for(const match of css.matchAll(/url\(['"]?(\/[^)'"\s]+)/g))await checkUrl(match[1]);
console.log(`Verified built routes, assets, search destinations, and font paths at ${base||'/'}.`);
