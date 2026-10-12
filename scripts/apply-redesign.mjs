import { readFile, writeFile } from 'node:fs/promises';
const { routes } = JSON.parse(await readFile('source/site-manifest.json', 'utf8'));
for (const route of routes) {
  const name = route === '/' ? 'home' : route.slice(1).replaceAll('/', '--');
  const path = `public/pages/${name}.html`;
  let html = await readFile(path, 'utf8');
  if (!html.includes('href="/redesign.css"')) {
    html = html.replace('</head>', '<link rel="stylesheet" href="/redesign.css"></head>');
  }
  if (!html.includes('src="/redesign.js"')) html = html.replace('</body>', '<script defer src="/redesign.js"></script></body>');
  if (name === 'splatgarden' && !html.includes('src="/garden.js"')) html = html.replace('</body>', '<script defer src="/garden.js"></script></body>');
  await writeFile(path, html);
}
console.log(`Applied shared redesign to ${routes.length} pages.`);
