// Short one-time reveals. Scroll handlers never measure layout.
(() => {
 const root=document.documentElement,prepared=new WeakSet(),running=new Set();
 const animate=(element,frames)=>{
  if(document.hidden||!element?.animate)return;
  const a=element.animate(frames,{duration:180,easing:'ease-out'});running.add(a);
  a.finished.then(()=>running.delete(a),()=>running.delete(a));return a;
 };
 const reveal=e=>{e.classList.remove('motion-pending');e.classList.add('motion-visible');observer?.unobserve(e);};
 const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting)reveal(e.target);},{threshold:0,rootMargin:'120px 0px'}):null;
 function prepare(scope=document){
  const selector='.section-heading,.topic,.report-card,.case-banner,.studio-intro,.about-statement,.service-grid > article,.event-card,.podcast-preview,.podcast-episode,.press-recognition,.garden-card,.garden-films-heading';
  const items=[...scope.querySelectorAll(selector)].filter(e=>!prepared.has(e)&&!e.hidden&&!e.closest('details:not([open])')).map(e=>({e,box:e.getBoundingClientRect()}));
  for(const {e,box} of items){prepared.add(e);e.classList.add('motion-reveal');if(!observer||box.top<innerHeight+120){reveal(e);continue;}e.classList.add('motion-pending');observer.observe(e);}
 }
 function animateItems(container,selector=':scope > *'){container?.querySelectorAll(selector).forEach(e=>{e.getAnimations().forEach(a=>a.cancel());animate(e,[{opacity:.65},{opacity:1}]);});}
 function change(mutate){
  mutate();document.querySelectorAll('.library-grid .report-card:not([hidden])').forEach(e=>{e.getAnimations().forEach(a=>a.cancel());reveal(e);});
  animate(document.querySelector('.library-grid'),[{opacity:.75},{opacity:1}]);
 }
 window.scadaskMotion={change,animateItems};
 document.addEventListener('scadask:results',e=>animateItems(e.detail));document.addEventListener('scadask:panel',e=>animateItems(e.detail));document.addEventListener('scadask:ready',e=>prepare(e.detail));
 document.addEventListener('focusin',e=>{for(let p=e.target;p&&p!==document;p=p.parentElement)if(p.classList?.contains('motion-pending'))reveal(p);});
 addEventListener('pageshow',()=>{document.querySelectorAll('.motion-pending').forEach(e=>{if(e.getBoundingClientRect().top<innerHeight+120)reveal(e);});});
 document.addEventListener('visibilitychange',()=>{root.classList.toggle('motion-idle',document.hidden);if(document.hidden)running.forEach(a=>a.finish());else prepare();});
 document.querySelector('#page-transitions').media='not all';prepare();
})();
