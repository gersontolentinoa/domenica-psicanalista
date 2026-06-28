// /api/testimonials/:id — PUT (atualiza) e DELETE.
import { json, bad } from '../../lib/respond.js';
import { requireUser, sameOrigin } from '../../lib/auth.js';

function clean(s, max) {
  return String(s == null ? '' : s).replace(/<[^>]*>/g, '').trim().slice(0, max);
}

export async function onRequestPut(context) {
  const { request, params, env } = context;
  const { user, response } = await requireUser(context);
  if (!user) return response;
  if (!sameOrigin(request)) return bad(403, 'Origem inválida.');

  const existing = await env.DB.prepare('SELECT * FROM testimonials WHERE id=?').bind(params.id).first();
  if (!existing) return bad(404, 'Depoimento não encontrado.');

  let data;
  try { data = await request.json(); } catch { return bad(400, 'JSON inválido.'); }

  const text = clean(data.text, 400);
  if (text.length < 3) return bad(400, 'O depoimento precisa de ao menos 3 caracteres.');
  const author = clean(data.author, 80);
  const status = data.status === 'published' ? 'published' : 'draft';
  const position = Number.isFinite(data.position) ? data.position : existing.position;

  await env.DB.prepare(
    "UPDATE testimonials SET text=?, author=?, status=?, position=?, updated_at=datetime('now') WHERE id=?"
  ).bind(text, author, status, position, existing.id).run();

  return json({ ok: true });
}

export async function onRequestDelete(context) {
  const { request, params, env } = context;
  const { user, response } = await requireUser(context);
  if (!user) return response;
  if (!sameOrigin(request)) return bad(403, 'Origem inválida.');
  await env.DB.prepare('DELETE FROM testimonials WHERE id=?').bind(params.id).run();
  return json({ ok: true });
}
