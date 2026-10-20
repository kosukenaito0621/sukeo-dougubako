import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import { SITE } from './src/site.config.ts';
import { headersFile } from './src/security.ts';
import { trimFonts } from './scripts/trim-fonts.mjs';

/** このサイト用の小さな仕組み */
const sukeoSite = {
  name: 'sukeo-site',
  hooks: {
    /** 確認用ページ（/dev/...）は開発中（npm run dev）だけ使えるようにし、公開用のビルドには入れない */
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command !== 'dev') return;
      injectRoute({ pattern: '/dev/sukeo', entrypoint: './src/dev/sukeo.astro' });
      injectRoute({ pattern: '/dev/design', entrypoint: './src/dev/design.astro' });
      injectRoute({ pattern: '/dev/draw/[p]', entrypoint: './src/dev/draw.astro' });
      injectRoute({ pattern: '/dev/og', entrypoint: './src/dev/og.astro' });
    },
    /** セキュリティ用のヘッダー（Cloudflare の _headers）を書き出す */
    'astro:build:done': async ({ dir, logger }) => {
      await writeFile(new URL('_headers', dir), headersFile());
      // 日本語フォントを、サイトで使っている文字だけの1ファイル（太さごと）にまとめて、表示を軽くする
      for (const line of await trimFonts(fileURLToPath(dir))) logger.info(`フォント：${line}`);
    },
  },
};

export default defineConfig({
  site: SITE.url,
  output: 'static',
  trailingSlash: 'always',
  // 開発中の画面下のツールバーは使わない（スクショに写り込むため）
  devToolbar: { enabled: false },
  build: {
    // CSP で 'unsafe-inline' を使わずに済むよう、CSS は必ず別ファイルにする
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      // スクリプトも HTML に埋め込まず、別ファイルにする（CSP のため）
      assetsInlineLimit: 0,
    },
  },
  integrations: [sukeoSite],
});
