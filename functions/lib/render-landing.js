// render-landing.js — renderiza a landing (SSR) substituindo o conteúdo dos
// elementos data-k pelo conteúdo do banco, via HTMLRewriter. Também extrai os
// valores padrão direto do template (para o editor mostrar o conteúdo atual).
import { escapeHtml, formatDate } from './layout.js';

export function waHref(content) {
  const num = (content['contact.whatsapp'] || '5535991468209').replace(/[^0-9]/g, '');
  const msg = content['contact.whatsappMsg'] || '';
  return `https://wa.me/${num}` + (msg ? `?text=${encodeURIComponent(msg)}` : '');
}
function waPlain(content) {
  const num = (content['contact.whatsapp'] || '5535991468209').replace(/[^0-9]/g, '');
  return `https://wa.me/${num}`;
}

function articlesHtml(articles) {
  return articles.slice(0, 3).map((a) => `<a class="post reveal" href="/blog/${escapeHtml(a.slug)}">
    <span class="k">${escapeHtml(a.category || 'Artigo')} · ${escapeHtml(formatDate(a.published_at))}</span>
    <h3>${escapeHtml(a.title)}</h3>
    <p>${escapeHtml(a.excerpt || '')}</p>
    <span class="more">Ler artigo →</span>
  </a>`).join('');
}

function testimonialsHtml(items) {
  return items.map((t) => `<figure class="dep-slide">
    <p>${escapeHtml(t.text)}</p>
    ${t.author ? `<cite>— ${escapeHtml(String(t.author).replace(/^[—–-]\s*/, ''))}</cite>` : ''}
  </figure>`).join('');
}

export function renderLanding(assetRes, content, articles, testimonials) {
  const wa = waHref(content);
  const waP = waPlain(content);
  const hasArticles = !!(articles && articles.length);
  const hasTestimonials = !!(testimonials && testimonials.length);
  const set = (el, v) => { if (v != null && v !== '') el.setInnerContent(String(v), { html: false }); };

  const rw = new HTMLRewriter()
    .on('[data-k]', { element(el) { set(el, content[el.getAttribute('data-k')]); } })
    .on('[data-k-content]', { element(el) { const v = content[el.getAttribute('data-k-content')]; if (v != null && v !== '') el.setAttribute('content', String(v)); } })
    .on('[data-k-href]', { element(el) { const v = content[el.getAttribute('data-k-href')]; if (v) el.setAttribute('href', String(v)); } })
    .on('[data-k-mailto]', { element(el) { const v = content[el.getAttribute('data-k-mailto')]; if (v) el.setAttribute('href', 'mailto:' + v); } })
    .on('[data-k-count]', { element(el) { const v = content[el.getAttribute('data-k-count')]; if (v) el.setAttribute('data-count', String(v)); } })
    .on('[data-k-wa]', { element(el) { el.setAttribute('href', wa); } })
    .on('[data-k-wa-plain]', { element(el) { el.setAttribute('href', waP); } })
    // Blog: oculta seção e link da nav quando não há artigos publicados
    .on('[data-navlink="blog"]', { element(el) { if (!hasArticles) el.remove(); } })
    .on('[data-section="blog"]', { element(el) { if (!hasArticles) el.remove(); } })
    .on('[data-articles]', { element(el) { if (hasArticles) el.setInnerContent(articlesHtml(articles), { html: true }); } })
    // Depoimentos: oculta seção quando não há nada publicado; senão injeta o carrossel
    .on('[data-section="depoimentos"]', { element(el) { if (!hasTestimonials) el.remove(); } })
    .on('[data-testimonials]', { element(el) { if (hasTestimonials) el.setInnerContent(testimonialsHtml(testimonials), { html: true }); } });

  const out = rw.transform(assetRes);
  return new Response(out.body, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=30' },
  });
}

// Extrai o texto atual de cada elemento [data-k] do template (defaults do editor).
export async function extractDefaults(assetRes) {
  const out = {};
  let cur = null;
  const rw = new HTMLRewriter().on('[data-k]', {
    element(el) {
      cur = el.getAttribute('data-k');
      out[cur] = '';
      el.onEndTag(() => { cur = null; });
    },
    text(t) { if (cur != null && out[cur] != null) out[cur] += t.text; },
  });
  await rw.transform(assetRes).text();
  for (const k of Object.keys(out)) out[k] = out[k].replace(/\s+/g, ' ').trim();
  return out;
}
