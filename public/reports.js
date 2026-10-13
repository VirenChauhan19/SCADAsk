// Final chart geometry and data are always in HTML. Animation is enhancement.
(() => {
  const findings=document.querySelector('.report-findings');
  if(!findings || !('IntersectionObserver' in window) || !Element.prototype.animate)return;
  const reduced=()=>document.documentElement.dataset.motion==='reduced';
  const active=new Set(),counters=new Map(),played=new WeakSet();
  const settle='cubic-bezier(.16,1,.3,1)';
  const animate=(element,frames,delay=0,duration=800,easing=settle)=>{
    if(!element || document.hidden || reduced())return;
    const motion=element.animate(frames,{duration,delay,easing,fill:'backwards'});
    active.add(motion);
    motion.finished.then(()=>active.delete(motion),()=>active.delete(motion));
    return motion;
  };
  const fade=(element,delay=0)=>animate(element,[{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'none'}],delay,650);
  const count=element=>{
    if(document.hidden || reduced())return;
    const value=Number(element.dataset.reportCount),start=performance.now();
    element.textContent='0';
    const tick=now=>{
      const progress=Math.min(1,(now-start)/1100);
      element.textContent=String(Math.round(value*(1-Math.pow(1-progress,3))));
      if(progress<1)counters.set(element,requestAnimationFrame(tick));
      else {element.textContent=String(value);counters.delete(element);}
    };
    counters.set(element,requestAnimationFrame(tick));
  };
  const finish=()=>{
    for(const motion of active)motion.finish();
    for(const [element,frame] of counters){cancelAnimationFrame(frame);element.textContent=element.dataset.reportCount;}
    counters.clear();
  };
  const draw=chart=>{
    const section=chart.closest('.report-finding');
    const items=[...chart.querySelectorAll('[data-chart-item]')];
    chart.dataset.reportAnimated='true';
    switch(section.id){
      case 'emergence':
        items.forEach((item,i)=>{
          const bar=item.firstElementChild;
          // Clip reveals preserve both the final layout and readable labels.
          animate(bar,[{clipPath:'inset(100% 0 0 0)'},{clipPath:'inset(0% 0 0 0)'}],i*100,1050);
          fade(bar.firstElementChild,220+i*100);
        });
        break;
      case 'acceleration':
        items.forEach((item,i)=>{
          const bar=item.firstElementChild.firstElementChild;
          bar.style.transformOrigin='left';
          animate(bar,[{transform:'scaleX(0)',opacity:.3},{transform:'scaleX(1)',opacity:1}],i*90,950);
          item.querySelectorAll(':scope > span').forEach(span=>fade(span,180+i*90));
        });
        break;
      case 'transformation':
        items.forEach((item,i)=>{
          const row=Math.floor(i/10),column=i%10;
          animate(item,[{opacity:0,transform:'scale(.25) rotate(-8deg)'},{opacity:1,transform:'scale(1) rotate(0deg)'}],(row+column)*40,600);
        });
        break;
      case 'foundation':
        // The reference grid stays steady as the data profile expands.
        chart.querySelectorAll('polygon').forEach(polygon=>{
          if(!polygon.closest('[data-chart-item]') && polygon.getAttribute('fill')!=='none'){
            polygon.style.transformBox='view-box';polygon.style.transformOrigin='center';
            animate(polygon,[{opacity:0,transform:'scale(.12)'},{opacity:1,transform:'scale(1)'}],100,1100);
          }
        });
        items.forEach((item,i)=>{
          const point=item.querySelector('circle');
          if(point){point.style.transformBox='fill-box';point.style.transformOrigin='center';animate(point,[{transform:'scale(0)'},{transform:'scale(1)'}],380+i*85,650);}
          item.querySelectorAll('text').forEach(text=>animate(text,[{opacity:0},{opacity:1}],320+i*85,550));
        });
        break;
      case 'horizon':
        items.forEach((item,i)=>{
          const circle=item.querySelector('circle');
          circle.style.transformBox='fill-box';circle.style.transformOrigin='center';
          animate(circle,[{transform:'translateY(24px) scale(.05)',opacity:0},{transform:'translateY(-3px) scale(1.015)',opacity:1,offset:.78},{transform:'translateY(0) scale(1)',opacity:1}],i*95,1100,'cubic-bezier(.22,.8,.3,1)');
          item.querySelectorAll('text').forEach(text=>animate(text,[{opacity:0},{opacity:1}],360+i*95,500));
        });
        break;
    }
    section.querySelectorAll('[data-report-count]').forEach(count);
  };
  const chartObserver=new IntersectionObserver(entries=>{
    for(const entry of entries)if(entry.isIntersecting && !played.has(entry.target)){
      played.add(entry.target);chartObserver.unobserve(entry.target);draw(entry.target);
    }
  },{threshold:.18});
  const tooltip=document.createElement('div');
  tooltip.className='report-chart-tooltip';tooltip.setAttribute('role','tooltip');tooltip.hidden=true;
  document.body.append(tooltip);
  let selectedItem=null;
  const tipPosition=(x,y)=>{
    const left=Math.max(12,Math.min(x+18,innerWidth-260));
    const top=Math.max(12,Math.min(y+18,innerHeight-140));
    tooltip.style.left=left+'px';tooltip.style.top=top+'px';
  };
  const showTip=(item,event)=>{
    const label=item.getAttribute('aria-label') || '';
    if(!label)return;
    if(selectedItem && selectedItem!==item){selectedItem.classList.remove('chart-selected');selectedItem.closest('[data-report-chart]')?.classList.remove('chart-exploring');}
    selectedItem=item;
    const match=label.match(/\d+%/);
    const value=document.createElement('strong'),caption=document.createElement('span');
    value.textContent=match?.[0] || '';caption.textContent=label.replace(/\d+%/,'').replace(/:\s*$/,'').trim();
    tooltip.replaceChildren(value,caption);tooltip.hidden=false;
    const box=item.getBoundingClientRect();
    tipPosition(event.clientX ?? box.left+box.width/2,event.clientY ?? box.top+Math.min(box.height,60));
    item.closest('[data-report-chart]').classList.add('chart-exploring');item.classList.add('chart-selected');
  };
  const hideTip=item=>{
    if(selectedItem!==item)return;
    selectedItem=null;
    tooltip.hidden=true;item.classList.remove('chart-selected');
    item.closest('[data-report-chart]')?.classList.remove('chart-exploring');
  };
  findings.querySelectorAll('.report-finding').forEach(section=>{
    const mark=section.querySelector('[data-chart-item]');
    if(!mark)return;
    const chart=mark.closest('svg') || mark.parentElement;
    chart.setAttribute('data-report-chart',section.id);chartObserver.observe(chart);
    chart.querySelectorAll('[data-chart-item]:not([aria-hidden])').forEach(item=>{
      item.addEventListener('pointerenter',event=>showTip(item,event));
      item.addEventListener('pointermove',event=>tipPosition(event.clientX,event.clientY));
      item.addEventListener('pointerleave',()=>{if(document.activeElement!==item)hideTip(item);});
      item.addEventListener('focus',event=>showTip(item,event));
      item.addEventListener('blur',()=>hideTip(item));
      item.addEventListener('keydown',event=>{if(event.key==='Escape'){hideTip(item);item.blur();}});
    });
  });
  const proseObserver=new IntersectionObserver(entries=>{
    for(const entry of entries)if(entry.isIntersecting){fade(entry.target);proseObserver.unobserve(entry.target);}
  },{threshold:.15});
  findings.querySelectorAll('.report-article-intro,.finding-copy,blockquote,.chart-legend').forEach(element=>proseObserver.observe(element));
  const index=document.querySelector('.report-index'),visibleSections=new Set();
  const sectionObserver=new IntersectionObserver(entries=>{
    for(const entry of entries){if(entry.isIntersecting)visibleSections.add(entry.target);else visibleSections.delete(entry.target);}
    const current=[...findings.querySelectorAll('.report-finding')].filter(section=>visibleSections.has(section)).at(-1);
    if(current)index?.querySelectorAll('a[href^="#"]').forEach(link=>{
      if(link.getAttribute('href')==='#'+current.id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');
    });
  },{rootMargin:`-100px 0px -${Math.max(0,innerHeight-180)}px 0px`,threshold:0});
  findings.querySelectorAll('.report-finding').forEach(section=>sectionObserver.observe(section));
  document.addEventListener('visibilitychange',()=>{if(document.hidden){finish();if(selectedItem)hideTip(selectedItem);}});
  window.addEventListener('resize',()=>{if(selectedItem)hideTip(selectedItem);});
  let tipFrame=0;
  window.addEventListener('scroll',()=>{
    if(!selectedItem)return;
    if(document.activeElement!==selectedItem){hideTip(selectedItem);return;}
    if(tipFrame)return;
    tipFrame=requestAnimationFrame(()=>{
      tipFrame=0;if(!selectedItem)return;
      const box=selectedItem.getBoundingClientRect();
      if(box.bottom<72 || box.top>innerHeight){hideTip(selectedItem);return;}
      tipPosition(box.left+box.width/2,box.top+Math.min(box.height,60));
    });
  },{passive:true});
  window.addEventListener('pagehide',finish);
})();
