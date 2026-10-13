import {readFile,writeFile} from 'node:fs/promises';
import {load} from 'cheerio';

// Writes public/ask-answers.json: pre-written answers for the floating Ask chat.
// Run once after content changes. Needs OPENAI_API_KEY in the environment or in .env (ignored by git).
// The key is only used here, on this computer; the published site never calls OpenAI.
const model=process.env.OPENAI_MODEL||'gpt-6-astra';
let key=process.env.OPENAI_API_KEY;
if(!key){try{key=(await readFile('.env','utf8')).match(/^OPENAI_API_KEY=(.+)$/m)?.[1].trim();}catch{}}
if(!key)throw new Error('Set OPENAI_API_KEY or add it to .env');

// Page text, excluding the long legal pages.
const {routes}=JSON.parse(await readFile('source/site-manifest.json','utf8'));
const pages=[];
for(const route of routes){
  if(['/privacy','/terms'].includes(route))continue;
  const name=route==='/'?'home':route.slice(1).replaceAll('/','--');
  const $=load(await readFile(`public/pages/${name}.html`,'utf8'));
  $('script,style,svg,video,.back-link,[aria-hidden=true]').remove();
  $('br').replaceWith(' ');
  // Email links show their address, so answers can give it.
  $('a[href^="mailto:"]').each((i,e)=>{$(e).append(` (${$(e).attr('href').slice(7)})`);});
  $('main *').each((i,e)=>{$(e).append(' ');});
  pages.push({
    id:`p${pages.length+1}`,
    title:$('title').text().replace(/ — SCADask$/,'').trim(),
    url:route,
    pdf:$('.report-hero .button').attr('href'),
    text:$('main').text().replace(/\s+/g,' ').trim()
  });
}
const byId=new Map(pages.map(p=>[p.id,p]));
const pageList=pages.map(p=>`[${p.id}] ${p.title} (${p.url})`).join('\n');

const rules=`You write a FAQ for the SCADask website, the applied research studio at SCAD (Savannah College of Art and Design). Visitors will read these answers in a small chat window.

Rules:
- Use only the page text provided. Never invent findings, numbers, quotes, names, dates, events, or prices.
- Each answer: 2 to 4 short sentences of plain text. No Markdown, no lists, no URLs.
- When the site only summarizes a report, say the full findings are in the report PDF.
- "alternates": 5 to 8 other ways a visitor might phrase the same question, including short and casual ones. The chat covers the whole site, so every question and alternate must name its subject (for example "the luxury report", not "this report" or "the report").
- "keywords": 4 to 10 distinctive words or names a visitor might type.
- "sources": ids of the pages the answer uses, most relevant first (1 to 3). Only use ids from the page list.
- Reply as a JSON object with an "items" array.

All pages:
${pageList}`;

const schema={type:'object',additionalProperties:false,required:['items'],properties:{items:{type:'array',items:{
  type:'object',additionalProperties:false,required:['question','alternates','keywords','answer','sources'],
  properties:{question:{type:'string'},alternates:{type:'array',items:{type:'string'}},keywords:{type:'array',items:{type:'string'}},answer:{type:'string'},sources:{type:'array',items:{type:'string'}}}
}}}};

async function generate(task,context){
  const payload={model,reasoning_effort:'low',max_completion_tokens:16000,
    messages:[{role:'system',content:rules},{role:'user',content:`${task}\n\nPage text:\n${context}`}],
    response_format:{type:'json_schema',json_schema:{name:'scadask_faq',strict:true,schema}}};
  const post=()=>fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(180000)});
  let response=await post();
  if(response.status===400&&/response_format|json_schema/i.test(await response.clone().text())){payload.response_format={type:'json_object'};response=await post();}
  if(!response.ok)throw new Error(`OpenAI ${response.status}: ${(await response.text()).slice(0,300)}`);
  const data=await response.json();
  return JSON.parse(data.choices?.[0]?.message?.content||'{"items":[]}').items||[];
}

const text=p=>`[${p.id}] ${p.title} (${p.url})${p.pdf?` — full report PDF available`:''}\n${p.text}`;
// Questions the chat must answer, including its starter buttons in public/ask.js.
const essentials=['What is SCADask?','What does AI Insights 2026 find?','How was SplatGarden made?','What reports has SCADask published?','Are there any upcoming events?','What is SCADask’s email address?','Is AI replacing designers?'];
const tasks=[
  {name:'essentials',task:`Write one item for each of these exact questions, using the question text as given: ${essentials.map(q=>`"${q}"`).join(', ')}. For the list of reports, name all eight with their season.`,context:pages.map(text).join('\n\n')},
  {task:'Write 8 to 10 questions about SCADask in general: what it is, who is behind it, what it researches, how to work with or commission it, how to get in touch, which reports exist, and how to find research by topic or year.',context:pages.filter(p=>['/','/aboutus','/research','/events','/casestudies','/podcast'].includes(p.url)).map(text).join('\n\n')},
  ...pages.filter(p=>p.url!=='/').map(p=>({
    task:`Write questions visitors might ask that this page answers: ${p.text.length>3000?'6 to 9':'3 to 5'} questions. Cover its main topic, its key points, and when it was published if stated. Sources should usually be ${p.id}.`,
    context:text(p)
  }))
];

// --only=essentials regenerates just that section and merges it into the existing file.
const only=process.argv.find(a=>a.startsWith('--only='))?.slice(7);
const selected=only?tasks.filter(t=>t.name===only):tasks;
if(!selected.length)throw new Error(`No section named ${only}`);
const results=[];
for(let i=0;i<selected.length;i+=4){
  const batch=await Promise.all(selected.slice(i,i+4).map(t=>generate(t.task,t.context)));
  results.push(...batch.flat());
  console.log(`Generated ${Math.min(i+4,selected.length)} of ${selected.length} sections`);
}

const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
// Phrasings that do not name their subject would match questions about every report.
const vague=text=>/\b(?:this|the) (?:report|page)\b|\bthis an? (?:\d{4} )?report\b/i.test(text);
const seen=new Set();const items=[];
// New answers come first, so a regenerated question replaces the older copy.
const previous=only?JSON.parse(await readFile('public/ask-answers.json','utf8')).items.map(i=>({question:i.q,alternates:i.alt,keywords:i.kw,answer:i.a,sources:i.sources.map(s=>pages.find(p=>p.url===s.url)?.id)})):[];
for(const item of [...results,...previous]){
  const question=clean(item.question);const answer=clean(item.answer);
  const norm=question.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  if(!question||!answer||seen.has(norm))continue;
  const sources=[...new Set(item.sources||[])].map(id=>byId.get(id)).filter(Boolean).slice(0,3);
  if(!sources.length)continue;
  seen.add(norm);
  items.push({
    id:`a${items.length+1}`,
    // Name the report so the question still makes sense as a suggestion button.
    q:question.replace(/\b(?:the|this) report\b/i,sources[0].title),
    alt:[...new Set((item.alternates||[]).map(clean).filter(text=>text&&!vague(text)))].slice(0,8),
    kw:[...new Set((item.keywords||[]).map(clean).filter(Boolean))].slice(0,10),
    a:answer,
    sources:sources.map(({title,url,pdf})=>({title,url,...(pdf?{pdf}:{})}))
  });
}
await writeFile('public/ask-answers.json',JSON.stringify({model,generated:new Date().toISOString().slice(0,10),items},null,1)+'\n');
console.log(`Wrote ${items.length} answers to public/ask-answers.json.`);
