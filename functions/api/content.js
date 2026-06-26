// /api/content — GET (schema + valores atuais, admin) e PUT (salva, admin).
import { json, bad } from '../lib/respond.js';
import { requireUser, sameOrigin } from '../lib/auth.js';
import { GROUPS, FIELDS, DEFAULTS } from '../lib/content-schema.js';
import { extractDefaults } from '../lib/render-landing.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const { user, response } = await requireUser(context);
  if (!user) return response;

  let tpl = {};
  try {
    const assetRes = await env.ASSETS.fetch(new URL('/_landing.html', request.url));
    if (assetRes.ok) tpl = await extractDefaults(assetRes);
  } catch {}

  let stored = {};
  try {
    const row = await env.DB.prepare("SELECT value FROM content WHERE key='landing'").first();
    if (row && row.value) stored = JSON.parse(row.value);
  } catch {}

  const values = { ...DEFAULTS, ...tpl, ...stored };
  return json({ groups: GROUPS, values });
}

export async function onRequestPut(context) {
  const { request, env } = context;
  const { user, response } = await requireUser(context);
  if (!user) return response;
  if (!sameOrigin(request)) return bad(403, 'Origem inválida.');

  let data;
  try { data = await request.json(); } catch { return bad(400, 'JSON inválido.'); }
  const incoming = (data && data.values) || {};

  const clean = {};
  for (const [k, v] of Object.entries(incoming)) {
    const f = FIELDS[k];
    if (!f) continue;
    let s = String(v == null ? '' : v).replace(/<[^>]*>/g, '').trim(); // campos de texto puro
    if (f.max && s.length > f.max) s = s.slice(0, f.max);
    clean[k] = s;
  }

  let stored = {};
  try {
    const row = await env.DB.prepare("SELECT value FROM content WHERE key='landing'").first();
    if (row && row.value) stored = JSON.parse(row.value);
  } catch {}

  const merged = { ...stored, ...clean };
  await env.DB.prepare(
    "INSERT INTO content (key, value, updated_at) VALUES ('landing', ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime('now')"
  ).bind(JSON.stringify(merged)).run();

  return json({ ok: true });
}
