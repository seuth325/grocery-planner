// State
let currentDay = null;
let currentItems = [];

// Preferences
const PREF_GROUP = 'pref_group';
const PREF_QTY = 'pref_qty';
const prefs = {
  group: JSON.parse(localStorage.getItem(PREF_GROUP) ?? 'true'),
  qty: JSON.parse(localStorage.getItem(PREF_QTY) ?? 'true')
};
function savePrefs(){ localStorage.setItem(PREF_GROUP, JSON.stringify(prefs.group)); localStorage.setItem(PREF_QTY, JSON.stringify(prefs.qty)); }

// Category mapping (regex-based)
const categoryMap = [
  { name: "Produce", patterns: [
    /lettuce/i, /mushroom/i, /\bmushrooms?\b/i, /bell\s*pepper/i, /\bpepper(s)?\b(?!\s*sauce)/i,
    /(snow|snap)\s*pea/i, /\bbasil\b/i, /thai\s*chil/i, /\bchili(?!\s*paste|\s*sauce)/i,
    /\bgarlic\b/i, /\bginger\b/i, /\blime\b/i, /shallot/i, /(green\s*onion|scallion)/i,
    /\bcucumber\b/i, /\bcarrot/i, /bok\s*choy/i, /\bspinach\b/i, /eggplant/i, /\bmint\b/i,
    /\blemongrass\b/i, /\bdaikon\b/i, /kaffir\s*lime\s*leaves?/i
  ]},
  { name: "Protein", patterns: [/\bchicken\b/i, /\bshrimp\b/i, /\bfish\b/i, /\btilapia\b/i, /\bcod\b/i, /\bturkey\b/i, /\btofu\b/i, /\beggs?\b/i] },
  { name: "Sauces/Condiments", patterns: [/low\s*sodium\s*soy|soy\s*sauce/i, /fish\s*sauce/i, /oyster\s*sauce/i, /sesame\s*oil/i, /rice\s*vinegar/i, /chili\s*(paste|sauce)|sambal/i, /peanut\s*butter/i, /coconut\s*milk/i, /black\s*bean\s*(paste|sauce)?/i] },
  { name: "Noodles/Rice", patterns: [/rice\s*paper/i, /glass\s*noodles?|bean\s*thread/i, /(jasmine|brown)\s*rice/i, /rice\s*noodles?|vermicelli/i] },
  { name: "Sweeteners", patterns: [/palm\s*sugar/i, /\bhoney\b/i, /\bsugar\b/i, /sweetener/i] },
  { name: "Spices/Seasonings", patterns: [/dried\s*chil/i, /kaffir\s*lime\s*leaves?/i, /toasted\s*rice(\s*powder)?/i, /miso\s*paste/i, /curry\s*paste/i, /five\s*spice/i, /sichuan|szechuan/i, /star\s*anise/i, /white\s*pepper/i] },
  { name: "Other", patterns: [] }
];
function normalizeItem(str){ return str.replace(/\s*\(.*?\)\s*/g, '').trim(); }
function getCategory(item){
  const clean = normalizeItem(item);
  for (const cat of categoryMap) if (cat.patterns.some(rx=>rx.test(clean))) return cat.name;
  return "Other";
}

// Quantity hints
const qtyHints = {
  "Lime":"2","Mint":"1 small bunch","Fresh Basil":"1 small bunch","Thai Chilies":"4–6","Garlic":"1 bulb","Ginger":"1 small knob",
  "Shallots":"3–4","Green Onions":"1 bunch","Red Onion":"1 medium","Bell Peppers":"2","Carrots":"3–4","Cucumber":"1–2",
  "Baby Bok Choy":"1 lb","Spinach":"1 small bag","Chinese Eggplant":"2","Daikon Radish":"1 small","Lettuce":"1 head",
  "Kaffir Lime Leaves":"6–8","Snow Peas or Snap Peas":"8 oz","Mushrooms":"8–12 oz","Lemongrass":"2 stalks",
  "Chicken Breast or Thighs":"1.5–2 lb","Ground Chicken or Turkey":"1 lb","Shrimp (peeled/deveined)":"1 lb","White Fish (cod or tilapia)":"2 fillets","Eggs":"1 dozen",
  "Low Sodium Soy Sauce":"1 bottle","Fish Sauce (low sodium)":"1 bottle","Oyster Sauce":"1 bottle","Sesame Oil":"1 small bottle","Rice Vinegar":"1 bottle",
  "Chili Paste or Sambal":"1 jar","Peanut Butter (for dipping sauce)":"1 small jar","Light Coconut Milk":"1 can","Miso Paste":"1 small tub","Black Bean Sauce":"1 jar",
  "Glass Noodles (bean thread)":"1 pack","Brown or Jasmine Rice":"1–2 cups dry","Rice Paper Wrappers":"1 pack","Rice Noodles / Vermicelli":"1 pack",
  "Palm Sugar or Honey":"1 small jar","Toasted Rice Powder":"small bag","Curry Paste":"1 small jar","White Pepper":"small tin"
};
function quantityFor(item){
  const clean = normalizeItem(item).toLowerCase();
  // exact
  for (const k of Object.keys(qtyHints)) if (clean === k.toLowerCase()) return qtyHints[k];
  // heuristics
  const pairs = [
    [/(green\s*onion|scallion)/i,"1 bunch"], [/shallot/i,"3–4"], [/bell\s*pepper/i,"2"],
    [/(snow|snap)\s*pea/i,"8 oz"], [/mushroom/i,"8–12 oz"], [/eggplant/i,"2"], [/spinach/i,"1 small bag"], [/bok\s*choy/i,"1 lb"],
    [/lemongrass/i,"2 stalks"], [/daikon/i,"1 small"], [/coconut\s*milk/i,"1 can"], [/soy\s*sauce/i,"1 bottle"], [/fish\s*sauce/i,"1 bottle"],
    [/rice\s*vinegar/i,"1 bottle"], [/sesame\s*oil/i,"1 small bottle"], [/chili\s*(paste|sauce)|sambal/i,"1 jar"], [/peanut\s*butter/i,"1 small jar"],
    [/glass\s*noodle|bean\s*thread/i,"1 pack"], [/rice\s*paper/i,"1 pack"], [/(jasmine|brown)\s*rice/i,"1–2 cups dry"], [/rice\s*noodle|vermicelli/i,"1 pack"],
    [/palm\s*sugar|honey/i,"1 small jar"], [/toasted\s*rice(\s*powder)?/i,"small bag"], [/curry\s*paste/i,"1 small jar"], [/white\s*pepper/i,"small tin"],
    [/chicken\b(?!\s*stock)/i,"1.5–2 lb"], [/ground\s*(chicken|turkey)/i,"1 lb"], [/shrimp/i,"1 lb"], /\b(cod|tilapia|fish)\b/i, [/egg(s)?\b/i,"1 dozen"],
    [/lime\b/i,"2"], [/garlic\b/i,"1 bulb"], [/ginger\b/i,"1 small knob"], [/basil\b/i,"1 small bunch"], [/mint\b/i,"1 small bunch"], [/chil/i,"4–6"]
  ];
  for (const p of pairs){
    if (p instanceof Array){
      const [rx, hint] = p
      if (rx.test(clean)) return hint
    } else {
      // skip
    }
  }
  return "1 unit";
}

// Rendering
function renderListAccordingToPrefs(){
  const root = document.getElementById("grocery-list");
  if (!root) return;
  root.innerHTML = "";

  if (prefs.group){
    const groups = {};
    categoryMap.forEach(c => groups[c.name] = []);
    currentItems.forEach(item => groups[getCategory(item)].push(item));

    for (const cat of categoryMap.map(c=>c.name)){
      const group = groups[cat];
      if (!group || group.length===0) continue;
      const header = document.createElement("div");
      header.className = "category-header";
      header.textContent = cat;
      root.appendChild(header);

      const ul = document.createElement("ul");
      ul.className = "category-list";
      group.forEach(i=>{
        const li = document.createElement("li");
        li.textContent = prefs.qty ? `${i} — ${quantityFor(i)}` : i;
        ul.appendChild(li);
      });
      root.appendChild(ul);
    }
  } else {
    currentItems.forEach(i=>{
      const li = document.createElement("li");
      li.textContent = prefs.qty ? `${i} — ${quantityFor(i)}` : i;
      root.appendChild(li);
    });
  }
}

// Recipes
let recipesData = {};
function displayRecipes(day){
  if (!Object.keys(recipesData).length){
    fetch('data/recipes.json').then(r=>r.json()).then(d=>{ recipesData=d; displayRecipes(day); });
    return;
  }
  const info = recipesData[day];
  const titleEl = document.getElementById('recipe-title');
  const linksEl = document.getElementById('recipe-links');
  if (!titleEl || !linksEl) return;
  linksEl.innerHTML = "";
  if (info){
    titleEl.textContent = `🍽️ Meals for ${day.charAt(0).toUpperCase()+day.slice(1)}`;
    info.meals.forEach((meal, idx)=>{
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = info.links[idx]; a.textContent = meal; a.target = "_blank";
      li.appendChild(a); linksEl.appendChild(li);
    });
  } else {
    titleEl.textContent = "";
  }
}

// Share & Print
document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('share-btn')?.addEventListener('click', async ()=>{
    const day = currentDay || 'monday';
    const shareUrl = `${location.origin}${location.pathname}?day=${day}`;
    const shareText = `🥢 Here's the grocery list for ${day.charAt(0).toUpperCase()+day.slice(1)}: ${shareUrl}`;
    try{
      if (navigator.share) await navigator.share({title:`Grocery List for ${day}`, text:shareText, url:shareUrl});
      else await navigator.clipboard.writeText(shareText);
      const s = document.getElementById('share-status'); if (s){ s.textContent = "✅ Link ready to share!"; s.style.display='block'; setTimeout(()=>s.style.display='none',2000); }
    }catch(e){ console.warn(e); }
  });
  document.getElementById('print-btn')?.addEventListener('click', ()=>window.print());
});

// Copy helpers respecting prefs
function buildFlatTextRespectingPrefs(){
  return currentItems.map(i => prefs.qty ? `- ${i} — ${quantityFor(i)}` : `- ${i}`).join("\n");
}
function buildCategorizedTextRespectingPrefs(){
  const groups = {}; categoryMap.forEach(c=>groups[c.name]=[]); currentItems.forEach(i=>groups[getCategory(i)].push(i));
  let out=[]; for (const cat of categoryMap.map(c=>c.name)){ const list=groups[cat]; if (!list||!list.length) continue; out.push(`${cat}:`); list.forEach(i=>out.push(prefs.qty?` - ${i} — ${quantityFor(i)}`:` - ${i}`)); out.push(""); }
  return out.join("\n").trim();
}
document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById("copy-btn")?.addEventListener("click", async ()=>{
    const text = prefs.group ? buildCategorizedTextRespectingPrefs() : buildFlatTextRespectingPrefs();
    await navigator.clipboard.writeText(text);
    const s = document.getElementById('share-status'); if (s){ s.textContent = "✅ Grocery items copied!"; s.style.display='block'; setTimeout(()=>s.style.display='none',2000); }
  });
  document.getElementById("copy-by-category-btn")?.addEventListener("click", async ()=>{
    const text = buildCategorizedTextRespectingPrefs();
    await navigator.clipboard.writeText(text);
    const s = document.getElementById('share-status'); if (s){ s.textContent = "✅ Categorized groceries copied!"; s.style.display='block'; setTimeout(()=>s.style.display='none',2000); }
  });
});

// Settings modal wiring
document.addEventListener('DOMContentLoaded', ()=>{
  const modal = document.getElementById('settings-modal');
  const btnOpen = document.getElementById('settings-btn');
  const btnClose = document.getElementById('settings-close');
  const chkGroup = document.getElementById('pref-group');
  const chkQty = document.getElementById('pref-qty');
  function sync(){ if (chkGroup) chkGroup.checked = !!prefs.group; if (chkQty) chkQty.checked = !!prefs.qty; }
  btnOpen?.addEventListener('click', ()=>{ sync(); modal.classList.add('show'); modal.setAttribute('aria-hidden','false'); });
  btnClose?.addEventListener('click', ()=>{
    prefs.group = !!chkGroup?.checked; prefs.qty = !!chkQty?.checked; savePrefs();
    modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); renderListAccordingToPrefs();
  });
  modal?.addEventListener('click', (e)=>{ if (e.target === modal) btnClose.click(); });
});

// Date display & day loading
function loadDay(day){
  currentDay = day.toLowerCase();
  const dropdown = document.getElementById('day-select'); if (dropdown) dropdown.value = currentDay;

  // Update date display to next occurrence
  const today = new Date();
  const idx = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].indexOf(currentDay);
  if (idx >= 0) {
    const diff = (idx + 7 - today.getDay()) % 7;
    const targetDate = new Date(today); targetDate.setDate(today.getDate() + diff);
    const dateEl = document.getElementById('day-date');
    if (dateEl) dateEl.textContent = targetDate.toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  }

  fetch(`data/${currentDay}_grocery.json`).then(res=>{
    if (!res.ok) throw new Error(`Failed to load ${currentDay}_grocery.json`);
    return res.json();
  }).then(data=>{
    currentItems = Array.isArray(data.ingredients) ? data.ingredients.slice() : [];
    renderListAccordingToPrefs();
    displayRecipes(currentDay);
  }).catch(err=>{
    console.error(err);
    currentItems = [];
    renderError(`Could not load grocery list for ${currentDay}. Check filenames in /data.`);
  });
}

function renderError(message){
  const root = document.getElementById("grocery-list");
  if (!root) return;
  root.innerHTML = "";
  const li = document.createElement("li");
  li.textContent = message;
  root.appendChild(li);
}

// Initial load
document.addEventListener('DOMContentLoaded', ()=>{
  const dayParam = (new URLSearchParams(location.search).get('day') || new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase());
  loadDay(dayParam);
  // day selector change
  document.getElementById('day-select')?.addEventListener('change', function(){ loadDay(this.value); });
});
