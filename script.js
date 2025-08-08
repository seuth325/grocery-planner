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

document.getElementById('day-select').addEventListener('change', function () {
  loadDay(this.value);
});

const dayParam = getQueryParam('day') || 'monday';
loadDay(dayParam.toLowerCase());
