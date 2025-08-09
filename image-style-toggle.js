
// Image Style toggle + applier (v1.0.9)
(function(){
  const PREF_IMG_STYLE = 'pref_image_style'; // 'illustration' | 'photo'
  window.gpPrefs = window.gpPrefs || {};
  const prefs = window.gpPrefs;
  prefs.imgStyle = localStorage.getItem(PREF_IMG_STYLE) || prefs.imgStyle || 'illustration';

  function saveImgPref(){
    localStorage.setItem(PREF_IMG_STYLE, prefs.imgStyle);
  }

  // Swap images across the page based on prefs.imgStyle
  function applyImageStyle(scope=document) {
    const mode = (prefs.imgStyle || 'illustration');
    const imgs = scope.querySelectorAll('img[data-photo][data-illustration]');
    imgs.forEach(img => {
      const nextSrc = mode === 'photo' ? img.dataset.photo : img.dataset.illustration;
      if (img.getAttribute('src') !== nextSrc) img.setAttribute('src', nextSrc);
    });
  }
  window.applyImageStyle = applyImageStyle;

  // Wire Settings select if present (id="pref-image-style")
  function wireSettings(){
    const sel = document.getElementById('pref-image-style');
    if (!sel) return;
    sel.value = prefs.imgStyle;
    sel.addEventListener('change', () => {
      prefs.imgStyle = sel.value;
      saveImgPref();
      applyImageStyle();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    wireSettings();
    applyImageStyle();
  });
})();
