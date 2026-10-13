import {load} from 'cheerio';

const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

// Keep the original survey graphics and their captions, rather than flattening
// the article into paragraphs. SSR graphics start hidden until Framer hydrates;
// remove those animation states so this static site works without that runtime.
export function aiReportArticle(source) {
  const $ = load(source('.aii-root').first().html() || '');
  const intro = $('main > div > header').first().clone();
  const sections = $('section[id]').toArray();
  if (sections.length !== 5 || !intro.length) throw new Error('AI report source is missing its five findings');
  intro.find('h1').each((i,node)=>{node.tagName='h2';});
  intro.addClass('report-article-intro');
  const index = sections.map(node=>{
    const section=$(node);
    return `<a href="#${escape(section.attr('id'))}">${escape(section.find('b').first().text())}</a>`;
  }).join('');
  const body = sections.map(node=>{
    const section=$(node).clone().addClass('report-finding');
    section.children().first().addClass('finding-copy');
    section.children().eq(1).addClass('finding-graphics');
    const chartItems=section.find('[data-chart-item]');
    chartItems.each((i,item)=>{
      let label=$(item).attr('aria-label') || $(item).find('span,text').map((j,e)=>$(e).text()).get().filter(Boolean).join(' ');
      // These two bubble labels live in the captured Framer module's dataset:
      // aeacb3b79115-ujotM6lxoILAj1Qc_me1L7eyE9gI5gtoVV6RLHIHKro.4azaArVP.mjs.
      if(section.attr('id')==='horizon' && label==='15%')label='15% Creative AI Co-authorship';
      if(section.attr('id')==='horizon' && label==='8%')label='8% Other';
      if(label) $(item).attr('aria-label',label).attr('title',label);
      // Local chart animation does not require the original Framer tooltip.
      $(item).removeAttr('tabindex');
    });
    if(section.attr('id')==='emergence') {
      const legend=chartItems.map((i,item)=>`<li>${escape($(item).attr('aria-label'))}</li>`).get().join('');
      chartItems.first().parent().after(`<ul class="chart-legend" aria-label="Efficiency gains chart values">${legend}</ul>`);
    }
    if(section.attr('id')==='acceleration') {
      chartItems.addClass('creative-output-row').each((i,item)=>{
        const value=$(item).children('span').first().text().trim();
        if(!/^\d+%$/.test(value))throw new Error('Missing creative output chart percentage');
        $(item).children('div').first().attr('style',`width:${value};min-width:0`);
      });
    }
    if(section.attr('id')==='transformation') {
      chartItems.first().parent().attr('role','img').attr('aria-label','63 of 100 practitioners define AI success primarily as time saved');
      chartItems.attr('aria-hidden','true');
    }
    section.find('svg[role="img"]').each((i,svg)=>{
      // A persistent text key makes every SVG value readable on small screens.
      const values=$(svg).find('[data-chart-item]').map((j,item)=>$(item).attr('aria-label')).get();
      $(svg).after(`<ul class="chart-legend" aria-label="Chart values">${values.map(value=>`<li>${escape(value)}</li>`).join('')}</ul>`);
    });
    return section.toString();
  }).join('');
  const clean=load(intro.toString()+body);
  clean('script,style').remove();
  clean('[style]').each((i,node)=>{
    // Keep the source's geometry/colors; reveal all static marks and text.
    const style=(clean(node).attr('style') || '').split(';').filter(rule=>!/^\s*(?:opacity|transform|transition|cursor)\s*:/.test(rule)).join(';');
    clean(node).attr('style',style);
  });
  return `<div class="report-article wrap"><aside class="report-index"><p class="eyebrow">IN THIS REPORT</p><nav aria-label="Report sections">${index}</nav><p class="report-data-source">Source: SCADask AI Insights 2026. Survey of 100+ leaders across design, technology, and enterprise.</p></aside><article class="report-findings">${clean('body').html()}</article></div>`;
}

