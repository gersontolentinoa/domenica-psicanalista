// layout.js — shell HTML (head + nav + footer) das páginas SSR do blog,
// reutilizando a identidade visual da landing.

export const SITE_DEFAULTS = {
  brandName: 'Domênica de Podestá',
  brandSub: 'Psicanalista · Itajubá',
  whatsapp: '5535991468209',
  whatsappMsg: 'Olá, Domênica! Vim pelo site e gostaria de agendar uma conversa.',
  instagram: 'https://www.instagram.com/domenica_psicanalista/',
  instagramHandle: '@domenica_psicanalista',
  email: 'dopodesta@gmail.com',
  hours: 'Seg a Dom · 10h às 20h',
  location: 'Itajubá, Minas Gerais',
};

export function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

export function waLink(c = SITE_DEFAULTS) {
  return `https://wa.me/${c.whatsapp}?text=${encodeURIComponent(c.whatsappMsg)}`;
}

const WA_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.821 11.821 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.512 5.26l-.999 3.648 3.488-.917z"/></svg>';

export function siteHeader(c = SITE_DEFAULTS) {
  return `
<nav class="bnav">
  <a href="/" class="bbrand">${escapeHtml(c.brandName)}<small>${escapeHtml(c.brandSub)}</small></a>
  <div class="bnav-links">
    <a href="/#sobre">Sobre</a>
    <a href="/#atendimentos">Atendimentos</a>
    <a href="/blog" class="active">Blog</a>
    <a href="/#contato">Contato</a>
    <a class="bbtn" href="${waLink(c)}" target="_blank" rel="noopener">Agendar conversa</a>
  </div>
</nav>`;
}

export function siteFooter(c = SITE_DEFAULTS) {
  const year = new Date().getUTCFullYear();
  return `
<footer class="bfoot">
  <div class="bwrap bfoot-grid">
    <div>
      <div class="bfoot-brand">${escapeHtml(c.brandName)}</div>
      <p>Escuta profunda e cuidado humanizado. Psicanálise presencial em Itajubá (MG) e online para todo o Brasil e o exterior.</p>
    </div>
    <div class="bfoot-col">
      <h4>Contato</h4>
      <a href="https://wa.me/${escapeHtml(c.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a>
      <a href="mailto:${escapeHtml(c.email)}">${escapeHtml(c.email)}</a>
      <a href="${escapeHtml(c.instagram)}" target="_blank" rel="noopener">Instagram ${escapeHtml(c.instagramHandle)}</a>
    </div>
    <div class="bfoot-col">
      <h4>Atendimento</h4>
      <p>${escapeHtml(c.location)}</p>
      <p>Online · Brasil e exterior</p>
      <p>${escapeHtml(c.hours)}</p>
    </div>
  </div>
  <div class="bwrap bfoot-bottom">© ${year} ${escapeHtml(c.brandName)} · Psicanalista em Itajubá</div>
</footer>
<a class="bwa-float" href="${waLink(c)}" target="_blank" rel="noopener" aria-label="WhatsApp">${WA_SVG}</a>`;
}

export function layout({ title, description, canonical, ogImage, body, content = SITE_DEFAULTS, extraHead = '' }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description || '')}" />
${canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}" />` : ''}
<meta property="og:type" content="article" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description || '')}" />
${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />` : ''}
<meta property="og:locale" content="pt_BR" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/blog.css" />
${extraHead}
</head>
<body>
${siteHeader(content)}
${body}
${siteFooter(content)}
</body>
</html>`;
}

// Formata data ISO/SQL para "26 de junho de 2026".
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export function formatDate(s) {
  if (!s) return '';
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z');
  if (isNaN(d)) return '';
  return `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}
