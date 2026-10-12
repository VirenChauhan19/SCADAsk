import {cp,mkdir,readFile,writeFile,readdir,rm} from 'node:fs/promises';
const base=(process.env.SITE_BASE_PATH||'').replace(/\/$/,'');
if(base && !/^\/[\w-]+(?:\/[\w-]+)*$/.test(base))throw new Error('Invalid SITE_BASE_PATH');
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
await cp('public','dist',{recursive:true});
const {routes}=JSON.parse(await readFile('source/site-manifest.json','utf8'));
for(const route of routes){
  const name=route==='/'?'home':route.slice(1).replaceAll('/','--');
  const html=await readFile(`public/pages/${name}.html`,'utf8');
  if(route==='/')await writeFile('dist/index.html',html);
  else{
    await mkdir(`dist${route}`,{recursive:true});
    await writeFile(`dist${route}/index.html`,html);
    await writeFile(`dist${route}.html`,html);
  }
}
// Project Pages serves under /repository/, including nested routes and search URLs.
if(base){
  async function rewrite(directory){
    for(const entry of await readdir(directory,{withFileTypes:true})){
      const path=`${directory}/${entry.name}`;
      if(entry.isDirectory()){
        if(!['mirror','assets'].includes(entry.name))await rewrite(path);
      }else if(/\.(html|css|js|json)$/.test(entry.name)){
        const content=await readFile(path,'utf8');
        const updated=content.replace(/(["'`])\/(?!\/)/g,`$1${base}/`)
          .replace(/url\(\/(?!\/)/g,`url(${base}/`);
        await writeFile(path,updated);
      }
    }
  }
  await rewrite('dist');
}
await writeFile('dist/.nojekyll','');
console.log(`Built ${routes.length} editorial pages with local styles, scripts, and assets${base?` at ${base}/`:''}.`);
