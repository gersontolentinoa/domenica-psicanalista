// GET / — renderiza a landing page server-side a partir do template + D1.
// Fallback robusto: qualquer erro serve o template original intacto.
import { renderLanding } from './lib/render-landing.js';
import { DEFAULTS } from './lib/content-schema.js';

export async function onRequestGet(context) {
  const { request, env } = context;

  const assetRes = await env.ASSETS.fetch(new URL('/_landing.html', request.url));
  const ct = assetRes.headers.get('content-type') || '';
  if (!assetRes.ok || !ct.includes('text/html')) return assetRes;

  let content, articles;
  try {
    content = { ...DEFAULTS };
    const row = await env.DB.prepare("SELECT value FROM content WHERE key='landing'").first();
    if (row && row.value) Object.assign(content, JSON.parse(row.value));
    const r = await env.DB.prepare(
      "SELECT slug, title, excerpt, cover_image, category, published_at FROM articles WHERE status='published' ORDER BY published_at DESC LIMIT 3"
    ).all();
    articles = r.results || [];
  } catch (e) {
    // Banco indisponível → serve o template como está (nunca quebra a home).
    return new Response(assetRes.body, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  return renderLanding(assetRes, content, articles);
}
