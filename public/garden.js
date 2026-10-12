// One live garden, a feature guide, and four original demonstration films.
(() => {
  const films = [
    ['15e4bc40e1c2-2ZOH4zbYzssOJUFkwVPaU4Hrl0.mp4', 'Navigate freely with a mouse or hand gesture'],
    ['2d970c1c8509-xoRBOMx68gb3vaAgFIqypc1uE.mp4', 'Touch anywhere in the scene to trigger live effects'],
    ['985cf1043203-07s0fJzYMkyJcqYf80k05omEdEU.mp4', 'Art direct the scene across multiple display modes: Gaussian splat, USD Voxel, point clouds, and painterly styles'],
    ['2e405feab273-cavpwCkX3uvKStSVkbIFwRFZh0.mp4', 'Technical breakdown: camera specs and asset credits']
  ];
  const features = [
    ['Navigate', 'Make the garden your own viewpoint.', 'Drag to orbit, scroll to zoom, and right-drag to pan. Use W, A, S, D to walk; Q and E to move down and up. Hold Shift to move faster.', 'Try the Front, Center, and Zoom viewpoints. Press R to reset your view.'],
    ['Live effects', 'Bring the scene to life with a click.', 'Click the garden to trigger the selected effect. In the FX panel, choose a preset such as Slime Molds, Cyan Plasma, or Vortex Drift.', 'Adjust radius, duration, and intensity under Core. Use Replay at last hit to repeat an effect.'],
    ['Display modes', 'See the same world in a different medium.', 'Open 3DGS / USD to switch between Gaussian and Point rendering, or add Billboard and Voxel layers. Layers can be combined.', 'Billboard and Voxel are view-only layers. Keep Splat enabled for mouse effects and asset hotspots.'],
    ['Technical details', 'Explore the craft behind every asset.', 'Click the floating asset hotspots for the landscape, gazebo, statue, foliage, and flowers. Open Tech Spec for training cameras, data labels, and credits.', 'Use the Enable toggle in Tech Spec to show or hide the asset hotspots.'],
    ['Style & cinema', 'Art direct the atmosphere.', 'Explore Painterly, Lens Distortion, Underwater, and Kaleidoscope under Cinematic FX. Customize includes post-processing and HDR sky controls.', 'Use Play Camera Move for the authored camera path; Stop Camera Move returns control to you.'],
    ['More controls', 'Choose how you explore.', 'Use Performance to choose Battery, Balanced, or Max Quality. The live garden also supports adding your own splat files and saving viewpoints.', 'For camera-based hand tracking, choose Open garden and enable Hand Tracking there. Camera permission is requested by the garden.']
  ];
  const element = (tag, className, text) => {
    const node = document.createElement(tag); if (className) node.className = className;
    if (text) node.textContent = text; return node;
  };
  const button = (className, text, action) => {
    const node = element('button', className, text); node.type = 'button'; node.addEventListener('click', action); return node;
  };
  const prepare = () => {
    const section = document.querySelector('.framer-14xmokj');
    if (!section || section.querySelector('.garden-studio')) return;
    const studio = element('div', 'garden-studio');
    const live = element('div', 'garden-live garden-stage');
    const cover = element('video', 'garden-live-preview'); cover.src = '/mirror/' + films[0][0];
    cover.poster = '/mirror/24aa90fc33b5-h4vANWyA617zy5Anzcc8z1kZ0w.jpg';
    cover.muted = true; cover.playsInline = true; cover.preload = 'metadata'; cover.setAttribute('aria-hidden', 'true');
    cover.addEventListener('loadedmetadata', () => { cover.currentTime = .1; }, {once:true});
    const overlay = element('div', 'garden-live-overlay');
    overlay.append(element('span', 'garden-eyebrow', 'LIVE · INTERACTIVE 3D'), element('strong', '', 'One garden. Endless ways to explore.'), element('div', '', 'Walk through the work. Shape the scene. Discover how it was made.'), element('small', 'garden-connection-note', 'Live experience hosted on splatgarden.com · Internet connection required'));
    const toolbar = element('div', 'garden-controls'); toolbar.hidden = true;
    toolbar.append(element('span', '', 'Drag to orbit · Scroll to zoom · Right-drag to pan'));
    let frame;
    const open = () => {
      if (frame) return;
      frame = element('iframe', ''); frame.src = 'https://splatgarden.com/';
      frame.title = 'Interactive SplatGarden'; frame.allow = 'fullscreen'; frame.allowFullscreen = true;
      overlay.hidden = true; cover.hidden = true; toolbar.hidden = false;
      live.classList.add('garden-live-active'); live.append(frame); frame.focus();
    };
    const enter = button('garden-enter', 'Enter the garden ↗', open); overlay.append(enter);
    toolbar.append(button('', 'Full screen', async () => {
      try { if (document.fullscreenElement === live) await document.exitFullscreen(); else await live.requestFullscreen(); } catch {}
    }), button('', 'Restart', () => { frame?.remove(); frame = undefined; open(); }));
    const external = element('a', '', 'Open garden ↗'); external.href = 'https://splatgarden.com/'; external.target = '_blank'; external.rel = 'noopener'; toolbar.append(external);
    toolbar.append(button('', 'Close', () => {
      frame?.remove(); frame = undefined; toolbar.hidden = true; overlay.hidden = false; cover.hidden = false;
      live.classList.remove('garden-live-active'); enter.focus();
    }));
    live.append(cover, overlay, toolbar);
    const guide = element('div', 'garden-guide');
    const guideHeading = element('h3', '', 'What can you do inside?');
    guide.append(guideHeading, element('div', 'garden-guide-intro', 'Choose a feature for a quick guide, then try it in the garden above.'));
    const tabs = element('div', 'garden-feature-tabs'); tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Garden feature guide');
    const panel = element('div', 'garden-feature-panel'); panel.id = 'garden-feature-panel'; panel.setAttribute('role', 'tabpanel'); panel.tabIndex = 0;
    const select = index => {
      [...tabs.children].forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
      const [, title, description, tip] = features[index];
      panel.setAttribute('aria-labelledby', `garden-feature-${index}`);
      panel.replaceChildren(element('strong', '', title), element('div', '', description), element('div', 'garden-feature-tip', tip));
      if(panel.isConnected)document.dispatchEvent(new CustomEvent('scadask:panel',{detail:panel}));
    };
    features.forEach(([label], i) => {
      const tab = button('', label, () => select(i)); tab.id = `garden-feature-${i}`;
      tab.setAttribute('role','tab'); tab.setAttribute('aria-controls',panel.id);
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (i+1)%features.length;
        if (event.key === 'ArrowLeft') next = (i+features.length-1)%features.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = features.length-1;
        if (next !== undefined) { event.preventDefault(); select(next); tabs.children[next].focus(); }
      });
      tabs.append(tab);
    });
    guide.append(tabs, panel); select(0);
    studio.append(live, guide); section.append(studio);
    const filmsHeading = element('div', 'garden-films-heading');
    filmsHeading.append(element('h3', '', 'See it in action'), element('div', '', 'Four short demonstrations of what the garden can do.'));
    section.append(filmsHeading);
    const gallery = element('div','garden-gallery');
    const videos = [];
    films.forEach(([file, caption], i) => {
      const card = element('article', 'garden-card');
      const media = element('div', 'garden-media');
      const video = element('video', ''); video.src = '/mirror/' + file; video.controls = true; video.playsInline = true; video.preload = 'metadata';
      video.setAttribute('aria-label', caption); video.setAttribute('aria-describedby', `garden-caption-${i}`);
      video.addEventListener('loadedmetadata', () => { video.currentTime = .1; }, {once:true});
      video.addEventListener('play', () => videos.forEach(other => { if (other !== video) other.pause(); })); videos.push(video);
      media.append(video);
      const text = element('p', 'garden-caption', caption); text.id = `garden-caption-${i}`;
      const number = element('span', 'garden-number', String(i+1).padStart(2,'0')); number.setAttribute('aria-hidden','true');
      card.append(media, text, number); gallery.append(card);
    });
    section.append(gallery);
    document.dispatchEvent(new CustomEvent('scadask:ready',{detail:section}));
    document.addEventListener('visibilitychange', () => { if (document.hidden) videos.forEach(video => video.pause()); });
  };
  prepare();
  let queued = false;
  new MutationObserver(() => { if (!queued) {queued = true;requestAnimationFrame(() => {queued = false;prepare();});} }).observe(document.body,{childList:true,subtree:true});
})();
