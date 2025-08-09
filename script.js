// State
let currentDay = null;
let currentItems = [];

// Preferences
const PREF_GROUP = 'pref_group';
const PREF_QTY = 'pref_qty';
const PREF_DATE_MODE = 'pref_date_mode'; // 'next' | 'week'
const PREF_WEEK_START = 'pref_week_start'; // weekday
const PREF_CUSTOM_START = 'pref_custom_start'; // YYYY-MM-DD

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

// Category mapping
const categoryMap = [
  { name: "Produce", patterns: [/lettuce/i,/mushroom/i,/bell\s*pepper/i,/pepper(?!\s*sauce)/i,/(snow|snap)\s*pea/i,/basil/i,/thai\s*chil/i,/\bchili(?!\s*paste|\s*sauce)/i,/garlic/i,/ginger/i,/\blime\b/i,/shallot/i,/(green\s*onion|scallion)/i,/cucumber/i,/carrot/i,/bok\s*choy/i,/spinach/i,/eggplant/i,/\bmint\b/i,/lemongrass/i,/daikon/i,/kaffir\s*lime\s*leaves?/i]},
  { name: "Protein", patterns: [/\bchicken\b/i,/\bshrimp\b/i,/\bfish\b/i,/tilapia/i,/\bcod\b/i,/\bturkey\b/i,/\btofu\b/i,/\beggs?\b/i]},
  { name: "Sauces/Condiments", patterns: [/soy\s*sauce/i,/fish\s*sauce/i,/oyster\s*sauce/i,/sesame\s*oil/i,/rice\s*vinegar/i,/chili\s*(paste|sauce)|sambal/i,/peanut\s*butter/i,/coconut\s*milk/i,/black\s*bean\s*(paste|sauce)?/i]},
  { name: "Noodles/Rice", patterns: [/rice\s*paper/i,/glass\s*noodles?|bean\s*thread/i,/(jasmine|brown)\s*rice/i,/rice\s*noodles?|vermicelli/i]},
  { name: "Sweeteners", patterns: [/palm\s*sugar/i,/\bhoney\b/i,/\bsugar\b/i,/sweetener/i]},
  { name: "Spices/Seasonings", patterns: [/dried\s*chil/i,/kaffir\s*lime\s*leaves?/i,/toasted\s*rice(\s*powder)?/i,/miso\s*paste/i,/curry\s*paste/i,/five\s*spice/i,/sichuan|szechuan/i,/star\s*anise/i,/white\s*pepper/i]},
  { name: "Other", patterns: [] }
];

function normalizeItem(str){ return str.replace(/\s*\(.*?\)\s*/g,'').trim(); }
function getCategory(item){
  const clean = normalizeItem(item);
  for(const cat of categoryMap){ if(cat.patterns.some(rx => rx.test(clean))) return cat.name; }
  return "Other";
}

// Quantities (hints)
function quantityFor(item){
  const clean = normalizeItem(item).toLowerCase();
  const pairs = [
    [/(green\s*onion|scallion)/i, "1 bunch"], [/shallot/i, "3–4"], [/bell\s*pepper/i, "2"],
    [/(snow|snap)\s*pea/i, "8 oz"], [/mushroom/i, "8–12 oz"], [/eggplant/i, "2"], [/spinach/i, "1 small bag"],
    [/bok\s*choy/i, "1 lb"], [/lemongrass/i, "2 stalks"], [/daikon/i, "1 small"],
    [/coconut\s*milk/i, "1 can"], [/soy\s*sauce/i, "1 bottle"], [/fish\s*sauce/i, "1 bottle"],
    [/rice\s*vinegar/i, "1 bottle"], [/sesame\s*oil/i, "1 small bottle"], [/chili\s*(paste|sauce)|sambal/i, "1 jar"],
    [/peanut\s*butter/i, "1 small jar"], [/glass\s*noodle|bean\s*thread/i, "1 pack"], [/rice\s*paper/i, "1 pack"],
    [/(jasmine|brown)\s*rice/i, "1–2 cups dry"], [/rice\s*noodle|vermicelli/i, "1 pack"], [/palm\s*sugar|honey/i, "1 small jar"],
    [/toasted\s*rice(\s*powder)?/i, "small bag"], [/curry\s*paste/i, "1 small jar"], [/white\s*pepper/i, "small tin"],
    [/chicken\b(?!\s*stock)/i, "1.5–2 lb"], [/ground\s*(chicken|turkey)/i, "1 lb"], [/shrimp/i, "1 lb"],
    [/(cod|tilapia|fish)\b/i, "2 fillets"], [/egg(s)?\b/i, "1 dozen"], [/\blime\b/i, "2"], [/\bgarlic\b/i, "1 bulb"],
    [/\bginger\b/i, "1 small knob"], [/\bbasil\b/i, "1 small bunch"], [/\bmint\b/i, "1 small bunch"], [/chil/i, "4–6"]
  ];
  for(const [rx, hint] of pairs){ if(rx.test(clean)) return hint; }
  return "1 unit";
}

// Date options
const weekdayToIndex = { sunday:0, monday:1, tuesday:2, wednesday:3, thursday:4, friday:5, saturday:6 };
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
    const target = new Date(today);
    target.setDate(today.getDate() + diff);
    return target;
  }
  // week mode
  let baseStart;
  if(prefs.customStart){
    const [yyyy,mm,dd] = prefs.customStart.split('-').map(Number);
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
  const el = document.getElementById('day-date'); if(!el) return;
  const target = computeTargetDateForDay(day);
  el.textContent = target.toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}

// Recipes
let recipesData = {};
function loadRecipes(day){
  fetch('data/recipes.json').then(r=>r.json()).then(data=> {
    recipesData = data; displayRecipes(day);
  });
}
function displayRecipes(day){
  const info = recipesData[day];
  const titleEl = document.getElementById('recipe-title');
  const linksEl = document.getElementById('recipe-links');
  if(!titleEl || !linksEl) return;
  linksEl.innerHTML = '';
  if(info){
    titleEl.textContent = `🍽️ Meals for ${day.charAt(0).toUpperCase()+day.slice(1)}`;
    info.meals.forEach((m,i)=>{
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = info.links[i]; a.textContent = m; a.target = "_blank";
      li.appendChild(a); linksEl.appendChild(li);
    });
  }else{ titleEl.textContent = ''; }
}

// Render list per prefs
function renderListAccordingToPrefs(){
  const root = document.getElementById('grocery-list'); if(!root) return;
  root.innerHTML = '';
  if(prefs.group){
    const groups = {}; categoryMap.forEach(c=>groups[c.name]=[]);
    currentItems.forEach(item => groups[getCategory(item)].push(item));
    for(const cat of categoryMap.map(c=>c.name)){
      const arr = groups[cat]; if(!arr || !arr.length) continue;
      const header = document.createElement('div');
      header.className = 'category-header'; header.textContent = cat; root.appendChild(header);
      const ul = document.createElement('ul'); ul.className = 'category-list';
      arr.forEach(i=>{ const li=document.createElement('li'); li.textContent = prefs.qty? `${i} — ${quantityFor(i)}` : i; ul.appendChild(li); });
      root.appendChild(ul);
    }
  }else{
    currentItems.forEach(i=>{ const li=document.createElement('li'); li.textContent = prefs.qty? `${i} — ${quantityFor(i)}`: i; root.appendChild(li); });
  }
}

// Load day
function loadDay(day){
  currentDay = day.toLowerCase();
  const dd = document.getElementById('day-select'); if(dd) dd.value = currentDay;
  updateDayDateDisplay(currentDay);
  fetch(`data/${currentDay}_grocery.json`).then(res=>{
    if(!res.ok) throw new Error('Failed to load '+currentDay+'_grocery.json');
    return res.json();
  }).then(data=>{
    currentItems = Array.isArray(data.ingredients)? data.ingredients.slice() : [];
    renderListAccordingToPrefs();
    displayRecipes(currentDay);
  }).catch(err=>{
    console.error(err);
    currentItems = [];
    const root = document.getElementById('grocery-list');
    if(root){ root.innerHTML=''; const li=document.createElement('li'); li.textContent='Could not load grocery list for '+currentDay; root.appendChild(li); }
  });
}

// Share
document.getElementById('share-btn')?.addEventListener('click', async () => {
  const day = currentDay || 'monday';
  const shareUrl = `${location.origin}${location.pathname}?day=${day}`;
  const shareText = `🥢 Here's the grocery list for ${day.charAt(0).toUpperCase()+day.slice(1)}: ${shareUrl}`;
  if(navigator.share){
    try{ await navigator.share({ title:'Grocery List', text:shareText, url:shareUrl }); }catch(e){}
  }else{
    await navigator.clipboard.writeText(shareText);
    const s=document.getElementById('share-status'); if(s){ s.textContent='✅ Link copied to clipboard!'; s.style.display='block'; setTimeout(()=>s.style.display='none',2000); }
  }
});
document.getElementById('print-btn')?.addEventListener('click', ()=> window.print());

// Copy
function buildFlatTextRespectingPrefs(){
  return currentItems.map(i => prefs.qty ? `- ${i} — ${quantityFor(i)}` : `- ${i}`).join('\n');
}
function buildCategorizedTextRespectingPrefs(){
  const groups = {}; categoryMap.forEach(c=>groups[c.name]=[]);
  currentItems.forEach(item => groups[getCategory(item)].push(item));
  let out = [];
  for(const cat of categoryMap.map(c=>c.name)){
    const arr = groups[cat]; if(!arr || !arr.length) continue;
    out.push(`${cat}:`);
    arr.forEach(i => out.push(prefs.qty ? ` - ${i} — ${quantityFor(i)}` : ` - ${i}`));
    out.push('');
  }
  return out.join('\n').trim();
}
document.getElementById('copy-btn')?.addEventListener('click', async ()=>{
  const text = prefs.group ? buildCategorizedTextRespectingPrefs() : buildFlatTextRespectingPrefs();
  await navigator.clipboard.writeText(text);
  const s=document.getElementById('share-status'); if(s){ s.textContent='✅ Grocery items copied!'; s.style.display='block'; setTimeout(()=>s.style.display='none',2000); }
});
document.getElementById('copy-by-category-btn')?.addEventListener('click', async ()=>{
  const text = buildCategorizedTextRespectingPrefs();
  await navigator.clipboard.writeText(text);
  renderListAccordingToPrefs(); // ensure grouped on screen
  const s=document.getElementById('share-status'); if(s){ s.textContent='✅ Categorized groceries copied!'; s.style.display='block'; setTimeout(()=>s.style.display='none',2000); }
});

// Settings modal
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
  if(!radioNext || !radioWeek) return;
  radioNext.checked = (prefs.dateMode === 'next');
  radioWeek.checked = (prefs.dateMode === 'week');
  if(weekOptions) weekOptions.style.display = prefs.dateMode === 'week' ? 'block' : 'none';
  if(selWeekStart) selWeekStart.value = prefs.weekStart;
  if(inputCustomStart) inputCustomStart.value = prefs.customStart;
}
function syncSettingsUI(){
  if(chkGroup) chkGroup.checked = !!prefs.group;
  if(chkQty) chkQty.checked = !!prefs.qty;
  syncDateUI();
}

btnOpen?.addEventListener('click', ()=>{ syncSettingsUI(); modal.classList.add('show'); modal.setAttribute('aria-hidden','false'); });
btnClose?.addEventListener('click', ()=>{
  if(chkGroup) prefs.group = chkGroup.checked;
  if(chkQty) prefs.qty = chkQty.checked;
  prefs.dateMode = (radioWeek && radioWeek.checked) ? 'week' : 'next';
  if(selWeekStart) prefs.weekStart = selWeekStart.value;
  if(inputCustomStart) prefs.customStart = inputCustomStart.value || '';
  savePrefs();
  modal.classList.remove('show'); modal.setAttribute('aria-hidden','true');
  if(currentDay){ updateDayDateDisplay(currentDay); renderListAccordingToPrefs(); }
});
modal?.addEventListener('click', (e)=>{ if(e.target === modal) btnClose.click(); });
radioNext?.addEventListener('change', ()=>{ prefs.dateMode='next'; syncDateUI(); });
radioWeek?.addEventListener('change', ()=>{ prefs.dateMode='week'; syncDateUI(); });
selWeekStart?.addEventListener('change', ()=>{ if(radioWeek?.checked && currentDay) updateDayDateDisplay(currentDay); });
inputCustomStart?.addEventListener('change', ()=>{ if(radioWeek?.checked && currentDay) updateDayDateDisplay(currentDay); });

// Day select
document.getElementById('day-select')?.addEventListener('change', function(){ loadDay(this.value); });

// Initial load
document.addEventListener('DOMContentLoaded', ()=>{
  const dayParam = (new URLSearchParams(location.search).get('day') || new Date().toLocaleString('en-US',{weekday:'long'}).toLowerCase());
  loadRecipes(dayParam.toLowerCase());
  loadDay(dayParam.toLowerCase());
});
