// About modal that reads CHANGELOG.md and updates footer version
function parseLatestFromChangelog(md) {
  const lines = md.split('\n');
  let version = 'Unknown', codename = '', date = '';
  for (let i=0; i<lines.length; i++) {
    const m = lines[i].match(/^## \[(.*?)\] — (.*)$/);
    if (m) {
      version = m[1]; date = m[2];
      if (lines[i+1] && lines[i+1].includes('**Codename:**')) {
        codename = lines[i+1].replace('**Codename:**','').trim();
      }
      return {version, codename, date};
    }
  }
  return {version, codename, date};
}

function showAboutModal(info, section) {
  const modal = document.createElement('div');
  modal.className = 'about-modal';
  modal.innerHTML = `
    <div class="about-content">
      <h2>About Grocery Planner</h2>
      <p><strong>Version:</strong> ${info.version} "${info.codename}"</p>
      <p><strong>Release date:</strong> ${info.date}</p>
      <h3>Changelog</h3>
      <pre style="text-align:left; white-space:pre-wrap;">${section}</pre>
      <button id="about-close">Close</button>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#about-close').addEventListener('click', () => modal.remove());
}

function loadChangelogAndShowAbout() {
  fetch('CHANGELOG.md').then(r=>r.text()).then(md=>{
    // extract latest section
    const lines = md.split('\n');
    let start = -1, end = lines.length;
    for (let i=0;i<lines.length;i++){
      if (lines[i].startsWith('## [')) { start = i; break; }
    }
    if (start>=0){
      for (let j=start+1;j<lines.length;j++){
        if (lines[j].startsWith('## [')) { end = j; break; }
      }
    }
    const latestSection = start>=0 ? lines.slice(start, end).join('\n') : md;
    const info = parseLatestFromChangelog(md);
    showAboutModal(info, latestSection);
  }).catch(err=>alert('Unable to load changelog.'));
}

// Wire About button
document.addEventListener('DOMContentLoaded', ()=>{
  const btn = document.getElementById('about-btn');
  if (btn) btn.addEventListener('click', loadChangelogAndShowAbout);

  // Also update footer version from CHANGELOG
  fetch('CHANGELOG.md').then(r=>r.text()).then(md=>{
    const info = parseLatestFromChangelog(md);
    const foot = document.querySelector('#app-footer span');
    if (foot) foot.textContent = `Grocery Planner — v${info.version} "${info.codename}"`;
  }).catch(()=>{});
});

// styles for about modal
const style = document.createElement('style');
style.textContent = `.about-modal{position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:1000}
.about-content{background:#fff;border-radius:10px;padding:1.2em;max-width:500px;width:90%;box-shadow:0 4px 20px rgba(0,0,0,.2)}
.about-content h2{margin-top:0;color:#FF8C42}
.about-content pre{background:#f9f9f9;padding:.6em;border-radius:6px}`;
document.head.appendChild(style);
