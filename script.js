// State
let currentDay = null;
let currentItems = [];

// Preferences
const PREF_GROUP='pref_group', PREF_QTY='pref_qty',
      PREF_DATE_MODE='pref_date_mode', PREF_WEEK_START='pref_week_start', PREF_CUSTOM_START='pref_custom_start';
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

// Categories & quantities
const categoryMap = [
  { name: "Produce", patterns: [/lettuce/i,/mushroom/i,/\bbell\s*pepper/i,/\bpepper(s)?\b(?!\s*sauce)/i,/(snow|snap)\s*pea/i,/\bbasil\b/i,/thai\s*chil/i,/\bchili(?!\s*paste|\s*sauce)/i,/\bgarlic\b/i,/\bginger\b/i,/\blime\b/i,/shallot/i,/(green\s*onion|scallion)/i,/\bcucumber\b/i,/\bcarrot/i,/bok\s*choy/i,/\bspinach\b/i,/eggplant/i,/\bmint\b/i,/\blemongrass\b/i,/\bdaikon\b/i,/kaffir\s*lime\s*leaves?/i]},
  { name: "Protein", patterns: [/\bchicken\b/i,/\bshrimp\b/i,/\bfish\b/i,/\btilapia\b/i,/\bcod\b/i,/\bturkey\b/i,/\btofu\b/i,/\beggs?\b/i]},
  { name: "Sauces/Condiments", patterns: [/low\s*sodium\s*soy|soy\s*sauce/i,/fish\s*sauce/i,/oyster\s*sauce/i,/sesame\s*oil/i,/rice\s*vinegar/i,/chili\s*(paste|sauce)|sambal/i,/peanut\s*butter/i,/coconut\s*milk/i,/black\s*bean\s*(paste|sauce)?/i,/miso\s*paste/i]},
  { name: "Noodles/Rice", patterns: [/rice\s*paper/i,/glass\s*noodles?|bean\s*thread/i,/(jasmine|brown)\s*rice/i,/rice\s*noodles?|vermicelli/i]},
  { name: "Sweeteners", patterns: [/palm\s*sugar/i,/\bhoney\b/i,/\bsugar\b/i,/sweetener/i]},
  { name: "Spices/Seasonings", patterns: [/dried\s*chil/i,/kaffir\s*lime\s*leaves?/i,/toasted\s*rice(\s*powder)?/i,/curry\s*paste/i,/five\s*spice/i,/sichuan|szechuan/i,/star\s*anise/i,/white\s*pepper/i]},
  { name: "Other", patterns: [] }
];
function normalizeItem(str){ return str.replace(/\s*\(.*?\)\s*/g,'').trim(); }
function getCategory(item){
  const clean = normalizeItem(item);
  for(const cat of categoryMap){ if(cat.patterns.some(rx=>rx.test(clean))) return cat.name; }
  return "Other";
}
function quantityFor(item){
  const clean = normalizeItem(item).toLowerCase();
  const pairs = [
    [/green\s*onion|scallion/i,"1 bunch"],[/shallot/i,"3–4"],[/bell\s*pepper/i,"2"],[/(snow|snap)\s*pea/i,"8 oz"],
    [/mushroom/i,"8–12 oz"],[/eggplant/i,"2"],[/spinach/i,"1 small bag"],[/bok\s*choy/i,"1 lb"],[/lemongrass/i,"2 stalks"],
    [/daikon/i,"1 small"],[/coconut\s*milk/i,"1 can"],[/soy\s*sauce/i,"1 bottle"],[/fish\s*sauce/i,"1 bottle"],
    [/rice\s*vinegar/i,"1 bottle"],[/sesame\s*oil/i,"1 small bottle"],[/chili\s*(paste|sauce)|sambal/i,"1 jar"],
    [/peanut\s*butter/i,"1 small jar"],[/glass\s*noodle|bean\s*thread/i,"1 pack"],[/rice\s*paper/i,"1 pack"],
    [/(jasmine|brown)\s*rice/i,"1–2 cups dry"],[/rice\s*noodle|vermicelli/i,"1 pack"],[/palm\s*sugar|honey/i,"1 small jar"],
    [/toasted\s*rice(\s*powder)?/i,"small bag"],[/curry\s*paste/i,"1 small jar"],[/white\s*pepper/i,"small tin"],
    [/chicken\b(?!\s*stock)/i,"1.5–2 lb"],[/ground\s*(chicken|turkey)/i,"1 lb"],[/shrimp/i,"1 lb"],/\b(cod|tilapia|fish)\b/i,"2 fillets",
    [/egg(s)?\b/i,"1 dozen"],[/lime\b/i,"2"],[/garlic\b/i,"1 bulb"],[/ginger\b/i,"1 small knob"],[/basil\b/i,"1 small bunch"],[/mint\b/i,"1 small bunch"],[/chil/i,"4–6"]
  ]
  for(let i=0;i<pairs.length;i++){
    const rx = pairs[i][0]; const hint = pairs[i][1];
    if(rx.test(clean)) return hint;
  }
  return "1 unit";
}

// Date logic
const weekdayToIndex = { sunday:0,monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6 };
function startOfWeek(date, weekStartIdx){
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = (d.getDay() - weekStartIdx + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}
function computeTargetDateForDay(dayName){
  const dayIdx = weekdayToIndex[dayName.toLowerCase()];
  const today = new Date();
  if(prefs.dateMode === 'next'){
    const diff = (dayIdx - today.getDay() + 7) % 7;
    const t = new Date(today); t.setDate(today.getDate()+diff); return t;
  }
  let baseStart;
  if(prefs.customStart){
    const [yyyy,mm,dd] = prefs.customStart.split('-').map(Number);
    baseStart = new Date(yyyy, mm-1, dd);
  } else {
    const weekStartIdx = weekdayToIndex[prefs.weekStart] ?? 1;
    baseStart = startOfWeek(today, weekStartIdx);
  }
  const weekStartIdx = prefs.customStart ? baseStart.getDay() : (weekdayToIndex[prefs.weekStart] ?? 1);
  const offset = (dayIdx - weekStartIdx + 7) % 7;
  const t = new Date(baseStart); t.setDate(baseStart.getDate()+offset); return t;
}
function updateDayDateDisplay(day){
  const el = document.getElementById('day-date'); if(!el) return;
  const t = computeTargetDateForDay(day);
  el.textContent = t.toLocaleDateString(undefined,{weekday:'long', year:'numeric', month:'long', day:'numeric'});
}

// Rendering
function renderListAccordingToPrefs(){
  const root = document.getElementById("grocery-list"); if(!root) return;
  root.innerHTML = "";
  if(prefs.group){
    const groups = {}; categoryMap.forEach(c=>groups[c.name]=[]);
    currentItems.forEach(item=>groups[getCategory(item)].push(item));
    for(const cat of categoryMap.map(c=>c.name)){
      const group = groups[cat]; if(!group || group.length===0) continue;
      const header = document.createElement("div"); header.className="category-header"; header.textContent=cat; root.appendChild(header);
      const ul = document.createElement("ul"); ul.className="category-list";
      group.forEach(i=>{ const li=document.createElement("li"); li.textContent = prefs.qty? `${i} — ${quantityFor(i)}`:i; ul.appendChild(li); });
      root.appendChild(ul);
    }
  } else {
    currentItems.forEach(i=>{ const li=document.createElement("li"); li.textContent = prefs.qty? `${i} — ${quantityFor(i)}`:i; root.appendChild(li); });
  }
}

// Recipes
let recipesData=null;
function displayRecipes(day){
  if(recipesData){
    renderRecipes(day); return;
  }
  fetch('data/recipes.json').then(r=>r.json()).then(d=>{ recipesData=d; renderRecipes(day); }).catch(()=>{});
}
function renderRecipes(day){
  const info = recipesData?.[day]; const titleEl = document.getElementById('recipe-title'); const linksEl = document.getElementById('recipe-links');
  linksEl.innerHTML='';
  if(info){
    titleEl.textContent = `🍽️ Meals for ${day.charAt(0).toUpperCase()+day.slice(1)}`;
    info.meals.forEach((meal,i)=>{ const li=document.createElement('li'); const a=document.createElement('a'); a.href=info.links[i]; a.textContent=meal; a.target="_blank"; li.appendChild(a); linksEl.appendChild(li); });
  } else { titleEl.textContent=''; }
}

// Load a day
function loadDay(day){
  currentDay = day.toLowerCase();
  const dd=document.getElementById('day-select'); if(dd) dd.value=currentDay;
  updateDayDateDisplay(currentDay);
  fetch(`data/${currentDay}_grocery.json`).then(res=>{
    if(!res.ok) throw new Error('Failed to load '+currentDay);
    return res.json();
  }).then(data=>{
    currentItems = Array.isArray(data.ingredients)? data.ingredients.slice():[];
    renderListAccordingToPrefs();
    displayRecipes(currentDay);
  }).catch(err=>{
    console.error(err); currentItems=[]; const root=document.getElementById('grocery-list'); if(root){ root.innerHTML=''; const li=document.createElement('li'); li.textContent='Could not load data. Check filenames in /data.'; root.appendChild(li); }
  });
}

// Share / Print / Copy
document.getElementById('share-btn')?.addEventListener('click', async ()=>{
  const day = document.getElementById('day-select').value;
  const shareUrl = `${location.origin}${location.pathname}?day=${day}`;
  const shareText = `🥢 Here's the grocery list for ${day.charAt(0).toUpperCase()+day.slice(1)}: ${shareUrl}`;
  try{
    if(navigator.share){ await navigator.share({title:`Grocery List for ${day}`, text:shareText, url:shareUrl}); }
    else { await navigator.clipboard.writeText(shareText); }
    const s=document.getElementById('share-status'); if(s){ s.textContent='✅ Link ready!'; s.style.display='block'; setTimeout(()=>s.style.display='none',2000); }
  }catch(e){ console.error(e); }
});
document.getElementById('print-btn')?.addEventListener('click', ()=>window.print());

function buildFlatText(){ return currentItems.map(i=> prefs.qty? `- ${i} — ${quantityFor(i)}`:`- ${i}`).join('\n'); }
function buildCategorizedText(){
  const groups={}; categoryMap.forEach(c=>groups[c.name]=[]); currentItems.forEach(i=>groups[getCategory(i)].push(i));
  let out=[]; for(const cat of categoryMap.map(c=>c.name)){ const list=groups[cat]; if(!list||list.length===0) continue; out.push(`${cat}:`); list.forEach(i=> out.push(prefs.qty? ` - ${i} — ${quantityFor(i)}`:` - ${i}`)); out.push(''); }
  return out.join('\n').trim();
}
document.getElementById('copy-btn')?.addEventListener('click', async ()=>{
  await navigator.clipboard.writeText(prefs.group? buildCategorizedText(): buildFlatText());
  const s=document.getElementById('share-status'); if(s){ s.textContent='✅ Grocery items copied!'; s.style.display='block'; setTimeout(()=>s.style.display='none',2000); }
});
document.getElementById('copy-by-category-btn')?.addEventListener('click', async ()=>{
  await navigator.clipboard.writeText(buildCategorizedText());
  const s=document.getElementById('share-status'); if(s){ s.textContent='✅ Categorized groceries copied!'; s.style.display='block'; setTimeout(()=>s.style.display='none',2000); }
});

// Settings modal inline
const modalHtml = `
<div id="settings-modal" class="modal" aria-hidden="true">
  <div class="modal-content">
    <h3>Preferences</h3>
    <label class="switch-row"><input type="checkbox" id="pref-group"> <span>Group items by category</span></label>
    <label class="switch-row"><input type="checkbox" id="pref-qty"> <span>Show quantities</span></label>
    <hr style="margin:.6rem 0; opacity:.25;">
    <h4 style="margin:.3rem 0 .4rem; color:#FF8C42;">Date Options</h4>
    <div class="switch-row" style="gap:.4rem;">
      <input type="radio" name="pref-date-mode" id="pref-date-next" value="next">
      <label for="pref-date-next">Next occurrence</label>
    </div>
    <div class="switch-row" style="gap:.4rem;">
      <input type="radio" name="pref-date-mode" id="pref-date-week" value="week">
      <label for="pref-date-week">This week (Mon–Sun)</label>
    </div>
    <div id="week-options" style="margin-left:1.6rem; display:none;">
      <label class="switch-row" style="gap:.6rem;">
        <span>Week starts on</span>
        <select id="pref-week-start">
          <option value="monday">Monday</option>
          <option value="tuesday">Tuesday</option>
          <option value="wednesday">Wednesday</option>
          <option value="thursday">Thursday</option>
          <option value="friday">Friday</option>
          <option value="saturday">Saturday</option>
          <option value="sunday">Sunday</option>
        </select>
      </label>
      <label class="switch-row" style="gap:.6rem;">
        <span>Custom week start (optional)</span>
        <input type="date" id="pref-custom-start">
      </label>
      <small style="opacity:.7; margin-left:.2rem;">If set, your week is the 7 days starting from this date.</small>
    </div>
    <div class="modal-actions"><button id="settings-close">Done</button></div>
  </div>
</div>`;
document.body.insertAdjacentHTML('beforeend', modalHtml);
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
  radioNext.checked = (prefs.dateMode==='next'); radioWeek.checked = (prefs.dateMode==='week');
  weekOptions.style.display = prefs.dateMode==='week' ? 'block':'none';
  selWeekStart.value = prefs.weekStart; inputCustomStart.value = prefs.customStart;
}
function syncSettingsUI(){
  chkGroup.checked = !!prefs.group; chkQty.checked = !!prefs.qty; syncDateUI();
}
btnOpen?.addEventListener('click', ()=>{ syncSettingsUI(); modal.classList.add('show'); modal.style.display='block'; modal.setAttribute('aria-hidden','false'); });
btnClose?.addEventListener('click', ()=>{
  prefs.group = chkGroup.checked; prefs.qty = chkQty.checked;
  prefs.dateMode = radioWeek.checked ? 'week' : 'next';
  prefs.weekStart = selWeekStart.value;
  prefs.customStart = inputCustomStart.value || '';
  savePrefs();
  modal.classList.remove('show'); modal.style.display='none'; modal.setAttribute('aria-hidden','true');
  if(currentDay){ updateDayDateDisplay(currentDay); renderListAccordingToPrefs(); }
});
radioNext?.addEventListener('change', ()=>{ prefs.dateMode='next'; syncDateUI(); });
radioWeek?.addEventListener('change', ()=>{ prefs.dateMode='week'; syncDateUI(); });
selWeekStart?.addEventListener('change', ()=>{ if(radioWeek.checked && currentDay) updateDayDateDisplay(currentDay); });
inputCustomStart?.addEventListener('change', ()=>{ if(radioWeek.checked && currentDay) updateDayDateDisplay(currentDay); });
modal?.addEventListener('click', (e)=>{ if(e.target===modal){ btnClose.click(); } });

// Onboarding
const ONBOARD_KEY='gp_seen_onboarding_v1';
function maybeShowOnboarding(){ try{ const seen = JSON.parse(localStorage.getItem(ONBOARD_KEY) ?? 'false'); if(!seen) openOnboarding(); }catch{ openOnboarding(); } }
function openOnboarding(){ const el=document.getElementById('onboard'); if(!el) return; el.classList.remove('hidden'); el.setAttribute('aria-hidden','false'); }
function closeOnboarding(persist){ const el=document.getElementById('onboard'); if(!el) return; el.classList.add('hidden'); el.setAttribute('aria-hidden','true'); if(persist) localStorage.setItem(ONBOARD_KEY,'true'); }
document.getElementById('onboard-close')?.addEventListener('click', ()=>{ const dont=document.getElementById('dont-show-again'); closeOnboarding(dont?.checked); });
document.getElementById('onboard')?.addEventListener('click', (e)=>{ if(e.target.id==='onboard') closeOnboarding(false); });

// Day select
document.getElementById('day-select').addEventListener('change', function(){ loadDay(this.value); });

// Initial load
document.addEventListener('DOMContentLoaded', ()=>{
  const dayParam = (new URLSearchParams(location.search).get('day') || new Date().toLocaleString('en-US',{weekday:'long'}).toLowerCase());
  loadDay(dayParam);
  maybeShowOnboarding();
});

// About (reads CHANGELOG.md)
document.getElementById('about-btn')?.addEventListener('click', ()=>{
  fetch('CHANGELOG.md').then(r=>r.text()).then(md=>{
    const versionInfo = extractLatestVersion(md);
    showAboutModal(versionInfo);
  });
});
function extractLatestVersion(markdown){
  const lines = markdown.split('\n');
  let version='Unknown', codename='', date='', changelog=[];
  for(let i=0;i<lines.length;i++){
    const m = lines[i].match(/^## \[(.*?)\] — (.*)$/);
    if(m){ version=m[1]; date=m[2]; if(lines[i+1]?.startsWith('**Codename:**')) codename=lines[i+1].replace('**Codename:**','').trim();
      for(let j=i+2;j<lines.length;j++){ if(lines[j].startsWith('## [')) break; changelog.push(lines[j]); } break; }
  }
  // update footer version
  const foot=document.getElementById('app-footer'); if(foot){ foot.querySelector('span').textContent = `Grocery Planner — v${version} "${codename}"`; }
  return {version, codename, date, notes: changelog.join('\n')};
}
function showAboutModal(info){
  const modal = document.createElement('div');
  modal.className='about-modal';
  modal.innerHTML = `<div class="about-content">
    <h2>About Grocery Planner</h2>
    <p><strong>Version:</strong> ${info.version} "${info.codename}"</p>
    <p><strong>Release date:</strong> ${info.date}</p>
    <h3>Changelog</h3>
    <pre style="text-align:left; white-space:pre-wrap;">${info.notes}</pre>
    <button id="about-close">Close</button>
  </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#about-close').addEventListener('click', ()=> modal.remove());
}
