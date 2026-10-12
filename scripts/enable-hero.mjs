import {readFile,writeFile} from 'node:fs/promises';
import {load} from 'cheerio';
for(const file of ['index.html','public/pages/home.html']){
  const $=load(await readFile(file,'utf8'));
  $('video').attr({autoplay:'',muted:'',loop:'',playsinline:'',preload:'auto'});
  await writeFile(file,$.html());
}
