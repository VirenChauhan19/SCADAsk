// Motion is enabled for this design. Visitors can switch it off in the footer.
(() => {
 const root=document.documentElement;
 let preference='full';
 try{if(localStorage.getItem('scadask-motion')==='reduced')preference='reduced';}catch{}
 const sync=()=>{
  root.dataset.motion=preference;
  const transitions=document.querySelector('#page-transitions');
  if(transitions)transitions.media=preference==='reduced'?'not all':'all';
  document.querySelectorAll('.motion-control').forEach(button=>{button.setAttribute('aria-pressed',String(preference==='full'));button.textContent=preference==='full'?'Motion on':'Motion off';});
  document.dispatchEvent(new Event('scadask:motionchange'));
 };
 sync();
 document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.motion-control').forEach(button=>button.addEventListener('click',()=>{
   preference=preference==='full'?'reduced':'full';
   try{localStorage.setItem('scadask-motion',preference);}catch{}
   sync();
  }));sync();
 });
 const handle=event=>{if(!event.viewTransition)return;event.viewTransition.ready.catch(()=>{});if(preference==='reduced')event.viewTransition.skipTransition();};
 addEventListener('pageswap',handle);addEventListener('pagereveal',handle);
})();
