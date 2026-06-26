// POST /api/setup — cria o primeiro administrador (apenas se nenhum existir).
// Protegido por SETUP_TOKEN para evitar sequestro do painel.
import { json, bad } from '../lib/respond.js';
import { hashPassword, createSessionToken, sessionCookie, sessionTtlMs } from '../lib/auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM admin_users').first();
  if (row && row.n > 0) return bad(403, 'O administrador já foi configurado.');

  let data;
  try {
    data = await request.json();
  } catch {
    return bad(400, 'JSON inválido.');
  }
  const { username, password, token } = data || {};

  if (env.SETUP_TOKEN && token !== env.SETUP_TOKEN) return bad(403, 'Token de configuração inválido.');
  if (!username || String(username).trim().length < 3) return bad(400, 'Usuário deve ter ao menos 3 caracteres.');
  if (!password || String(password).length < 8) return bad(400, 'Senha deve ter ao menos 8 caracteres.');

  const uname = String(username).toLowerCase().trim();
  const { hash, salt } = await hashPassword(String(password));
  await env.DB.prepare('INSERT INTO admin_users (username, password_hash, password_salt) VALUES (?,?,?)')
    .bind(uname, hash, salt)
    .run();

  const user = await env.DB.prepare('SELECT id, username FROM admin_users WHERE username=?').bind(uname).first();
  const exp = Date.now() + sessionTtlMs();
  const tok = await createSessionToken(env.SESSION_SECRET, { uid: user.id, username: user.username, exp });
  return json({ ok: true, user: { username: user.username } }, { headers: { 'Set-Cookie': sessionCookie(tok) } });
}
