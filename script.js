function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
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
}

// Share button logic
document.getElementById('share-btn').addEventListener('click', async () => {
  const day = document.getElementById('day-select').value;
  const shareUrl = `${window.location.origin}${window.location.pathname}?day=${day}`;
  const shareText = `🥢 Here's the grocery list for ${day.charAt(0).toUpperCase() + day.slice(1)}: ${shareUrl}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `Grocery List for ${day}`,
        text: shareText,
        url: shareUrl
      });
    } catch (err) {
      console.error("Share cancelled or failed", err);
    }
  } else {
    await navigator.clipboard.writeText(shareText);
    const status = document.getElementById('share-status');
    status.style.display = 'block';
    setTimeout(() => (status.style.display = 'none'), 2000);
  }
});

document.getElementById('day-select').addEventListener('change', function () {
  loadDay(this.value);
});

// Auto-detect today's day if not provided in URL
let dayParam = getQueryParam('day');
if (!dayParam) {
  const today = new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
  dayParam = today;
}
loadDay(dayParam.toLowerCase());
