
/***** GLOBAL STATE & PREFS *****/
let currentDay = null;
let currentItems = [];
let manifest = {};
const BUILD_TAG = 'v1.0.9.2';

const PREF_GROUP = 'pref_group';
const PREF_QTY = 'pref_qty';
const PREF_DATE_MODE = 'pref_date_mode'; // 'next'|'week'
const PREF_WEEK_START = 'pref_week_start';
const PREF_CUSTOM_START = 'pref_custom_start';
const PREF_IMG_STYLE = 'pref_image_style';
const ONBOARD_KEY = 'gp_seen_onboarding_v1';
const TOAST_KEY = 'gp_seen_version';

const prefs = {
  group: JSON.parse(localStorage.getItem(PREF_GROUP) ?? 'true'),
  qty: JSON.parse(localStorage.getItem(PREF_QTY) ?? 'true'),
  dateMode: localStorage.getItem(PREF_DATE_MODE) || 'next',
  weekStart: localStorage.getItem(PREF_WEEK_START) || 'monday',
  customStart: localStorage.getItem(PREF_CUSTOM_START) || '',
  imgStyle: localStorage.getItem(PREF_IMG_STYLE) || 'illustration'
};

function savePrefs(){
  localStorage.setItem(PREF_GROUP, JSON.stringify(prefs.group));
  localStorage.setItem(PREF_QTY, JSON.stringify(prefs.qty));
  localStorage.setItem(PREF_DATE_MODE, prefs.dateMode);
  localStorage.setItem(PREF_WEEK_START, prefs.weekStart);
  localStorage.setItem(PREF_CUSTOM_START, prefs.customStart);
  localStorage.setItem(PREF_IMG_STYLE, prefs.imgStyle);
}

/***** CATEGORY & QUANTITY *****/
const categoryMap = [
  { name: "Produce", patterns: [
    /lettuce/i,/mushroom/i,/bell\s*pepper/i,/(snow|snap)\s*pea/i,/basil/i,/thai\s*chil/i,/\bchili(?!\s*(paste|sauce))/i,
    /\bgarlic\b/i,/\bginger\b/i,/\blime\b/i,/shallot/i,/(green\s*onion|scallion)/i,/\bcucumber\b/i,/\bcarrot/i,
    /bok\s*choy/i,/\bspinach\b/i,/eggplant/i,/\bmint\b/i,/\blemongrass\b/i,/\bdaikon\b/i,/kaffir\s*lime\s*leaves?/i,
    /tomato/i,/dill/i,/long\s*beans?/i/
  ]},
  { name: "Protein", patterns: [/\bchicken\b/i,/\bshrimp\b/i,/\bfish\b/i,/\btilapia\b/i,/\bcod\b/i,/\bturkey\b/i,/\btofu\b/i,/\beggs?\b/i,/\bbeef\b/i]},
  { name: "Sauces/Condiments", patterns: [/soy\s*sauce/i,/fish\s*sauce/i,/oyster\s*sauce/i,/sesame\s*oil/i,/rice\s*vinegar/i,/chili\s*(paste|sauce)|sambal/i,/peanut\s*butter/i,/coconut\s*milk/i,/black\s*bean/i]},
  { name: "Noodles/Rice", patterns: [/rice\s*paper/i,/glass\s*noodles?|bean\s*thread/i,/(jasmine|sticky|brown)\s*rice/i,/rice\s*noodles?|vermicelli/i]},
  { name: "Sweeteners", patterns: [/palm\s*sugar/i,/\bhoney\b/i,/\bsugar\b/i,/sweetener/i]},
  { name: "Spices/Seasonings", patterns: [/dried\s*chil/i,/toasted\s*rice(\s*powder)?/i,/miso\s*paste/i,/curry\s*paste/i,/five\s*spice/i,/sichuan|szechuan/i,/star\s*anise/i,/white\s*pepper/i,/turmeric/i]},
  { name: "Other", patterns: [] }
];
function normalizeItem(str){ return str.replace(/\s*\(.*?\)\s*/g,'').trim(); }
function getCategory(item){
  const clean = normalizeItem(item);
  for (const cat of categoryMap){ if (cat.patterns.some(rx => rx.test(clean))) return cat.name; }
  return "Other";
}
function quantityFor(item){
  const clean = normalizeItem(item).toLowerCase();
  const pairs = [
    [/(green\s*onion|scallion)/i, "1 bunch"], [/shallot/i, "3–4"], [/bell\s*pepper/i, "2"],
    [/(snow|snap)\s*pea/i, "8 oz"], [/mushroom/i, "8–12 oz"], [/eggplant/i, "2"], [/spinach/i, "1 small bag"],
    [/bok\s*choy/i, "1 lb"], [/lemongrass/i, "2 stalks"], [/daikon/i, "1 small"],
    [/coconut\s*milk/i, "1 can"], [/soy\s*sauce/i, "1 bottle"], [/fish\s*sauce/i, "1 bottle"],
    [/rice\s*vinegar/i, "1 bottle"], [/sesame\s*oil/i, "1 small bottle"], [/chili\s*(paste|sauce)|sambal/i, "1 jar"],
    [/peanut\s*butter/i, "1 small jar"], [/glass\s*noodle|bean\s*thread/i, "1 pack"],
    [/rice\s*paper/i, "1 pack"], [/(jasmine|brown|sticky)\s*rice/i, "1–2 cups dry"],
    [/rice\s*noodle|vermicelli/i, "1 pack"], [/palm\s*sugar|honey/i, "1 small jar"],
    [/toasted\s*rice(\s*powder)?/i, "small bag"], [/curry\s*paste/i, "1 small jar"], [/white\s*pepper/i, "small tin"],
    [/chicken\b(?!\s*stock)/i, "1.5–2 lb"], [/beef\b/i, "1.5 lb"], [/ground\s*(chicken|turkey)/i, "1 lb"],
    [/shrimp/i, "1 lb"], /\b(cod|tilapia|fish)\b/i, [/egg(s)?\b/i, "1 dozen"], [/lime\b/i, "2"], [/garlic\b/i, "1 bulb"],
    [/ginger\b/i, "1 small knob"], [/basil\b/i, "1 small bunch"], [/mint\b/i, "1 small bunch"], [/chil/i, "4–6"]
  ];
  for (const p of pairs){
    if (p instanceof Array){
      const [rx, hint] = p;
      if (rx.test(clean)) return hint;
    }else{
      // shouldn't happen
    }
  }
  return "1 unit";
}

/***** DATE LOGIC *****/
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
  if (prefs.dateMode === 'next'){
    const diff = (dayIdx - today.getDay() + 7) % 7;
    const target = new Date(today);
    target.setDate(today.getDate() + diff);
    return target;
  }
  // week mode
  let baseStart;
  if (prefs.customStart){
    const [yyyy, mm, dd] = prefs.customStart.split('-').map(Number);
    baseStart = new Date(yyyy, mm-1, dd);
  }else{
    const weekStartIdx = weekdayToIndex[prefs.weekStart] ?? 1;
    baseStart = startOfWeek(today, weekStartIdx);
  }
  const weekStartIdx = prefs.customStart ? baseStart.getDay() : (weekdayToIndex[prefs.weekStart] ?? 1);
  const offset = (dayIdx - weekStartIdx + 7) % 7;
  const target = new Date(baseStart);
  target.setDate(baseStart.getDate() + offset);
  return target;
}
function updateDayDateDisplay(day){
  const el = document.getElementById('day-date');
  if (!el) return;
  const target = computeTargetDateForDay(day);
  el.textContent = target.toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}

/***** MANIFEST LOADER & DAY LOAD *****/
async function loadManifest(){
  if (Object.keys(manifest).length) return;
  const url = `data/manifest.json?v=${BUILD_TAG}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Manifest load failed: ${res.status}`);
  manifest = await res.json();
}
function renderError(msg){
  const root = document.getElementById("grocery-list");
  if (!root) return;
  root.innerHTML = `<div class="category-header">Error</div><ul class="category-list"><li>${msg}</li></ul>`;
}
async function loadDay(day){
  currentDay = day.toLowerCase();
  const dd = document.getElementById('day-select'); if (dd) dd.value = currentDay;
  updateDayDateDisplay(currentDay);
  try{
    await loadManifest();
    const path = manifest[currentDay];
    if (!path) throw new Error(`No entry for "${currentDay}" in data/manifest.json`);
    const url = `${path}?v=${BUILD_TAG}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`);
    const data = await res.json();
    currentItems = Array.isArray(data.ingredients) ? data.ingredients.slice() : [];
    renderListAccordingToPrefs();
    displayRecipes(currentDay);
  }catch(err){
    console.error(err);
    currentItems = [];
    renderError(`Could not load grocery list for "${currentDay}". Check ${manifest[currentDay]||'data/<day>_grocery.json'} exists and path is correct.`);
  }
}

/***** RENDERING *****/
function renderListAccordingToPrefs(){
  const root = document.getElementById("grocery-list");
  if (!root) return;
  root.innerHTML = "";
  if (prefs.group){
    const groups = {}; categoryMap.forEach(c => groups[c.name]=[]);
    currentItems.forEach(item => groups[getCategory(item)].push(item));
    for (const cat of categoryMap.map(c=>c.name)){
      const arr = groups[cat]; if (!arr || !arr.length) continue;
      const header = document.createElement("div"); header.className="category-header"; header.textContent=cat; root.appendChild(header);
      const ul = document.createElement("ul"); ul.className="category-list";
      arr.forEach(i => { const li=document.createElement("li"); li.textContent = prefs.qty? `${i} — ${quantityFor(i)}`: i; ul.appendChild(li); });
      root.appendChild(ul);
    }
  }else{
    const ul = document.createElement("ul"); ul.className="category-list";
    currentItems.forEach(i => { const li=document.createElement("li"); li.textContent = prefs.qty? `${i} — ${quantityFor(i)}`: i; ul.appendChild(li); });
    root.appendChild(ul);
  }
}

/***** COPY & SHARE & PRINT *****/
function buildFlatText(){ return currentItems.map(i => prefs.qty? `- ${i} — ${quantityFor(i)}`: `- ${i}`).join("\n"); }
function buildCategorizedText(){
  const groups = {}; categoryMap.forEach(c => groups[c.name]=[]);
  currentItems.forEach(item => groups[getCategory(item)].push(item));
  let out=[];
  for (const cat of categoryMap.map(c=>c.name)){
    const arr=groups[cat]; if (!arr || !arr.length) continue;
    out.push(`${cat}:`); arr.forEach(i=> out.push(prefs.qty? ` - ${i} — ${quantityFor(i)}`: ` - ${i}`)); out.push("");
  }
  return out.join("\n").trim();
}
document.addEventListener('click', async (e)=>{
  if (e.target.id==='copy-btn'){ await navigator.clipboard.writeText(prefs.group? buildCategorizedText(): buildFlatText()); flashStatus("✅ Grocery items copied!"); }
  if (e.target.id==='copy-by-category-btn'){ await navigator.clipboard.writeText(buildCategorizedText()); flashStatus("✅ Categorized groceries copied!"); }
  if (e.target.id==='print-btn'){ window.print(); }
  if (e.target.id==='share-btn'){
    const day = currentDay || 'monday';
    const shareUrl = `${location.origin}${location.pathname}?day=${day}`;
    const shareText = `🥢 Grocery list for ${day[0].toUpperCase()+day.slice(1)}: ${shareUrl}`;
    if (navigator.share){ try{ await navigator.share({ title:`Grocery List — ${day}`, text:shareText, url:shareUrl }); }catch{} }
    else{ await navigator.clipboard.writeText(shareText); flashStatus("✅ Link copied to clipboard!"); }
  }
});
function flashStatus(msg){
  const s = document.getElementById('share-status'); if (!s) return;
  s.textContent = msg; s.style.display='block'; setTimeout(()=> s.style.display='none', 2000);
}

/***** SETTINGS MODAL *****/
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
const selImgStyle = document.getElementById('pref-image-style');

function syncDateUI(){
  radioNext.checked = (prefs.dateMode==='next'); radioWeek.checked = (prefs.dateMode==='week');
  weekOptions.style.display = prefs.dateMode==='week' ? 'block' : 'none';
  selWeekStart.value = prefs.weekStart; inputCustomStart.value = prefs.customStart;
}
function syncSettingsUI(){
  chkGroup.checked = !!prefs.group; chkQty.checked = !!prefs.qty; syncDateUI();
  if (selImgStyle) selImgStyle.value = prefs.imgStyle;
}
btnOpen?.addEventListener('click', ()=>{ syncSettingsUI(); modal.classList.add('show'); modal.setAttribute('aria-hidden','false'); });
btnClose?.addEventListener('click', ()=>{
  prefs.group = chkGroup.checked; prefs.qty = chkQty.checked;
  prefs.dateMode = radioWeek.checked ? 'week':'next'; prefs.weekStart = selWeekStart.value; prefs.customStart = inputCustomStart.value || '';
  if (selImgStyle) prefs.imgStyle = selImgStyle.value;
  savePrefs();
  modal.classList.remove('show'); modal.setAttribute('aria-hidden','true');
  if (currentDay){ updateDayDateDisplay(currentDay); renderListAccordingToPrefs(); }
  applyImageStyle();
});
radioNext?.addEventListener('change', ()=>{ prefs.dateMode='next'; syncDateUI(); });
radioWeek?.addEventListener('change', ()=>{ prefs.dateMode='week'; syncDateUI(); });
selWeekStart?.addEventListener('change', ()=>{ if (radioWeek.checked && currentDay) updateDayDateDisplay(currentDay); });
inputCustomStart?.addEventListener('change', ()=>{ if (radioWeek.checked && currentDay) updateDayDateDisplay(currentDay); });
selImgStyle?.addEventListener('change', ()=>{ prefs.imgStyle = selImgStyle.value; savePrefs(); applyImageStyle(); });

/***** RECIPE BANNER *****/
function displayRecipes(day){
  fetch('data/recipes.json').then(r=>r.json()).then(all=>{
    const arr = all[day] || [];
    const title = document.getElementById('recipe-title'); const cards = document.getElementById('recipe-cards');
    title.textContent = arr.length? `🍽️ Meals for ${day[0].toUpperCase()+day.slice(1)}` : '';
    cards.innerHTML = '';
    arr.forEach(rc => {
      const card = document.createElement('div'); card.className='recipe-card';
      const img = document.createElement('img');
      img.setAttribute('data-photo', rc.images.photo);
      img.setAttribute('data-illustration', rc.images.illustration);
      img.alt = rc.name;
      card.appendChild(img);
      const a = document.createElement('a'); a.href = rc.link; a.textContent = rc.name; a.target="_blank";
      card.appendChild(a);
      cards.appendChild(card);
    });
    applyImageStyle(cards);
  }).catch(()=>{});
}

/***** IMAGE STYLE SWAP *****/
function applyImageStyle(scope=document){
  const mode = prefs.imgStyle || 'illustration';
  const imgs = scope.querySelectorAll('img[data-photo][data-illustration]');
  imgs.forEach(img => {
    const src = mode==='photo'? img.dataset.photo : img.dataset.illustration;
    if (img.getAttribute('src') !== src) img.setAttribute('src', src);
  });
}

/***** ONBOARDING *****/
function maybeShowOnboarding(){
  try{ const seen = JSON.parse(localStorage.getItem(ONBOARD_KEY) ?? 'false'); if (!seen) openOnboarding(); }
  catch{ openOnboarding(); }
}
function openOnboarding(){ const el=document.getElementById('onboard'); if (!el) return; el.classList.remove('hidden'); el.setAttribute('aria-hidden','false'); }
function closeOnboarding(persist){ const el=document.getElementById('onboard'); if (!el) return; el.classList.add('hidden'); el.setAttribute('aria-hidden','true'); if (persist) localStorage.setItem(ONBOARD_KEY,'true'); }
document.getElementById('onboard-close')?.addEventListener('click', ()=>{ const dont=document.getElementById('dont-show-again'); closeOnboarding(dont?.checked); });
document.getElementById('onboard')?.addEventListener('click', (e)=>{ if (e.target.id==='onboard') closeOnboarding(false); });

/***** WHAT'S NEW TOAST + ABOUT *****/
function parseLatestFromChangelog(md){
  const lines = md.split('\n'); let version=null, date=null, codename=null;
  for (let i=0;i<lines.length;i++){
    const m = lines[i].match(/^## \[(.*?)\] — (.*)$/); if (m){ version=m[1]; date=m[2]; if (lines[i+1]?.startsWith('**Codename:**')) codename = lines[i+1].replace('**Codename:**','').trim(); break; }
  }
  return {version,date,codename};
}
function showWhatsNewToast(info){
  if (!info.version) return;
  const lastSeen = localStorage.getItem(TOAST_KEY);
  if (lastSeen === info.version) return;
  let toast = document.getElementById('whats-new-toast');
  if (!toast){ toast = document.createElement('div'); toast.id='whats-new-toast'; document.body.appendChild(toast); }
  toast.innerHTML = `<span>🎉 Updated to <strong>v${info.version}</strong>${info.codename?` “${info.codename}”`:''}</span>
    <a href="#" id="whats-new-about">What’s new</a>
    <button id="whats-new-dismiss">OK</button>`;
  toast.classList.add('show');
  document.getElementById('whats-new-dismiss')?.addEventListener('click', ()=>{ toast.classList.remove('show'); localStorage.setItem(TOAST_KEY, info.version); });
  document.getElementById('whats-new-about')?.addEventListener('click', (e)=>{ e.preventDefault(); loadChangelogAndShowAbout(); });
}
function loadChangelogAndShowAbout(){
  fetch('CHANGELOG.md').then(r=>r.text()).then(md=>{
    const info = parseLatestFromChangelog(md);
    showAboutModal(info, md);
  }).catch(()=> alert("Unable to load changelog."));
}
function showAboutModal(info, md){
  const modal = document.createElement('div'); modal.className='about-modal';
  modal.innerHTML = `<div class="about-content">
    <h2>About Grocery Planner</h2>
    <p><strong>Version:</strong> ${info.version||'Unknown'}${info.codename?` “${info.codename}”`:''}</p>
    <p><strong>Release date:</strong> ${info.date||'—'}</p>
    <h3>Changelog</h3>
    <pre style="text-align:left; white-space:pre-wrap;">${md.split('\\n').slice(0,40).join('\\n')}</pre>
    <button id="about-close">Close</button>
  </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#about-close').addEventListener('click', ()=> modal.remove());
}
document.getElementById('about-link')?.addEventListener('click', (e)=>{ e.preventDefault(); loadChangelogAndShowAbout(); });

// simple styles for About
const aboutStyle = document.createElement('style');
aboutStyle.textContent = `.about-modal{position:fixed; inset:0; background:rgba(0,0,0,.35); display:flex; align-items:center; justify-content:center; z-index:1000;}
.about-content{ background:#fff; border-radius:10px; padding:1.2em; max-width:520px; width:90%; box-shadow:0 4px 20px rgba(0,0,0,.2); }
.about-content h2{ margin-top:0; color:#FF8C42; } .about-content pre{ background:#f9f9f9; padding:.6em; border-radius:6px; }`;
document.head.appendChild(aboutStyle);

/***** INITIALIZE *****/
document.addEventListener('DOMContentLoaded', () => {
  const param = new URLSearchParams(location.search).get('day');
  const day = (param || new Date().toLocaleString('en-US', { weekday: 'long' })).toLowerCase();
  // footer version from CHANGELOG
  fetch('CHANGELOG.md').then(r=>r.text()).then(md=>{
    const info = parseLatestFromChangelog(md);
    const f = document.getElementById('footer-version'); if (f && info.version) f.textContent = `Grocery Planner — v${info.version} ${info.codename?('“'+info.codename+'”'):''}`;
    showWhatsNewToast(info);
  }).catch(()=>{});

  // help button next to settings
  document.getElementById('settings-btn')?.insertAdjacentHTML('afterend','<button id="help-btn" title="Show quick guide">❓ Help</button>');
  document.getElementById('help-btn')?.addEventListener('click', ()=> openOnboarding());

  // listeners
  document.getElementById('day-select')?.addEventListener('change', function(){ loadDay(this.value); });

  // start
  loadDay(day);
  maybeShowOnboarding();
  applyImageStyle();
});
