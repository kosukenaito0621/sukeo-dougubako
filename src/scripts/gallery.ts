export {};

/**
 * 詳細ページのスクショ一覧：スワイプ（横スクロール）は JS なしで動く。
 * JS があれば、マウスでも送れるように「前へ・次へ」ボタンを出す。
 */
const gallery = document.querySelector<HTMLElement>('[data-gallery]');
const nav = document.querySelector<HTMLElement>('[data-gallery-nav]');

if (gallery && nav) {
  nav.hidden = false;
  const step = () => (gallery.querySelector<HTMLElement>('li')?.offsetWidth ?? 200) + 16;
  const smooth = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  nav.querySelectorAll<HTMLButtonElement>('[data-dir]').forEach((btn) => {
    btn.addEventListener('click', () => {
      gallery.scrollBy({ left: Number(btn.dataset.dir) * step(), behavior: smooth });
    });
  });
}
