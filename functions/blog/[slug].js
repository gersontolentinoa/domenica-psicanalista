// GET /blog/:slug — página do artigo (SSR).
import { layout, escapeHtml, formatDate } from '../lib/layout.js';
import { getSiteMeta } from '../lib/site-content.js';

export async function onRequestGet(context) {
  const { request, params, env } = context;
  const meta = await getSiteMeta(env);
  const origin = new URL(request.url).origin;

  const a = await env.DB.prepare(
    "SELECT * FROM articles WHERE slug=? AND status='published'"
  ).bind(params.slug).first();

  if (!a) {
    const body = `
<main class="article"><div class="bwrap-narrow" style="padding-top:60px;padding-bottom:80px;text-align:center">
  <span class="beyebrow" style="justify-content:center">Ops</span>
  <h1>Artigo não encontrado</h1>
  <p style="color:var(--ink-soft);margin-top:14px">Esse texto pode ter saído do ar ou o endereço está incorreto.</p>
  <p style="margin-top:24px"><a class="bbtn" href="/blog">Ver todos os artigos</a></p>
</div></main>`;
    return new Response(layout({ title: 'Artigo não encontrado · ' + meta.brandName, description: '', body, content: meta }), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const coverAbs = a.cover_image ? (a.cover_image.startsWith('http') ? a.cover_image : origin + a.cover_image) : '';
  const canonical = origin + '/blog/' + a.slug;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.excerpt || '',
    datePublished: a.published_at,
    dateModified: a.updated_at || a.published_at,
    author: { '@type': 'Person', name: meta.brandName },
    publisher: { '@type': 'Person', name: meta.brandName },
    mainEntityOfPage: canonical,
    ...(coverAbs ? { image: coverAbs } : {}),
  };

  const body = `
<main class="article">
  <div class="bwrap-narrow">
    <div class="meta"><span>${escapeHtml(a.category || 'Artigo')}</span><span>${escapeHtml(formatDate(a.published_at))}</span></div>
    <h1>${escapeHtml(a.title)}</h1>
  </div>
  ${a.cover_image ? `<div class="bwrap-narrow"><div class="cover"><img src="${escapeHtml(a.cover_image)}" alt="${escapeHtml(a.title)}"/></div></div>` : ''}
  <div class="bwrap-narrow"><div class="content">${a.body_html}</div></div>
  <div class="article-foot"><a class="back" href="/blog">← Todos os artigos</a></div>
</main>
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`;

  return new Response(layout({
    title: a.title + ' · ' + meta.brandName,
    description: a.excerpt || '',
    canonical,
    ogImage: coverAbs,
    body,
    content: meta,
  }), {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=120' },
  });
}
