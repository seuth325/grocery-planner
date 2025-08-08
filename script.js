document.getElementById('day-select').addEventListener('change', function () {
  const day = this.value;
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
});
document.getElementById('day-select').dispatchEvent(new Event('change'));
