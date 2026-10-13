import {readFile} from 'node:fs/promises';
const {socials}=JSON.parse(await readFile('public/brand/footer-source.json','utf8'));
export function renderFooter({navItems,footerBrand,arrow}){
  return `<footer id="footer" class="site-footer"><div class="wrap">
    <div class="footer-top"><div><p class="eyebrow">CONTACT THE STUDIO</p><h2>Bring your question.<br> We’ll turn it into actionable research.</h2></div>
      <div class="footer-contact"><a class="footer-email" href="mailto:research@scad.edu">Email research@scad.edu ${arrow}</a><div class="footer-socials" role="group" aria-label="Follow SCADask">${socials.map(({href,label,icon})=>`<a href="${href}" target="_blank" rel="noopener noreferrer" aria-label="SCADask on ${label} (opens in a new tab)"><img src="${icon}" alt="" width="24" height="24"><span>${label}</span>${arrow}</a>`).join('')}</div></div>
    </div>
    <div class="footer-links"><a class="footer-scad" href="https://www.scad.edu/" target="_blank" rel="noopener noreferrer" aria-label="SCAD — The University for Creative Careers (opens in a new tab)"><img src="/brand/scad-university.svg" alt="SCAD — The University for Creative Careers" width="148" height="34"></a>
      <div class="footer-navigation" role="group" aria-label="Explore SCADask">${navItems.map(([label,href])=>`<a href="${href}">${label}</a>`).join('')}</div>
      <div class="footer-university" role="group" aria-label="SCAD resources"><a href="https://welcome.scad.edu/rfi/" target="_blank" rel="noopener noreferrer">Request information ${arrow}</a><a href="https://myadmission.scad.edu/account/login?callbackUrl=https%3A%2F%2Fmyadmission.scad.edu%2F" target="_blank" rel="noopener noreferrer">MyAdmission ${arrow}</a><a href="https://sso.scad.edu/cas-web/login?service=https%3A%2F%2Fmy.scad.edu%2FuPortal%2FLogin%3FrefUrl%3D%2FuPortal%2F" target="_blank" rel="noopener noreferrer">MySCAD ${arrow}</a></div>
    </div>
    <div class="footer-bottom"><div class="footer-signature"><a class="brand" href="/" aria-label="SCADask home">${footerBrand}</a><p>© 2026 Savannah College of Art and Design. All rights reserved.</p></div><div><a href="/privacy">Privacy</a><a href="/terms">Terms of use</a><a href="#main">Back to top ↑</a></div></div>
  </div></footer>`;
}
