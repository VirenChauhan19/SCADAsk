import {cp,mkdir,readFile,writeFile} from 'node:fs/promises';
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
console.log(`Built ${routes.length} editorial pages with local styles, scripts, and assets.`);
