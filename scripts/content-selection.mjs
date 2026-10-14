// Deliberate editorial omissions: source captures remain available for reference.
export function omittedMediaReason(name,media){
  if(name==='home' && (media.tag==='video' || media.src.includes('/pL934KOHQA1Rr8juoAnYV1PKEW4.jpg')))return 'Removed homepage overview film and poster';
  if(name==='aboutus' && media.context.includes('Summary'))return 'Removed decorative studio artwork';
  if(name==='research' && media.anchor==='./ai-insights-2026')return 'Removed duplicate featured report artwork; report remains in library';
  if(name==='events' && media.context.includes('Variant 2') && media.anchor.includes('qs.com'))return 'Removed redundant event banner';
  if(name==='splatgarden'){
    if(media.context.includes('Hero'))return 'Removed extra overview film and poster; live experience and four demos remain';
    if(media.context.includes('Company'))return 'Removed decorative production tool logo strip';
    if(media.tag==='video' && media.context.includes('Asset Creation'))return 'Removed extra production players; production text and credits remain';
  }
  return null;
}

export function omittedTextReason(name,block){
  if(name==='splatgarden' && ['No installation, no reel','Work in context','Interactive by design','Opens in a browser'].includes(block.text))return 'Removed benefit cards; useful descriptions are consolidated in project overview';
  return null;
}
