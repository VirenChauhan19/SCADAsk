// Shared motion for the editorial site. Content stays visible without this file.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const root = document.documentElement;
  const running = new Set();
  const prepared = new WeakSet();
  const detailsCleanup = new Set();
  const ease = 'cubic-bezier(.22,1,.36,1)';
  let observer;
  let override = null;
  try { const saved = sessionStorage.getItem('scadask-motion'); if (saved === 'full' || saved === 'reduced') override = saved; } catch {}
  const allowed = () => override ? override === 'full' : !reduced.matches;
  const enabled = () => allowed() && !document.hidden;

  function animate(element, frames, options = {}) {
    if (!element || !enabled() || !element.animate) return null;
    const animation = element.animate(frames, {duration: 650, easing: ease, fill: 'backwards', ...options});
    running.add(animation);
    animation.finished.then(() => running.delete(animation), () => running.delete(animation));
    return animation;
  }

  function reveal(element) {
    element.classList.remove('motion-pending');
    element.classList.add('motion-visible');
    observer?.unobserve(element);
  }

  function watch(element, delay = 0) {
    if (prepared.has(element) || element.hidden || element.closest('details:not([open])')) return;
    if (!enabled()) return;
    prepared.add(element);
    element.style.setProperty('--reveal-delay', `${delay}ms`);
    element.classList.add('motion-reveal');
    const box = element.getBoundingClientRect();
    if (box.top < innerHeight - 25 && box.bottom > 0) {
      animate(element, [{opacity: 0, transform: 'translateY(18px)'}, {opacity: 1, transform: 'translateY(0)'}], {delay, duration: 620});
      element.classList.add('motion-visible');
    } else if (box.bottom > 0 && observer) {
      element.classList.add('motion-pending');
      observer.observe(element);
    }
  }

  function makeObserver() {
    observer?.disconnect();
    if (!enabled() || !('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) reveal(entry.target);
    }, {threshold: .04, rootMargin: '0px 0px -24px 0px'});
  }

  function headingEntrance() {
    const heading = document.querySelector('main h1');
    if (!heading || !enabled()) return;
    if (heading.classList.contains('motion-heading')) return;
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    let index = 0;
    for (const node of nodes) {
      const fragment = document.createDocumentFragment();
      for (const word of node.textContent.split(/(\s+)/)) {
        if (!word.trim()) { fragment.append(document.createTextNode(word)); continue; }
        const span = document.createElement('span');
        span.className = 'heading-token'; span.textContent = word;
        fragment.append(span);
        animate(span, [{opacity: 0, transform: 'translateY(20px)'}, {opacity: 1, transform: 'translateY(0)'}], {delay: 60 + index++ * 45, duration: 700});
      }
      node.replaceWith(fragment);
    }
    heading.classList.add('motion-heading');
  }

  function prepare(scope = document) {
    const selector = [
      '.hero-copy > .eyebrow', '.hero-description', '.hero-actions', '.hero-note', '.hero-feature',
      '.page-intro > .eyebrow', '.page-intro > p:not(.eyebrow)', '.garden-tags',
      '.section-heading', '.topics-intro', '.topic', '.report-card', '.case-banner',
      '.studio-intro > div', '.about-statement', '.service-grid > article', '.event-card', '.event-followup',
      '.report-hero-grid > div', '.report-overview > div', '.article-prose > h2', '.article-prose > blockquote',
      '.footer-top > div', '.footer-links', '.garden-studio', '.garden-films-heading', '.garden-card',
      '.making-section > .eyebrow', '.making-section > h2'
    ].join(',');
    scope.querySelectorAll(selector).forEach(element => {
      const siblings = [...element.parentElement.children];
      const stagger = element.matches('.topic,.report-card,.service-grid > article,.garden-card') ? (siblings.indexOf(element) % 4) * 60 : 0;
      const introDelay = element.matches('.hero-description') ? 180 : element.matches('.hero-actions') ? 260 : element.matches('.hero-note') ? 320 : element.matches('.hero-feature') ? 120 : 0;
      watch(element, stagger + introDelay);
    });
    scope.querySelectorAll('.making-section details').forEach(prepareDetails);
  }

  function prepareDetails(details) {
    if (prepared.has(details)) return;
    prepared.add(details);
    const summary = details.querySelector('summary');
    const content = details.querySelector('.making-content');
    if (!summary || !content) return;
    let intent = details.open;
    let current;
    summary.addEventListener('click', event => {
      if (!enabled()) { intent = !details.open; return; }
      event.preventDefault();
      const from = details.open ? content.getBoundingClientRect().height : 0;
      const fromPadding = details.open ? getComputedStyle(content).paddingBottom : '0px';
      current?.cancel();
      intent = !intent;
      details.open = true;
      details.dataset.expanded = String(intent);
      const to = intent ? content.scrollHeight : 0;
      const toPadding = intent ? getComputedStyle(content).paddingBottom : '0px';
      content.classList.add('details-animating');
      const animation = animate(content, [{height: `${from}px`, paddingBottom: fromPadding, opacity: from ? 1 : 0}, {height: `${to}px`, paddingBottom: toPadding, opacity: intent ? 1 : 0}], {duration: 420, fill: 'both'});
      current = animation;
      if (!animation) { details.open = intent; content.classList.remove('details-animating'); delete details.dataset.expanded; return; }
      animation.finished.then(() => {
        if (current !== animation) return;
        details.open = intent;
        current = null;
        animation.cancel();
        content.classList.remove('details-animating');
        delete details.dataset.expanded;
      }, () => {});
    });
    detailsCleanup.add(() => { current?.cancel(); current = null; details.open = intent; content.classList.remove('details-animating'); delete details.dataset.expanded; });
  }

  function animateItems(container, selector = ':scope > *') {
    if (!container || !enabled()) return;
    container.querySelectorAll(selector).forEach((element, index) => {
      element.getAnimations().forEach(animation => animation.cancel());
      animate(element, [{opacity: 0, transform: 'translateY(12px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 400, delay: Math.min(index, 6) * 35});
    });
  }

  function change(mutate) {
    if (!enabled()) { mutate(); return; }
    const grid = document.querySelector('.library-grid');
    const before = new Map();
    grid?.querySelectorAll('.report-card:not([hidden])').forEach(card => before.set(card, card.getBoundingClientRect()));
    // Commit the filters immediately. Only the visual positions are animated.
    mutate();
    grid?.querySelectorAll('.report-card:not([hidden])').forEach((card, index) => {
      const previous = before.get(card);
      card.getAnimations().forEach(animation => animation.cancel());
      reveal(card); card.classList.remove('motion-reveal');
      const next = card.getBoundingClientRect();
      const x = previous ? previous.left - next.left : 0;
      const y = previous ? previous.top - next.top : 15;
      animate(card, [{opacity: previous ? 1 : 0, transform: `translate(${x}px, ${y}px) scale(${previous ? 1 : .985})`}, {opacity: 1, transform: 'translate(0, 0) scale(1)'}], {duration: 450, delay: previous ? 0 : Math.min(index, 5) * 45});
    });
    const empty = document.querySelector('.empty-state:not([hidden])');
    if (empty) animate(empty, [{opacity: 0, transform: 'translateY(12px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 400});
  }

  // Shared interactions dispatch these events after their content changes.
  window.scadaskMotion = {change, animateItems};
  document.addEventListener('scadask:results', event => animateItems(event.detail));
  document.addEventListener('scadask:panel', event => animateItems(event.detail));
  document.addEventListener('scadask:ready', event => prepare(event.detail));
  document.addEventListener('focusin', event => {
    for (let parent = event.target; parent && parent !== document; parent = parent.parentElement) {
      if (parent.classList?.contains('motion-pending')) reveal(parent);
    }
  });

  // Subtle pointer tilt applies only to the featured artwork, on desktop.
  const feature = document.querySelector('.hero-feature');
  if (feature) {
    let pointerFrame;
    feature.addEventListener('pointermove', event => {
      if (!enabled() || !finePointer.matches) return;
      const x = event.clientX; const y = event.clientY;
      cancelAnimationFrame(pointerFrame);
      pointerFrame = requestAnimationFrame(() => {
        const box = feature.getBoundingClientRect();
        const horizontal = Math.max(-.5, Math.min(.5, (x - box.left) / box.width - .5));
        const vertical = Math.max(-.5, Math.min(.5, (y - box.top) / box.height - .5));
        feature.style.setProperty('--tilt-x', `${-vertical * 2}deg`);
        feature.style.setProperty('--tilt-y', `${horizontal * 3}deg`);
        feature.style.setProperty('--light-x', `${(horizontal + .5) * 100}%`);
        feature.style.setProperty('--light-y', `${(vertical + .5) * 100}%`);
      });
    });
    feature.addEventListener('pointerleave', () => {
      cancelAnimationFrame(pointerFrame);
      feature.style.removeProperty('--tilt-x'); feature.style.removeProperty('--tilt-y');
    });
  }

  // One passive scroll listener and one animation frame; no scroll hijacking.
  const header = document.querySelector('.site-header');
  const progress = document.createElement('div');
  progress.className = 'motion-progress'; progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);
  const hero = document.querySelector('.home-hero');
  let scrollFrame = 0;
  function updateScroll() {
    scrollFrame = 0;
    header.classList.toggle('is-scrolled', scrollY > 20);
    const range = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${range > 0 ? Math.min(1, scrollY / range) : 0})`;
    if (hero && enabled() && finePointer.matches && scrollY < innerHeight) {
      hero.style.setProperty('--art-parallax', `${Math.min(scrollY * .055, 28)}px`);
    }
  }
  const queueScroll = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll); };
  addEventListener('scroll', queueScroll, {passive: true});
  addEventListener('resize', queueScroll, {passive: true});
  addEventListener('pageshow', () => { document.querySelectorAll('.motion-pending').forEach(element => { if (element.getBoundingClientRect().top < innerHeight) reveal(element); }); queueScroll(); });

  function stopMotion() {
    observer?.disconnect();
    running.forEach(animation => animation.cancel());
    running.clear();
    detailsCleanup.forEach(cleanup => cleanup());
    document.querySelectorAll('.motion-pending').forEach(reveal);
    if (feature) { feature.style.removeProperty('--tilt-x'); feature.style.removeProperty('--tilt-y'); }
    hero?.style.removeProperty('--art-parallax');
  }
  const toggle = document.querySelector('.motion-toggle');
  const stylesheet = document.querySelector('link[href="/motion.css"]');
  function syncMotion() {
    root.dataset.motion = allowed() ? 'full' : 'reduced';
    document.querySelector('#page-transitions').media = allowed() ? 'all' : 'not all';
    if (stylesheet) stylesheet.media = allowed() ? 'all' : 'not all';
    if (toggle) {
      toggle.hidden = false;
      toggle.setAttribute('aria-pressed', String(allowed()));
      const label = allowed() ? 'Pause animations' : 'Play animations';
      toggle.setAttribute('aria-label', label); toggle.title = label;
    }
    if (!allowed()) stopMotion();
    else { makeObserver(); headingEntrance(); prepare(); queueScroll(); }
  }
  toggle?.addEventListener('click', () => {
    override = allowed() ? 'reduced' : 'full';
    try { sessionStorage.setItem('scadask-motion', override); } catch {}
    syncMotion();
  });
  reduced.addEventListener('change', syncMotion);
  document.addEventListener('visibilitychange', () => {
    root.classList.toggle('motion-idle', document.hidden);
    if (document.hidden) running.forEach(animation => animation.finish());
    else { if (!observer) makeObserver(); headingEntrance(); prepare(); queueScroll(); }
  });

  syncMotion();
  updateScroll();
})();
