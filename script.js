function getQueryParam(param){const urlParams=new URLSearchParams(window.location.search);return urlParams.get(param);}
let recipesData={};
function loadRecipes(day){fetch('data/recipes.json').then(res=>res.json()).then(data=>{recipesData=data;displayRecipes(day);});}
function displayRecipes(day){const info=recipesData[day];const titleEl=document.getElementById('recipe-title');const linksEl=document.getElementById('recipe-links');linksEl.innerHTML='';if(info){titleEl.textContent=`🍽️ Meals for ${day.charAt(0).toUpperCase()+day.slice(1)}`;info.meals.forEach((meal,i)=>{const li=document.createElement('li');const a=document.createElement('a');a.href=info.links[i];a.textContent=meal;a.target='_blank';li.appendChild(a);linksEl.appendChild(li);});}else{titleEl.textContent='';}}
function loadDay(day){const dropdown=document.getElementById('day-select');dropdown.value=day;fetch(`data/${day}_grocery.json`).then(res=>res.json()).then(data=>{const list=document.getElementById('grocery-list');list.innerHTML='';data.ingredients.forEach(item=>{const li=document.createElement('li');li.textContent=item;list.appendChild(li);});});displayRecipes(day);updatePrintHeader(day);}
document.getElementById('day-select').addEventListener('change',function(){loadDay(this.value);});
// Share
document.getElementById('share-btn').addEventListener('click',async()=>{const day=document.getElementById('day-select').value;const shareUrl=`${window.location.origin}${window.location.pathname}?day=${day}`;const shareText=`🥢 Here's the grocery list for ${day.charAt(0).toUpperCase()+day.slice(1)}: ${shareUrl}`;if(navigator.share){try{await navigator.share({title:`Grocery List for ${day}`,text:shareText,url:shareUrl});}catch(e){console.error('Share failed',e);}}else{await navigator.clipboard.writeText(shareText);const status=document.getElementById('share-status');status.style.display='block';setTimeout(()=>status.style.display='none',2000);}});
// Copy All Items
document.getElementById('copy-btn').addEventListener('click',async()=>{const items=[...document.querySelectorAll('#grocery-list li')].map(li=>`- ${li.textContent}`);const text=items.join('\n');try{await navigator.clipboard.writeText(text);const s=document.getElementById('copy-status');s.style.display='block';setTimeout(()=>s.style.display='none',2000);}catch(e){alert('Copy failed. You can manually select and copy the list.');}});
// Print
document.getElementById('print-btn').addEventListener('click',()=>window.print());
// Print header helper
function updatePrintHeader(day){const pretty=day.charAt(0).toUpperCase()+day.slice(1);const todayISO=new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'});const el=document.getElementById('print-day');el.textContent=`📅 ${pretty} • ${todayISO}`;}
// Init
let dayParam=getQueryParam('day')||new Date().toLocaleString('en-US',{weekday:'long'}).toLowerCase();loadRecipes(dayParam);loadDay(dayParam);