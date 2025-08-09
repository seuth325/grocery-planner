// Simple About modal pulling from CHANGELOG.md and updating footer version
function parseLatestFromChangelog(md){
  const lines = md.split('\n');
  for(let i=0;i<lines.length;i++){
    const m = lines[i].match(/^## \[(.*?)\] — (.*)$/);
    if(m){
      const version = m[1], date = m[2];
      let codename = '';
      if(lines[i+1] && lines[i+1].startsWith('**Codename:**')){
        codename = lines[i+1].replace('**Codename:**','').trim();
      }
      let body = [];
      for(let j=i+2;j<lines.length;j++){
        if(lines[j].startsWith('## [')) break;
        body.push(lines[j]);
      }
      return {version, date, codename, body: body.join('\n').trim()};
    }
  }
  return null;
}

function showAbout(info){
  const modal = document.createElement('div');
  modal.className = 'about-modal';
  modal.innerHTML = `<div class="about-content">
    <h2>About Grocery Planner</h2>
    <p><strong>Version:</strong> ${info.version} "${info.codename}"</p>
    <p><strong>Release date:</strong> ${info.date}</p>
    <h3>Changelog</h3>
    <pre style="text-align:left; white-space:pre-wrap;">${info.body}</pre>
    <button id="about-close">Close</button>
  </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#about-close').addEventListener('click', ()=> modal.remove());
}

function updateFooterVersion(info){
  const footer = document.getElementById('app-footer');
  if(!footer) return;
  footer.querySelector('span').textContent = `Grocery Planner — v${info.version} "${info.codename}"`;
}

document.addEventListener('DOMContentLoaded', () => {
  fetch('CHANGELOG.md').then(r=>r.text()).then(md => {
    const info = parseLatestFromChangelog(md);
    if(!info) return;
    updateFooterVersion(info);
    const btn = document.getElementById('about-btn');
    if(btn){
      btn.addEventListener('click', () => showAbout(info));
    }
  });
});

// styles for about
const style = document.createElement('style');
style.textContent = `.about-modal{position:fixed; inset:0; background:rgba(0,0,0,.35); display:flex; align-items:center; justify-content:center; z-index:1000;}
.about-content{background:#fff; border-radius:10px; padding:1.2em; max-width:520px; width:90%; box-shadow:0 4px 20px rgba(0,0,0,.2);}
.about-content h2{margin-top:0; color:#FF8C42;}
.about-content pre{background:#f9f9f9; padding:.6em; border-radius:6px;}`;
document.head.appendChild(style);
