// slug.js — gera slug de URL a partir de um texto.
const ACCENTS = {
  à: 'a', á: 'a', â: 'a', ã: 'a', ä: 'a',
  é: 'e', ê: 'e', è: 'e', ë: 'e',
  í: 'i', ì: 'i', î: 'i', ï: 'i',
  ó: 'o', ô: 'o', õ: 'o', ò: 'o', ö: 'o',
  ú: 'u', ù: 'u', û: 'u', ü: 'u',
  ç: 'c', ñ: 'n',
};

export function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[àáâãäéêèëíìîïóôõòöúùûüçñ]/g, (c) => ACCENTS[c] || c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'artigo';
}

// Garante slug único na tabela articles (ignora o próprio id em edições).
export async function uniqueSlug(env, base, excludeId = null) {
  let slug = base;
  while (true) {
    const row = excludeId
      ? await env.DB.prepare('SELECT id FROM articles WHERE slug=? AND id<>?').bind(slug, excludeId).first()
      : await env.DB.prepare('SELECT id FROM articles WHERE slug=?').bind(slug).first();
    if (!row) return slug;
    const m = slug.match(/-(\d+)$/);
    slug = m ? slug.replace(/-(\d+)$/, `-${parseInt(m[1]) + 1}`) : `${base}-2`;
  }
}
