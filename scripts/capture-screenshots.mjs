// 各アプリの体験版を開いて、スマホサイズ（390×844・2倍）でスクショを撮り、WebP にして保存する。
// 体験版の URL は src/content/apps/<slug>.md の trialUrl から読む（ここには URL を書かない）。
//
// 使い方：npm run shots            … すべてのアプリ
//         npm run shots -- planty  … 指定したアプリだけ
//
// 撮ったあとは、個人情報・メールアドレス・トークンなどが写っていないか、必ず目で確認すること。
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

/**
 * アプリごとの撮り方。
 * - start：体験版を開いたあとに押すボタン（なければ開いただけで始まる）
 * - tidy ：始まったあとに押すボタン（使い方ガイドを小さくするなど。スクショに重ならないように）
 * - shots：撮る画面。path へ移動し、openFirst があればその一覧の最初の項目を開いてから撮る
 */
const APPS = {
  kondate: {
    shots: [
      { name: '01-home', path: '/' },
      { name: '02-week', path: '/week' },
      { name: '03-shopping', path: '/shopping' },
      { name: '04-recipes', path: '/recipes' },
      { name: '05-pantry', path: '/pantry' },
    ],
  },
  planty: {
    start: 'ログインせずに試す',
    shots: [
      { name: '01-home', path: '/' },
      { name: '02-plants', path: '/plants' },
      { name: '03-plant', path: '/plants', openFirst: 'a[href^="/plants/"]:not([href="/plants/new"])' },
      { name: '04-watering', path: '/watering' },
      { name: '05-calendar', path: '/calendar' },
    ],
  },
  kajirima: {
    // 使い方ガイドがスクショに重ならないよう、はじめに小さくしておく
    tidy: '小さくする',
    shots: [
      { name: '01-home', path: '/' },
      { name: '02-routine', path: '/', openFirst: 'button[aria-label="換気扇・レンジフードの詳細"]' },
      { name: '03-add', path: '/add' },
      { name: '04-collection', path: '/collection' },
      { name: '05-vault', path: '/collection/vault' },
    ],
  },
};

async function trialUrlOf(slug) {
  const md = await readFile(new URL(`../src/content/apps/${slug}.md`, import.meta.url), 'utf8');
  const m = md.match(/^trialUrl:\s*["']?(https:\/\/[^"'\s]+)["']?\s*$/m);
  if (!m) throw new Error(`${slug}: trialUrl が見つかりません（https のみ）`);
  return m[1];
}

const targets = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(APPS);
const browser = await chromium.launch();
try {
  for (const slug of targets) {
    const app = APPS[slug];
    if (!app) throw new Error(`${slug}: 撮り方が APPS に登録されていません`);
    const trialUrl = await trialUrlOf(slug);
    const origin = new URL(trialUrl).origin;
    const outDir = new URL(`../src/assets/apps/${slug}/`, import.meta.url);
    await mkdir(outDir, { recursive: true });

    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      locale: 'ja-JP',
      timezoneId: 'Asia/Tokyo',
    });
    const page = await ctx.newPage();
    // 体験版を開く（ここでお試しのデータが用意される）
    await page.goto(trialUrl, { waitUntil: 'networkidle' });
    if (app.start) {
      await page.getByRole('button', { name: app.start }).click();
      await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30000 });
    }
    await page.waitForTimeout(3000);
    if (app.tidy) {
      const btn = page.getByRole('button', { name: app.tidy });
      if (await btn.count()) await btn.first().click();
      await page.waitForTimeout(800);
    }

    for (const shot of app.shots) {
      await page.goto(origin + shot.path, { waitUntil: 'networkidle' });
      if (shot.openFirst) {
        await page.locator(shot.openFirst).first().click();
        await page.waitForLoadState('networkidle');
      }
      await page.waitForTimeout(6000); // 画面の動きやヒントの表示が落ち着くまで待つ
      if (app.tidy) {
        // 画面を移ると開き直すことがあるので、撮る前にもう一度小さくする
        const btn = page.getByRole('button', { name: app.tidy });
        if (await btn.count()) {
          await btn.first().click();
          await page.waitForTimeout(1200);
        }
      }
      const png = await page.screenshot();
      const file = new URL(`${shot.name}.webp`, outDir);
      await sharp(png).webp({ quality: 82 }).toFile(fileURLToPath(file));
      console.log(`${slug}/${shot.name}.webp`);
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}
