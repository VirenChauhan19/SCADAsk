import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';

// Work exclusively from the homepage already captured for this project.
// Only the fonts and media explicitly referenced by that document are copied.
const source = await readFile(new URL('../source/reference.html', import.meta.url), 'utf8');
const $ = load(source);
const assetDirectory = new URL('../public/assets/', import.meta.url);
await mkdir(assetDirectory, { recursive: true });
await mkdir(new URL('../src/styles/', import.meta.url), { recursive: true });

$('script, noscript, link[rel="modulepreload"], meta[name^="framer-"], meta[name="generator"], link[rel="canonical"], meta[property="og:url"]').remove();
$('html').removeAttr('data-redirect-timezone');
$('#main').removeAttr('data-framer-hydrate-v2 data-framer-ssr-released-at data-framer-page-optimized-at data-framer-generated-page');

const assets = new Map();
function localAsset(url) {
  if (!url?.startsWith('https://framerusercontent.com/')) return url;
  if (!assets.has(url)) {
    const parsed = new URL(url);
    const hash = createHash('sha256').update(url).digest('hex').slice(0, 12);
    const name = `${path.basename(parsed.pathname, path.extname(parsed.pathname))}-${hash}${path.extname(parsed.pathname)}`;
    assets.set(url, `/assets/${name}`);
  }
  return assets.get(url);
}

$('img, video, source').each((_, element) => {
  const el = $(element);
  if (el.attr('src')) el.attr('src', localAsset(el.attr('src')));
  if (el.attr('poster')) el.attr('poster', localAsset(el.attr('poster')));
  if (el.attr('srcset')) el.attr('srcset', el.attr('srcset').split(',').map(part => {
    const [url, size] = part.trim().split(/\s+/);
    return `${localAsset(url)} ${size}`;
  }).join(', '));
});
$('link[rel="icon"]').each((_, el) => $(el).attr('href', localAsset($(el).attr('href'))));
$('meta[property="og:image"], meta[name="twitter:image"]').each((_, el) => $(el).attr('content', localAsset($(el).attr('content'))));

let referenceCss = '';
$('style').each((_, element) => {
  referenceCss += $(element).text().replace(/https:\/\/framerusercontent\.com\/[^"')\s]+/g, localAsset) + '\n';
  $(element).remove();
});
await writeFile(new URL('../src/styles/reference.css', import.meta.url), referenceCss);

// Preserve real destinations for pages that were not included in the reference.
$('a[href^="./"]').each((_, element) => {
  const href = $(element).attr('href');
  $(element).attr('href', href === './' ? '/' : new URL(href, 'https://www.scadask.com/').href);
});
$('a[target="_blank"]').attr('rel', 'noopener noreferrer');
$('a[data-framer-name="ScadaskLogo"]').attr('aria-label', 'SCADask home');
$('nav').attr('aria-label', 'Main navigation');
$('[data-framer-name="Body"]').first().attr({ id: 'main-content', role: 'main', tabindex: '-1' });
$('main').each((_, element) => { element.name = 'div'; });
$('.framer-d9k1rz h2').each((_, element) => { element.name = 'h1'; });
$('.framer-xG3dk').attr('role', 'contentinfo');
$('a[href="https://www.scad.edu/"]').attr('aria-label', 'Savannah College of Art and Design');
$('a[href="https://museaward.com/winner-info.php?id=237382"] img').attr('alt', 'MUSE Creative Awards logo');
$('.framer-8urz7m').attr({ id: 'research', 'aria-label': 'Research and publications' });
$('.framer-5lws9r').attr({ id: 'case-studies', 'aria-label': 'Case studies' });
$('video').attr({ autoplay: '', muted: '', preload: 'metadata', 'aria-label': 'SCADask animated background' });

// The reference includes separate responsive variants. Retain their exact CSS.
$('[data-framer-name="Search + Menu"] .framer-arnwd4').each((i, element) => {
  const el = $(element);
  const menu = el.closest('nav').find('[data-framer-name="NavMenu"]');
  menu.attr('id', `mobile-navigation-${i}`);
  el.attr({ role: 'button', 'aria-label': 'Open menu', 'aria-expanded': 'false', 'aria-controls': menu.attr('id'), 'data-menu-toggle': '' });
});

const search = $('[role="search"]');
search.addClass('desktop-search');
search.find('input').attr('tabindex', '-1');
const icon = search.find('svg').parent();
icon.replaceWith(`<button type="button" class="desktop-search-toggle" aria-label="Open site search" aria-expanded="false">${icon.html()}</button>`);

const records = [];
const seen = new Set();
$('.framer-1c4tp48 a[href], .framer-6xgjmy a[href]').each((_, element) => {
  const el = $(element);
  const href = el.attr('href');
  const heading = el.find('h2,h3,h4').first().text().trim();
  if (!heading || seen.has(href)) return;
  seen.add(href);
  records.push({ title: heading, url: href, text: el.find('h2,h3,h4,p').map((_, child) => $(child).text().trim()).get().join(' ') });
});
await writeFile(new URL('../src/search-index.json', import.meta.url), JSON.stringify(records, null, 2) + '\n');

$('body').prepend('<a class="skip-link" href="#main-content">Skip to content</a>');
$('head').append('<link rel="stylesheet" href="/src/styles/reference.css"><link rel="stylesheet" href="/src/styles/interactions.css">');
$('body').append(`
<dialog class="mobile-search-dialog" aria-labelledby="search-dialog-title">
  <div class="search-dialog-header">
    <h2 id="search-dialog-title">Search SCADask</h2>
    <button type="button" class="close-search" aria-label="Close search">&#215;</button>
  </div>
  <input type="search" class="mobile-search-input" aria-label="Search site" placeholder="Search..." autocomplete="off">
  <div class="mobile-search-results" aria-live="polite"></div>
</dialog>
<script type="module" src="/src/main.js"></script>`);

// Remove obsolete hydration comments without changing any visible content.
const html = $.html().replace(/<!--[^]*?-->/g, '');
await writeFile(new URL('../index.html', import.meta.url), html);

const queue = [...assets.entries()];
let completed = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (queue.length) {
    const [url, local] = queue.shift();
    // Public URLs resolve under public/assets on disk.
    const diskPath = new URL(`../public${local}`, import.meta.url);
    try { await access(diskPath); } catch {
      const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
      if (!response.ok) throw new Error(`Asset ${url}: HTTP ${response.status}`);
      await writeFile(diskPath, Buffer.from(await response.arrayBuffer()));
    }
    completed++;
    if (completed % 20 === 0 || completed === assets.size) console.log(`Saved ${completed}/${assets.size} reference assets`);
  }
}));
await writeFile(new URL('../source/asset-manifest.json', import.meta.url), JSON.stringify(Object.fromEntries(assets), null, 2) + '\n');
console.log(`Prepared homepage with ${records.length} searchable publications and ${assets.size} local assets.`);
