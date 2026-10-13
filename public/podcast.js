(() => {
  const audio=document.querySelector('.podcast-audio');
  if(!audio)return;
  // The original episode host can require Dropbox authentication. Preserve the
  // original source and keep the public listening destinations usable on error.
  const fallback=document.createElement('p');
  fallback.className='podcast-audio-fallback';fallback.hidden=true;
  fallback.setAttribute('role','status');
  fallback.textContent='Listen to this episode on one of the platforms below.';
  audio.after(fallback);
  audio.addEventListener('error',()=>{audio.hidden=true;fallback.hidden=false;});
})();
