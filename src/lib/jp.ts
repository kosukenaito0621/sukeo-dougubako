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
 * BudouX が途中で切ってしまう言葉。ここにある言葉の中では改行しない。
 * おかしな位置で改行される言葉を見つけたら、ここに足す。
 */
const KEEP_TOGETHER = ['もふもふ'];

/** 言葉の途中にある区切りを消して、つなげなおす */
function keepWords(list: string[]): string[] {
  const text = list.join('');
  const cut = new Set<number>(); // 消す区切りの位置（文の先頭からの文字数）
  for (const word of KEEP_TOGETHER) {
    for (let at = text.indexOf(word); at >= 0; at = text.indexOf(word, at + 1)) {
      for (let k = at + 1; k < at + word.length; k++) cut.add(k);
    }
  }
  const out: string[] = [];
  let pos = 0;
  for (const p of list) {
    if (out.length > 0 && cut.has(pos)) out[out.length - 1] += p;
    else out.push(p);
    pos += p.length;
  }
  return out;
}

/**
 * 1行の文を、改行してよい区切りごとのかたまりに分ける。
 * 最後のかたまりは、短くなりすぎないよう前の文節とつなげてある。
 */
export function phrases(text: string): string[] {
  const list = keepWords(parser.parse(text));
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
