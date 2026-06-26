// /api/articles/:id — GET (1, admin), PUT (atualiza), DELETE.
import { json, bad } from '../../lib/respond.js';
import { requireUser, sameOrigin } from '../../lib/auth.js';
import { sanitizeHtml, htmlToText } from '../../lib/sanitize.js';
import { slugify, uniqueSlug } from '../../lib/slug.js';
import { validate } from './index.js';

export async function onRequestGet(context) {
  const { params, env } = context;
  const { user, response } = await requireUser(context);
  if (!user) return response;
  const row = await env.DB.prepare('SELECT * FROM articles WHERE id=?').bind(params.id).first();
  if (!row) return bad(404, 'Artigo não encontrado.');
  return json({ article: row });
}

export async function onRequestPut(context) {
  const { request, params, env } = context;
  const { user, response } = await requireUser(context);
  if (!user) return response;
  if (!sameOrigin(request)) return bad(403, 'Origem inválida.');

  const existing = await env.DB.prepare('SELECT * FROM articles WHERE id=?').bind(params.id).first();
  if (!existing) return bad(404, 'Artigo não encontrado.');

  let data;
  try { data = await request.json(); } catch { return bad(400, 'JSON inválido.'); }
  const v = validate(data);
  if (v.error) return bad(400, v.error);

  const bodyHtml = await sanitizeHtml(String(data.body_html || ''));
  if (bodyHtml.length > 200000) return bad(400, 'Conteúdo muito longo.');
  const excerpt = (String(data.excerpt || '').trim() || (await htmlToText(bodyHtml)).slice(0, 200)).slice(0, 300);
  const status = data.status === 'published' ? 'published' : 'draft';

  // slug: regenera só se o título mudou
  let slug = existing.slug;
  if (v.title !== existing.title) slug = await uniqueSlug(env, slugify(v.title), existing.id);

  // published_at: define ao publicar pela 1ª vez; limpa ao voltar a rascunho
  let publishedAt = existing.published_at;
  if (status === 'published' && !existing.published_at) publishedAt = new Date().toISOString();
  if (status === 'draft') publishedAt = null;

  await env.DB.prepare(
    `UPDATE articles SET slug=?, title=?, excerpt=?, cover_image=?, body_html=?, category=?, status=?, published_at=?, updated_at=datetime('now') WHERE id=?`
  ).bind(slug, v.title, excerpt, v.cover, bodyHtml, v.category, status, publishedAt, existing.id).run();

  return json({ ok: true, id: existing.id, slug });
}

export async function onRequestDelete(context) {
  const { request, params, env } = context;
  const { user, response } = await requireUser(context);
  if (!user) return response;
  if (!sameOrigin(request)) return bad(403, 'Origem inválida.');
  await env.DB.prepare('DELETE FROM articles WHERE id=?').bind(params.id).run();
  return json({ ok: true });
}
