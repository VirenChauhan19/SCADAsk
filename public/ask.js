// Floating "Ask SCADask" chat. Answers come from /ask-answers.json, which is
// written ahead of time by scripts/build-ask-answers.mjs. Nothing is sent to a server.
(() => {
  const siteRoot = '/'; // Rewritten to the deployment path at build time.
  const STORE = 'scadask-ask-chat';
  const starters = ['What is SCADask?', 'What does AI Insights 2026 find?', 'How was SplatGarden made?'];

  // The conversation follows the visitor across pages for this browser tab only.
  let messages = [];
  try { messages = JSON.parse(sessionStorage.getItem(STORE) || '[]'); } catch {}
  if (!Array.isArray(messages)) messages = [];
  messages = messages.filter(m => m && ['user', 'assistant'].includes(m.role) && typeof m.text === 'string').slice(-20);
  let shown = [];
  try { shown = JSON.parse(sessionStorage.getItem(STORE + '-suggestions') || '[]'); } catch {}
  if (!Array.isArray(shown)) shown = [];
  shown = [...new Set([...shown.filter(q => typeof q === 'string'), ...messages.flatMap(m => m.related || [])])];
  const save = () => { try {
    sessionStorage.setItem(STORE, JSON.stringify(messages.slice(-20)));
    sessionStorage.setItem(STORE + '-suggestions', JSON.stringify(shown));
  } catch {} };


  let index;
  let loading;
  function getIndex() {
    loading ||= Promise.all([
      fetch('/ask-answers.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      import('/ask-engine.js')
    ]).then(([{items}, {createMatcher}]) => index = createMatcher(items))
      .catch(error => { loading = null; throw error; });
    return loading;
  }

  const root = document.createElement('div');
  root.className = 'ask-widget';
  root.innerHTML = `
    <section class="ask-window" id="ask-window" role="dialog" aria-labelledby="ask-title" hidden>
      <header class="ask-header">
        <div class="ask-identity"><span class="ask-avatar" aria-hidden="true">a<span>✦</span></span><div><h2 id="ask-title">Ask SCADask</h2><p>Your guide to our research</p></div></div>
        <div class="ask-controls"><button type="button" class="ask-reset" aria-label="Start new conversation" title="Start new conversation">↺</button><button type="button" class="ask-close" aria-label="Close chat">×</button></div>
      </header>
      <div class="ask-log" role="log" aria-live="polite"></div>
      <div class="ask-composer"><form class="ask-form">
        <label class="sr-only" for="ask-input">Ask a question about SCADask</label>
        <input id="ask-input" type="text" maxlength="200" autocomplete="off" placeholder="Ask a question…">
        <button type="submit" aria-label="Send question" disabled><svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      </form><p class="ask-note">Answers from SCADask publications. Follow sources for details.</p></div>
    </section>
    <button type="button" class="ask-launcher" aria-expanded="false" aria-controls="ask-window" aria-label="Ask SCADask">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
      <span>Ask SCADask</span>
    </button>`;
  document.body.append(root);

  const win = root.querySelector('.ask-window');
  const launcher = root.querySelector('.ask-launcher');
  const log = root.querySelector('.ask-log');
  const form = root.querySelector('.ask-form');
  const input = root.querySelector('#ask-input');
  const send = form.querySelector('button');
  const reset = root.querySelector('.ask-reset');
  let busy = false;
  const updateControls = () => {
    send.disabled = busy || !input.value.trim();
    reset.disabled = busy || !messages.length;
    root.querySelectorAll('.ask-suggestions button').forEach(button => button.disabled = busy);
  };

  const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text) node.textContent = text; return node; };
  const link = (href, text, external) => {
    const a = el('a', '', text + ' ');
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('class', 'ask-link-arrow'); icon.setAttribute('viewBox', '0 0 24 24'); icon.setAttribute('width', '12'); icon.setAttribute('height', '12'); icon.setAttribute('aria-hidden', 'true'); icon.setAttribute('focusable', 'false');
    icon.innerHTML = '<path d="M6 18 18 6M6 6h12v12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>';
    a.append(icon); a.href = href; if (external) { a.target = '_blank'; a.rel = 'noopener'; } return a;
  };
  const chips = list => {
    const wrap = el('div', 'ask-suggestions');
    for (const text of list) { const chip = el('button', '', text); chip.type = 'button'; chip.addEventListener('click', () => ask(text)); wrap.append(chip); }
    return wrap;
  };

  function bubble(message) {
    const item = el('div', `ask-message ask-${message.role}`);
    if (message.role === 'assistant') item.append(el('span', 'ask-author', 'SCADask'));
    for (const paragraph of message.text.split(/\n+/).filter(Boolean)) item.append(el('p', '', paragraph));
    if (message.sources?.length) {
      item.append(el('span', 'ask-source-label', 'Explore the sources'));
      const list = el('ul', 'ask-sources'); list.setAttribute('aria-label', 'Sources');
      for (const source of message.sources) {
        const href = source.url.startsWith(siteRoot) ? source.url : siteRoot + source.url.replace(/^\/+/, '');
        const row = el('li'); row.append(link(href, source.title));
        if (source.pdf) row.append(link(source.pdf, 'PDF', true));
        list.append(row);
      }
      item.append(list);
    }
    if (message.contact) { const p = el('p', 'ask-contact'); p.append(link('mailto:research@scad.edu', 'Email research@scad.edu')); item.append(p); }
    return item;
  }

  function render(animateReply = false) {
    log.replaceChildren();
    if (!messages.length) {
      shown = [...new Set([...shown, ...starters])];
      const welcome = el('div', 'ask-welcome');
      welcome.append(el('span', 'ask-eyebrow', 'A little curiosity goes a long way'), el('h3', '', 'What would you like to explore?'), el('p', '', 'Find an insight, discover a project, or get to know the studio. Start here, or ask your own question.'));
      log.append(welcome, chips(starters));
    }
    messages.forEach((message, i) => {
      const item = bubble(message);
      if (animateReply && i === messages.length - 1 && message.role === 'assistant') item.classList.add('ask-reply-enter');
      log.append(item);
      if (i === messages.length - 1 && message.related?.length) log.append(chips(message.related));
    });
    log.scrollTop = log.scrollHeight;
    updateControls();
  }

  function setOpen(open) {
    win.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    launcher.setAttribute('aria-label', open ? 'Close chat' : 'Ask SCADask');
    root.classList.toggle('is-open', open);
    if (open) { render(); if (busy) showTyping(); input.focus(); getIndex().catch(() => {}); }
  }

  function showTyping() {
    const typing = el('div', 'ask-message ask-assistant ask-typing');
    typing.setAttribute('role', 'status');
    typing.setAttribute('aria-label', 'SCADask is typing');
    typing.append(el('span'), el('span'), el('span'), el('small', '', 'SCADask is typing…'));
    log.append(typing); log.scrollTop = log.scrollHeight;
  }

  async function ask(question) {
    question = question.replace(/\s+/g, ' ').trim().slice(0, 200);
    if (!question || busy) return;
    const previous = [...messages].reverse().find(m => m.role === 'assistant' && m.answerId);
    busy = true;
    messages.push({role: 'user', text: question});
    input.value = ''; render(); showTyping();
    try {
      // Keep the typing indicator visible even when local answers are cached.
      const typingDuration = Math.min(1800, 1100 + question.length * 8);
      await Promise.all([getIndex(), new Promise(resolve => setTimeout(resolve, typingDuration))]);
      const answer = index.answer(question, previous, messages, shown);
      if (!answer.related?.length && !answer.sources?.length) answer.related = index.suggest(null, messages, shown);
      shown = [...new Set([...shown, question, ...(answer.related || [])])];
      messages.push({role: 'assistant', ...answer});
    } catch {
      messages.push({role: 'assistant', text: 'Answers are unavailable right now. Please try again, or browse the research library.', sources: [{title: 'Research library', url: 'research'}]});
    } finally {
      busy = false;
    }
    save();
    messages = messages.slice(-20);
    if (!win.hidden) render(true);
    updateControls();
  }

  launcher.addEventListener('click', () => setOpen(win.hidden));
  root.querySelector('.ask-close').addEventListener('click', () => { setOpen(false); launcher.focus(); });
  reset.addEventListener('click', () => { if (busy) return; messages = []; shown = []; save(); input.value = ''; render(); input.focus(); });
  input.addEventListener('input', updateControls);
  form.addEventListener('submit', event => { event.preventDefault(); ask(input.value); });
  win.addEventListener('keydown', event => { if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); launcher.focus(); } });
})();
