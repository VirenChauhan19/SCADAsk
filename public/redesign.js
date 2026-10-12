// Progressive motion without replacing the original page components.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let motionEnabled = !reduced.matches;
  try {
    const saved = sessionStorage.getItem('scadask-effects');
    if (saved !== null) motionEnabled = saved === 'on';
  } catch { /* Motion remains usable when browser storage is unavailable. */ }
  const toggle = document.createElement('button');
  toggle.className = 'motion-toggle';
  const syncMotion = () => {
    document.documentElement.dataset.motion = motionEnabled ? 'full' : 'paused';
    toggle.textContent = motionEnabled ? 'Pause effects' : 'Enable effects';
    toggle.setAttribute('aria-pressed', String(motionEnabled));
    if (!motionEnabled) document.querySelectorAll('.motion-wait').forEach(e => e.classList.remove('motion-wait'));
  };
  document.body.append(toggle);
  syncMotion();
  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);
  let scrollQueued = false;
  const updateProgress = () => {
    scrollQueued = false;
    const distance = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty('--read-progress', distance > 0 ? scrollY / distance : 0);
  };
  addEventListener('scroll', () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateProgress); }
  }, { passive: true });
  addEventListener('resize', updateProgress);
  const observed = new WeakSet();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.remove('motion-wait');
      observer.unobserve(entry.target);
    }
  }, { threshold: .08 });
  const prepare = () => {
    const hero = document.querySelector('[data-framer-name="Landing"]');
    if (hero && !hero.querySelector('.hero-orbit')) {
      const orbit = document.createElement('div');
      orbit.className = 'hero-orbit'; orbit.setAttribute('aria-hidden', 'true');
      const core = document.createElement('div'); core.className = 'hero-core'; orbit.append(core);
      hero.append(orbit);
    }
    for (const heading of document.querySelectorAll('[data-framer-name="Landing"] h1, [data-framer-name="Landing"] h2')) {
      if (heading.querySelector('.hero-accent') || heading.children.length) continue;
      const value = heading.textContent;
      const match = value.match(/what[’']s next/);
      if (!match) continue;
      const accent = document.createElement('span'); accent.className = 'hero-accent'; accent.textContent = match[0];
      heading.replaceChildren(document.createTextNode(value.slice(0, match.index)), accent, document.createTextNode(value.slice(match.index + match[0].length)));
    }
    if (motionEnabled) {
      const targets = document.querySelectorAll('a:has(> [data-framer-name="CoverImage"]), [data-framer-name="Body"] > div:not([data-framer-name="Landing"]), [data-framer-name="Text + SocialIcons"]');
      let index = 0;
      for (const element of targets) {
        if (observed.has(element)) continue;
        observed.add(element);
        if (element.getBoundingClientRect().top < innerHeight) continue;
        element.style.setProperty('--reveal-delay', `${(index++ % 3) * 70}ms`);
        element.classList.add('motion-reveal', 'motion-wait'); observer.observe(element);
      }
    }
    updateProgress();
  };
  let queued = false;
  const changes = new MutationObserver(() => {
    if (queued) return;
    queued = true; requestAnimationFrame(() => { queued = false; prepare(); });
  });
  prepare(); changes.observe(document.body, { childList: true, subtree: true });
  toggle.addEventListener('click', () => {
    motionEnabled = !motionEnabled;
    try { sessionStorage.setItem('scadask-effects', motionEnabled ? 'on' : 'off'); } catch {}
    syncMotion(); prepare();
  });
  reduced.addEventListener('change', () => {
    motionEnabled = !reduced.matches; syncMotion(); prepare();
  });
})();
