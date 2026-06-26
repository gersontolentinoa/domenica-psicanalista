// site-content.js — carrega o conteúdo editável do site (D1) com fallback nos defaults.
// Na Fase 3 a landing passa a ler deste mesmo documento.
import { SITE_DEFAULTS } from './layout.js';

let _cache = null;

export async function getContent(env) {
  let stored = {};
  try {
    const row = await env.DB.prepare("SELECT value FROM content WHERE key='landing'").first();
    if (row && row.value) stored = JSON.parse(row.value);
  } catch {
    stored = {};
  }
  return stored;
}

// Subconjunto usado pelo layout (nav/footer das páginas de blog).
export async function getSiteMeta(env) {
  const c = await getContent(env);
  return {
    ...SITE_DEFAULTS,
    brandName: c['brand.name'] || SITE_DEFAULTS.brandName,
    brandSub: c['brand.sub'] || SITE_DEFAULTS.brandSub,
    whatsapp: c['contact.whatsapp'] || SITE_DEFAULTS.whatsapp,
    whatsappMsg: c['contact.whatsappMsg'] || SITE_DEFAULTS.whatsappMsg,
    instagram: c['contact.instagram'] || SITE_DEFAULTS.instagram,
    instagramHandle: c['contact.instagramHandle'] || SITE_DEFAULTS.instagramHandle,
    email: c['contact.email'] || SITE_DEFAULTS.email,
    hours: c['contact.hours'] || SITE_DEFAULTS.hours,
    location: c['contact.location'] || SITE_DEFAULTS.location,
  };
}
