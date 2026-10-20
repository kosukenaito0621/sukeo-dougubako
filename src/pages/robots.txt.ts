/**
 * robots.txt。クロール自体は止めない（止めると noindex が読まれず、検索に出てしまうことがあるため）。
 * 検索に出すかどうかは src/site.config.ts の SITE_INDEXING で切り替える（noindex の付け外し）。
 */
import type { APIRoute } from 'astro';

export const GET: APIRoute = () =>
  new Response('User-agent: *\nAllow: /\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
