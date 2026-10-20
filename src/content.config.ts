/**
 * アプリの情報（1アプリ＝1ファイル：src/content/apps/<slug>.md）。
 * 入力漏れや形のまちがいは、ビルド時にエラーになる。
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { SCENE_KEYS, isSceneKey } from './scenes/keys';

/** https:// で始まる URL だけを許す */
const httpsUrl = z.url({ protocol: /^https$/, hostname: z.regexes.domain }).describe('https のURL');

const apps = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/apps' }),
  schema: ({ image }) =>
    z
      .object({
        slug: z.string().regex(/^[a-z0-9-]+$/, 'slug は半角の小文字・数字・ハイフンだけ'),
        name: z.string().min(1),
        /** 一言説明 */
        catchcopy: z.string().min(1),
        status: z.enum(['公開中', '開発中', '構想中']),
        /** 表示順（小さいほど先） */
        order: z.number().int(),
        /** トップページで使う背景（src/scenes/keys.ts にあるもの） */
        scene: z.string().refine(isSceneKey, { message: `scene は ${SCENE_KEYS.join(' / ')} のどれか` }),
        /** 構想中は省略できる */
        icon: image().optional(),
        /** 体験版のURL（https のみ）。構想中や、体験版がまだないときは省略 */
        trialUrl: httpsUrl.optional(),
        /** 体験版でできないこと */
        trialLimitations: z.array(z.string().min(1)).optional(),
        screenshots: z.array(z.object({ src: image(), alt: z.string().min(1) })).optional(),
        /** 使い方（ステップ） */
        howTo: z.array(z.object({ title: z.string().min(1), body: z.string().min(1), image: image().optional() })).optional(),
        /** 更新履歴 */
        changelog: z.array(z.object({ date: z.coerce.date(), version: z.string().optional(), body: z.string().min(1) })).optional(),
        /** スクショなどに写っている、他の人の作品のクレジット（ライセンス表示） */
        credits: z
          .array(
            z.object({
              label: z.string().min(1),
              items: z.array(z.object({ work: z.string().min(1), author: z.string().min(1), license: z.string().min(1), url: httpsUrl })),
            }),
          )
          .optional(),
        /** すけおのセリフ */
        sukeoLine: z.string().min(1),
      })
      .superRefine((app, ctx) => {
        if (app.status !== '構想中' && !app.icon) {
          ctx.addIssue({ code: 'custom', path: ['icon'], message: '公開中・開発中のアプリには icon が必要です' });
        }
      }),
});

export const collections = { apps };
