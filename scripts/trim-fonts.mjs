/**
 * ビルド後に、日本語フォントを「サイトで使っている文字だけ」の1ファイル（太さごと）にまとめる。
 *
 * @fontsource のフォントは文字の範囲ごとに 100 以上のファイルに分かれていて、
 * 定義（@font-face）が多いほど、ファイルが届くたびに文字の配置計算がやり直されて表示が重くなる。
 * 文章はすべてビルド時に決まるので、dist の HTML に出てくる文字だけを集めた1ファイルにすれば、
 * 見た目はそのままで、定義は太さごとに1つ・ダウンロードも1回になる。
 * （Zen Maru Gothic は SIL Open Font License。文字を絞って配布することは認められている）
 */
import { createHash } from 'node:crypto';
import { readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import fe from 'fonteditor-core';

async function files(dir, ext) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await files(p, ext)));
    else if (p.endsWith(ext)) out.push(p);
  }
  return out;
}

/** "U+3000-303F, U+4E00" → [[0x3000,0x303f],[0x4e00,0x4e00]] */
function ranges(spec) {
  return spec.split(',').map((r) => {
    const [a, b] = r.trim().replace(/^U\+/i, '').split('-');
    return [parseInt(a, 16), parseInt(b ?? a, 16)];
  });
}

const prop = (block, name) => block.match(new RegExp(`${name}:\\s*([^;}]+)`))?.[1]?.trim();

export async function trimFonts(distDir) {
  await fe.woff2.init();
  const astroDir = join(distDir, '_astro');

  // サイトで使っている文字（HTML に出てくる文字すべて＋基本の英数字・記号）
  const used = new Set();
  for (const f of await files(distDir, '.html')) for (const ch of await readFile(f, 'utf8')) used.add(ch.codePointAt(0));
  for (let c = 0x20; c <= 0x7e; c++) used.add(c);
  for (const c of [0x3000, 0x3001, 0x3002, 0x300c, 0x300d, 0xff01, 0xff1f, 0x2026, 0x30fc]) used.add(c);

  const report = [];
  const replacedFiles = new Set();
  for (const cssFile of await files(astroDir, '.css')) {
    const css = await readFile(cssFile, 'utf8');
    if (!css.includes('@font-face')) continue;

    // 同じ書体・太さ・スタイルの定義をまとめる
    const groups = new Map();
    for (const block of css.match(/@font-face\s*{[^}]*}/g) ?? []) {
      const key = [prop(block, 'font-family'), prop(block, 'font-weight'), prop(block, 'font-style')].join('|');
      const url = block.match(/url\(([^)]+\.woff2)\)/)?.[1]?.replace(/["']/g, '');
      const range = prop(block, 'unicode-range');
      if (!url || !range) continue;
      if (!groups.has(key)) groups.set(key, { block, parts: [] });
      groups.get(key).parts.push({ url, ranges: ranges(range) });
    }

    let next = css.replace(/@font-face\s*{[^}]*}/g, '');
    for (const [key, g] of groups) {
      const [family, weight, style] = key.split('|');
      let merged = null;
      const seen = new Set();
      for (const part of g.parts) {
        const want = [...used].filter((c) => part.ranges.some(([a, b]) => c >= a && c <= b) && !seen.has(c));
        replacedFiles.add(basename(part.url));
        if (want.length === 0) continue;
        const buf = await readFile(join(astroDir, basename(part.url)));
        const font = fe.Font.create(buf, { type: 'woff2', subset: want, hinting: false, compound2simple: true });
        // ほかのファイルと重なる文字（空白など）は、先に入れたほうを使う
        const ttf = font.get();
        ttf.glyf = ttf.glyf.filter((gl, i) => {
          if (i === 0) return merged === null; // .notdef は1つだけ
          const own = (gl.unicode ?? []).filter((u) => !seen.has(u));
          gl.unicode = own;
          return own.length > 0;
        });
        for (const gl of ttf.glyf) for (const u of gl.unicode ?? []) seen.add(u);
        if (merged === null) merged = font;
        else merged.merge(font, { scale: 1 });
      }
      if (!merged) continue;
      const out = Buffer.from(merged.write({ type: 'woff2', hinting: false }));
      const name = `${family.replace(/["']/g, '').replace(/\W+/g, '-').toLowerCase()}-${weight}-${createHash('sha256').update(out).digest('hex').slice(0, 10)}.woff2`;
      await writeFile(join(astroDir, name), out);
      next =
        `@font-face{font-family:${family};font-style:${style};font-display:swap;font-weight:${weight};src:url(/_astro/${name}) format("woff2")}` +
        next;
      report.push(`${family.replace(/["']/g, '')} ${weight}: ${seen.size} 文字・${Math.round(out.length / 1024)}KB`);
    }
    await writeFile(cssFile, next);
  }

  // もう使わない分割ファイル（woff2 と、古いブラウザ用の woff）を消す
  for (const f of replacedFiles) await rm(join(astroDir, f), { force: true });
  const css = (await Promise.all((await files(astroDir, '.css')).map((f) => readFile(f, 'utf8')))).join('');
  for (const f of await files(astroDir, '.woff')) {
    if (!css.includes(basename(f))) await rm(f, { force: true });
  }
  return report;
}
