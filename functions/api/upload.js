// POST /api/upload — recebe imagem (multipart), guarda no R2, devolve a URL.
import { json, bad } from '../lib/respond.js';
import { requireUser, sameOrigin } from '../lib/auth.js';

const MAX_BYTES = 6 * 1024 * 1024; // 6MB
const TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export async function onRequestPost(context) {
  const { request, env } = context;
  const { user, response } = await requireUser(context);
  if (!user) return response;
  if (!sameOrigin(request)) return bad(403, 'Origem inválida.');

  let form;
  try { form = await request.formData(); } catch { return bad(400, 'Envio inválido.'); }
  const file = form.get('file');
  if (!file || typeof file === 'string') return bad(400, 'Nenhum arquivo enviado.');

  const type = file.type;
  if (!TYPES[type]) return bad(400, 'Formato não suportado. Use JPG, PNG, WebP ou GIF.');
  if (file.size > MAX_BYTES) return bad(400, 'Imagem muito grande (máx. 6MB).');

  const ext = TYPES[type];
  const key = `articles/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;

  await env.UPLOADS.put(key, file.stream(), {
    httpMetadata: { contentType: type, cacheControl: 'public, max-age=31536000, immutable' },
  });

  return json({ ok: true, url: `/uploads/${key}` });
}
