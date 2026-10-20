/** シーン背景で使う形（葉・ぶち・板目など） */
const rad = (d: number) => (d * Math.PI) / 180;
const f = (n: number) => Math.round(n * 10) / 10;

/** 細長い葉。(x,y) が付け根、len の長さで angle の向きへ */
export function leaf(x: number, y: number, len: number, width: number, angle: number) {
  const c = Math.cos(rad(angle));
  const s = Math.sin(rad(angle));
  const p = (u: number, v: number) => `${f(x + u * c - v * s)} ${f(y + u * s + v * c)}`;
  return `M${p(0, 0)} Q ${p(len * 0.35, width)}, ${p(len, 0)} Q ${p(len * 0.35, -width)}, ${p(0, 0)} Z`;
}

/** 葉の中心の筋 */
export function vein(x: number, y: number, len: number, angle: number) {
  const c = Math.cos(rad(angle));
  const s = Math.sin(rad(angle));
  return `M${f(x)} ${f(y)} L${f(x + len * 0.85 * c)} ${f(y + len * 0.85 * s)}`;
}

/** ハート形の葉（ポトス・モンステラの幼葉など）。(x,y) が付け根 */
export function heartLeaf(x: number, y: number, size: number, angle: number) {
  const c = Math.cos(rad(angle));
  const s = Math.sin(rad(angle));
  const p = (u: number, v: number) => `${f(x + (u * c - v * s) * size)} ${f(y + (u * s + v * c) * size)}`;
  return `M${p(0, 0)} C ${p(0.1, -0.55)}, ${p(0.75, -0.6)}, ${p(1, 0)} C ${p(0.75, 0.6)}, ${p(0.1, 0.55)}, ${p(0, 0)} Z`;
}

/** 決まった並びの疑似乱数 */
export function rng(seed = 1) {
  let t = seed * 9301 + 49297;
  return () => {
    t = (t * 9301 + 49297) % 233280;
    return t / 233280;
  };
}

/** ページ内で重ならない id */
export const sid = () => `sc${Math.random().toString(36).slice(2, 8)}`;
