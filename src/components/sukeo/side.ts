/**
 * 横向き（右向き）の頭の形。(ox, oy) が頭骨の中心。
 * 首までふくむので、胴と同じ Layer に入れるとつなぎ目のない1つの形になる。
 */
import { arc, blob, ellipse, scatter, spines, type Shape } from './parts';

export function sideHead(ox: number, oy: number) {
  const shapes: Shape[] = [
    ellipse(ox, oy, 44, 31), // 頭骨
    ellipse(ox + 28, oy + 9, 26, 19), // 鼻先（丸い）
    ellipse(ox + 4, oy + 18, 40, 14), // 下あご（平らで出っぱらない）
    ellipse(ox - 24, oy + 10, 26, 22), // 目のうしろのほお
    ellipse(ox - 46, oy + 16, 26, 22), // 首
  ];
  const eye = { x: ox + 8, y: oy - 6, r: 12.5 };
  // 目の上のまつげのようなトゲと、目のうしろから首へ続くクレスト
  const crest: Shape[] = [
    ...spines(arc(eye.x, eye.y, eye.r + 3.5, -172, -38, 8), 7, 6.5, 4.6, -1, 0.5),
    ...spines(
      [
        [ox - 6, oy - 18],
        [ox - 22, oy - 20],
        [ox - 38, oy - 15],
        [ox - 52, oy - 7],
      ],
      6,
      5.5,
      5,
      1,
    ),
  ];
  const mouth = `M${ox + 53} ${oy + 11} C ${ox + 40} ${oy + 17}, ${ox + 14} ${oy + 18}, ${ox - 6} ${oy + 15} Q ${ox - 13} ${oy + 13}, ${ox - 15} ${oy + 9}`;
  const nostril = { cx: ox + 47, cy: oy - 1 };
  const blotches = [
    blob(ox - 12, oy - 22, 7, 4.5, 10, 1),
    blob(ox - 30, oy - 4, 5, 3.5, 30, 2),
    blob(ox + 24, oy - 16, 4.5, 3, -10, 3),
    blob(ox - 40, oy + 18, 5, 3.4, 20, 4),
  ];
  const speckles = scatter(ox - 50, oy - 26, ox + 44, oy + 8, 14, 7);
  const throat = { cx: ox - 4, cy: oy + 32, rx: 40, ry: 9 };
  return { shapes, eye, crest, mouth, nostril, blotches, speckles, throat };
}
