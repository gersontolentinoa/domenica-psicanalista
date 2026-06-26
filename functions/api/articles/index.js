// /api/articles — GET (lista) e POST (cria). POST exige auth.
import { json, bad } from '../../lib/respond.js';
import { requireUser, sameOrigin } from '../../lib/auth.js';
import { sanitizeHtml, htmlToText } from '../../lib/sanitize.js';
import { slugify, uniqueSlug } from '../../lib/slug.js';

const LIST_COLS = 'id, slug, title, excerpt, cover_image, category, status, published_at, updated_at';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const wantAll = url.searchParams.get('all') === '1';

  if (wantAll) {
    const { user, response } = await requireUser(context);
    if (!user) return response;
    const rows = await env.DB.prepare(
      `SELECT ${LIST_COLS} FROM articles ORDER BY COALESCE(published_at, updated_at) DESC`
    ).all();
    return json({ articles: rows.results || [] });
  }

  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 50);
  const rows = await env.DB.prepare(
    `SELECT ${LIST_COLS} FROM articles WHERE status='published' ORDER BY published_at DESC LIMIT ?`
  ).bind(limit).all();
  return json({ articles: rows.results || [] });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const { user, response } = await requireUser(context);
  if (!user) return response;
  if (!sameOrigin(request)) return bad(403, 'Origem inválida.');

  let data;
  try { data = await request.json(); } catch { return bad(400, 'JSON inválido.'); }

  const v = validate(data);
  if (v.error) return bad(400, v.error);

  const bodyHtml = await sanitizeHtml(String(data.body_html || ''));
  if (bodyHtml.length > 200000) return bad(400, 'Conteúdo muito longo.');
  const excerpt = (String(data.excerpt || '').trim() || (await htmlToText(bodyHtml)).slice(0, 200)).slice(0, 300);
  const status = data.status === 'published' ? 'published' : 'draft';
  const slug = await uniqueSlug(env, slugify(data.title));
  const publishedAt = status === 'published' ? new Date().toISOString() : null;

  const res = await env.DB.prepare(
    `INSERT INTO articles (slug, title, excerpt, cover_image, body_html, category, status, published_at)
     VALUES (?,?,?,?,?,?,?,?)`
  ).bind(
    slug, v.title, excerpt, v.cover, bodyHtml, v.category, status, publishedAt
  ).run();

  return json({ ok: true, id: res.meta.last_row_id, slug });
}

export function validate(data) {
  const title = String(data.title || '').trim();
  if (title.length < 3) return { error: 'O título precisa de ao menos 3 caracteres.' };
  if (title.length > 160) return { error: 'O título é muito longo (máx. 160).' };
  const category = String(data.category || '').trim().slice(0, 40) || null;
  let cover = String(data.cover_image || '').trim();
  if (cover && !/^(https:\/\/|\/uploads\/)/.test(cover)) return { error: 'Imagem de capa inválida.' };
  cover = cover || null;
  return { title, category, cover };
}
