// --- v1.0.9 (manifest fix integrated) ---
let currentDay = null;
let currentItems = [];
let manifest = {};
const BUILD_TAG = 'v1.0.9-manifest';

function renderError(msg) {
  const root = document.getElementById("grocery-list");
  if (!root) return;
  root.innerHTML = "";
  const li = document.createElement("li");
  li.textContent = msg;
  root.appendChild(li);
}

async function loadManifest() {
  if (Object.keys(manifest).length) return;
  const url = `data/manifest.json?v=${BUILD_TAG}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Manifest load failed: ${res.status} ${res.statusText}`);
  manifest = await res.json();
}

async function loadDay(day) {
  try {
    currentDay = (day || 'monday').toLowerCase();
    const dd = document.getElementById('day-select');
    if (dd) dd.value = currentDay;

    if (typeof updateDayDateDisplay === 'function') {
      updateDayDateDisplay(currentDay);
    }

    await loadManifest();
    const path = manifest[currentDay];
    if (!path) throw new Error(`No entry for "${currentDay}" in data/manifest.json`);

    const url = `${path}?v=${BUILD_TAG}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`);
    const data = await res.json();
    currentItems = Array.isArray(data.ingredients) ? data.ingredients.slice() : [];

    if (typeof renderListAccordingToPrefs === 'function') renderListAccordingToPrefs();
    if (typeof displayRecipes === 'function') displayRecipes(currentDay);
    if (typeof applyImageStyle === 'function') applyImageStyle();
  } catch (err) {
    console.error(err);
    currentItems = [];
    renderError(`Could not load grocery list for "${currentDay}". Expected file: ${manifest[currentDay] || 'data/<day>_grocery.json'}`);
  }
}

// Wire initial load safely
document.addEventListener('DOMContentLoaded', () => {
  const param = new URLSearchParams(location.search).get('day');
  const day = (param || new Date().toLocaleString('en-US', { weekday: 'long' })).toLowerCase();
  loadDay(day);
});

// Keep existing change handler working if present
document.getElementById('day-select')?.addEventListener('change', function(){
  loadDay(this.value);
});
