import {readFile,writeFile,mkdir,readdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {pages}=JSON.parse(await readFile('source/content-reference.json','utf8'));
const manifest=JSON.parse(await readFile('source/site-manifest.json','utf8'));
const hash=buffer=>createHash('sha256').update(buffer).digest('hex');
const originals=new Map(Object.values(pages).flatMap(page=>page.media).map(item=>[item.src.split('?')[0],item]));
const brandHashes=new Map();
async function brands(directory){
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const path=directory+'/'+entry.name;
    if(entry.isDirectory())await brands(path);
    else if(/\.(png|jpg|jpeg|svg)$/.test(path))brandHashes.set(hash(await readFile(path)),'/'+path.replace(/^public\//,''));
  }
}
await brands('public/brand');
await mkdir('public/original-media',{recursive:true});
const assets={};
for(const [base,item] of originals){
  if(item.tag==='audio'){assets[base]=item.src;continue;}
  const mirrored=Object.entries(manifest.assets).find(([remote])=>remote.split('?')[0]===base)?.[1];
  if(mirrored){try{const bytes=await readFile('public'+mirrored);if(bytes.length){assets[base]=brandHashes.get(hash(bytes)) || mirrored;continue;}}catch{}}
  const filename=new URL(base).pathname.split('/').at(-1);
  const file='public/original-media/'+filename;
  let bytes;
  try{bytes=await readFile(file);}catch{
    const response=await fetch(base,{signal:AbortSignal.timeout(45000)});
    if(!response.ok)throw new Error(`Media HTTP ${response.status}: ${base}`);
    // Large video files stream from the same official source as the original.
    if(item.tag==='video' && Number(response.headers.get('content-length'))>20000000){await response.body.cancel();assets[base]=base;continue;}
    bytes=Buffer.from(await response.arrayBuffer());
  }
  const identical=brandHashes.get(hash(bytes));
  if(identical)assets[base]=identical;
  else{await writeFile(file,bytes);assets[base]='/original-media/'+filename;}
  console.log(`${filename}: ${assets[base]}`);
}
await writeFile('source/content-media-map.json',JSON.stringify(assets,null,2)+'\n');
