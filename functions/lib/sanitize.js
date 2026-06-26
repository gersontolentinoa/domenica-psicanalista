// sanitize.js — sanitização de HTML do editor de artigos via HTMLRewriter.
// Allowlist estrita: só passam tags/atributos seguros. Defesa server-side
// (o editor é client-side e pode ser burlado por POST direto).

const ALLOWED = {
  p: [], br: [], strong: [], b: [], em: [], i: [], u: [],
  h2: [], h3: [], h4: [], ul: [], ol: [], li: [],
  blockquote: [], hr: [],
  a: ['href'], img: ['src', 'alt'],
  figure: [], figcaption: [],
};
const DANGEROUS = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'link', 'meta',
  'base', 'form', 'input', 'button', 'textarea', 'select', 'svg', 'math',
]);

export async function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';
  const rewriter = new HTMLRewriter().on('*', {
    element(el) {
      const tag = el.tagName.toLowerCase();
      if (DANGEROUS.has(tag)) { el.remove(); return; }
      if (!(tag in ALLOWED)) { el.removeAndKeepContent(); return; }

      const allowed = ALLOWED[tag];
      const names = [];
      for (const [name] of el.attributes) names.push(name);
      for (const name of names) {
        const lname = name.toLowerCase();
        if (!allowed.includes(lname)) { el.removeAttribute(name); continue; }
        if (lname === 'href') {
          const v = (el.getAttribute('href') || '').trim();
          if (!/^(https?:|mailto:|tel:|\/)/i.test(v)) {
            el.removeAttribute('href');
          } else {
            el.setAttribute('rel', 'noopener noreferrer nofollow');
            if (/^https?:/i.test(v)) el.setAttribute('target', '_blank');
          }
        }
        if (lname === 'src') {
          const v = (el.getAttribute('src') || '').trim();
          if (!/^(https:\/\/|\/uploads\/)/i.test(v)) {
            el.remove();
          } else {
            el.setAttribute('loading', 'lazy');
          }
        }
      }
    },
  });
  const out = await rewriter.transform(new Response(html)).text();
  // remove wrappers que o parser possa ter implícito
  return out.replace(/^\s*<!DOCTYPE[^>]*>/i, '')
            .replace(/<\/?(html|head|body)[^>]*>/gi, '')
            .trim();
}

// Texto puro a partir de HTML (para gerar excerpt/meta description).
export async function htmlToText(html) {
  if (!html) return '';
  let text = '';
  const rewriter = new HTMLRewriter()
    .on('p, h2, h3, h4, li, blockquote, br, figcaption', { element() { text += ' '; } })
    .on('*', { text(t) { text += t.text; } });
  await rewriter.transform(new Response(html)).text();
  return text.replace(/\s+/g, ' ').trim();
}
