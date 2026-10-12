// Apply the visitor's choice before the first paint and navigation reveal.
(() => {
  let saved;
  try { saved = sessionStorage.getItem('scadask-motion'); } catch {}
  const full = saved === 'full' || (saved !== 'reduced' && !matchMedia('(prefers-reduced-motion: reduce)').matches);
  document.documentElement.dataset.motion = full ? 'full' : 'reduced';
  document.querySelector('#page-transitions').media = full ? 'all' : 'not all';
  const handle = event => {
    if (!event.viewTransition) return;
    event.viewTransition.ready.catch(() => {});
    if (document.documentElement.dataset.motion === 'reduced') event.viewTransition.skipTransition();
  };
  addEventListener('pageswap', handle);
  addEventListener('pagereveal', handle);
})();
