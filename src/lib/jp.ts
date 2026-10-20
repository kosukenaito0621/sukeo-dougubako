/**
 * 日本語の改行を自然にする（サイトを作るときに処理する。閲覧者の端末では何も動かない）。
 * - BudouX で文節に分け、文節の切れ目でだけ改行できるようにする（<wbr>）
 * - 最後の行が1〜3文字だけにならないよう、文末の数文字は前の文節とつなげて改行させない
 */
import { loadDefaultJapaneseParser } from 'budoux';

const parser = loadDefaultJapaneseParser();

/** 文末で、改行させずにまとめておく最低の文字数 */
const TAIL_MIN = 5;
/** まとめすぎると狭い画面ではみ出すので、上限を決めておく */
const TAIL_MAX = 12;

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const len = (s: string) => [...s].length;

/**
 * 1行の文を、改行してよい区切りごとのかたまりに分ける。
 * 最後のかたまりは、短くなりすぎないよう前の文節とつなげてある。
 */
export function phrases(text: string): string[] {
  const list = parser.parse(text);
  if (list.length === 0) return [];
  let tail = list.pop()!;
  while (list.length > 0 && len(tail) < TAIL_MIN && len(list[list.length - 1]! + tail) <= TAIL_MAX) {
    tail = list.pop()! + tail;
  }
  return [...list, tail];
}

function line(text: string): string {
  const parts = phrases(text);
  if (parts.length === 0) return '';
  const tail = parts.pop()!;
  const head = parts.map(esc).join('<wbr>');
  return `${head}${head ? '<wbr>' : ''}<span class="jp-tail">${esc(tail)}</span>`;
}

/** 文章を、改行位置を整えた HTML にする。\n は改行（<br>）として残す */
export function jp(text: string): string {
  return text.split('\n').map(line).join('<br>');
}
