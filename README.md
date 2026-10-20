# すけおの暮らし道具箱

クレステッドゲッコーの「すけお」が案内する、暮らしを楽に、豊かにする小さな Web アプリの紹介サイトです。
スクロールすると、すけおが歩いて「壁 → キッチン → 窓辺 → テラリウム → すけおの家」と場面が進みます。

- 完全な静的サイト（Astro + TypeScript）。サーバーの処理・データベース・フォームはありません
- 演出：GSAP（ScrollTrigger）、なめらかスクロール：Lenis、フォント：Zen Maru Gothic（自前配信）
- 公開：Cloudflare Workers（静的アセット配信）

## ローカルでの起動方法

必要なもの：Node.js 22 以上

```bash
npm ci
npm run dev        # http://localhost:4321
```

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー。確認用ページ `/dev/sukeo/`（すけお）・`/dev/design/`（デザイン案）・`/dev/og/` も開ける |
| `npm run build` | 型チェック（astro check）とビルド。`dist/` にできる |
| `npm run preview` | ビルドしたものを Cloudflare と同じしくみ（wrangler）で表示。`http://localhost:8788`。ヘッダーの確認もここで |
| `npm run shots` | 体験版のスクショを撮り直す（下の「スクショの再撮影方法」） |
| `npm run og` | OGP 画像とファビコンを作り直す |

`/dev/...` の確認用ページは開発中だけのもので、公開用のビルドには入りません。

## アプリの追加方法

`src/content/apps/` に、アプリ1つにつき1ファイル（`<slug>.md`）を足すだけです。トップページのシーンと詳細ページ（`/apps/<slug>/`）が自動でできます。
書き方は `kondate.md` をまねしてください。入力漏れや形のまちがいは `npm run build` でエラーになります（定義：`src/content.config.ts`）。

| 項目 | 必須 | 内容 |
|---|---|---|
| `slug` | ○ | URL に使う名前（半角小文字・数字・ハイフン） |
| `name` / `catchcopy` | ○ | アプリ名 / 一言説明 |
| `status` | ○ | `公開中` / `開発中` / `構想中`（構想中は「COMING SOON」で名前を隠し、詳細ページは作らない） |
| `order` | ○ | 表示順（小さいほど先） |
| `scene` | ○ | 背景。`kitchen` / `veranda` / `terrarium` など（`src/scenes/keys.ts` にあるもの） |
| `icon` | 構想中以外 | アイコン画像（`src/assets/apps/<slug>/icon.png`） |
| `trialUrl` |  | 体験版の URL（`https://` のみ）。ないと「体験版準備中」と表示 |
| `trialLimitations` |  | 体験版でできないこと |
| `screenshots` |  | スクショ（`src`・`alt`） |
| `howTo` |  | 使い方のステップ（`title`・`body`・`image`） |
| `changelog` |  | 更新履歴（`date`・`version`・`body`）。新しい順に並べて表示 |
| `credits` |  | スクショなどに写っている他の人の作品のクレジット |
| `sukeoLine` | ○ | すけおのセリフ |

> 本番版の URL は書かないこと。体験版の URL だけを `trialUrl` に書きます。

## シーン（背景）の追加方法

1. `src/components/scenes/` に背景の SVG コンポーネントを作る（`SceneKitchen.astro` をまねる。縦長 390×844 を基準に、床が下になるように描く）
2. `src/scenes/keys.ts` の `SCENES` に名前を足す（例：`bath: { label: 'お風呂', note: '' }`）
3. `src/scenes/backgrounds.ts` の `BACKGROUNDS` に、名前とコンポーネントを足す
4. `src/styles/tokens.css` に、そのシーンの色（`[data-scene='bath'] { ... }`）を足す。文字と背景のコントラスト比が 4.5 以上になるようにする
5. アプリのファイルの `scene` にその名前を書く

## スクショの再撮影方法

```bash
npm run shots              # すべてのアプリ
npm run shots -- planty    # 1つだけ
```

- 各アプリの `trialUrl` を開いて、スマホサイズ（390×844・2倍）で撮り、`src/assets/apps/<slug>/` に WebP で保存します
- 撮る画面や、体験版を始めるボタンは `scripts/capture-screenshots.mjs` の `APPS` で決めています
- **撮ったあとは、個人情報・メールアドレス・トークンなどが写っていないか、必ず目で確認してください**
- Playwright のブラウザが入っていなければ、先に `npx playwright install chromium`

## 検索公開への切り替え方法

最初は検索エンジンに出ない設定です。切り替えは `src/site.config.ts` の1か所だけです。

```ts
export const SITE_INDEXING = false; // true にすると検索に出る
```

- `false` のとき：全ページに `<meta name="robots" content="noindex, nofollow">` と、`X-Robots-Tag: noindex, nofollow` ヘッダーが付きます
- `true` に変えて、ビルド・デプロイし直すと（main に push すると自動）、両方とも外れます
- `robots.txt` ではクロールを止めていません（止めると noindex が読まれず、かえって検索に出ることがあるため）

## デプロイ方法

main ブランチに push すると、GitHub Actions がビルドして Cloudflare Workers にデプロイします（`.github/workflows/deploy.yml`）。

最初に一度だけ、GitHub のリポジトリに次のシークレットを登録します（Settings → Secrets and variables → Actions）。

| 名前 | 内容 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare の API トークン（「Edit Cloudflare Workers」のテンプレートで作成） |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare のアカウント ID |

手元から出すときは `npx wrangler login` のあと `npm run deploy`。
前の版に戻したいときは、Cloudflare のダッシュボード（Workers → sukeo-dougubako → Deployments）でロールバックするか、git で戻して push します。

## セキュリティ

- ヘッダー（CSP・HSTS など）は `src/security.ts` で決め、ビルド時に `dist/_headers` に書き出します。外部のスクリプト・スタイル・フォントは読み込まず、`'unsafe-inline'` も使っていません
- 外部リンクはすべて新しいタブで開き、`rel="noopener noreferrer"` を付けています
- Cookie・アクセス解析は使いません。オープニングを2回目以降に出さないためだけに sessionStorage を使います（使えない環境でも動きます）
- 依存パッケージは Dependabot で毎週チェックし（`.github/dependabot.yml`）、CI で `npm audit` を実行します
