function parseLatestFromChangelog(md){
  const lines = md.split('\n');
  let version='?', date='?', codename='';
  let start=-1, end=lines.length;
  for (let i=0;i<lines.length;i++){
    const m = lines[i].match(/^## \[(.*?)\] — (.*)$/);
    if (m){ version=m[1]; date=m[2]; start=i; break; }
  }
  if (start>=0){
    for (let j=start+1;j<lines.length;j++){
      if (/^## \[/.test(lines[j])) { end=j; break; }
    }
  }
  for (let k=start+1;k<Math.min(start+4, lines.length); k++){
    if (lines[k] && lines[k].startsWith("**Codename:**")) {
      codename = lines[k].replace("**Codename:**","").trim();
      break;
    }
  }
  const section = lines.slice(start+1, end).join('\n');
  return {version, date, codename, section};
}

function updateFooterVersion(info){
  const span = document.getElementById('version-span');
  if (span) span.textContent = `v${info.version} “${info.codename||''}”`.trim();
}

function showAbout(info){
  const modal = document.createElement('div');
  modal.className = 'about-modal show';
  modal.innerHTML = `
    <div class="about-content">
      <h2>About Grocery Planner</h2>
      <p><strong>Version:</strong> ${info.version} ${info.codename?('“'+info.codename+'”'):''}</p>
      <p><strong>Release date:</strong> ${info.date}</p>
      <h3>Changelog</h3>
      <pre>${info.section}</pre>
      <div style="text-align:right;"><button id="about-close" class="btn">Close</button></div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#about-close').addEventListener('click', ()=> modal.remove());
  modal.addEventListener('click', (e)=> { if (e.target===modal) modal.remove(); });
}

function loadChangelog(initOnly=false){
  fetch('CHANGELOG.md')
    .then(r=>r.text())
    .then(md=>{
      const info = parseLatestFromChangelog(md);
      updateFooterVersion(info);
      if (!initOnly) showAbout(info);
    })
    .catch(e=>console.error('CHANGELOG load failed', e));
}

// Wire About button
document.getElementById('about-btn')?.addEventListener('click', ()=> loadChangelog(false));
// Initial footer update
loadChangelog(true);