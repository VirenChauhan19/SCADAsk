import {readFile,writeFile} from 'node:fs/promises';
import {load} from 'cheerio';

const manifest=JSON.parse(await readFile('source/site-manifest.json','utf8'));
const normalize=text=>text.replace(/\s+/g,' ').trim();
const pages={};
const refresh=process.argv.includes('--refresh');
const chromeNames=new Set(['Research','Podcast','Case Studies','Events','About Us','Request information','MyAdmission login','MySCAD login']);
for(const route of manifest.routes){
  const name=route==='/'?'home':route.slice(1);
  let html=await readFile(`source/pages/${name}.html`,'utf8');
  let source='saved capture';
  if(refresh){
    try{
      const response=await fetch(manifest.origin+route,{signal:AbortSignal.timeout(20000)});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const live=await response.text();
      if(!live.includes('framer') || !live.includes('SCAD'))throw new Error('Unexpected page response');
      html=live;source='live website';
    }catch(error){console.log(`${name}: using saved capture (${error.message})`);}
  }
  const $=load(html);
  $('script,style,noscript').remove();
  // One canonical copy of responsive content; remove the repeated AI article.
  $('.aii-root').slice(1).remove();
  const blocks=[];const seen=new Set();
  const cleanHtml=node=>{
    const copy=$(node).clone();
    copy.find('*').each((i,child)=>{
      const element=$(child);
      for(const key of Object.keys(child.attribs || {}))if(key!=='href')element.removeAttr(key);
      if(['span','div'].includes(child.tagName))element.replaceWith(element.contents());
    });
    return copy.html();
  };
  $('h1,h2,h3,h4,h5,p,li,cite,dd,dt').each((i,node)=>{
    if($(node).parents('li').length)return;
    const text=normalize($(node).text());
    if(!text || chromeNames.has(text) || seen.has(text))return;
    seen.add(text);blocks.push({tag:node.tagName,text,html:cleanHtml(node)});
  });
  $('div,span,b,strong,time,button').each((i,node)=>{
    if($(node).children().length || $(node).parents('p,h1,h2,h3,h4,h5,li,cite,a,svg').length)return;
    const text=normalize($(node).text());
    if(text.length<2 || !/[a-z0-9]/i.test(text) || chromeNames.has(text) || seen.has(text))return;
    seen.add(text);blocks.push({tag:'label',text});
  });
  const links=[...new Map($('a[href]').map((i,node)=>({href:$(node).attr('href'),text:normalize($(node).text()),label:$(node).attr('aria-label')||'',heading:normalize($(node).find('h1,h2,h3,h4').first().text()),paragraphs:[...new Set($(node).find('p').map((j,p)=>normalize($(p).text())).get())],images:$(node).find('img[src]').map((j,img)=>({src:$(img).attr('src'),alt:$(img).attr('alt')||''})).get()})).get().filter(link=>link.href&&!link.href.startsWith('#')).map(link=>[link.href,link])).values()];
  const media=[...new Map($('img,video,audio').map((i,node)=>({tag:node.tagName,src:$(node).attr('src'),alt:$(node).attr('alt')||'',poster:$(node).attr('poster')||'',anchor:$(node).closest('a[href]').attr('href')||'',context:$(node).parents('[data-framer-name]').slice(0,4).map((j,p)=>$(p).attr('data-framer-name')).get()})).get().filter(item=>item.src).map(item=>[item.src,item])).values()];
  const charts=$('.aii-root section[id]').map((i,section)=>({id:$(section).attr('id'),marks:$(section).find('[data-chart-item]').map((j,item)=>({text:normalize($(item).text()),label:$(item).attr('aria-label') || ''})).get()})).get();
  pages[name]={route,source,blocks,links,media,charts};
  console.log(`${name}: ${blocks.length} unique text blocks, ${links.length} links (${source})`);
}
await writeFile('source/content-reference.json',JSON.stringify({origin:manifest.origin,capturedAt:new Date().toISOString(),pages},null,2)+'\n');
