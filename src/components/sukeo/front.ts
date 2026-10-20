/**
 * 正面の頭の形。(ox, oy) が頭の中心。
 * 目は頭の両わきにあり、下あごは上あごより細く、うしろに引っこむ（あごが出ない）。
 */
import { arc, blob, ellipse, scatter, spines, type Shape } from './parts';

export type FrontMouth = 'smile' | 'open' | 'wobble';

export function frontHead(ox: number, oy: number, mouthKind: FrontMouth = 'smile') {
  const shapes: Shape[] = [
    ellipse(ox, oy - 4, 52, 34), // 頭のてっぺん
    ellipse(ox, oy + 6, 60, 22), // うしろのほお（いちばん幅が広い）
    ellipse(ox - 44, oy - 12, 18, 17), // 左目のふくらみ
    ellipse(ox + 44, oy - 12, 18, 17), // 右目のふくらみ
    ellipse(ox, oy + 13, 38, 16), // 鼻先・上あご
    ellipse(ox, oy + 19, 30, 9.5), // 下あご（上あごより細く、下に出っぱらない）
  ];
  const eyes = [
    { x: ox - 44, y: oy - 12, r: 13.5 },
    { x: ox + 44, y: oy - 12, r: 13.5 },
  ];
  const crest: Shape[] = [
    ...spines(arc(ox - 44, oy - 12, 17, -170, -78, 6), 5, 5, 4.2, -1, 0.35),
    ...spines(arc(ox + 44, oy - 12, 17, -102, -10, 6), 5, 5, 4.2, -1, -0.35),
    ...spines([[ox - 61, oy + 2], [ox - 61, oy + 10], [ox - 56, oy + 20]], 3, 4, 4.2, 1, 0.3),
    ...spines([[ox + 61, oy + 2], [ox + 61, oy + 10], [ox + 56, oy + 20]], 3, 4, 4.2, -1, 0.3),
  ];
  const lips = `M${ox - 44} ${oy + 9} Q ${ox - 38} ${oy + 15}, ${ox - 29} ${oy + 16} C ${ox - 14} ${oy + 21}, ${ox + 14} ${oy + 21}, ${ox + 29} ${oy + 16} Q ${ox + 38} ${oy + 15}, ${ox + 44} ${oy + 9}`;
  const wobble = `M${ox - 36} ${oy + 13} C ${ox - 24} ${oy + 17}, ${ox - 13} ${oy + 18}, ${ox - 9} ${oy + 17} Q ${ox - 4.5} ${oy + 13}, ${ox} ${oy + 17} Q ${ox + 4.5} ${oy + 21}, ${ox + 9} ${oy + 17} C ${ox + 13} ${oy + 18}, ${ox + 24} ${oy + 17}, ${ox + 36} ${oy + 13}`;
  const mouth = mouthKind === 'wobble' ? wobble : lips;
  const open = {
    inner: `M${ox - 12} ${oy + 19.5} C ${ox - 9} ${oy + 32}, ${ox + 9} ${oy + 32}, ${ox + 12} ${oy + 19.5} C ${ox + 5} ${oy + 21}, ${ox - 5} ${oy + 21}, ${ox - 12} ${oy + 19.5} Z`,
    tongue: `M${ox - 7} ${oy + 26.5} C ${ox - 4} ${oy + 31}, ${ox + 4} ${oy + 31}, ${ox + 7} ${oy + 26.5} C ${ox + 3} ${oy + 24.5}, ${ox - 3} ${oy + 24.5}, ${ox - 7} ${oy + 26.5} Z`,
  };
  const nostrils = [
    { cx: ox - 7, cy: oy + 4 },
    { cx: ox + 7, cy: oy + 4 },
  ];
  const blotches = [
    blob(ox, oy - 26, 9, 5.5, 0, 1),
    blob(ox - 16, oy - 32, 4.6, 3.2, 20, 2),
    blob(ox + 16, oy - 32, 4.6, 3.2, -20, 3),
    blob(ox - 22, oy - 6, 4, 3, 30, 4),
    blob(ox + 22, oy - 6, 4, 3, -30, 5),
    blob(ox - 52, oy + 12, 4.5, 3, 40, 6),
    blob(ox + 52, oy + 12, 4.5, 3, -40, 7),
  ];
  const speckles = scatter(ox - 46, oy - 34, ox + 46, oy + 8, 14, 5);
  return { shapes, eyes, crest, mouth, open, nostrils, blotches, speckles };
}
