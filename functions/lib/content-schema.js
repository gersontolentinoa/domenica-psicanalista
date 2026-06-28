// content-schema.js — define os campos editáveis da landing (rótulo, grupo,
// tipo, limite). Dirige o editor do painel e a validação. `def` = valor padrão
// para campos que não existem como texto no template (ex: número do WhatsApp).

export const GROUPS = [
  { id: 'seo', label: 'SEO (Google)', desc: 'Como o site aparece na aba e nos resultados de busca.', fields: [
    { k: 'seo.title', label: 'Título (aba e Google)', type: 'text', max: 75 },
    { k: 'seo.description', label: 'Descrição no Google', type: 'textarea', max: 185 },
  ]},
  { id: 'contato', label: 'Marca & Contato', desc: 'Usados em todos os botões e no rodapé.', fields: [
    { k: 'brand.name', label: 'Nome', type: 'text', max: 40 },
    { k: 'brand.sub', label: 'Subtítulo da marca', type: 'text', max: 40 },
    { k: 'contact.whatsapp', label: 'WhatsApp (só números, com DDI 55)', type: 'text', max: 15, def: '5535991468209' },
    { k: 'contact.whatsappMsg', label: 'Mensagem automática do WhatsApp', type: 'textarea', max: 200, def: 'Olá, Domênica! Vim pelo site e gostaria de agendar uma conversa.' },
    { k: 'contact.whatsappLabel', label: 'Texto do WhatsApp (rodapé)', type: 'text', max: 50 },
    { k: 'contact.email', label: 'E-mail', type: 'text', max: 80 },
    { k: 'contact.instagram', label: 'Link do Instagram', type: 'text', max: 120, def: 'https://www.instagram.com/domenica_psicanalista/' },
    { k: 'contact.instagramText', label: 'Texto do Instagram (rodapé)', type: 'text', max: 60 },
    { k: 'contact.location', label: 'Localização', type: 'text', max: 60 },
    { k: 'contact.hours', label: 'Horário de atendimento', type: 'text', max: 60 },
  ]},
  { id: 'hero', label: 'Topo (primeira dobra)', fields: [
    { k: 'hero.eyebrow', label: 'Etiqueta acima do título', type: 'text', max: 50 },
    { k: 'hero.titleA', label: 'Título — parte normal', type: 'text', max: 60 },
    { k: 'hero.titleB', label: 'Título — parte em itálico', type: 'text', max: 40 },
    { k: 'hero.lead', label: 'Texto de apresentação', type: 'textarea', max: 300 },
    { k: 'hero.ctaPrimary', label: 'Botão principal', type: 'text', max: 30 },
    { k: 'hero.ctaSecondary', label: 'Botão secundário', type: 'text', max: 30 },
    { k: 'hero.stat1num', label: 'Número 1', type: 'text', max: 10 },
    { k: 'hero.stat1label', label: 'Rótulo 1', type: 'text', max: 40 },
    { k: 'hero.stat2num', label: 'Número 2', type: 'text', max: 10 },
    { k: 'hero.stat2label', label: 'Rótulo 2', type: 'text', max: 40 },
    { k: 'hero.stat3num', label: 'Destaque 3', type: 'text', max: 12 },
    { k: 'hero.stat3label', label: 'Rótulo 3', type: 'text', max: 40 },
  ]},
  { id: 'faixa', label: 'Faixa de informações', fields: [
    { k: 'strip.1', label: 'Item 1', type: 'text', max: 40 },
    { k: 'strip.2', label: 'Item 2', type: 'text', max: 45 },
    { k: 'strip.3', label: 'Item 3', type: 'text', max: 40 },
    { k: 'strip.4', label: 'Item 4', type: 'text', max: 40 },
  ]},
  { id: 'cred', label: 'Credenciais', fields: [
    { k: 'cred.eyebrow', label: 'Etiqueta', type: 'text', max: 40 },
    { k: 'cred.h2', label: 'Título', type: 'text', max: 80 },
    { k: 'cred.badge1Title', label: 'Selo 1 — título', type: 'text', max: 20 },
    { k: 'cred.badge1Sub', label: 'Selo 1 — descrição', type: 'text', max: 40 },
    { k: 'cred.badge2Title', label: 'Selo 2 — título', type: 'text', max: 20 },
    { k: 'cred.badge2Sub', label: 'Selo 2 — descrição', type: 'text', max: 40 },
    { k: 'cred.badge3Title', label: 'Selo 3 — título', type: 'text', max: 20 },
    { k: 'cred.badge3Sub', label: 'Selo 3 — descrição', type: 'text', max: 40 },
    { k: 'cred.badge4Title', label: 'Selo 4 — título', type: 'text', max: 20 },
    { k: 'cred.badge4Sub', label: 'Selo 4 — descrição', type: 'text', max: 40 },
  ]},
  { id: 'sobre', label: 'Sobre', fields: [
    { k: 'sobre.eyebrow', label: 'Etiqueta', type: 'text', max: 40 },
    { k: 'sobre.h2', label: 'Título', type: 'text', max: 90 },
    { k: 'sobre.ch1No', label: 'Capítulo 1 — rótulo', type: 'text', max: 40 },
    { k: 'sobre.ch1Text', label: 'Capítulo 1 — texto', type: 'textarea', max: 600 },
    { k: 'sobre.ch2No', label: 'Capítulo 2 — rótulo', type: 'text', max: 40 },
    { k: 'sobre.ch2Text', label: 'Capítulo 2 — texto', type: 'textarea', max: 600 },
    { k: 'sobre.ch3No', label: 'Capítulo 3 — rótulo', type: 'text', max: 40 },
    { k: 'sobre.ch3Text', label: 'Capítulo 3 — texto', type: 'textarea', max: 600 },
    { k: 'sobre.asideH3', label: 'Título da trajetória', type: 'text', max: 40 },
  ]},
  { id: 'quote', label: 'Citação', fields: [
    { k: 'quote.text', label: 'Frase', type: 'textarea', max: 220 },
    { k: 'quote.by', label: 'Autoria', type: 'text', max: 40 },
  ]},
  { id: 'atend', label: 'Atendimentos', fields: [
    { k: 'atend.eyebrow', label: 'Etiqueta', type: 'text', max: 40 },
    { k: 'atend.h2', label: 'Título', type: 'text', max: 90 },
    { k: 'atend.intro', label: 'Introdução', type: 'textarea', max: 280 },
    { k: 'atend.card1Title', label: 'Card 1 — título', type: 'text', max: 40 },
    { k: 'atend.card1Desc', label: 'Card 1 — descrição', type: 'textarea', max: 200 },
    { k: 'atend.card2Title', label: 'Card 2 — título', type: 'text', max: 40 },
    { k: 'atend.card2Desc', label: 'Card 2 — descrição', type: 'textarea', max: 200 },
    { k: 'atend.card3Title', label: 'Card 3 — título', type: 'text', max: 40 },
    { k: 'atend.card3Desc', label: 'Card 3 — descrição', type: 'textarea', max: 200 },
  ]},
  { id: 'quem', label: 'Para quem', fields: [
    { k: 'quem.eyebrow', label: 'Etiqueta', type: 'text', max: 40 },
    { k: 'quem.h2', label: 'Título', type: 'text', max: 90 },
    { k: 'quem.intro', label: 'Introdução', type: 'textarea', max: 300 },
  ]},
  { id: 'proc', label: 'Processo', fields: [
    { k: 'proc.eyebrow', label: 'Etiqueta', type: 'text', max: 40 },
    { k: 'proc.h2', label: 'Título', type: 'text', max: 90 },
    { k: 'proc.step1Title', label: 'Etapa 1 — título', type: 'text', max: 40 },
    { k: 'proc.step1Desc', label: 'Etapa 1 — texto', type: 'textarea', max: 220 },
    { k: 'proc.step2Title', label: 'Etapa 2 — título', type: 'text', max: 40 },
    { k: 'proc.step2Desc', label: 'Etapa 2 — texto', type: 'textarea', max: 220 },
    { k: 'proc.step3Title', label: 'Etapa 3 — título', type: 'text', max: 40 },
    { k: 'proc.step3Desc', label: 'Etapa 3 — texto', type: 'textarea', max: 220 },
    { k: 'proc.step4Title', label: 'Etapa 4 — título', type: 'text', max: 40 },
    { k: 'proc.step4Desc', label: 'Etapa 4 — texto', type: 'textarea', max: 220 },
  ]},
  { id: 'dep', label: 'Depoimentos (cabeçalho)', desc: 'Os depoimentos em si são gerenciados na aba “Depoimentos”. A seção só aparece no site quando houver depoimentos publicados.', fields: [
    { k: 'dep.eyebrow', label: 'Etiqueta', type: 'text', max: 40 },
    { k: 'dep.h2', label: 'Título', type: 'text', max: 80 },
  ]},
  { id: 'blog', label: 'Blog (cabeçalho)', desc: 'Os artigos aparecem automaticamente abaixo.', fields: [
    { k: 'blog.eyebrow', label: 'Etiqueta', type: 'text', max: 40 },
    { k: 'blog.h2', label: 'Título', type: 'text', max: 80 },
    { k: 'blog.intro', label: 'Introdução', type: 'textarea', max: 200 },
  ]},
  { id: 'faq', label: 'Dúvidas frequentes', fields: [
    { k: 'faq.eyebrow', label: 'Etiqueta', type: 'text', max: 40 },
    { k: 'faq.h2', label: 'Título', type: 'text', max: 60 },
    { k: 'faq.q1', label: 'Pergunta 1', type: 'text', max: 120 },
    { k: 'faq.a1', label: 'Resposta 1', type: 'textarea', max: 500 },
    { k: 'faq.q2', label: 'Pergunta 2', type: 'text', max: 120 },
    { k: 'faq.a2', label: 'Resposta 2', type: 'textarea', max: 500 },
    { k: 'faq.q3', label: 'Pergunta 3', type: 'text', max: 120 },
    { k: 'faq.a3', label: 'Resposta 3', type: 'textarea', max: 500 },
    { k: 'faq.q4', label: 'Pergunta 4', type: 'text', max: 120 },
    { k: 'faq.a4', label: 'Resposta 4', type: 'textarea', max: 500 },
    { k: 'faq.q5', label: 'Pergunta 5', type: 'text', max: 120 },
    { k: 'faq.a5', label: 'Resposta 5', type: 'textarea', max: 500 },
    { k: 'faq.q6', label: 'Pergunta 6', type: 'text', max: 120 },
    { k: 'faq.a6', label: 'Resposta 6', type: 'textarea', max: 500 },
  ]},
  { id: 'cta', label: 'Chamada final', fields: [
    { k: 'cta.h2', label: 'Título', type: 'text', max: 60 },
    { k: 'cta.p', label: 'Texto', type: 'textarea', max: 240 },
    { k: 'cta.button', label: 'Botão', type: 'text', max: 30 },
  ]},
  { id: 'footer', label: 'Rodapé', fields: [
    { k: 'footer.blurb', label: 'Texto do rodapé', type: 'textarea', max: 200 },
    { k: 'footer.atend2', label: 'Linha de atendimento', type: 'text', max: 50 },
    { k: 'footer.tagline', label: 'Assinatura final', type: 'text', max: 70 },
  ]},
];

export const FIELDS = {};
export const DEFAULTS = {};
for (const g of GROUPS) {
  for (const f of g.fields) {
    FIELDS[f.k] = f;
    if (f.def != null) DEFAULTS[f.k] = f.def;
  }
}
