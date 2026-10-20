export {};

/**
 * 全画面メニュー（JS があるときの動き）。
 * 開く・閉じる、Esc で閉じる、Tab のフォーカスをメニューの中に閉じこめる、閉じたらボタンにフォーカスを戻す。
 * スクロールの停止・再開は、トップページの演出側（story.ts）が menu:open / menu:close を受け取って行う。
 */
const menu = document.querySelector<HTMLElement>('[data-menu]');
const opener = document.querySelector<HTMLAnchorElement>('[data-menu-open]');
const closer = menu?.querySelector<HTMLAnchorElement>('[data-menu-close]');

if (menu && opener && closer) {
  const focusables = () => [...menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];

  const open = () => {
    menu.classList.add('is-open');
    opener.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('menu-is-open');
    document.dispatchEvent(new CustomEvent('menu:open'));
    closer.focus();
  };
  const close = (returnFocus = true) => {
    menu.classList.remove('is-open');
    opener.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('menu-is-open');
    document.dispatchEvent(new CustomEvent('menu:close'));
    if (returnFocus) opener.focus();
  };

  opener.addEventListener('click', (e) => {
    e.preventDefault();
    open();
  });
  closer.addEventListener('click', (e) => {
    e.preventDefault();
    close();
  });
  // メニューの中のリンクを押したら閉じる（移動は通常どおり）
  menu.querySelectorAll<HTMLAnchorElement>('[data-menu-link]').forEach((a) => {
    a.addEventListener('click', () => close(false));
  });
  document.addEventListener('keydown', (e) => {
    if (!menu.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') {
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  // JS なしのとき用の #menu が URL に残っていたら、JS の開き方に切り替える
  if (location.hash === '#menu') {
    history.replaceState(null, '', location.pathname + location.search);
    open();
  }
}
