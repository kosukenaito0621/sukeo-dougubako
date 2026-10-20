/**
 * すけおの動き（GSAP）。各関数は止めるための timeline / tween を返す。
 * 「視差効果を減らす」がオンのときは、呼び出し側で動かさないこと（reducedMotion() で判定）。
 * 回すパーツには data-origin="x y"（SVG 全体の座標）が付いていて、そこを軸に回す。
 */
import { gsap } from 'gsap';

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const q = (root: Element, part: string) => [...root.querySelectorAll<SVGGElement>(`[data-part="${part}"]`)];

/** data-origin を回転の軸にする */
function pivot(els: SVGGElement[]) {
  els.forEach((el) => {
    if (el.dataset.origin) gsap.set(el, { svgOrigin: el.dataset.origin });
  });
  return els;
}

/** まばたき（目をきゅっとつぶる）。数秒おきにくり返す */
export function blink(root: Element) {
  const eyes = q(root, 'eye');
  if (eyes.length === 0) return null; // 目を閉じたポーズなど
  gsap.set(eyes, { transformOrigin: '50% 50%' });
  const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.8, delay: 1 + Math.random() });
  tl.to(eyes, { scaleY: 0.1, duration: 0.07, ease: 'power1.in' }).to(eyes, { scaleY: 1, duration: 0.13, ease: 'power1.out' });
  return tl;
}

/** しっぽをゆらゆら振る */
export function wagTail(root: Element, amount = 6) {
  const tail = pivot(q(root, 'tail'));
  if (tail.length === 0) return null;
  return gsap.fromTo(tail, { rotation: -amount }, { rotation: amount, duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
}

/**
 * 歩く（横向き）。脚を対角で交互に振り、体を少し上下させる。
 * paused で返すので、スクロール量に合わせて progress() を動かして使える。
 */
export function walkCycle(root: Element, { stepDuration = 0.32 } = {}) {
  const a = pivot([...q(root, 'leg-near-front'), ...q(root, 'leg-far-back')]);
  const b = pivot([...q(root, 'leg-near-back'), ...q(root, 'leg-far-front')]);
  const walker = q(root, 'walker');
  const head = pivot(q(root, 'head'));
  const tail = pivot(q(root, 'tail'));
  const s = stepDuration;

  const tl = gsap.timeline({ paused: true, repeat: -1, defaults: { ease: 'sine.inOut', duration: s } });
  tl.fromTo(a, { rotation: 22 }, { rotation: -22 }, 0)
    .fromTo(b, { rotation: -22 }, { rotation: 22 }, 0)
    .to(a, { rotation: 22 }, s)
    .to(b, { rotation: -22 }, s)
    // 1歩ごとに体が少し上がる
    .fromTo(walker, { y: 0 }, { y: -3, duration: s / 2, yoyo: true, repeat: 3, ease: 'sine.out' }, 0);
  // 頭・しっぽが別パーツのときだけ揺らす（横向きは胴と一体なので揺らさない）
  if (head.length) tl.fromTo(head, { rotation: -2.5 }, { rotation: 2.5, duration: s, yoyo: true, repeat: 1 }, 0);
  if (tail.length) tl.fromTo(tail, { rotation: 5 }, { rotation: -5, duration: s, yoyo: true, repeat: 1 }, 0);
  return tl;
}

/** 手を振る（talk ポーズの上げた手） */
export function wave(root: Element) {
  const arm = pivot(q(root, 'arm-r'));
  return gsap.fromTo(arm, { rotation: -6 }, { rotation: 10, duration: 0.26, ease: 'sine.inOut', yoyo: true, repeat: 5 });
}

/** 壁をのぼる（はりつきポーズ）。手足を対角で交互に伸ばしながら上へ */
export function climb(root: Element, distance = 40, steps = 2) {
  const fl = q(root, 'leg-fl');
  const fr = q(root, 'leg-fr');
  const bl = q(root, 'leg-bl');
  const br = q(root, 'leg-br');
  const tl = gsap.timeline({ defaults: { duration: 0.3, ease: 'sine.inOut' } });
  for (let i = 0; i < steps; i++) {
    tl.to([...fl, ...br], { y: -8 })
      .to([...fr, ...bl], { y: 4 }, '<')
      .to(root, { y: `-=${distance / (2 * steps)}` }, '<')
      .to([...fl, ...br], { y: 4 })
      .to([...fr, ...bl], { y: -8 }, '<')
      .to(root, { y: `-=${distance / (2 * steps)}` }, '<');
  }
  tl.to([...fl, ...fr, ...bl, ...br], { y: 0 });
  return tl;
}

/** 目を閉じた状態にする（wakeable で描いたすけおを、オープニングの前に眠らせる） */
export function sleep(root: Element) {
  gsap.set(q(root, 'eye'), { opacity: 0 });
  gsap.set(q(root, 'eye-closed'), { opacity: 1 });
}

/** 目を覚ます（はりつきポーズ）。閉じた目 → ぱちっと開く */
export function wake(root: Element) {
  const eyes = q(root, 'eye');
  const closed = q(root, 'eye-closed');
  gsap.set(eyes, { transformOrigin: '50% 50%' });
  return gsap
    .timeline()
    .to(closed, { opacity: 0, duration: 0.12 }, 0.3)
    .fromTo(eyes, { scaleY: 0.1, opacity: 1 }, { scaleY: 1, duration: 0.35, ease: 'back.out(3)' }, 0.3);
}
