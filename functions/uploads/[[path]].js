// GET /uploads/* — serve objetos de imagem do R2.
export async function onRequestGet(context) {
  const { params, env } = context;
  const key = Array.isArray(params.path) ? params.path.join('/') : String(params.path || '');
  if (!key) return new Response('Not found', { status: 404 });

  const obj = await env.UPLOADS.get(key);
  if (!obj) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('X-Content-Type-Options', 'nosniff');
  if (!headers.get('Content-Type')) headers.set('Content-Type', 'application/octet-stream');
  return new Response(obj.body, { headers });
}
