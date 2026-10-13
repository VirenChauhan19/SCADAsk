// Animate the local report graphics without depending on Framer hydration.
// HTML always contains the final values, including when JavaScript is disabled.
(() => {
  const findings = document.querySelector('.report-findings');
  if (!findings || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const reduced = () => document.documentElement.dataset.motion === 'reduced';
  const active = new Set();
  const played = new WeakSet();
  const ease = 'cubic-bezier(.22,.61,.36,1)';
  const animate = (element, frames, delay = 0, duration = 700) => {
    if (!element || document.hidden || reduced()) return;
    const animation = element.animate(frames, {duration, delay, easing:ease, fill:'backwards'});
    active.add(animation);
    animation.finished.then(() => active.delete(animation), () => active.delete(animation));
  };
  const fade = (element, delay = 0) => animate(element, [{opacity:0, transform:'translateY(12px)'}, {opacity:1, transform:'none'}], delay, 550);
  const chartObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting || played.has(entry.target)) continue;
      const chart = entry.target;
      played.add(chart);
      chartObserver.unobserve(chart);
      const section = chart.closest('.report-finding');
      const items = [...chart.querySelectorAll('[data-chart-item]')];
      chart.dataset.reportAnimated = 'true';
      switch (section.id) {
        case 'emergence':
          items.forEach((item, i) => {
            const bar = item.firstElementChild;
            const height = getComputedStyle(bar).height;
            animate(bar, [{height:'0px', opacity:0}, {height, opacity:1}], i * 90, 800);
            animate(bar.firstElementChild, [{opacity:0}, {opacity:1}], 200 + i * 90, 450);
          });
          break;
        case 'acceleration':
          items.forEach((item, i) => {
            const bar = item.firstElementChild.firstElementChild;
            bar.style.transformOrigin = 'left';
            animate(bar, [{transform:'scaleX(0)'}, {transform:'scaleX(1)'}], i * 120, 750);
            item.querySelectorAll(':scope > span').forEach(span => fade(span, 160 + i * 120));
          });
          break;
        case 'transformation':
          items.forEach((item, i) => animate(item, [{opacity:0, transform:'scale(.4)'}, {opacity:1, transform:'scale(1)'}], i * 7, 350));
          break;
        case 'foundation':
          chart.querySelectorAll('polygon').forEach(polygon => {
            polygon.style.transformBox = 'view-box';
            polygon.style.transformOrigin = 'center';
            animate(polygon, [{opacity:0, transform:'scale(.2)'}, {opacity:1, transform:'scale(1)'}], 0, 850);
          });
          items.forEach((item, i) => animate(item, [{opacity:0}, {opacity:1}], 240 + i * 90, 450));
          break;
        case 'horizon':
          items.forEach((item, i) => {
            const circle = item.querySelector('circle');
            circle.style.transformBox = 'fill-box';
            circle.style.transformOrigin = 'center';
            animate(circle, [{transform:'scale(0)'}, {transform:'scale(1)'}], i * 100, 800);
            item.querySelectorAll('text').forEach(text => animate(text, [{opacity:0}, {opacity:1}], 280 + i * 100, 450));
          });
          break;
      }
    }
  }, {threshold:.15});
  findings.querySelectorAll('.report-finding').forEach(section => {
    const mark = section.querySelector('[data-chart-item]');
    if (mark) chartObserver.observe(mark.closest('svg') || mark.parentElement);
  });
  const proseObserver = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      fade(entry.target);
      proseObserver.unobserve(entry.target);
    }
  }, {threshold:.15});
  findings.querySelectorAll('.report-article-intro,.finding-copy,blockquote,.chart-legend').forEach(element => proseObserver.observe(element));
  const index = document.querySelector('.report-index');
  const visibleSections = new Set();
  const sectionObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) visibleSections.add(entry.target);
      else visibleSections.delete(entry.target);
    }
    const current = [...findings.querySelectorAll('.report-finding')].filter(section => visibleSections.has(section)).at(-1);
    if (!current) return;
    index?.querySelectorAll('a[href^="#"]').forEach(link => {
      if (link.getAttribute('href') === '#' + current.id) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
  }, {rootMargin:`-100px 0px -${Math.max(0, innerHeight - 180)}px 0px`, threshold:0});
  findings.querySelectorAll('.report-finding').forEach(section => sectionObserver.observe(section));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) for (const animation of active) animation.finish();
  });
  window.addEventListener('pagehide', () => {
    for (const animation of active) animation.finish();
  });
})();
