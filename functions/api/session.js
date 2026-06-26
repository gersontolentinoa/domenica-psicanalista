// GET /api/session — estado de autenticação e se o setup inicial é necessário.
import { json } from '../lib/respond.js';
import { getUser } from '../lib/auth.js';

export async function onRequestGet(context) {
  const { env } = context;
  let setupRequired = false;
  try {
    const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM admin_users').first();
    setupRequired = !row || row.n === 0;
  } catch {
    setupRequired = true; // tabela ainda não migrada
  }
  const user = await getUser(context);
  return json({
    authenticated: !!user,
    setupRequired,
    user: user ? { username: user.username } : null,
  });
}
