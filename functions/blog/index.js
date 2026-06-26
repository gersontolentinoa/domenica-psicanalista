// GET /blog — listagem de artigos publicados (SSR).
import { layout, escapeHtml, formatDate } from '../lib/layout.js';
import { getSiteMeta } from '../lib/site-content.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const meta = await getSiteMeta(env);

  const rows = await env.DB.prepare(
    `SELECT slug, title, excerpt, cover_image, category, published_at
     FROM articles WHERE status='published' ORDER BY published_at DESC LIMIT 60`
  ).all();
  const articles = rows.results || [];

  const cards = articles.map((a) => `
    <a class="bcard" href="/blog/${escapeHtml(a.slug)}">
      ${a.cover_image
        ? `<div class="thumb"><img src="${escapeHtml(a.cover_image)}" alt="${escapeHtml(a.title)}" loading="lazy"/></div>`
        : ''}
      <div class="body">
        <span class="k">${escapeHtml(a.category || 'Artigo')} · ${escapeHtml(formatDate(a.published_at))}</span>
        <h3>${escapeHtml(a.title)}</h3>
        <p>${escapeHtml(a.excerpt || '')}</p>
        <span class="more">Ler artigo →</span>
      </div>
    </a>`).join('');

  const body = `
<main class="blog-list">
  <section class="bhero"><div class="bwrap">
    <span class="beyebrow">Blog</span>
    <h1>Reflexões sobre escuta, mente e vida.</h1>
    <p>Conteúdos sobre psicanálise, saúde emocional e o cuidado com a própria história.</p>
  </div></section>
  <div class="bwrap">
    ${articles.length
      ? `<div class="bposts">${cards}</div>`
      : `<p class="bempty">Em breve, os primeiros textos por aqui. Acompanhe também no <a href="${escapeHtml(meta.instagram)}" target="_blank" rel="noopener" style="color:var(--steel);text-decoration:underline">Instagram</a>.</p>`}
  </div>
</main>`;

  const html = layout({
    title: 'Blog · ' + meta.brandName + ' · Psicanalista em Itajubá',
    description: 'Artigos sobre psicanálise, ansiedade, luto, autoconhecimento e saúde mental, por ' + meta.brandName + '.',
    canonical: new URL(request.url).origin + '/blog',
    body,
    content: meta,
  });
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=60' },
  });
}
