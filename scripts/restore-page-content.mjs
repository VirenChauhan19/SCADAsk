import {load} from 'cheerio';
import {sourceBlocks,sourcePage,sourceParagraphs,escape,localAsset} from './content-reference.mjs';

export function restorePageContent(name,body,reports){
  const $=load(body);
  if(name==='home'){
    const film=sourcePage(name).media.find(item=>item.tag==='video');
    if(film)$('.home-hero').after(`<section class="wrap home-original-film" aria-label="SCADask overview"><video controls muted loop playsinline preload="none" src="${escape(localAsset(film.src))}" poster="${reports[0].image}" aria-label="Original SCADask research overview film"></video></section>`);
    const cover=sourcePage(name).media.find(item=>item.anchor==='./splatgarden');
    if(cover)$('.case-banner img').attr('src',localAsset(cover.src));
  }
  if(name==='aboutus'){
    const portrait=sourcePage(name).media.find(item=>item.context.includes('Summary'));
    if(portrait)$('.about-title').append(`<figure class="about-source-art"><img src="${escape(localAsset(portrait.src))}" alt="SCADask studio artwork" width="2800" height="3500" loading="lazy"></figure>`);
  }
  if(name==='research'){
    const paragraphs=sourceParagraphs(name);
    const date=paragraphs.find(text=>text.startsWith('Last Updated'));
    const description=paragraphs.find(text=>text.startsWith('Powered by AI'));
    const cover=sourcePage(name).media.find(item=>item.anchor==='./ai-insights-2026');
    $('.library').before(`<section class="wrap library-feature"><div><p class="eyebrow">${escape(date)}</p><h2>AI Insights 2026</h2><p>${escape(description)}</p><a class="text-link" href="/ai-insights-2026">Explore the report ↗</a></div><a href="/ai-insights-2026" aria-label="Explore AI Insights 2026"><img src="${cover?localAsset(cover.src):reports[0].image}" alt="AI Insights 2026 report artwork" width="800" height="450"></a></section>`);
  }
  if(name==='casestudies'){
    $('.case-copy p').last().text(sourceParagraphs(name)[0]);
    const cover=sourcePage(name).media.find(item=>item.anchor==='./splatgarden');
    if(cover)$('.case-banner img').attr('src',localAsset(cover.src));
  }
  if(name==='podcast')$('.podcast-platforms a').each((index,link)=>{
    const icon=sourcePage(name).media.find(item=>item.anchor===$(link).attr('href'));
    if(icon)$(link).prepend(`<img class="platform-mark" src="${escape(localAsset(icon.src))}" alt="" width="24" height="24" loading="lazy">`);
  });
  if(name==='events'){
    const desktop=sourcePage(name).media.find(item=>item.context.includes('Desktop') && item.anchor.includes('qs.com'));
    if(desktop)$('.event-visual img').attr('src',localAsset(desktop.src));
    const banner=sourcePage(name).media.find(item=>item.context.includes('Variant 2') && item.anchor.includes('qs.com'));
    if(banner)$('.event-story').prepend(`<img class="event-original-banner" src="${escape(localAsset(banner.src))}" alt="QS Back to School Summit" width="2048" height="585" loading="lazy">`);
  }
  if(name==='splatgarden'){
    const paragraphs=sourceParagraphs(name);
    const exact=prefix=>paragraphs.find(text=>text.startsWith(prefix));
    $('.garden-intro h1').text('SplatGarden');
    $('.garden-intro>p').last().html('A living, collaborative portfolio showcase<br> where the medium is the work');
    $('.garden-tags').html(['Gaussian Splat','Interaction','AI Tools','VAT'].map(tag=>`<span>${tag}</span>`).join(''));
    const hero=sourcePage(name).media.find(item=>item.tag==='video' && item.context.includes('Hero'));
    const poster=sourcePage(name).media.find(item=>item.tag==='img' && item.context.includes('Hero'));
    if(hero)$('.garden-intro').append(`<figure class="garden-overview-film"><video controls playsinline preload="none" src="${escape(localAsset(hero.src))}"${poster?` poster="${escape(localAsset(poster.src))}"`:''} aria-label="SplatGarden scene overview"></video></figure>`);
    const tools=sourcePage(name).media.filter(item=>item.context.includes('Company'));
    $('.garden-intro').after(`<section class="wrap garden-tools" aria-label="Production tools">${tools.map(item=>`<img src="${escape(localAsset(item.src))}" alt="${escape(item.alt || item.context[0].replace(/_Logo.*| 1$/g,''))}" loading="lazy">`).join('')}</section>`);
    const lichtfeld=tools.find(item=>item.context[0].includes('Lichtfeld'));
    if(lichtfeld)$('.garden-tools').append('<span class="tool-name">Lichtfeld Studio</span>');
    $('.studio-intro h2').text('SplatGarden turns a portfolio into a place you can stand inside.');
    $('.studio-intro>div').last().html(`<p>${escape(exact('SplatGarden places'))}</p><p>${escape(exact('SplatGarden earns'))}</p>`);
    const benefits=`<section class="wrap garden-benefits"><article><h3>No installation, no reel</h3><p>${escape(exact('Explore a real-time'))}</p><p class="eyebrow">Opens in a browser</p></article><article><h3>Work in context</h3><p>${escape(exact("Discover each artist"))}</p></article><article><h3>Interactive by design</h3><p>${escape(exact('Move freely'))}</p></article></section>`;
    $('.studio-intro').after(benefits);
    $('.garden-experience h2').text('Inside the Garden');
    $('.garden-experience>.section-heading').after(`<p class="garden-description">${escape(exact('Every interaction'))}</p>`);
    const films=[
      ['15e4bc40e1c2-2ZOH4zbYzssOJUFkwVPaU4Hrl0.mp4','Navigate freely with a mouse or hand gesture'],
      ['2d970c1c8509-xoRBOMx68gb3vaAgFIqypc1uE.mp4','Touch anywhere in the scene to trigger live effects'],
      ['985cf1043203-07s0fJzYMkyJcqYf80k05omEdEU.mp4','Art direct the scene across multiple display modes: Gaussian splat, USD Voxel, point clouds, and painterly styles'],
      ['2e405feab273-cavpwCkX3uvKStSVkbIFwRFZh0.mp4','Technical breakdown: camera specs and asset credits']
    ];
    $('.garden-experience').append(`<div class="garden-films-heading"><h3>See it in action</h3><div>Four short demonstrations of what the garden can do.</div></div><div class="garden-gallery">${films.map(([file,caption],index)=>`<article class="garden-card"><div class="garden-media"><video controls playsinline preload="none" src="/mirror/${file}" aria-label="${escape(caption)}" aria-describedby="garden-caption-${index}"></video></div><p class="garden-caption" id="garden-caption-${index}">${escape(caption)}</p><span class="garden-number" aria-hidden="true">${String(index+1).padStart(2,'0')}</span></article>`).join('')}</div>`);
    // Production copy and credits are already recovered from the original
    // component captures. Preserve their technical language, images and films.
    $('.making-section').attr('data-source-section','production');
  }
  return $('body').html();
}

export function legalContent(name){
  let firstHeading=true;let listOpen=false;
  const blocks=[];
  for(const block of sourceBlocks(name)){
    if(block.tag==='label')continue;
    if(block.tag==='li'){
      if(!listOpen){blocks.push('<ul>');listOpen=true;}
      blocks.push(`<li>${block.html || escape(block.text)}</li>`);continue;
    }
    if(listOpen){blocks.push('</ul>');listOpen=false;}
    let tag=block.tag;
    if(/^h/.test(tag)){tag=firstHeading?'h1':tag;firstHeading=false;}
    blocks.push(`<${tag}>${block.html || escape(block.text)}</${tag}>`);
  }
  if(listOpen)blocks.push('</ul>');
  return blocks.join('').replaceAll('&nbsp;',' ').replaceAll('\u00a0',' ');
}
