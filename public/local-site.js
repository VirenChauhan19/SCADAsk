// Keep Framer's original components, transitions and filtering on the local host.
// Ensure links emitted by its runtime stay local, including nested report pages.
(()=>{
  const tickerStyles=document.createElement('style');
  tickerStyles.textContent=`
    [data-local-ticker] > ul { opacity: 0 !important; pointer-events: none !important; }
    .local-logo-track { position: absolute; left: 0; top: 0; display: flex; width: max-content; height: 100%; animation: local-logo-scroll var(--ticker-duration, 37.32s) linear infinite; will-change: transform; }
    .local-logo-group { display: flex; flex: none; align-items: center; gap: 50px; padding-right: 50px; }
    .local-logo-group > * { flex: none; position: relative; list-style: none; transform: none !important; }
    @keyframes local-logo-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  `;
  document.head.append(tickerStyles);
  function prepareTickers(){
    for(const container of document.querySelectorAll('[data-framer-name="Colored Ticker"]')){
      if(container.querySelector('.local-logo-track'))continue;
      const original=container.querySelector('ul');
      const items=original&&[...original.children].filter(item=>item.getAttribute('aria-hidden')!=='true');
      if(!items?.length)continue;
      const track=document.createElement('div');
      track.className='local-logo-track';track.setAttribute('aria-hidden','true');
      const group=document.createElement('div');group.className='local-logo-group';
      for(const item of items){
        const copy=item.cloneNode(true);copy.removeAttribute('id');copy.removeAttribute('aria-posinset');copy.removeAttribute('aria-setsize');
        copy.style.transform='none';group.append(copy);
      }
      track.append(group,group.cloneNode(true));
      container.setAttribute('data-local-ticker','');container.append(track);
      const distance=group.getBoundingClientRect().width;
      if(distance)track.style.setProperty('--ticker-duration',`${distance/50}s`);
    }
  }
  const heroVideos=new WeakSet();
  function playHero(video){
    const bounds=video.getBoundingClientRect();
    if(document.hidden||bounds.bottom<=0||bounds.top>=innerHeight)return;
    video.muted=true;
    video.defaultMuted=true;
    video.autoplay=true;
    video.loop=true;
    video.playsInline=true;
    video.preload='auto';
    if(video.paused)video.play().catch(()=>{});
  }
  function prepareHero(){
    for(const video of document.querySelectorAll('video')){
      if(!/P2jTll2ZTpEr5jep4802rW1AOLA/.test(video.getAttribute('src')||''))continue;
      if(!heroVideos.has(video)){
        heroVideos.add(video);
        video.addEventListener('loadeddata',()=>playHero(video));
        video.addEventListener('pause',()=>{if(!document.hidden)setTimeout(()=>playHero(video),50);});
      }
      playHero(video);
    }
  }
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){for(const video of document.querySelectorAll('video'))if(heroVideos.has(video))video.pause();}
    else prepareHero();
  });
  document.addEventListener('pointerdown',prepareHero,{passive:true});
  const nativeFetch=window.fetch.bind(window);
  window.fetch=async(input,options)=>{
    const url=new URL(typeof input==='string'||input instanceof URL?input:input.url,location.href);
    if(url.origin===location.origin&&url.pathname.endsWith('.framercms')&&url.searchParams.has('range')){
      const ranges=url.searchParams.get('range').split(',').map(r=>r.split('-').map(Number));
      url.searchParams.delete('range');
      const response=await nativeFetch(url,options);
      if(!response.ok)return response;
      const bytes=new Uint8Array(await response.arrayBuffer());
      return new Response(new Blob(ranges.map(([start,end])=>bytes.slice(start,end+1))),{status:200,headers:{'Content-Type':'application/octet-stream'}});
    }
    return nativeFetch(input,options);
  };
  const localize=()=>{
    for(const a of document.querySelectorAll('a[href]')){
      const href=a.getAttribute('href');
      if(href.startsWith('./'))a.setAttribute('href','/'+href.slice(2));
      else if(/^https:\/\/(www\.)?scadask\.com(?:\/|$)/.test(href)){
        const url=new URL(href);a.setAttribute('href',url.pathname+url.search+url.hash);
      }
    }
    for(const element of document.querySelectorAll('img,video,source')){
      for(const attribute of ['src','poster']){
        const value=element.getAttribute(attribute),local=window.__scadAssets?.[value];
        if(local)element.setAttribute(attribute,local);
      }
      const srcset=element.getAttribute('srcset');
      if(srcset&&srcset.includes('framerusercontent.com')){const mapped=srcset.split(',').map(part=>{
        const [url,...size]=part.trim().split(/\s+/);return [window.__scadAssets?.[url]||url,...size].join(' ');
      }).join(', ');if(mapped!==srcset)element.setAttribute('srcset',mapped);}
    }
    prepareHero();
    prepareTickers();
  };
  document.addEventListener('DOMContentLoaded',()=>{
    localize();new MutationObserver(localize).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['href','src','srcset','poster']});
  });
})();
