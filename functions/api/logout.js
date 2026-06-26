// POST /api/logout — encerra a sessão.
import { json } from '../lib/respond.js';
import { clearSessionCookie } from '../lib/auth.js';

export async function onRequestPost() {
  return json({ ok: true }, { headers: { 'Set-Cookie': clearSessionCookie() } });
}
