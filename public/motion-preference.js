// Site motion is explicitly enabled for this design, before first paint.
(() => {
  const full = true;
  document.documentElement.dataset.motion = full ? 'full' : 'reduced';
  document.querySelector('#page-transitions').media = 'not all';
  const handle = event => {
    if (!event.viewTransition) return;
    event.viewTransition.ready.catch(() => {});
    if (document.documentElement.dataset.motion === 'reduced') event.viewTransition.skipTransition();
  };
  addEventListener('pageswap', handle);
  addEventListener('pagereveal', handle);
})();
