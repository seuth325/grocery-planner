
(function(){
  function el(tag, props={}, children=[]) {
    const e = document.createElement(tag);
    Object.entries(props).forEach(([k,v]) => {
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else e.setAttribute(k, v);
    });
    children.forEach(c => e.appendChild(c));
    return e;
  }

  function injectStyles() {
    if (document.getElementById('about-css')) return;
    const css = `
    /* About Modal */
    .about-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display:none; z-index: 1000; }
    .about-overlay.show { display:block; }
    .about-card { background:#fff; width:min(92vw,480px); margin:10vh auto; border-radius:12px; padding:1rem 1.2rem; box-shadow:0 12px 30px rgba(0,0,0,0.15); }
    .about-card h3 { margin:0 0 .5rem 0; color:#FF8C42; }
    .about-meta { color:#555; font-size:.95rem; margin-bottom:.5rem; }
    .about-changelog { margin:.4rem 0; padding-left:1.1rem; }
    .about-actions { display:flex; justify-content:flex-end; margin-top:.6rem; }
    .about-btn, #about-btn { background:#FF8C42; color:#fff; border:none; padding:.5em 1em; border-radius:6px; font-weight:600; cursor:pointer; }
    .about-btn:hover, #about-btn:hover { background:#FFA600; box-shadow:0 4px 12px rgba(255,166,0,.4); }
    @media print { .about-overlay { display:none !important; } }
    `;
    const style = el('style', { id:'about-css' });
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  async function init() {
    injectStyles();

    // Fetch version.json
    let ver = { version: '1.0.1', codename: 'mango-curry final+', released: '', changelog: [] };
    try {
      const res = await fetch('version.json', { cache: 'no-store' });
      if (res.ok) ver = await res.json();
    } catch(e){ /* ignore */ }

    // Ensure footer exists and update it
    let footer = document.getElementById('app-footer');
    if (!footer) {
      footer = el('footer', { id:'app-footer', 'aria-label':'version' });
      document.body.appendChild(footer);
    }
    const siteUrl = (window.location && window.location.origin) ? window.location.origin + window.location.pathname : '#';
    footer.innerHTML = '';
    footer.appendChild(el('span', { text: `Grocery Planner — v${ver.version} “${ver.codename}”` }));
    footer.appendChild(el('span', { text: ' · ' }));
    footer.appendChild(el('a', { href: siteUrl, target:'_blank', rel:'noopener', text:'Site' }));

    // Create/About button near Settings if possible
    let aboutBtn = document.getElementById('about-btn');
    if (!aboutBtn) {
      aboutBtn = el('button', { id:'about-btn', class:'about-btn', text:'ℹ️ About' });
      // Try to place next to settings-btn; else append to body top
      const settings = document.getElementById('settings-btn');
      if (settings && settings.parentNode) settings.parentNode.insertBefore(aboutBtn, settings.nextSibling);
      else document.body.insertBefore(aboutBtn, document.body.firstChild);
    }

    // Build modal
    let overlay = document.querySelector('.about-overlay');
    if (!overlay) {
      overlay = el('div', { class:'about-overlay', role:'dialog', 'aria-modal':'true' });
      const card = el('div', { class:'about-card' });
      const h = el('h3', { text:'About Grocery Planner' });
      const meta = el('div', { class:'about-meta', text: `Version v${ver.version} “${ver.codename}”${ver.released ? ' • Released '+ver.released : ''}` });
      const clTitle = el('div', { class:'about-meta', text:'Changelog:' });
      const list = el('ul', { class:'about-changelog' });
      (ver.changelog || []).forEach(item => list.appendChild(el('li', { text: item })));

      const actions = el('div', { class:'about-actions' });
      const close = el('button', { class:'about-btn', text:'Close' });
      close.addEventListener('click', () => { overlay.classList.remove('show'); overlay.setAttribute('aria-hidden','true'); });

      actions.appendChild(close);
      [h, meta, clTitle, list, actions].forEach(n => card.appendChild(n));
      overlay.appendChild(card);
      document.body.appendChild(overlay);
    }

    // Wire button
    aboutBtn.addEventListener('click', () => {
      overlay.classList.add('show');
      overlay.setAttribute('aria-hidden','false');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
