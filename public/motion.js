// Motion enhances rendered content; navigation and reading never depend on it.
(() => {
 const root=document.documentElement,prepared=new WeakSet(),running=new Set();
 const reduced=()=>root.dataset.motion==='reduced';
 const ease='cubic-bezier(.16,1,.3,1)';
 function animate(element,frames,options={}){
  if(!element?.animate||document.hidden||reduced())return;
  const animation=element.animate(frames,{duration:550,easing:ease,...options});
  running.add(animation);
  animation.finished.then(()=>running.delete(animation),()=>running.delete(animation));
  return animation;
 }
 function reveal(element){element.classList.remove('motion-pending');element.classList.add('motion-visible');observer?.unobserve(element);}
 const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{
  for(const entry of entries)if(entry.isIntersecting)reveal(entry.target);
 },{threshold:0,rootMargin:'0px 0px -35px 0px'}):null;
 function prepare(scope=document){
  const selector='.section-heading,.topic,.report-card,.case-banner,.studio-intro,.about-statement,.service-grid>article,.event-feature,.event-card,.podcast-preview,.podcast-episode,.press-recognition,.garden-card,.garden-films-heading,.report-overview,.about-hero,.events-hero';
  const items=[...scope.querySelectorAll(selector)].filter(e=>!prepared.has(e)&&!e.hidden&&!e.closest('details:not([open])'));
  const positions=items.map(e=>({e,top:e.getBoundingClientRect().top}));
  for(const {e,top} of positions){
   prepared.add(e);e.classList.add('motion-reveal');
   const peers=e.parentElement?.matches('.report-grid,.topic-grid,.service-grid,.garden-gallery')?[...e.parentElement.children]:[];
   e.style.setProperty('--reveal-delay',String(Math.max(0,peers.indexOf(e))%3*65)+'ms');
   if(!observer||reduced()||top<innerHeight){reveal(e);continue;}
   e.classList.add('motion-pending');observer.observe(e);
  }
 }
 function animateItems(container,selector=':scope > *'){
  container?.querySelectorAll(selector).forEach((e,i)=>{
   e.getAnimations().forEach(a=>a.cancel());
   animate(e,[{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'none'}],{delay:Math.min(i,5)*40,duration:420,fill:'backwards'});
  });
 }
 function change(mutate){mutate();const grid=document.querySelector('.library-grid');grid?.querySelectorAll('.report-card:not([hidden])').forEach(reveal);animateItems(grid,'.report-card:not([hidden])');}
 window.scadaskMotion={change,animateItems};
 document.addEventListener('scadask:results',e=>animateItems(e.detail));
 document.addEventListener('scadask:panel',e=>animateItems(e.detail));
 document.addEventListener('scadask:ready',e=>prepare(e.detail||document));
 document.addEventListener('focusin',e=>{for(let p=e.target;p&&p!==document;p=p.parentElement)if(p.classList?.contains('motion-pending'))reveal(p);});
 document.querySelectorAll('details').forEach(details=>details.addEventListener('toggle',()=>{if(details.open)animateItems(details,':scope > :not(summary)');}));
 if('IntersectionObserver' in window){
  const sentinel=document.createElement('div');sentinel.className='header-sentinel';sentinel.setAttribute('aria-hidden','true');document.body.prepend(sentinel);
  new IntersectionObserver(([entry])=>document.querySelector('.site-header')?.classList.toggle('is-scrolled',!entry.isIntersecting)).observe(sentinel);
 }
 function finish(){running.forEach(animation=>animation.finish());document.querySelectorAll('.motion-pending').forEach(reveal);}
 const atmosphere=document.querySelector('.hero-atmosphere');
 if(atmosphere){
  let visible=true;
  const sync=()=>{if(reduced()||document.hidden||!visible)atmosphere.pause();else atmosphere.play().catch(()=>{});};
  if('IntersectionObserver' in window)new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();}).observe(atmosphere);
  document.addEventListener('scadask:motionchange',sync);document.addEventListener('visibilitychange',sync);sync();
 }
 document.addEventListener('scadask:motionchange',()=>{if(reduced())finish();});
 document.addEventListener('visibilitychange',()=>{root.classList.toggle('motion-idle',document.hidden);if(document.hidden)finish();else prepare();});
 addEventListener('pageshow',event=>{if(event.persisted)finish();});
 prepare();
 const opening=document.querySelector('.hero-copy')||document.querySelector('.page-intro');
 if(opening)animateItems(opening,':scope > :not(.award-strip)');
 animate(document.querySelector('.hero-feature'),[{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'none'}],{duration:800,delay:100});
})();
