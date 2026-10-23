const DEFAULTS = { reading: true, list: false };

document.documentElement.lang = chrome.i18n.getUILanguage();
document.querySelectorAll('[data-i18n]').forEach((el) => {
  el.textContent = chrome.i18n.getMessage(el.dataset.i18n);
});

chrome.storage.sync.get(DEFAULTS, (s) => {
  for (const key of Object.keys(DEFAULTS)) {
    const el = document.getElementById(key);
    el.checked = !!s[key];
    el.addEventListener('change', () => chrome.storage.sync.set({ [key]: el.checked }));
  }
});
