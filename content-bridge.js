// Isolated world: chrome.storage の設定を <html> の data 属性に書き出し、
// MAIN world 側 (content-main.js) に伝える橋渡し役。
(() => {
  const DEFAULTS = { reading: true, list: false, bold: true, lang: 'auto' };
  const root = document.documentElement;

  const apply = (s) => {
    root.dataset.osaReading = s.reading ? '1' : '0';
    root.dataset.osaList = s.list ? '1' : '0';
    root.dataset.osaBold = s.bold ? '1' : '0';
    root.dataset.osaLang = s.lang;
  };

  chrome.storage.sync.get(DEFAULTS, apply);
  chrome.storage.onChanged.addListener((_changes, area) => {
    if (area === 'sync') chrome.storage.sync.get(DEFAULTS, apply);
  });
})();
