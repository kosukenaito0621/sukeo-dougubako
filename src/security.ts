/**
 * 全ページに付ける HTTP ヘッダー。ビルド時に dist/_headers（Cloudflare の静的アセット用）へ書き出す。
 * 外部のスクリプト・スタイル・フォントは読み込まないので、すべて 'self' に限定している。
 */
import { SITE_INDEXING } from './site.config';

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

/** カメラ・マイク・位置情報などは、すべて使わない */
const PERMISSIONS = [
  'accelerometer',
  'autoplay',
  'bluetooth',
  'browsing-topics',
  'camera',
  'display-capture',
  'encrypted-media',
  'fullscreen',
  'geolocation',
  'gyroscope',
  'hid',
  'idle-detection',
  'magnetometer',
  'microphone',
  'midi',
  'payment',
  'picture-in-picture',
  'publickey-credentials-get',
  'screen-wake-lock',
  'serial',
  'usb',
  'xr-spatial-tracking',
]
  .map((p) => `${p}=()`)
  .join(', ');

export function securityHeaders(): Record<string, string> {
  return {
    'Content-Security-Policy': CSP,
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': PERMISSIONS,
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    ...(SITE_INDEXING ? {} : { 'X-Robots-Tag': 'noindex, nofollow' }),
  };
}

/** Cloudflare の _headers ファイルの中身 */
export function headersFile(): string {
  const all = Object.entries(securityHeaders())
    .map(([k, v]) => `  ${k}: ${v}`)
    .join('\n');
  return [
    '# このファイルはビルド時に src/security.ts から作られる。直接編集しないこと。',
    '/*',
    all,
    '',
    '# ファイル名にハッシュが付いた資産は、長くキャッシュしてよい',
    '/_astro/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
  ].join('\n');
}
