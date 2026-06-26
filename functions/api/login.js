// POST /api/login — autentica e cria sessão. Rate limit simples por IP (D1).
import { json, bad, getIp } from '../lib/respond.js';
import { verifyPassword, createSessionToken, sessionCookie, sessionTtlMs } from '../lib/auth.js';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 10;

export async function onRequestPost(context) {
  const { request, env } = context;
  const ip = getIp(request);
  const now = Date.now();

  // rate limit: conta falhas recentes deste IP
  const since = now - WINDOW_MS;
  const fails = await env.DB.prepare('SELECT COUNT(*) AS n FROM login_attempts WHERE ip=? AND ts>?')
    .bind(ip, since)
    .first();
  if (fails && fails.n >= MAX_FAILS) {
    return bad(429, 'Muitas tentativas. Aguarde alguns minutos e tente novamente.');
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return bad(400, 'JSON inválido.');
  }
  const username = String(data.username || '').toLowerCase().trim();
  const password = String(data.password || '');
  if (!username || !password) return bad(400, 'Informe usuário e senha.');

  const user = await env.DB.prepare('SELECT id, username, password_hash, password_salt FROM admin_users WHERE username=?')
    .bind(username)
    .first();

  // Sempre executa um hash (mesmo sem usuário) para mitigar timing oracle.
  const ok = user
    ? await verifyPassword(password, user.password_hash, user.password_salt)
    : await verifyPassword(password, '0'.repeat(64), '00');

  if (!user || !ok) {
    await env.DB.prepare('INSERT INTO login_attempts (ip, ts) VALUES (?,?)').bind(ip, now).run();
    return bad(401, 'Usuário ou senha incorretos.');
  }

  // limpa tentativas antigas deste IP no sucesso
  await env.DB.prepare('DELETE FROM login_attempts WHERE ip=?').bind(ip).run();

  const exp = now + sessionTtlMs();
  const tok = await createSessionToken(env.SESSION_SECRET, { uid: user.id, username: user.username, exp });
  return json({ ok: true, user: { username: user.username } }, { headers: { 'Set-Cookie': sessionCookie(tok) } });
}
