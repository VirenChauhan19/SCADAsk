export function eventsPage({reports, card, arrow}) {
  return `<section class="wrap events-hero">
    <div><p class="eyebrow">EVENTS & CONVERSATIONS</p><h1>Events &<br><span>conversations.</span></h1></div>
    <div class="events-introduction"><p>Conversations with researchers, creative leaders, and industry insiders about the changes shaping our work.</p><a class="text-link" href="#event-archive">Explore the archive <span aria-hidden="true">↓</span></a></div>
  </section>
  <section class="wrap events-archive" id="event-archive" aria-labelledby="archive-title">
    <div class="events-section-label"><h2 id="archive-title">From the archive</h2><span>PAST CONVERSATIONS</span></div>
    <article class="event-feature" aria-labelledby="featured-event-title">
      <div class="event-date-rail" aria-label="September 17"><span>SEP</span><strong>17</strong></div>
      <div class="event-visual" aria-hidden="true"><img src="/mirror/27031a7da5e7-zMdatHwldwbfMf5E7M0jlHpRc.png" alt="" width="1279" height="1024"></div>
      <div class="event-story"><div class="event-kicker"><span>Panel conversation</span><span class="event-status">Past event</span></div>
        <p class="event-host">QS Back to School Summit</p>
        <h3 id="featured-event-title">Research Reimagined:<br>AI, IP & the New Rules of Discovery</h3>
        <dl class="event-facts"><div><dt class="sr-only">Time</dt><dd>2:00 PM–2:30 PM</dd></div><div><dt class="sr-only">Location</dt><dd>New York City</dd></div></dl>
        <p class="event-summary">SCADask Executive Director Munkhtsetseg Nandigjav joined Dr. Maali Alabdulhafith and Sanjay Goel for a panel exploring how AI-enabled research is evaluated and how institutions can use AI to enhance discovery.</p>
        <a class="event-agenda" href="https://www.qs.com/conferences/back-to-school/agenda" target="_blank" rel="noopener noreferrer">View the summit agenda ${arrow}</a>
      </div>
    </article>
    <div class="events-next"><div><h2>Join the next conversation.</h2><p>Get in touch to ask about upcoming SCADask events.</p></div><a class="text-link" href="mailto:research@scad.edu">Ask about upcoming events ${arrow}</a></div>
  </section>
  <section class="section wrap events-reading" aria-labelledby="events-reading-title"><div class="section-heading"><div><p class="eyebrow">CONTINUE EXPLORING</p><h2 id="events-reading-title">The research behind the conversation.</h2></div><a class="text-link" href="/research?category=technology">All technology research ${arrow}</a></div><div class="report-grid">${[reports[0],reports[6],reports[7]].map(card).join('')}</div></section>`;
}
