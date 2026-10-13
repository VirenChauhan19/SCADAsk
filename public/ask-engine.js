// Local retrieval only: return published answers, never invent new research claims.
const stop = new Set('a all an and are about any as at be by can could did do does for from get give help i in is it its list me my of on or please say says show tell that the their them there this to us was what which will with would you your more'.split(' '));
const synonyms = new Map(Object.entries({
  make: 'made make build built creat create created produc produce produced production develop developed',
  organization: 'company compan business organization organisation client firm employer',
  contact: 'contact email reach touch',
  report: 'report publication paper',
  download: 'download pdf read full access',
  lead: 'run runs lead leads leader director behind head',
  listen: 'listen watch hear stream'
}).flatMap(([token, words]) => words.split(' ').map(word => [word, token])));
const trim = word => word.length > 4 ? word.replace(/ies$/, 'y').replace(/(?:ing|ed|es|s)$/, '') : word;
const tokens = text => String(text).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/['’]s\b/g, '')
  .split(/[^\p{L}\p{N}]+/u).filter(word => word && !stop.has(word)).map(word => synonyms.get(word) || synonyms.get(trim(word)) || trim(word));
const normalized = text => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

export function createMatcher(items) {
  const entries = items.map(item => ({item,
    words: new Set(tokens([item.q, ...item.alt, ...item.kw, ...item.sources.map(s => s.title)].join(' '))),
    phrases: [item.q, ...item.alt].map(phrase => new Set(tokens(phrase)))
  }));
  const df = new Map();
  for (const entry of entries) for (const word of entry.words) df.set(word, (df.get(word) || 0) + 1);
  const idf = word => Math.log((entries.length + 1) / ((df.get(word) || 0) + 1)) + 1;
  function rank(question, sourceUrl) {
    const words = [...new Set(tokens(question))];
    if (!words.length) return [];
    const years = question.match(/\b20\d{2}\b/g) || [];
    const weight = list => list.reduce((sum, word) => sum + idf(word), 0);
    const total = weight(words);
    return entries.filter(({item, words: known}) =>
      (!sourceUrl || item.sources.some(s => s.url === sourceUrl)) && years.every(year => known.has(year))
    ).map(entry => {
      const coverage = weight(words.filter(word => entry.words.has(word))) / total;
      const similarity = p => weight(words.filter(word => p.has(word))) / (total + weight([...p].filter(word => !words.includes(word))));
      const phrase = Math.max(...entry.phrases.map(similarity));
      const exact = [entry.item.q, ...entry.item.alt].some(q => normalized(q) === normalized(question));
      return {item: entry.item, score: exact ? 1 : coverage * 0.6 + phrase * 0.4, main: similarity(entry.phrases[0]), exact};
    }).filter(result => result.score > 0).sort((a, b) => b.score - a.score || b.main - a.main);
  }
  function suggest(item, history = [], shown = []) {
    const used = new Set([...shown, ...history.flatMap(m => m.related || []), ...history.filter(m => m.role === 'user').map(m => m.text)].map(normalized));
    const answered = new Set(history.map(m => m.answerId).filter(Boolean));
    if (item) answered.add(item.id);
    const available = items.filter(other => !answered.has(other.id) && ![other.q, ...other.alt].some(q => used.has(normalized(q))));
    const topic = available.filter(other => item && other.sources[0]?.url === item.sources[0]?.url);
    const choices = topic.slice(0, 3);
    // Once this topic is explored, introduce other parts of the research library.
    const sources = new Set(choices.map(other => other.sources[0]?.url));
    for (const other of available) {
      if (choices.length === 3) break;
      if (choices.includes(other) || sources.has(other.sources[0]?.url)) continue;
      choices.push(other); sources.add(other.sources[0]?.url);
    }
    return choices.map(other => other.q);
  }
  function answer(question, previous, history = [], shown = []) {
    const text = normalized(question);
    if (/^(hi|hello|hey|good morning|good evening)$/.test(text)) return {text: 'Hello! What would you like to explore? I can help you find research, reports, and projects from SCADask.'};
    if (/^(thanks|thank you|thank you so much|thanks a lot|great|cool|awesome)$/.test(text)) return {text: 'You’re welcome. Ask another question whenever you’re ready.'};
    const followup = /^(tell me more|more|go on|continue|what else|explain more|tell me more about (it|that|this))$/.test(text);
    if (followup) {
      const item = items.find(item => item.id === previous?.answerId);
      return item ? {text: `You can explore more questions below, or open ${item.sources[0].title} for the full story.`, sources: item.sources, related: suggest(item, history, shown), answerId: item.id}
        : {text: 'Which report or project would you like to explore? Choose a starting point below.'};
    }
    // A complete known question can start a new topic even if it contains "this".
    const exact = rank(question).find(result => result.exact);
    if (exact) return {text: exact.item.a, sources: exact.item.sources, answerId: exact.item.id, related: suggest(exact.item, history, shown)};
    // Resolve short references only within the previous answer's topic.
    const contextual = /\b(it|that|this|its)\b/.test(text) && previous?.answerId && tokens(question).length <= 6;
    const topic = contextual ? items.find(item => item.id === previous.answerId)?.sources[0] : null;
    const ranked = rank(topic ? `${question} ${topic.title}` : question, topic?.url);
    const [best, next] = ranked;
    const ambiguous = best && !best.exact && next && best.score - next.score < 0.055 && best.item.sources[0]?.url !== next.item.sources[0]?.url;
    if (best && best.score >= 0.55 && !ambiguous) return {text: best.item.a, sources: best.item.sources, answerId: best.item.id, related: suggest(best.item, history, shown)};
    const used = new Set([...shown, ...history.flatMap(m => m.related || []), ...history.filter(m => m.role === 'user').map(m => m.text)].map(normalized));
    const close = ranked.filter(r => r.score >= 0.36 && !used.has(normalized(r.item.q))).slice(0, 3).map(r => r.item.q);
    return {text: close.length ? 'I found a few possible matches. Which of these is closest to what you’re looking for?'
      : 'I don’t have a sourced answer to that yet. I can help with SCADask research, reports, the podcast, and the studio. Try a question below or contact our team.', related: close, contact: !close.length};
  }
  return {rank, answer, suggest};
}
