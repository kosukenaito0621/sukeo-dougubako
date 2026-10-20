// OGP 画像とファビコンを作る：npm run og
// 開発サーバーを一時的に起動して /dev/og を撮影し、public/ に書き出す。
//   public/og.png              … 1200×630（LINE や SNS で共有したときの画像）
//   public/favicon.svg         … すけおの顔
//   public/favicon-32.png      … 32×32（SVG のファビコンに対応していないブラウザ用）
//   public/apple-touch-icon.png… 180×180（iPhone のホーム画面用。背景はクリーム色）
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const PORT = 4321;
const BASE = `http://localhost:${PORT}`;
const root = new URL('../', import.meta.url);
const out = (name) => fileURLToPath(new URL(`public/${name}`, root));

const alive = async () => {
  try {
    return (await fetch(`${BASE}/dev/og/`)).ok;
  } catch {
    return false;
  }
};

// すでに npm run dev が動いていればそれを使う（Astro は同じフォルダで2つ起動できない）。なければ起動する
let server = null;
if (!(await alive())) {
  server = spawn(process.execPath, [fileURLToPath(new URL('node_modules/astro/bin/astro.mjs', root)), 'dev', '--port', String(PORT)], {
    cwd: fileURLToPath(root),
    stdio: 'ignore',
  });
  const until = Date.now() + 60000;
  while (!(await alive())) {
    if (Date.now() > until) throw new Error('開発サーバーが起動しませんでした');
    await new Promise((r) => setTimeout(r, 500));
  }
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1300, height: 1300 }, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/dev/og/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);

  const og = await page.locator('#og').screenshot();
  await sharp(og).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(out('og.png'));

  const svg = await page.locator('#face svg').evaluate((el) => {
    const c = el.cloneNode(true);
    c.removeAttribute('class');
    c.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    return c.outerHTML;
  });
  await writeFile(out('favicon.svg'), svg);

  const face = await page.locator('#face').screenshot({ omitBackground: true });
  await sharp(face).resize(32, 32).png().toFile(out('favicon-32.png'));
  await sharp({ create: { width: 180, height: 180, channels: 4, background: '#fbf6ec' } })
    .composite([{ input: await sharp(face).resize(156, 156).png().toBuffer(), top: 12, left: 12 }])
    .png()
    .toFile(out('apple-touch-icon.png'));
  console.log('public/og.png, favicon.svg, favicon-32.png, apple-touch-icon.png を作りました');
} finally {
  await browser.close();
  server?.kill();
}
