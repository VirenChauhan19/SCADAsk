import {defineConfig} from 'vite';
import {readFile} from 'node:fs/promises';
export default defineConfig({plugins:[{
  name:'captured-pages',
  configureServer(server){server.middlewares.use(async(req,res,next)=>{
    const route=(req.url||'/').split('?')[0].replace(/\/$/,'')||'/';
    if(route.includes('.')||route.startsWith('/@')||route.startsWith('/src/')||route.startsWith('/mirror/'))return next();
    try{
      const name=route==='/'?'home':route.slice(1).replaceAll('/','--');
      const html=await readFile(`public/pages/${name}.html`,'utf8');
      res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);
    }catch{next();}
  });}
}]});
