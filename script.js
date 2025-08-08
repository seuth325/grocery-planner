
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

let recipesData = {};

function loadRecipes(day) {
  fetch('data/recipes.json')
    .then(res => res.json())
    .then(data => { recipesData = data; displayRecipes(day); });
}

function displayRecipes(day) {
  const recipeInfo = recipesData[day];
  const titleEl = document.getElementById('recipe-title');
  const linksEl = document.getElementById('recipe-links');
  linksEl.innerHTML = '';
  if (recipeInfo) {
    titleEl.textContent = `🍽️ Meals for ${day.charAt(0).toUpperCase() + day.slice(1)}`;
    recipeInfo.meals.forEach((meal, i) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = recipeInfo.links[i] || '#';
      a.textContent = meal;
      a.target = "_blank";
      li.appendChild(a);
      linksEl.appendChild(li);
    });
  } else {
    titleEl.textContent = '';
  }
}

function loadDay(day) {
  const dropdown = document.getElementById('day-select');
  dropdown.value = day;
  fetch(`data/${day}_grocery.json`)
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById('grocery-list');
      list.innerHTML = '';
      data.ingredients.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        list.appendChild(li);
      });
    });
  displayRecipes(day);
}

function updatePrintHeader(day) {
  const pretty = day.charAt(0).toUpperCase() + day.slice(1);
  const todayISO = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const el = document.getElementById('print-day');
  el.textContent = `📅 ${pretty} • ${todayISO}`;
}

// Share button
document.addEventListener('click', async (e) => {
  if (e.target && e.target.id === 'share-btn') {
    const day = document.getElementById('day-select').value;
    const shareUrl = `${window.location.origin}${window.location.pathname}?day=${day}`;
    const shareText = `🥢 Here's the grocery list for ${day.charAt(0).toUpperCase() + day.slice(1)}: ${shareUrl}`;
    if (navigator.share) {
      try { await navigator.share({ title: `Grocery List for ${day}`, text: shareText, url: shareUrl }); }
      catch (err) { console.error("Share cancelled or failed", err); }
    } else {
      await navigator.clipboard.writeText(shareText);
      const status = document.getElementById('share-status');
      status.style.display = 'block';
      setTimeout(() => (status.style.display = 'none'), 2000);
    }
  }
});

// Print button
document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'print-btn') window.print();
});

// Copy All Items
document.addEventListener('click', async (e) => {
  if (e.target && e.target.id === 'copy-btn') {
    const items = [...document.querySelectorAll('#grocery-list li')].map(li => `- ${li.textContent}`);
    await navigator.clipboard.writeText(items.join('\n'));
    const status = document.getElementById('copy-status');
    status.textContent = '✅ Grocery items copied!';
    status.style.display = 'block';
    setTimeout(() => (status.style.display = 'none'), 2000);
  }
});

// Copy by Category (expanded map)
document.addEventListener('click', async (e) => {
  if (e.target && e.target.id === 'copy-cat-btn') {
    const items = [...document.querySelectorAll('#grocery-list li')].map(li => li.textContent);
    const categories = {
      "Produce": [],
      "Protein": [],
      "Sauces/Condiments": [],
      "Noodles/Rice": [],
      "Sweeteners": [],
      "Spices/Seasonings": [],
      "Other": []
    };

    // Keyword map (lowercase checks)
    const rules = [
      ["Produce", ["lime","mint","shallot","green onion","scallion","basil","cilantro","chili","bell pepper","carrot","cucumber","bok choy","spinach","eggplant","daikon","lettuce","snow pea","snap pea","mushroom","ginger","garlic","lemongrass","kaffir lime"]],
      ["Protein", ["chicken","shrimp","white fish","tilapia","cod","turkey","egg"]],
      ["Sauces/Condiments", ["soy","fish sauce","oyster","sesame oil","rice vinegar","chili paste","sambal","peanut butter","coconut milk"]],
      ["Noodles/Rice", ["rice paper","glass noodle","noodle","jasmine rice","brown rice","vermicelli"]],
      ["Sweeteners", ["palm sugar","honey","sugar"]],
      ["Spices/Seasonings", ["toasted rice powder","miso","kaffir","curry","black pepper","five-spice","sichuan","galangal"]]
    ];

    function categorize(name) {
      const n = name.toLowerCase();
      for (const [cat, needles] of rules) {
        if (needles.some(k => n.includes(k))) return cat;
      }
      return "Other";
    }

    items.forEach(it => categories[categorize(it)].push(it));

    const order = ["Produce","Protein","Sauces/Condiments","Noodles/Rice","Sweeteners","Spices/Seasonings","Other"];
    let out = [];
    order.forEach(cat => {
      if (categories[cat].length) {
        out.push(`${cat}:`);
        categories[cat].sort((a,b)=>a.localeCompare(b)).forEach(item => out.push(` - ${item}`));
        out.push("");
      }
    });
    await navigator.clipboard.writeText(out.join('\n').trim());
    const status = document.getElementById('copy-status');
    status.textContent = '✅ Categorized list copied!';
    status.style.display = 'block';
    setTimeout(() => (status.style.display = 'none'), 2000);
  }
});

document.getElementById('day-select').addEventListener('change', function () {
  loadDay(this.value);
  updatePrintHeader(this.value);
});

// Initial load
let dayParam = getQueryParam('day') || new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
loadRecipes(dayParam);
loadDay(dayParam);
updatePrintHeader(dayParam);
