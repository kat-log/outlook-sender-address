const DEFAULTS = { reading: true, list: false, bold: true, lang: 'auto' };
const TOGGLES = ['reading', 'list', 'bold'];

// 言語を選べるように、chrome.i18n ではなく _locales の messages.json を直接読む
const cache = {};
const loadMessages = async (lang) => {
  if (!cache[lang]) {
    const res = await fetch(chrome.runtime.getURL(`_locales/${lang}/messages.json`));
    cache[lang] = await res.json();
  }
  return cache[lang];
};
const resolveLang = (pref) => {
  if (pref === 'ja' || pref === 'en') return pref;
  return chrome.i18n.getUILanguage().toLowerCase().startsWith('ja') ? 'ja' : 'en';
};
const applyLang = async (pref) => {
  const lang = resolveLang(pref);
  const msgs = await loadMessages(lang);
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = msgs[el.dataset.i18n]?.message ?? '';
  });
};

chrome.storage.sync.get(DEFAULTS, async (s) => {
  for (const key of TOGGLES) {
    const el = document.getElementById(key);
    el.checked = !!s[key];
    el.addEventListener('change', () => chrome.storage.sync.set({ [key]: el.checked }));
  }
  const sel = document.getElementById('lang');
  sel.value = s.lang;
  sel.addEventListener('change', () => {
    chrome.storage.sync.set({ lang: sel.value });
    applyLang(sel.value);
  });
  await applyLang(s.lang);
});
