function getQueryParam(param){const urlParams=new URLSearchParams(window.location.search);return urlParams.get(param);}

let recipesData={};

function loadRecipes(day){
  fetch('data/recipes.json').then(res=>res.json()).then(data=>{recipesData=data;displayRecipes(day);});
}

function displayRecipes(day){
  const info=recipesData[day]; const titleEl=document.getElementById('recipe-title'); const linksEl=document.getElementById('recipe-links');
  linksEl.innerHTML='';
  if(info){
    titleEl.textContent=`🍽️ Meals for ${day.charAt(0).toUpperCase()+day.slice(1)}`;
    info.meals.forEach((meal,i)=>{const li=document.createElement('li'); const a=document.createElement('a'); a.href=info.links[i]; a.textContent=meal; a.target="_blank"; li.appendChild(a); linksEl.appendChild(li);});
  } else { titleEl.textContent=''; }
}

function loadDay(day){
  const dropdown=document.getElementById('day-select'); dropdown.value=day;
  fetch(`data/${day}_grocery.json`).then(res=>res.json()).then(data=>{
    const list=document.getElementById('grocery-list'); list.innerHTML='';
    data.ingredients.forEach(item=>{const li=document.createElement('li'); li.textContent=item; list.appendChild(li);});
  });
  displayRecipes(day);
  updatePrintHeader(day);
}

function updatePrintHeader(day){
  const pretty=day.charAt(0).toUpperCase()+day.slice(1);
  const todayISO=new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'});
  const el=document.getElementById('print-day'); el.textContent=`📅 ${pretty} • ${todayISO}`;
}

// Share
document.addEventListener('click',async(e)=>{
  if(e.target && e.target.id==='share-btn'){
    const day=document.getElementById('day-select').value;
    const shareUrl=`${window.location.origin}${window.location.pathname}?day=${day}`;
    const shareText=`🥢 Here's the grocery list for ${day.charAt(0).toUpperCase()+day.slice(1)}: ${shareUrl}`;
    try{
      if(navigator.share){ await navigator.share({title:`Grocery List for ${day}`,text:shareText,url:shareUrl}); }
      else { await navigator.clipboard.writeText(shareText); setStatus('✅ Link copied to clipboard!'); }
    }catch(err){ console.error('Share failed',err); }
  }
  if(e.target && e.target.id==='print-btn'){ window.print(); }
  if(e.target && e.target.id==='copy-btn'){
    const items=Array.from(document.querySelectorAll("#grocery-list li")).map(li=>li.textContent.trim());
    const text=items.map(i=>`- ${i}`).join("\n");
    await navigator.clipboard.writeText(text);
    setStatus('✅ Grocery items copied!');
  }
  if(e.target && e.target.id==='copy-by-category-btn'){
    const text=buildCategorizedText();
    await navigator.clipboard.writeText(text);
    setStatus('✅ Categorized groceries copied!');
  }
});

function setStatus(msg){ const status=document.getElementById('share-status'); status.textContent=msg; status.style.display='inline'; setTimeout(()=>status.style.display='none',2000); }

document.getElementById('day-select').addEventListener('change', function(){ loadDay(this.value); });

// Auto day
let dayParam=getQueryParam('day'); if(!dayParam){ dayParam=new Date().toLocaleString('en-US',{weekday:'long'}).toLowerCase(); }
loadRecipes(dayParam); loadDay(dayParam);

// ===== Expanded Category Map & Copier =====
const categoryMap=[
  {name:"Produce",keywords:["lettuce","mushroom","bell pepper","pepper","snow pea","snap pea","basil","thai chil","garlic","ginger","lime","shallot","green onion","scallion","cucumber","carrot","bok choy","spinach","eggplant","mint","lemongrass","daikon","kaffir"]},
  {name:"Protein",keywords:["chicken","shrimp","fish","tilapia","cod","turkey","tofu","egg"]},
  {name:"Sauces/Condiments",keywords:["soy","fish sauce","oyster","sesame oil","rice vinegar","chili paste","sambal","peanut butter","miso","coconut milk","fermented","black bean"]},
  {name:"Noodles/Rice",keywords:["rice paper","glass noodle","bean thread","jasmine rice","brown rice","rice noodle","vermicelli"]},
  {name:"Sweeteners",keywords:["palm sugar","honey","sugar","sweetener"]},
  {name:"Spices/Seasonings",keywords:["dried chili","kaffir lime","toasted rice","rice powder","curry paste","five spice","sichuan","star anise","white pepper"]},
  {name:"Other",keywords:[]}
];

function categorizeItem(item){
  const lower=item.toLowerCase();
  for(const cat of categoryMap){ if(cat.keywords.some(k=>lower.includes(k))) return cat.name; }
  return "Other";
}

function buildCategorizedText(){
  const items=Array.from(document.querySelectorAll("#grocery-list li")).map(li=>li.textContent.trim());
  const groups={}; categoryMap.forEach(c=>groups[c.name]=[]);
  items.forEach(item=>groups[categorizeItem(item)].push(item));
  let out=[];
  for(const cat of categoryMap.map(c=>c.name)){
    const list=groups[cat]; if(!list || list.length===0) continue;
    out.push(`${cat}:`); list.forEach(i=>out.push(` - ${i}`)); out.push("");
  }
  return out.join("\n").trim();
}
