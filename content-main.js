// MAIN world: Outlook の DOM / React 内部データから差出人アドレスを取り出し、
// 差出人名の右にバッジとして表示する。
//
// - 閲覧ウィンドウ: アドレスは DOM に無く、React fiber の props
//   (sender.Mailbox.EmailAddress など) にしか無いため MAIN world で読む。
// - メッセージ一覧: 差出人 <span> の title 属性にアドレスが入っている。
(() => {
  if (window.__osaLoaded) return;
  window.__osaLoaded = true;

  const root = document.documentElement;
  const BADGE = 'osa-badge';
  const EMAIL_RE = /^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+$/;
  const JA = (navigator.language || '').toLowerCase().startsWith('ja');
  const T = JA
    ? { hint: 'クリックでアドレスをコピー', copied: '✓ コピー' }
    : { hint: 'Click to copy address', copied: '✓ Copied' };

  const settings = () => ({
    reading: root.dataset.osaReading !== '0', // 既定 ON
    list: root.dataset.osaList === '1', // 既定 OFF
  });

  // ---------- React fiber からアドレスを探す ----------
  const fiberOf = (el) => {
    for (const k in el) if (k.startsWith('__reactFiber$')) return el[k];
    return null;
  };

  const pick = (v) => (typeof v === 'string' && EMAIL_RE.test(v) ? v : null);

  const emailFromProps = (p) => {
    if (!p || typeof p !== 'object') return null;
    try {
      return (
        pick(p.cardParameters?.personaInfo?.identifiers?.Smtp) ||
        pick(p.emailAddress) ||
        pick(p.sender?.Mailbox?.EmailAddress) ||
        pick(p.from?.Mailbox?.EmailAddress) ||
        pick(p.persona?.EmailAddress) ||
        null
      );
    } catch {
      return null;
    }
  };

  const findEmailInFiber = (el) => {
    let f = fiberOf(el);
    for (let i = 0; i < 60 && f; i++) {
      const e = emailFromProps(f.memoizedProps);
      if (e) return e;
      f = f.return;
    }
    return null;
  };

  // ---------- バッジ ----------
  const buildBadge = (email, kind) => {
    const b = document.createElement('span');
    b.className = `${BADGE} ${BADGE}--${kind}`;
    b.dataset.email = email;
    b.title = T.hint;
    b.dataset.copiedLabel = T.copied;
    const at = email.lastIndexOf('@');
    const local = document.createElement('span');
    local.className = `${BADGE}__local`;
    local.textContent = email.slice(0, at);
    const domain = document.createElement('span');
    domain.className = `${BADGE}__domain`;
    domain.textContent = email.slice(at);
    b.append(local, domain);

    const stop = (e) => e.stopPropagation();
    b.addEventListener('mousedown', stop);
    b.addEventListener('pointerdown', stop);
    b.addEventListener('mouseover', stop);
    b.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      navigator.clipboard?.writeText(email).then(() => {
        b.classList.add(`${BADGE}--copied`);
        setTimeout(() => b.classList.remove(`${BADGE}--copied`), 1200);
      });
    });
    return b;
  };

  const upsertBadge = (anchor, email, kind) => {
    const next = anchor.nextElementSibling;
    const existing = next && next.classList.contains(BADGE) ? next : null;
    if (!email || anchor.textContent.trim().toLowerCase() === email.toLowerCase()) {
      existing?.remove();
      return;
    }
    if (existing) {
      if (existing.dataset.email === email) return;
      existing.replaceWith(buildBadge(email, kind));
      return;
    }
    anchor.after(buildBadge(email, kind));
  };

  const removeBadges = (kind) =>
    document.querySelectorAll(`.${BADGE}--${kind}`).forEach((b) => b.remove());

  // ---------- 閲覧ウィンドウ ----------
  const renderReading = () => {
    document.querySelectorAll('[id$="_FROM"][role="heading"], [id^="MSG_"][id$="_FROM"]').forEach((h) => {
      const target =
        h.querySelector('[aria-haspopup="dialog"]') ||
        h.querySelector('[role="button"]') ||
        h.firstElementChild;
      if (!target) return;
      upsertBadge(target, findEmailInFiber(target), 'reading');
    });
  };

  // ---------- メッセージ一覧 ----------
  const renderList = () => {
    document.querySelectorAll('[role="option"] span[title*="@"]').forEach((s) => {
      if (s.closest(`.${BADGE}`)) return;
      const email = s.title.trim();
      if (!EMAIL_RE.test(email)) return;
      upsertBadge(s, email, 'list');
    });
  };

  // ---------- 実行ループ ----------
  let scheduled = false;
  const run = () => {
    scheduled = false;
    const s = settings();
    s.reading ? renderReading() : removeBadges('reading');
    s.list ? renderList() : removeBadges('list');
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(run);
  };

  new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.target.nodeType === 1 && m.target.closest?.(`.${BADGE}`)) continue;
      schedule();
      return;
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true });

  new MutationObserver(schedule).observe(root, {
    attributes: true,
    attributeFilter: ['data-osa-reading', 'data-osa-list'],
  });

  schedule();
})();
