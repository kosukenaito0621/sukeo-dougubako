/**
 * サイト全体の設定。
 *
 * ★ 検索エンジンに出すかどうかは SITE_INDEXING の1か所で切り替える。
 *   false：全ページに noindex（<meta name="robots"> と X-Robots-Tag ヘッダー）を付けて、検索に出さない
 *   true ：検索に出す
 *   変えたら、ビルドしてデプロイし直すと反映される（README「検索公開への切り替え方法」）。
 */
export const SITE_INDEXING = false;

export const SITE = {
  name: 'すけおの暮らし道具箱',
  tagline: '暮らしを、楽に、豊かに。',
  description:
    'クレステッドゲッコーの「すけお」が案内する、暮らしを楽に、豊かにする小さなWebアプリの道具箱。献立づくりや植物の世話を、ちょっとだけ楽にします。',
  /** 公開するURL（OGP画像などの絶対URLに使う）。末尾のスラッシュなし */
  url: 'https://sukeo-dougubako.naikou7110.workers.dev',
  lang: 'ja',
} as const;
