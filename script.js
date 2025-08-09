// Utilities
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Category regex map
const categoryMap = [
  { name: "Produce", patterns: [
    /lettuce/i, /mushroom/i, /bell\s*pepper/i, /(snow|snap)\s*pea/i, /\bbasil\b/i, /thai\s*chil/i,
    /\bchili(?!\s*paste|\s*sauce)/i, /\bgarlic\b/i, /\bginger\b/i, /\blime\b/i, /shallot/i,
    /(green\s*onion|scallion)/i, /\bcucumber\b/i, /\bcarrot/i, /bok\s*choy/i, /\bspinach\b/i, /eggplant/i, /\bmint\b/i,
    /\blemongrass\b/i, /\bdaikon\b/i, /kaffir\s*lime\s*leaves?/i
  ]},
  { name: "Protein", patterns: [/\bchicken\b/i, /\bshrimp\b/i, /\bfish\b/i, /\btilapia\b/i, /\bcod\b/i, /\bturkey\b/i, /\btofu\b/i, /\beggs?\b/i]},
  { name: "Sauces/Condiments", patterns: [/soy\s*sauce/i, /fish\s*sauce/i, /oyster\s*sauce/i, /sesame\s*oil/i, /rice\s*vinegar/i, /chili\s*(paste|sauce)|sambal/i, /peanut\s*butter/i, /coconut\s*milk/i, /black\s*bean/i]},
  { name: "Noodles/Rice", patterns: [/rice\s*paper/i, /glass\s*noodles?|bean\s*thread/i, /(jasmine|brown)\s*rice/i, /rice\s*noodles?|vermicelli/i]},
  { name: "Sweeteners", patterns: [/palm\s*sugar/i, /\bhoney\b/i, /\bsugar\b/i, /sweetener/i]},
  { name: "Spices/Seasonings", patterns: [/dried\s*chil/i, /kaffir\s*lime\s*leaves?/i, /toasted\s*rice(\s*powder)?/i, /miso\s*paste/i, /curry\s*paste/i, /five\s*spice/i, /sichuan|szechuan/i, /star\s*anise/i, /white\s*pepper/i]},
  { name: "Other", patterns: [] }
];

function normalizeItem(str){ return str.replace(/\s*\(.*?\)\s*/g,'').trim(); }
function getCategory(item){
  const clean = normalizeItem(item);
  for (const cat of categoryMap) if (cat.patterns.some(rx=>rx.test(clean))) return cat.name;
  return "Other";
}

// Quantity suggestions
function quantityFor(item){
  const clean = normalizeItem(item).toLowerCase();
  const pairs = [
    [/(green\s*onion|scallion)/i, "1 bunch"],
    [/shallot/i, "3–4"],
    [/bell\s*pepper/i, "2"],
    [/(snow|snap)\s*pea/i, "8 oz"],
    [/mushroom/i, "8–12 oz"],
    [/eggplant/i, "2"],
    [/spinach/i, "1 small bag"],
    [/bok\s*choy/i, "1 lb"],
    [/lemongrass/i, "2 stalks"],
    [/daikon/i, "1 small"],
    [/coconut\s*milk/i, "1 can"],
    [/soy\s*sauce/i, "1 bottle"],
    [/fish\s*sauce/i, "1 bottle"],
    [/rice\s*vinegar/i, "1 bottle"],
    [/sesame\s*oil/i, "1 small bottle"],
    [/chili\s*(paste|sauce)|sambal/i, "1 jar"],
    [/peanut\s*butter/i, "1 small jar"],
    [/glass\s*noodle|bean\s*thread/i, "1 pack"],
    [/rice\s*paper/i, "1 pack"],
    [/(jasmine|brown)\s*rice/i, "1–2 cups dry"],
    [/rice\s*noodle|vermicelli/i, "1 pack"],
    [/palm\s*sugar|honey/i, "1 small jar"],
    [/toasted\s*rice(\s*powder)?/i, "small bag"],
    [/curry\s*paste/i, "1 small jar"],
    [/white\s*pepper/i, "small tin"],
    [/\bchicken\b(?!\s*stock)/i, "1.5–2 lb"],
    [/ground\s*(chicken|turkey)/i, "1 lb"],
    [/shrimp/i, "1 lb"],
    /(cod|tilapia|\bfish\b)/i, "2 fillets",
    [/egg(s)?\b/i, "1 dozen"],
    [/lime\b/i, "2"],
    [/garlic\b/i, "1 bulb"],
    [/ginger\b/i, "1 small knob"],
    [/basil\b/i, "1 small bunch"],
    [/mint\b/i, "1 small bunch"],
    [/chil/i, "4–6"],
  ];
  for (const [rx,h] of pairs) if (rx.test(clean)) return h;
  return "1 unit";
}

// Settings
const PREF_GROUP = 'pref_group';
const PREF_QTY = 'pref_qty';
const prefs = {
  group: JSON.parse(localStorage.getItem(PREF_GROUP) ?? 'true'),
  qty: JSON.parse(localStorage.getItem(PREF_QTY) ?? 'true')
};
function savePrefs(){
  localStorage.setItem(PREF_GROUP, JSON.stringify(prefs.group));
  localStorage.setItem(PREF_QTY, JSON.stringify(prefs.qty));
}

// Render according to prefs
function renderListAccordingToPrefs(){
  const root = document.getElementById("grocery-list");
  const items = Array.from(root.querySelectorAll("li")).map(li => li.textContent.replace(/\s—\s.*$/, "").trim());
  if (prefs.group){
    const groups = {}; categoryMap.forEach(c=>groups[c.name]=[]);
    items.forEach(i=>groups[getCategory(i)].push(i));
    root.innerHTML = "";
    for (const cat of categoryMap.map(c=>c.name)){
      const g = groups[cat]; if (!g || g.length===0) continue;
      const header = document.createElement("div");
      header.className = "category-header"; header.textContent = cat; root.appendChild(header);
      const ul = document.createElement("ul"); ul.className="category-list";
      g.forEach(i=>{ const li=document.createElement("li"); li.textContent = prefs.qty ? `${i} — ${quantityFor(i)}` : i; ul.appendChild(li); });
      root.appendChild(ul);
    }
  } else {
    root.innerHTML = "";
    items.forEach(i=>{ const li=document.createElement("li"); li.textContent = prefs.qty ? `${i} — ${quantityFor(i)}` : i; root.appendChild(li); });
  }
}

// Recipes
let recipesData = {};
function loadRecipes(day){
  fetch('data/recipes.json').then(r=>r.json()).then(data=>{ recipesData = data; displayRecipes(day); });
}
function displayRecipes(day){
  const info = recipesData[day];
  const titleEl = document.getElementById('recipe-title');
  const linksEl = document.getElementById('recipe-links');
  titleEl.textContent = info ? `🍽️ Meals for ${day.charAt(0).toUpperCase()+day.slice(1)}` : '';
  linksEl.innerHTML = '';
  if (info){
    info.meals.forEach((meal,idx)=>{
      const li = document.createElement('li');
      const a = document.createElement('a'); a.href = info.links[idx]; a.textContent = meal; a.target = "_blank";
      li.appendChild(a); linksEl.appendChild(li);
    });
  }
}

// Date display fix
function updateDayDateDisplay(day){
  const today = new Date();
  const idx = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].indexOf(day.toLowerCase());
  if (idx>=0){
    const diff = (idx + 7 - today.getDay()) % 7;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    document.getElementById('day-date').textContent = targetDate.toLocaleDateString(undefined, {
      weekday:'long', year:'numeric', month:'long', day:'numeric'
    });
  }
}

// Load a day
function loadDay(day){
  document.getElementById('day-select').value = day;
  updateDayDateDisplay(day);
  fetch(`data/${day}_grocery.json`)
    .then(res=>res.json())
    .then(data=>{
      const root = document.getElementById('grocery-list');
      root.innerHTML='';
      data.ingredients.forEach(item=>{ const li=document.createElement('li'); li.textContent=item; root.appendChild(li); });
      renderListAccordingToPrefs();
    });
  displayRecipes(day);
}

// Share + Print + Copy
document.getElementById('share-btn')?.addEventListener('click', async ()=>{
  const day = document.getElementById('day-select').value;
  const shareUrl = `${window.location.origin}${window.location.pathname}?day=${day}`;
  const shareText = `🥢 Here's the grocery list for ${day.charAt(0).toUpperCase()+day.slice(1)}: ${shareUrl}`;
  if (navigator.share){
    try { await navigator.share({ title:`Grocery List for ${day}`, text:shareText, url:shareUrl }); }
    catch(e){ console.warn('Share cancelled', e); }
  } else {
    await navigator.clipboard.writeText(shareText);
    const status = document.getElementById('share-status'); status.textContent="✅ Link copied to clipboard!"; status.style.display='block'; setTimeout(()=>status.style.display='none',2000);
  }
});
document.getElementById('print-btn')?.addEventListener('click', ()=> window.print());

function buildFlatTextRespectingPrefs(){
  const items = Array.from(document.querySelectorAll("#grocery-list li")).map(li => li.textContent.replace(/\s—\s.*$/, "").trim());
  return items.map(i => prefs.qty ? `- ${i} — ${quantityFor(i)}` : `- ${i}`).join("\n");
}
function buildCategorizedTextRespectingPrefs(){
  const items = Array.from(document.querySelectorAll("#grocery-list li")).map(li => li.textContent.replace(/\s—\s.*$/, "").trim());
  const groups = {}; categoryMap.forEach(c=>groups[c.name]=[]);
  items.forEach(i=>groups[getCategory(i)].push(i));
  let out=[];
  for (const cat of categoryMap.map(c=>c.name)){
    const list = groups[cat]; if (!list||list.length===0) continue;
    out.push(`${cat}:`); list.forEach(i=> out.push(prefs.qty ? ` - ${i} — ${quantityFor(i)}` : ` - ${i}`)); out.push("");
  }
  return out.join("\n").trim();
}
document.getElementById('copy-btn')?.addEventListener('click', async ()=>{
  const text = prefs.group ? buildCategorizedTextRespectingPrefs() : buildFlatTextRespectingPrefs();
  await navigator.clipboard.writeText(text);
  const s=document.getElementById('share-status'); s.textContent="✅ Grocery items copied!"; s.style.display='block'; setTimeout(()=>s.style.display='none',2000);
});
document.getElementById('copy-by-category-btn')?.addEventListener('click', async ()=>{
  const text = buildCategorizedTextRespectingPrefs();
  await navigator.clipboard.writeText(text);
  const s=document.getElementById('share-status'); s.textContent="✅ Categorized groceries copied!"; s.style.display='block'; setTimeout(()=>s.style.display='none',2000);
});

// Settings modal
const modal = document.getElementById('settings-modal');
const btnOpen = document.getElementById('settings-btn');
const btnClose = document.getElementById('settings-close');
const chkGroup = document.getElementById('pref-group');
const chkQty = document.getElementById('pref-qty');
function syncSettingsUI(){ chkGroup.checked=!!prefs.group; chkQty.checked=!!prefs.qty; }
btnOpen?.addEventListener('click', ()=>{ syncSettingsUI(); modal.classList.add('show'); modal.setAttribute('aria-hidden','false'); });
btnClose?.addEventListener('click', ()=>{ prefs.group=chkGroup.checked; prefs.qty=chkQty.checked; savePrefs(); modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); renderListAccordingToPrefs(); });
modal?.addEventListener('click', (e)=>{ if (e.target===modal){ btnClose.click(); } });

// Day select change
document.getElementById('day-select').addEventListener('change', function(){ loadDay(this.value); });

// Initial load
let dayParam = getQueryParam('day') || new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
loadRecipes(dayParam);
loadDay(dayParam);