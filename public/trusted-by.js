const trust=document.querySelector('.trusted-by');
if(trust){
 // This row's automatic scrolling is explicitly enabled, independently of page motion.
 trust.dataset.scroll='auto';
 let visible=false;
 const sync=()=>{trust.classList.toggle('is-in-view',visible&&!document.hidden);};
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(trust);
 document.addEventListener('visibilitychange',sync);sync();
}
