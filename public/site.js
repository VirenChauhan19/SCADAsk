(() => {
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#primary-nav');
  let menuTimer;
  function finishMenuClose() {
    clearTimeout(menuTimer);
    nav.classList.remove('is-open','is-closing');
    nav.inert=false;
  }
  function closeMenu(restore=false) {
    menu.setAttribute('aria-expanded','false');
    menu.setAttribute('aria-label','Open navigation');
    if(restore) menu.focus();
    if(!nav.classList.contains('is-open') || nav.classList.contains('is-closing'))return;
    if(document.documentElement.dataset.motion==='full' && matchMedia('(max-width:800px)').matches) {
      nav.classList.add('is-closing');nav.inert=true;
      menuTimer=setTimeout(finishMenuClose,220);
    } else finishMenuClose();
  }
  menu.addEventListener('click',()=>{
    const open=menu.getAttribute('aria-expanded')!=='true';
    if(!open){closeMenu();return;}
    clearTimeout(menuTimer);nav.inert=false;nav.classList.remove('is-closing');
    menu.setAttribute('aria-expanded','true');
    menu.setAttribute('aria-label','Close navigation');
    nav.classList.add('is-open');
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.getAttribute('aria-expanded')==='true')closeMenu(true);});
  document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))closeMenu();});
  matchMedia('(min-width:801px)').addEventListener('change',e=>{if(e.matches){closeMenu();finishMenuClose();}});

  const dialog=document.querySelector('.search-dialog');
  const input=document.querySelector('#site-search');
  const results=document.querySelector('.search-results');
  const status=document.querySelector('.search-status');
  let searchIndex;
  let indexPromise;
  const normalize = text => text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
  // Match word prefixes so "AI" does not also match "retail" or "sustainable".
  const words = text => normalize(text).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const matches = (text,query) => {const tokens=words(text);return words(query).every(term=>tokens.some(token=>token.startsWith(term)));};
  async function getIndex() {
    if(searchIndex) return searchIndex;
    if(!indexPromise) indexPromise=fetch('/search-data.json').then(r=>{if(!r.ok)throw new Error('Search unavailable');return r.json();}).then(data=>searchIndex=data).catch(error=>{indexPromise=null;throw error;});
    return indexPromise;
  }
  async function renderSearch() {
    const query=input.value.trim();
    if(!searchIndex)status.textContent='Finding perspectives…';
    results.setAttribute('aria-busy','true');
    try {
      const data=await getIndex();
      if(query!==input.value.trim())return;
      const found=query?data.filter(item=>matches([item.title,item.description,item.category].join(' '),query)):data.slice(0,4);
      status.textContent=query?`${found.length} result${found.length===1?'':'s'} for “${query}”`:'Start exploring';
      results.replaceChildren();
      for(const item of found) {
        const link=document.createElement('a'); link.href=item.url;
        const label=document.createElement('span');label.textContent=item.category;
        const title=document.createElement('h3');title.textContent=item.title+' ↗';
        const description=document.createElement('p');description.textContent=item.description;
        link.append(label,title,description);results.append(link);
      }
      if(!found.length){const hint=document.createElement('p');hint.textContent='Try a broader search, such as AI, culture, or design.';results.append(hint);}
      document.dispatchEvent(new CustomEvent('scadask:results',{detail:results}));
    }catch{
      status.textContent='Search is temporarily unavailable.';results.replaceChildren();
      const fallback=document.createElement('a');fallback.href='/research';fallback.className='search-error-link';fallback.textContent='Browse the research library →';results.append(fallback);
    }finally{if(query===input.value.trim())results.setAttribute('aria-busy','false');}
  }
  let closeTimer;
  function closeSearch() {
    if(!dialog.open || dialog.classList.contains('is-closing'))return;
    if(document.documentElement.dataset.motion==='reduced' || !window.scadaskMotion){dialog.close();return;}
    dialog.classList.add('is-closing');
    closeTimer=setTimeout(()=>dialog.close(),180);
  }
  dialog.addEventListener('close',()=>{clearTimeout(closeTimer);dialog.classList.remove('is-closing');});
  dialog.addEventListener('cancel',e=>{e.preventDefault();closeSearch();});
  dialog.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeSearch();}},true);
  document.querySelector('.search-open').addEventListener('click',()=>{closeMenu();clearTimeout(closeTimer);dialog.classList.remove('is-closing');dialog.showModal();input.focus();renderSearch();});
  document.querySelector('.search-close').addEventListener('click',closeSearch);
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeSearch();}});
  document.querySelector('.site-search').addEventListener('submit',e=>{e.preventDefault();renderSearch();});
  input.addEventListener('input',renderSearch);
  document.querySelectorAll('[data-search-term]').forEach(button=>button.addEventListener('click',()=>{input.value=button.dataset.searchTerm;input.focus();renderSearch();}));

  const library=document.querySelector('.library');
  if(library) {
    const cards=[...library.querySelectorAll('.report-card')];
    const filters=[...library.querySelectorAll('[data-filter]')];
    const search=library.querySelector('#research-search');
    const year=library.querySelector('#research-year');
    const count=library.querySelector('#result-count');
    const empty=library.querySelector('.empty-state');
    const resetControls=[...library.querySelectorAll('[data-reset-filters]')];
    let selected='All';
    function hydrate() {
      const params=new URLSearchParams(location.search);
      selected=filters.map(b=>b.dataset.filter).find(t=>t.toLowerCase()===params.get('category'))||'All';
      search.value=params.get('q')||'';
      year.value=['2026','2025','2024'].includes(params.get('year'))?params.get('year'):'all';
      update(false);
    }
    function update(syncUrl=true) {
      const apply = () => {
      let visible=0;
      for(const card of cards) {
        const show=(selected==='All'||card.dataset.category===selected)&&(year.value==='all'||card.dataset.year===year.value)&&matches(card.dataset.search,search.value);
        card.hidden=!show;if(show)visible++;
      }
      filters.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===selected)));
      count.textContent=`${visible} report${visible===1?'':'s'}`;
      empty.hidden=visible!==0;
      resetControls.filter(button=>button.classList.contains('reset-link')).forEach(button=>{button.hidden=selected==='All'&&year.value==='all'&&!search.value.trim();});
      if(syncUrl){const params=new URLSearchParams();if(selected!=='All')params.set('category',selected.toLowerCase());if(search.value.trim())params.set('q',search.value.trim());if(year.value!=='all')params.set('year',year.value);history.replaceState(null,'',location.pathname+(params.size?'?'+params.toString():''));}
      };
      if(syncUrl && window.scadaskMotion)window.scadaskMotion.change(apply);
      else apply();
    }
    filters.forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.filter;update();}));
    search.addEventListener('input',()=>update());year.addEventListener('change',()=>update());
    library.querySelector('form').addEventListener('submit',e=>{e.preventDefault();update();});
    resetControls.forEach(button=>button.addEventListener('click',()=>{selected='All';search.value='';year.value='all';update();search.focus();}));
    addEventListener('popstate',hydrate);hydrate();
  }
})();
