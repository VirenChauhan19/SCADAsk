import {load} from 'cheerio';
import {sourceBlocks,sourcePage,sourceParagraphs,escape,localAsset} from './content-reference.mjs';

export function restorePageContent(name,body,reports){
  const $=load(body);
  if(name==='home'){
    const cover=sourcePage(name).media.find(item=>item.anchor==='./splatgarden');
    if(cover)$('.case-banner img').attr('src',localAsset(cover.src));
  }
  if(name==='research'){
    const paragraphs=sourceParagraphs(name);
    const date=paragraphs.find(text=>text.startsWith('Last Updated'));
    $('.page-intro').append(`<p class="eyebrow">${escape(date)}</p>`);
    $('.report-link[href="/ai-insights-2026"] .report-body p').text(paragraphs.find(text=>text.startsWith('Powered by AI')));
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
  }
  if(name==='splatgarden'){
    const paragraphs=sourceParagraphs(name);
    const exact=prefix=>paragraphs.find(text=>text.startsWith(prefix));
    $('.garden-intro h1').text('SplatGarden');
    $('.garden-intro>p').last().html('A living, collaborative portfolio showcase<br> where the medium is the work');
    $('.garden-tags').html(['Gaussian Splat','Interaction','AI Tools','VAT'].map(tag=>`<span>${tag}</span>`).join(''));
    $('.studio-intro h2').text('SplatGarden turns a portfolio into a place you can stand inside.');
    $('.studio-intro>div').last().html(`<p>${escape(exact('SplatGarden places'))}</p><p>${escape(exact('SplatGarden earns'))}</p>`);
    $('.studio-intro>div').last().append(`<ul class="garden-highlights">${['Explore a real-time',"Discover each artist",'Move freely'].map(prefix=>`<li>${escape(exact(prefix))}</li>`).join('')}</ul>`);
    $('.garden-experience h2').text('Inside the Garden');
    $('.garden-experience>.section-heading').after(`<p class="garden-description">${escape(exact('Every interaction'))}</p>`);
    const films=[
      ['15e4bc40e1c2-2ZOH4zbYzssOJUFkwVPaU4Hrl0.mp4','Navigate freely with a mouse or hand gesture', 'navigate'],
      ['2d970c1c8509-xoRBOMx68gb3vaAgFIqypc1uE.mp4','Touch anywhere in the scene to trigger live effects', 'effects'],
      ['985cf1043203-07s0fJzYMkyJcqYf80k05omEdEU.mp4','Art direct the scene across multiple display modes: Gaussian splat, USD Voxel, point clouds, and painterly styles', 'display-modes'],
      ['2e405feab273-cavpwCkX3uvKStSVkbIFwRFZh0.mp4','Technical breakdown: camera specs and asset credits', 'technical-details']
    ];
    $('.garden-experience').append(`<div class="garden-films-heading"><h3>See it in action</h3><div>Four short demonstrations of what the garden can do.</div></div><div class="garden-gallery">${films.map(([file,caption,poster],index)=>`<article class="garden-card"><div class="garden-media"><video controls playsinline preload="none" width="1920" height="1150" poster="/garden-posters/${poster}.jpg" src="/mirror/${file}" aria-label="${escape(caption)}" aria-describedby="garden-caption-${index}"></video></div><p class="garden-caption" id="garden-caption-${index}"><span class="garden-number" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><span>${escape(caption)}</span></p></article>`).join('')}</div>`);
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
