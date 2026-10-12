import records from './search-index.json';

const video = document.querySelector('video');
let ticker;

function updateVideo() {
  if (!video) return;
  video.muted = true;
  if (document.hidden) video.pause();
  else video.play().catch(() => { /* Autoplay can be disabled by the browser. */ });
}
updateVideo();
document.addEventListener('visibilitychange', updateVideo);

// Reuse the original vector logos, with an accessible continuous ticker.
const tickerList = document.querySelector('[data-framer-name="Colored Ticker"] ul');
if (tickerList) {
  const originals = [...tickerList.children];
  for (const item of originals) {
    const logo = item.querySelector('[data-framer-name]');
    if (logo) item.setAttribute('aria-label', logo.dataset.framerName.replace(/Logo$/, '').replace(/([a-z])([A-Z])/g, '$1 $2'));
    const copy = item.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    copy.removeAttribute('aria-posinset');
    copy.removeAttribute('aria-setsize');
    tickerList.append(copy);
  }
  tickerList.classList.add('logo-ticker');
  ticker = tickerList;
}

const menuToggles = [...document.querySelectorAll('[data-menu-toggle]')];
function setMenu(toggle, open) {
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  toggle.closest('.framer-3ZT7Z').classList.toggle('menu-open', open);
  const menu = document.getElementById(toggle.getAttribute('aria-controls'));
  menu.inert = !open;
}
for (const toggle of menuToggles) {
  setMenu(toggle, false);
  toggle.addEventListener('click', () => setMenu(toggle, toggle.getAttribute('aria-expanded') !== 'true'));
  toggle.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle.click();
    }
  });
}
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') for (const toggle of menuToggles) setMenu(toggle, false);
});
window.addEventListener('resize', () => {
  for (const toggle of menuToggles) setMenu(toggle, false);
}, { passive: true });

function renderResults(container, query) {
  container.replaceChildren();
  const term = query.trim().toLocaleLowerCase();
  if (!term) {
    const hint = document.createElement('p');
    hint.className = 'search-hint';
    hint.textContent = 'Search research and case studies';
    container.append(hint);
    return;
  }
  const matches = records.filter(record => record.text.toLocaleLowerCase().includes(term));
  const status = document.createElement('p');
  status.className = 'search-hint';
  status.textContent = matches.length ? `${matches.length} result${matches.length === 1 ? '' : 's'}` : 'No results found. Try another search.';
  container.append(status);
  for (const record of matches) {
    const link = document.createElement('a');
    link.href = record.url;
    link.className = 'search-result';
    link.textContent = record.title;
    container.append(link);
  }
}

const desktopSearch = document.querySelector('.desktop-search');
const desktopToggle = document.querySelector('.desktop-search-toggle');
const desktopInput = desktopSearch.querySelector('input');
const desktopResults = document.createElement('div');
desktopResults.className = 'desktop-search-results';
desktopResults.setAttribute('aria-live', 'polite');
desktopSearch.append(desktopResults);
function setDesktopSearch(open) {
  desktopSearch.classList.toggle('search-open', open);
  desktopToggle.setAttribute('aria-expanded', String(open));
  desktopToggle.setAttribute('aria-label', open ? 'Close site search' : 'Open site search');
  desktopInput.tabIndex = open ? 0 : -1;
  if (open) {
    renderResults(desktopResults, desktopInput.value);
    desktopInput.focus();
  }
}
desktopToggle.addEventListener('click', () => setDesktopSearch(!desktopSearch.classList.contains('search-open')));
desktopInput.addEventListener('input', () => renderResults(desktopResults, desktopInput.value));
desktopInput.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    setDesktopSearch(false);
    desktopToggle.focus();
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    desktopResults.querySelector('a')?.focus();
  }
  if (event.key === 'Enter') desktopResults.querySelector('a')?.click();
});
document.addEventListener('click', event => {
  if (!desktopSearch.contains(event.target)) setDesktopSearch(false);
  if (!event.target.closest('nav')) for (const toggle of menuToggles) setMenu(toggle, false);
});

const dialog = document.querySelector('.mobile-search-dialog');
const mobileInput = dialog.querySelector('input');
const mobileResults = dialog.querySelector('.mobile-search-results');
for (const button of document.querySelectorAll('[data-framer-name="Search + Menu"] button')) {
  button.addEventListener('click', () => {
    for (const toggle of menuToggles) setMenu(toggle, false);
    renderResults(mobileResults, mobileInput.value);
    dialog.showModal();
    mobileInput.focus();
  });
}
dialog.querySelector('.close-search').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
mobileInput.addEventListener('input', () => renderResults(mobileResults, mobileInput.value));
mobileInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') mobileResults.querySelector('a')?.click();
});
