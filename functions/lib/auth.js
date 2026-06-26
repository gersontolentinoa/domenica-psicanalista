// auth.js — hashing de senha (PBKDF2) e sessões via cookie assinado (HMAC).
// Usa apenas WebCrypto (sem dependências externas).

const enc = new TextEncoder();
const PBKDF2_ITER = 100000;
export const SESSION_COOKIE = 'dpsess';
const SESSION_TTL_SEC = 7 * 24 * 3600;

function bufToHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function hexToBytes(hex) {
  const a = new Uint8Array(hex.length / 2);
  for (let i = 0; i < a.length; i++) a[i] = parseInt(hex.substr(i * 2, 2), 16);
  return a;
}
function b64urlFromBytes(bytes) {
  let bin = '';
  const b = new Uint8Array(bytes);
  for (let i = 0; i < b.length; i++) bin += String.fromCharCode(b[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function bytesFromB64url(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// ── Senha ──────────────────────────────────────────────────
export async function hashPassword(password, saltHex) {
  const salt = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITER, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return { hash: bufToHex(bits), salt: bufToHex(salt.buffer || salt) };
}

export async function verifyPassword(password, hashHex, saltHex) {
  const { hash } = await hashPassword(password, saltHex);
  if (hash.length !== hashHex.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ hashHex.charCodeAt(i);
  return diff === 0;
}

// ── Sessão (cookie assinado) ───────────────────────────────
async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function createSessionToken(secret, payload) {
  const body = b64urlFromBytes(enc.encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  return body + '.' + b64urlFromBytes(sig);
}

export async function verifySessionToken(secret, token) {
  if (!token || token.indexOf('.') < 0) return null;
  const [body, sigB64] = token.split('.');
  const key = await hmacKey(secret);
  let ok = false;
  try {
    ok = await crypto.subtle.verify('HMAC', key, bytesFromB64url(sigB64), enc.encode(body));
  } catch {
    return null;
  }
  if (!ok) return null;
  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(bytesFromB64url(body)));
  } catch {
    return null;
  }
  if (payload.exp && Date.now() > payload.exp) return null;
  return payload;
}

export function parseCookies(request) {
  const h = request.headers.get('Cookie') || '';
  const out = {};
  h.split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > -1) out[p.slice(0, i).trim()] = p.slice(i + 1).trim();
  });
  return out;
}

export function sessionCookie(token) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SEC}`;
}
export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
export function sessionTtlMs() {
  return SESSION_TTL_SEC * 1000;
}

// Retorna o payload do usuário logado ou null.
export async function getUser(context) {
  const { request, env } = context;
  if (!env.SESSION_SECRET) return null;
  const token = parseCookies(request)[SESSION_COOKIE];
  return verifySessionToken(env.SESSION_SECRET, token);
}

// Defesa anti-CSRF complementar ao SameSite: confere o header Origin.
export function sameOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return true; // navegação same-origin / sem Origin: cookie+SameSite cobre
  try {
    return new URL(origin).host === request.headers.get('Host');
  } catch {
    return false;
  }
}

// Helper para handlers que exigem autenticação.
export async function requireUser(context) {
  const user = await getUser(context);
  if (!user) {
    return {
      user: null,
      response: new Response(JSON.stringify({ error: 'Não autenticado.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
      }),
    };
  }
  return { user, response: null };
}
