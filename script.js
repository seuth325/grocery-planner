// === State ===
let currentDay = null;
let currentItems = [];

// === Preferences ===
const PREF_GROUP='pref_group', PREF_QTY='pref_qty';
const PREF_DATE_MODE='pref_date_mode', PREF_WEEK_START='pref_week_start', PREF_CUSTOM_START='pref_custom_start';
const weekdayToIndex = { sunday:0, monday:1, tuesday:2, wednesday:3, thursday:4, friday:5, saturday:6 };

const prefs = {
  group: JSON.parse(localStorage.getItem(PREF_GROUP) ?? 'true'),
  qty: JSON.parse(localStorage.getItem(PREF_QTY) ?? 'true'),
  dateMode: localStorage.getItem(PREF_DATE_MODE) || 'next',
  weekStart: localStorage.getItem(PREF_WEEK_START) || 'monday',
  customStart: localStorage.getItem(PREF_CUSTOM_START) || ''
};

function savePrefs(){
  localStorage.setItem(PREF_GROUP, JSON.stringify(prefs.group));
  localStorage.setItem(PREF_QTY, JSON.stringify(prefs.qty));
  localStorage.setItem(PREF_DATE_MODE, prefs.dateMode);
  localStorage.setItem(PREF_WEEK_START, prefs.weekStart);
  localStorage.setItem(PREF_CUSTOM_START, prefs.customStart);
}

// === Category map + quantity hints (shortened) ===
const categoryMap = [
  { name: "Produce", patterns: [/lettuce/i,/mushroom/i,/bell\s*pepper/i,/(snow|snap)\s*pea/i,/basil/i,/thai\s*chil/i,/garlic/i,/ginger/i,/lime\b/i,/shallot/i,/(green\s*onion|scallion)/i,/cucumber/i,/carrot/i,/bok\s*choy/i,/spinach/i,/eggplant/i,/mint/i,/lemongrass/i,/daikon/i,/kaffir\s*lime\s*leaves?/i]},
  { name: "Protein", patterns: [/\bchicken\b/i,/\bshrimp\b/i,/\bfish\b/i,/tilapia/i,/\bcod\b/i,/turkey/i,/\btofu\b/i,/\beggs?\b/i]},
  { name: "Sauces/Condiments", patterns: [/soy\s*sauce/i,/fish\s*sauce/i,/oyster\s*sauce/i,/sesame\s*oil/i,/rice\s*vinegar/i,/chili\s*(paste|sauce)|sambal/i,/peanut\s*butter/i,/coconut\s*milk/i,/black\s*bean/i,/miso\s*paste/i]},
  { name: "Noodles/Rice", patterns: [/rice\s*paper/i,/glass\s*noodles?|bean\s*thread/i,/(jasmine|brown)\s*rice/i,/rice\s*noodles?|vermicelli/i]},
  { name: "Sweeteners", patterns: [/palm\s*sugar/i,/\bhoney\b/i,/\bsugar\b/i,/sweetener/i]},
  { name: "Spices/Seasonings", patterns: [/dried\s*chil/i,/kaffir\s*lime\s*leaves?/i,/toasted\s*rice(\s*powder)?/i,/curry\s*paste/i,/five\s*spice/i,/sichuan|szechuan/i,/star\s*anise/i,/white\s*pepper/i]},
  { name: "Other", patterns: [] }
];

function normalizeItem(s){ return s.replace(/\s*\(.*?\)\s*/g,'').trim(); }
function getCategory(item){
  const clean = normalizeItem(item);
  for (const cat of categoryMap){
    if (cat.patterns.some(rx=>rx.test(clean))) return cat.name;
  }
  return "Other";
}

function quantityFor(item){
  const clean = normalizeItem(item).toLowerCase();
  const pairs = [
    [/(green\s*onion|scallion)/i,"1 bunch"],[/shallot/i,"3–4"],[/bell\s*pepper/i,"2"],[/(snow|snap)\s*pea/i,"8 oz"],[/mushroom/i,"8–12 oz"],[/eggplant/i,"2"],[/spinach/i,"1 small bag"],[/bok\s*choy/i,"1 lb"],[/lemongrass/i,"2 stalks"],[/daikon/i,"1 small"],[/coconut\s*milk/i,"1 can"],[/soy\s*sauce/i,"1 bottle"],[/fish\s*sauce/i,"1 bottle"],[/rice\s*vinegar/i,"1 bottle"],[/sesame\s*oil/i,"1 small bottle"],[/chili\s*(paste|sauce)|sambal/i,"1 jar"],[/peanut\s*butter/i,"1 small jar"],[/glass\s*noodle|bean\s*thread/i,"1 pack"],[/rice\s*paper/i,"1 pack"],[/(jasmine|brown)\s*rice/i,"1–2 cups dry"],[/rice\s*noodle|vermicelli/i,"1 pack"],[/palm\s*sugar|honey/i,"1 small jar"],[/toasted\s*rice(\s*powder)?/i,"small bag"],[/curry\s*paste/i,"1 small jar"],[/white\s*pepper/i,"small tin"],[/\bchicken\b(?!\s*stock)/i,"1.5–2 lb"],[/ground\s*(chicken|turkey)/i,"1 lb"],[/shrimp/i,"1 lb"],[/(cod|tilapia|fish)/i,"2 fillets"],[/egg(s)?\b/i,"1 dozen"],[/lime\b/i,"2"],[/garlic\b/i,"1 bulb"],[/ginger\b/i,"1 small knob"],[/basil\b/i,"1 small bunch"],[/mint\b/i,"1 small bunch"],[/chil/i,"4–6"]
  ];
  for (const [rx,h] of pairs){ if (rx.test(clean)) return h; }
  return "1 unit";
}

// === Date logic ===
function startOfWeek(date, weekStartIdx){
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = (d.getDay() - weekStartIdx + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}
function computeTargetDateForDay(dayName){
  const dayIdx = weekdayToIndex[dayName.toLowerCase()];
  const today = new Date();
  if (prefs.dateMode === 'next'){
    const diff = (dayIdx - today.getDay() + 7) % 7;
    const t = new Date(today); t.setDate(today.getDate()+diff); return t;
  }
  let baseStart;
  if (prefs.customStart){
    const [y,m,d] = prefs.customStart.split('-').map(Number);
    baseStart = new Date(y, m-1, d);
  } else {
    const weekStartIdx = weekdayToIndex[prefs.weekStart] ?? 1;
    baseStart = startOfWeek(today, weekStartIdx);
  }
  const weekStartIdx = prefs.customStart ? baseStart.getDay() : (weekdayToIndex[prefs.weekStart] ?? 1);
  const offset = (dayIdx - weekStartIdx + 7) % 7;
  const t = new Date(baseStart); t.setDate(baseStart.getDate()+offset); return t;
}
function updateDayDateDisplay(day){
  const el = document.getElementById('day-date'); if (!el) return;
  const t = computeTargetDateForDay(day);
  el.textContent = t.toLocaleDateString(undefined,{weekday:'long', year:'numeric', month:'long', day:'numeric'});
}

// === Rendering ===
function renderListAccordingToPrefs(){
  const root = document.getElementById("grocery-list");
  if (!root) return;
  root.innerHTML = "";

  if (prefs.group){
    const groups = {}; categoryMap.forEach(c=>groups[c.name]=[]);
    currentItems.forEach(item=>groups[getCategory(item)].push(item));
    for (const cat of categoryMap.map(c=>c.name)){
      const arr = groups[cat]; if (!arr || arr.length===0) continue;
      const header = document.createElement("div"); header.className="category-header"; header.textContent = cat; root.appendChild(header);
      const ul = document.createElement("ul"); ul.className="category-list";
      arr.forEach(i=>{ const li=document.createElement("li"); li.textContent = prefs.qty ? `${i} — ${quantityFor(i)}` : i; ul.appendChild(li); });
      root.appendChild(ul);
    }
  } else {
    currentItems.forEach(i=>{ const li=document.createElement("li"); li.textContent = prefs.qty ? `${i} — ${quantityFor(i)}` : i; root.appendChild(li); });
  }
}

// === Recipes ===
let recipesData = {};
function loadRecipes(day){
  fetch('data/recipes.json').then(r=>r.json()).then(data=>{recipesData=data; displayRecipes(day);});
}
function displayRecipes(day){
  const info = recipesData[day];
  const titleEl = document.getElementById('recipe-title');
  const linksEl = document.getElementById('recipe-links');
  if (!titleEl || !linksEl) return;
  linksEl.innerHTML = "";
  if (info){
    titleEl.textContent = `🍽️ Meals for ${day.charAt(0).toUpperCase()+day.slice(1)}`;
    info.meals.forEach((meal, idx)=>{
      const li=document.createElement('li'); const a=document.createElement('a');
      a.href = info.links[idx]; a.textContent = meal; a.target="_blank"; li.appendChild(a); linksEl.appendChild(li);
    });
  } else { titleEl.textContent = ''; }
}

// === Load Day ===
function loadDay(day){
  currentDay = day.toLowerCase();
  const dropdown=document.getElementById('day-select'); if (dropdown) dropdown.value=currentDay;
  updateDayDateDisplay(currentDay);

  fetch(`data/${currentDay}_grocery.json`)
    .then(res=>{ if(!res.ok) throw new Error('Failed to load '+currentDay); return res.json(); })
    .then(data=>{
      currentItems = Array.isArray(data.ingredients)? data.ingredients.slice(): [];
      renderListAccordingToPrefs();
      displayRecipes(currentDay);
    })
    .catch(err=>{
      console.error(err);
      currentItems = [];
      const root=document.getElementById('grocery-list'); if (root){ root.innerHTML=''; const li=document.createElement('li'); li.textContent='Could not load grocery list for '+currentDay; root.appendChild(li); }
    });
}

// === Share/Print/Copy ===
document.getElementById('share-btn')?.addEventListener('click', async ()=>{
  const day = currentDay || 'monday';
  const shareUrl = `${window.location.origin}${window.location.pathname}?day=${day}`;
  const text = `🥢 Here's the grocery list for ${day.charAt(0).toUpperCase()+day.slice(1)}: ${shareUrl}`;
  try{
    if (navigator.share){ await navigator.share({ title:`Grocery List for ${day}`, text, url:shareUrl }); }
    else { await navigator.clipboard.writeText(text); }
    const s=document.getElementById('share-status'); if(s){ s.textContent='✅ Link ready to share!'; s.style.display='block'; setTimeout(()=>s.style.display='none', 2000); }
  }catch{}
});
document.getElementById('print-btn')?.addEventListener('click', ()=>window.print());

function buildFlatText(){ return currentItems.map(i=> prefs.qty? `- ${i} — ${quantityFor(i)}`:`- ${i}`).join("\n"); }
function buildCategorizedText(){
  const groups={}; categoryMap.forEach(c=>groups[c.name]=[]);
  currentItems.forEach(i=>groups[getCategory(i)].push(i));
  let out=[]; for(const cat of categoryMap.map(c=>c.name)){ const arr=groups[cat]; if(!arr||arr.length===0) continue; out.push(`${cat}:`); arr.forEach(i=> out.push(prefs.qty? ` - ${i} — ${quantityFor(i)}`:` - ${i}`)); out.push(''); }
  return out.join("\n").trim();
}
document.getElementById('copy-btn')?.addEventListener('click', async ()=>{
  await navigator.clipboard.writeText(prefs.group? buildCategorizedText(): buildFlatText());
  const s=document.getElementById('share-status'); if(s){ s.textContent='✅ Grocery items copied!'; s.style.display='block'; setTimeout(()=>s.style.display='none', 2000); }
});
document.getElementById('copy-by-category-btn')?.addEventListener('click', async ()=>{
  await navigator.clipboard.writeText(buildCategorizedText());
  const s=document.getElementById('share-status'); if(s){ s.textContent='✅ Categorized groceries copied!'; s.style.display='block'; setTimeout(()=>s.style.display='none', 2000); }
});

// === Settings Modal ===
const modal = document.getElementById('settings-modal');
const btnOpen = document.getElementById('settings-btn');
const btnClose = document.getElementById('settings-close');
const chkGroup = document.getElementById('pref-group');
const chkQty = document.getElementById('pref-qty');
const radioNext = document.getElementById('pref-date-next');
const radioWeek = document.getElementById('pref-date-week');
const selWeekStart = document.getElementById('pref-week-start');
const inputCustomStart = document.getElementById('pref-custom-start');
const weekOptions = document.getElementById('week-options');

function syncDateUI(){
  radioNext.checked = (prefs.dateMode==='next');
  radioWeek.checked = (prefs.dateMode==='week');
  weekOptions.style.display = prefs.dateMode==='week' ? 'block':'none';
  selWeekStart.value = prefs.weekStart;
  inputCustomStart.value = prefs.customStart;
}
function syncSettingsUI(){
  chkGroup.checked = !!prefs.group;
  chkQty.checked = !!prefs.qty;
  syncDateUI();
}
btnOpen?.addEventListener('click', ()=>{ syncSettingsUI(); modal.classList.add('show'); modal.setAttribute('aria-hidden','false'); });
btnClose?.addEventListener('click', ()=>{
  prefs.group = chkGroup.checked;
  prefs.qty = chkQty.checked;
  prefs.dateMode = radioWeek.checked ? 'week':'next';
  prefs.weekStart = selWeekStart.value;
  prefs.customStart = inputCustomStart.value || '';
  savePrefs();
  modal.classList.remove('show'); modal.setAttribute('aria-hidden','true');
  if (currentDay){ updateDayDateDisplay(currentDay); renderListAccordingToPrefs(); }
});
modal?.addEventListener('click',(e)=>{ if(e.target===modal){ btnClose.click(); } });
radioNext?.addEventListener('change', ()=>{ prefs.dateMode='next'; syncDateUI(); });
radioWeek?.addEventListener('change', ()=>{ prefs.dateMode='week'; syncDateUI(); });
selWeekStart?.addEventListener('change', ()=>{ if (radioWeek.checked && currentDay) updateDayDateDisplay(currentDay); });
inputCustomStart?.addEventListener('change', ()=>{ if (radioWeek.checked && currentDay) updateDayDateDisplay(currentDay); });

// === About (reads from CHANGELOG.md) + footer version ===
function parseLatestFromChangelog(md){
  const lines = md.split('\n'); let version=null,date=null,codename='';
  for (let i=0;i<lines.length;i++){
    const m = lines[i].match(/^## \[(.*?)\] — (.*)$/);
    if (m){ version=m[1]; date=m[2]; if (lines[i+1]?.startsWith('**Codename:**')) codename = lines[i+1].replace('**Codename:**','').trim(); break; }
  }
  return {version,date,codename};
}
function extractSectionAfterHeader(md){
  const lines=md.split('\n'); let start=-1; let buf=[];
  for (let i=0;i<lines.length;i++){
    if (lines[i].match(/^## \[/)){ start = i; break; }
  }
  if (start<0) return '';
  for (let j=start+2; j<lines.length; j++){
    if (lines[j].match(/^## \[/)) break;
    buf.push(lines[j]);
  }
  return buf.join('\n').trim();
}
function loadChangelogAndShowAbout(){
  fetch('CHANGELOG.md').then(r=>r.text()).then(md=>{
    const info = parseLatestFromChangelog(md);
    const section = extractSectionAfterHeader(md);
    const modalDiv = document.createElement('div');
    modalDiv.className='modal show';
    modalDiv.innerHTML = `
      <div class="modal-content">
        <h3>About Grocery Planner</h3>
        <p><strong>Version:</strong> ${info.version || '?'} ${info.codename? '“'+info.codename+'”':''}</p>
        <p><strong>Release date:</strong> ${info.date || ''}</p>
        <h4>Changelog</h4>
        <pre style="white-space:pre-wrap; background:#f9f9f9; padding:.5em; border-radius:6px;">${section}</pre>
        <div class="modal-actions">
          <button id="about-close">Close</button>
        </div>
      </div>`;
    document.body.appendChild(modalDiv);
    modalDiv.addEventListener('click', (e)=>{ if (e.target===modalDiv) modalDiv.remove(); });
    modalDiv.querySelector('#about-close')?.addEventListener('click', ()=> modalDiv.remove());
  });
}
document.getElementById('about-btn')?.addEventListener('click', loadChangelogAndShowAbout);

function updateFooterVersion(){
  fetch('CHANGELOG.md').then(r=>r.text()).then(md=>{
    const info = parseLatestFromChangelog(md);
    const el = document.getElementById('version-span');
    if (el && info.version){ el.textContent = `Grocery Planner — v${info.version} ${info.codename? '“'+info.codename+'”':''}`; }
  }).catch(()=>{});
}

// === What's New Toast ===
const TOAST_KEY = 'gp_seen_version';
function showWhatsNewToast(info){
  if (!info.version) return;
  const lastSeen = localStorage.getItem(TOAST_KEY);
  if (lastSeen === info.version) return;
  const toast = document.getElementById('whats-new-toast');
  toast.innerHTML = `<span>🎉 Updated to <strong>v${info.version}</strong>${info.codename? ' “'+info.codename+'”':''}</span>
    <a href="#" id="whats-new-about">What’s new</a>
    <button id="whats-new-dismiss">OK</button>`;
  toast.classList.add('show');
  document.getElementById('whats-new-dismiss')?.addEventListener('click', ()=>{ toast.classList.remove('show'); localStorage.setItem(TOAST_KEY, info.version); });
  document.getElementById('whats-new-about')?.addEventListener('click', (e)=>{ e.preventDefault(); loadChangelogAndShowAbout(); });
}
function checkWhatsNew(){
  fetch('CHANGELOG.md').then(r=>r.text()).then(md=>{
    const info = parseLatestFromChangelog(md);
    showWhatsNewToast(info);
    updateFooterVersion();
  }).catch(()=>{});
}

// === Onboarding ===
const ONBOARD_KEY='gp_seen_onboarding_v1';
function maybeShowOnboarding(){
  try{ const seen = JSON.parse(localStorage.getItem(ONBOARD_KEY) ?? 'false'); if (!seen) openOnboarding(); }catch{ openOnboarding(); }
}
function openOnboarding(){
  const el=document.getElementById('onboard'); if(!el) return;
  el.classList.remove('hidden'); el.setAttribute('aria-hidden','false');
}
function closeOnboarding(persist){
  const el=document.getElementById('onboard'); if(!el) return;
  el.classList.add('hidden'); el.setAttribute('aria-hidden','true');
  if (persist) localStorage.setItem(ONBOARD_KEY, 'true');
}
document.getElementById('onboard-close')?.addEventListener('click', ()=>{
  const dont=document.getElementById('dont-show-again'); closeOnboarding(dont?.checked);
});
document.getElementById('onboard')?.addEventListener('click', (e)=>{ if (e.target.id==='onboard') closeOnboarding(false); });

// === Init ===
document.addEventListener('DOMContentLoaded', ()=>{
  // Help button next to Settings
  document.getElementById('settings-btn')?.insertAdjacentHTML('afterend','<button id="help-btn" title="Show quick guide">❓ Help</button>');
  document.getElementById('help-btn')?.addEventListener('click', ()=> openOnboarding());

  // Day selection
  document.getElementById('day-select')?.addEventListener('change', function(){ loadDay(this.value); });

  // Initial day
  const dayParam = (new URLSearchParams(location.search).get('day') || new Date().toLocaleString('en-US',{weekday:'long'}).toLowerCase());
  loadRecipes(dayParam);
  loadDay(dayParam);

  // Onboarding + What's New
  maybeShowOnboarding();
  checkWhatsNew();
});