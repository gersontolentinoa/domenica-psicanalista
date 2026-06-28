// /api/testimonials — GET (lista) e POST (cria). POST exige auth.
import { json, bad } from '../../lib/respond.js';
import { requireUser, sameOrigin } from '../../lib/auth.js';

function clean(s, max) {
  return String(s == null ? '' : s).replace(/<[^>]*>/g, '').trim().slice(0, max);
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const wantAll = new URL(request.url).searchParams.get('all') === '1';

  if (wantAll) {
    const { user, response } = await requireUser(context);
    if (!user) return response;
    const rows = await env.DB.prepare(
      'SELECT * FROM testimonials ORDER BY position ASC, id ASC'
    ).all();
    return json({ testimonials: rows.results || [] });
  }

  const rows = await env.DB.prepare(
    "SELECT id, text, author FROM testimonials WHERE status='published' ORDER BY position ASC, id ASC"
  ).all();
  return json({ testimonials: rows.results || [] });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const { user, response } = await requireUser(context);
  if (!user) return response;
  if (!sameOrigin(request)) return bad(403, 'Origem inválida.');

  let data;
  try { data = await request.json(); } catch { return bad(400, 'JSON inválido.'); }

  const text = clean(data.text, 400);
  if (text.length < 3) return bad(400, 'O depoimento precisa de ao menos 3 caracteres.');
  const author = clean(data.author, 80);
  const status = data.status === 'published' ? 'published' : 'draft';

  const max = await env.DB.prepare('SELECT COALESCE(MAX(position), 0) AS m FROM testimonials').first();
  const position = (max && max.m ? max.m : 0) + 1;

  const res = await env.DB.prepare(
    'INSERT INTO testimonials (text, author, status, position) VALUES (?,?,?,?)'
  ).bind(text, author, status, position).run();

  return json({ ok: true, id: res.meta.last_row_id });
}
