// admin.js — painel administrativo (vanilla SPA).
const app = document.getElementById('app');
let state = { user: null };

// ── API ────────────────────────────────────────────────────
async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch('/api' + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error((data && data.error) || 'Erro ' + res.status);
  return data;
}

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ── Boot ───────────────────────────────────────────────────
async function boot() {
  app.className = '';
  let s;
  try {
    s = await api('/session');
  } catch (e) {
    app.innerHTML = `<div class="auth-wrap"><div class="auth-card"><div class="msg msg-err">Não foi possível conectar ao servidor.</div></div></div>`;
    return;
  }
  if (s.setupRequired) return viewSetup();
  if (!s.authenticated) return viewLogin();
  state.user = s.user;
  viewDashboard();
}

// ── Setup (primeiro acesso) ────────────────────────────────
function viewSetup() {
  app.innerHTML = '';
  const card = el(`
    <div class="auth-wrap"><div class="auth-card">
      <div class="brand">Configuração inicial</div>
      <div class="sub">Crie o seu acesso ao painel. Isto só acontece uma vez.</div>
      <div id="msg"></div>
      <div class="field"><label>Token de configuração</label><input id="token" type="password" autocomplete="off" placeholder="Cole o token fornecido"/><div class="hint">Fornecido por quem instalou o painel.</div></div>
      <div class="field"><label>Usuário</label><input id="username" autocomplete="username" placeholder="ex: domenica"/></div>
      <div class="field"><label>Senha (mín. 8 caracteres)</label><input id="password" type="password" autocomplete="new-password"/></div>
      <button class="btn btn-pri btn-block" id="go">Criar acesso</button>
    </div></div>`);
  app.appendChild(card);
  const msg = card.querySelector('#msg');
  card.querySelector('#go').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    msg.innerHTML = '';
    try {
      await api('/setup', { method: 'POST', body: {
        token: card.querySelector('#token').value,
        username: card.querySelector('#username').value,
        password: card.querySelector('#password').value,
      }});
      boot();
    } catch (err) {
      msg.innerHTML = `<div class="msg msg-err">${esc(err.message)}</div>`;
      btn.disabled = false;
    }
  });
}

// ── Login ──────────────────────────────────────────────────
function viewLogin() {
  app.innerHTML = '';
  const card = el(`
    <div class="auth-wrap"><div class="auth-card">
      <div class="brand">Domênica de Podestá</div>
      <div class="sub">Painel administrativo</div>
      <div id="msg"></div>
      <form id="f">
        <div class="field"><label>Usuário</label><input id="username" autocomplete="username" autofocus/></div>
        <div class="field"><label>Senha</label><input id="password" type="password" autocomplete="current-password"/></div>
        <button class="btn btn-pri btn-block" id="go" type="submit">Entrar</button>
      </form>
    </div></div>`);
  app.appendChild(card);
  const msg = card.querySelector('#msg');
  card.querySelector('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = card.querySelector('#go');
    btn.disabled = true;
    msg.innerHTML = '';
    try {
      await api('/login', { method: 'POST', body: {
        username: card.querySelector('#username').value,
        password: card.querySelector('#password').value,
      }});
      boot();
    } catch (err) {
      msg.innerHTML = `<div class="msg msg-err">${esc(err.message)}</div>`;
      btn.disabled = false;
    }
  });
}

// ── Dashboard ──────────────────────────────────────────────
const SECTIONS = {
  conteudo: { label: 'Conteúdo da página', render: renderConteudo },
  blog: { label: 'Blog', render: renderBlog },
  depoimentos: { label: 'Depoimentos', render: renderDepoimentos },
};

function viewDashboard(active = 'conteudo') {
  app.innerHTML = '';
  const dash = el(`
    <div class="dash">
      <aside class="side">
        <div class="logo">Domênica<small>Painel</small></div>
        ${Object.entries(SECTIONS).map(([k, v]) => `<button class="navlink ${k === active ? 'active' : ''}" data-k="${k}">${v.label}</button>`).join('')}
        <div class="spacer"></div>
        <div class="who">Conectada como<br><strong>${esc(state.user.username)}</strong></div>
        <button class="navlink" id="logout">Sair</button>
      </aside>
      <main class="main" id="main"></main>
    </div>`);
  app.appendChild(dash);
  dash.querySelectorAll('.navlink[data-k]').forEach((b) =>
    b.addEventListener('click', () => viewDashboard(b.dataset.k))
  );
  dash.querySelector('#logout').addEventListener('click', async () => {
    await api('/logout', { method: 'POST' });
    boot();
  });
  SECTIONS[active].render(dash.querySelector('#main'));
}

// Placeholders (preenchidos nas próximas fases)
async function renderConteudo(main) {
  main.innerHTML = `
    <div class="page-head">
      <div><h1>Conteúdo da página</h1><p>Edite os textos de cada seção. A estrutura do design fica protegida — você só troca o conteúdo.</p></div>
      <div class="sticky-actions"><a class="btn btn-ghost btn-sm" href="/" target="_blank">Ver site ↗</a><button class="btn btn-pri" id="save">Salvar alterações</button></div>
    </div>
    <div id="msg"></div>
    <div id="groups"><div class="placeholder">Carregando conteúdo…</div></div>`;

  let data;
  try { data = await api('/content'); }
  catch (e) { main.querySelector('#groups').innerHTML = `<div class="msg msg-err">${esc(e.message)}</div>`; return; }

  const wrap = main.querySelector('#groups');
  wrap.innerHTML = '';
  const inputs = {};

  data.groups.forEach((g) => {
    const card = el(`<div class="card"><h3 class="group-title">${esc(g.label)}</h3>${g.desc ? `<p class="group-desc">${esc(g.desc)}</p>` : ''}<div class="group-fields"></div></div>`);
    const gf = card.querySelector('.group-fields');
    g.fields.forEach((f) => {
      const isArea = f.type === 'textarea';
      const field = el(`<div class="field ${isArea ? 'full' : ''}"><label>${esc(f.label)}</label>${
        isArea ? `<textarea rows="3" maxlength="${f.max || 500}"></textarea>` : `<input type="text" maxlength="${f.max || 120}"/>`
      }<div class="counter"></div></div>`);
      const inp = field.querySelector('textarea, input');
      inp.value = data.values[f.k] != null ? data.values[f.k] : '';
      const cnt = field.querySelector('.counter');
      const upd = () => { cnt.textContent = `${inp.value.length}/${f.max}`; cnt.classList.toggle('over', inp.value.length > f.max); };
      inp.addEventListener('input', upd); upd();
      inputs[f.k] = inp;
      gf.appendChild(field);
    });
    wrap.appendChild(card);
  });

  main.querySelector('#save').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    const values = {};
    Object.entries(inputs).forEach(([k, inp]) => { values[k] = inp.value; });
    try { await api('/content', { method: 'PUT', body: { values } }); toast('Conteúdo salvo! As mudanças já estão no site.'); }
    catch (err) { toast(err.message, true); main.querySelector('#msg').innerHTML = `<div class="msg msg-err">${esc(err.message)}</div>`; }
    btn.disabled = false;
  });
}
// ── Blog: lista de artigos ─────────────────────────────────
async function renderBlog(main) {
  main.innerHTML = `
    <div class="page-head">
      <div><h1>Blog</h1><p>Escreva, edite e publique artigos. Cada um ganha uma página própria no site.</p></div>
      <button class="btn btn-pri" id="new">+ Novo artigo</button>
    </div>
    <div id="list" class="art-list"><div class="placeholder">Carregando…</div></div>`;
  main.querySelector('#new').addEventListener('click', () => viewArticleEditor(main, null));
  const list = main.querySelector('#list');
  let data;
  try { data = await api('/articles?all=1'); } catch (e) { list.innerHTML = `<div class="msg msg-err">${esc(e.message)}</div>`; return; }
  if (!data.articles.length) {
    list.innerHTML = `<div class="card placeholder">Nenhum artigo ainda. Clique em <strong>+ Novo artigo</strong> para começar.</div>`;
    return;
  }
  list.innerHTML = '';
  data.articles.forEach((a) => {
    const item = el(`
      <div class="art-item">
        ${a.cover_image ? `<img class="thumb" src="${esc(a.cover_image)}" alt=""/>` : `<div class="thumb"></div>`}
        <div class="info">
          <h4>${esc(a.title)}</h4>
          <div class="sub">${a.status === 'published' ? '<span class="pill pill-pub">Publicado</span>' : '<span class="pill pill-draft">Rascunho</span>'} · ${esc(a.category || 'Artigo')}${a.status === 'published' ? ' · /blog/' + esc(a.slug) : ''}</div>
        </div>
        <div class="acts">
          ${a.status === 'published' ? `<a class="btn btn-ghost btn-sm" href="/blog/${esc(a.slug)}" target="_blank">Ver</a>` : ''}
          <button class="btn btn-ghost btn-sm edit">Editar</button>
          <button class="btn btn-danger btn-sm del">Excluir</button>
        </div>
      </div>`);
    item.querySelector('.edit').addEventListener('click', () => viewArticleEditor(main, a.id));
    item.querySelector('.del').addEventListener('click', async () => {
      if (!confirm(`Excluir "${a.title}"? Esta ação não pode ser desfeita.`)) return;
      try { await api('/articles/' + a.id, { method: 'DELETE' }); toast('Artigo excluído.'); renderBlog(main); }
      catch (e) { toast(e.message, true); }
    });
    list.appendChild(item);
  });
}

// ── Blog: editor de artigo ─────────────────────────────────
async function viewArticleEditor(main, id) {
  let art = { title: '', excerpt: '', category: '', cover_image: '', body_html: '', status: 'draft' };
  if (id) {
    try { art = (await api('/articles/' + id)).article; } catch (e) { toast(e.message, true); return; }
  }
  const cover = { url: art.cover_image || '' };

  main.innerHTML = `
    <div class="page-head">
      <div><h1>${id ? 'Editar artigo' : 'Novo artigo'}</h1></div>
      <button class="btn btn-ghost" id="back">← Voltar</button>
    </div>
    <div id="msg"></div>
    <div class="field"><label>Título</label><input id="title" maxlength="160" placeholder="Título do artigo"/><div class="counter" id="cTitle"></div></div>
    <div class="editor-grid">
      <div>
        <div class="toolbar" id="tb">
          <button data-cmd="bold" title="Negrito"><b>B</b></button>
          <button data-cmd="italic" title="Itálico"><i>I</i></button>
          <span class="sep"></span>
          <button data-block="h2" title="Título">H2</button>
          <button data-block="h3" title="Subtítulo">H3</button>
          <button data-block="p" title="Parágrafo">¶</button>
          <span class="sep"></span>
          <button data-list="insertUnorderedList" title="Lista">• Lista</button>
          <button data-list="insertOrderedList" title="Lista numerada">1. Lista</button>
          <button data-block="blockquote" title="Citação">❝ Citação</button>
          <span class="sep"></span>
          <button data-link title="Link">🔗 Link</button>
          <button data-img title="Imagem">🖼 Imagem</button>
          <button data-clear title="Limpar formatação">⌫ Limpar</button>
        </div>
        <div class="rte" id="rte" contenteditable="true" data-ph="Escreva o artigo aqui…"></div>
      </div>
      <div>
        <div class="aside-card">
          <div class="field" style="margin-bottom:8px"><label>Imagem de capa</label>
            <img class="cover-prev" id="coverPrev" alt="" style="${cover.url ? '' : 'display:none'}" src="${esc(cover.url)}"/>
            <div class="sticky-actions">
              <button class="btn btn-ghost btn-sm" id="coverBtn">Enviar capa</button>
              <button class="btn btn-danger btn-sm" id="coverDel" style="${cover.url ? '' : 'display:none'}">Remover</button>
            </div>
          </div>
        </div>
        <div class="aside-card">
          <div class="field"><label>Categoria</label><input id="category" maxlength="40" placeholder="ex: Ansiedade"/></div>
          <div class="field"><label>Resumo (aparece na listagem)</label><textarea id="excerpt" rows="3" maxlength="300" placeholder="Frase curta que convida à leitura"></textarea><div class="counter" id="cExcerpt"></div></div>
        </div>
        <div class="aside-card">
          <div class="sticky-actions">
            <button class="btn btn-pri" id="save">Salvar rascunho</button>
            <button class="btn btn-ghost" id="pub"></button>
          </div>
          <div class="hint" id="statusHint" style="margin-top:10px"></div>
        </div>
      </div>
    </div>
    <input type="file" id="fileInput" accept="image/*" hidden/>`;

  const rte = main.querySelector('#rte');
  const titleI = main.querySelector('#title');
  const catI = main.querySelector('#category');
  const excI = main.querySelector('#excerpt');
  const fileInput = main.querySelector('#fileInput');
  const coverPrev = main.querySelector('#coverPrev');
  const coverDel = main.querySelector('#coverDel');
  const pubBtn = main.querySelector('#pub');
  const statusHint = main.querySelector('#statusHint');

  titleI.value = art.title || '';
  catI.value = art.category || '';
  excI.value = art.excerpt || '';
  rte.innerHTML = art.body_html || '';

  try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch {}

  // contadores
  const counter = (input, out, max) => {
    const upd = () => { out.textContent = `${input.value.length}/${max}`; out.classList.toggle('over', input.value.length > max); };
    input.addEventListener('input', upd); upd();
  };
  counter(titleI, main.querySelector('#cTitle'), 160);
  counter(excI, main.querySelector('#cExcerpt'), 300);

  // colar como texto simples
  rte.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, text);
  });

  // toolbar
  main.querySelector('#tb').addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b) return;
    e.preventDefault(); rte.focus();
    if (b.dataset.cmd) document.execCommand(b.dataset.cmd);
    else if (b.dataset.block) document.execCommand('formatBlock', false, b.dataset.block);
    else if (b.dataset.list) document.execCommand(b.dataset.list);
    else if (b.hasAttribute('data-clear')) { document.execCommand('removeFormat'); document.execCommand('formatBlock', false, 'p'); }
    else if (b.hasAttribute('data-link')) {
      const url = prompt('Endereço do link (https://…):'); if (url) document.execCommand('createLink', false, url);
    } else if (b.hasAttribute('data-img')) {
      fileInput.dataset.target = 'inline'; fileInput.click();
    }
  });

  // upload (capa ou inline)
  main.querySelector('#coverBtn').addEventListener('click', () => { fileInput.dataset.target = 'cover'; fileInput.click(); });
  coverDel.addEventListener('click', () => { cover.url = ''; coverPrev.style.display = 'none'; coverDel.style.display = 'none'; });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0]; if (!file) return;
    const target = fileInput.dataset.target;
    fileInput.value = '';
    toast('Enviando imagem…');
    try {
      const url = await uploadImage(file);
      if (target === 'cover') { cover.url = url; coverPrev.src = url; coverPrev.style.display = 'block'; coverDel.style.display = ''; }
      else { rte.focus(); document.execCommand('insertHTML', false, `<img src="${url}" alt=""/><p></p>`); }
      toast('Imagem adicionada.');
    } catch (e) { toast(e.message, true); }
  });

  // estado de publicação
  let status = art.status || 'draft';
  function refreshStatusUI() {
    pubBtn.textContent = status === 'published' ? 'Despublicar' : 'Publicar';
    pubBtn.className = 'btn ' + (status === 'published' ? 'btn-danger' : 'btn-ghost');
    statusHint.textContent = status === 'published' ? 'Este artigo está visível no site.' : 'Rascunho — só você vê.';
    main.querySelector('#save').textContent = status === 'published' ? 'Salvar alterações' : 'Salvar rascunho';
  }
  refreshStatusUI();

  async function save(newStatus) {
    const payload = {
      title: titleI.value, category: catI.value, excerpt: excI.value,
      cover_image: cover.url, body_html: rte.innerHTML, status: newStatus,
    };
    const msg = main.querySelector('#msg'); msg.innerHTML = '';
    try {
      const res = id
        ? await api('/articles/' + id, { method: 'PUT', body: payload })
        : await api('/articles', { method: 'POST', body: payload });
      id = res.id; status = newStatus; refreshStatusUI();
      toast(newStatus === 'published' ? 'Publicado!' : 'Salvo.');
    } catch (e) { msg.innerHTML = `<div class="msg msg-err">${esc(e.message)}</div>`; toast(e.message, true); }
  }
  main.querySelector('#save').addEventListener('click', () => save(status));
  pubBtn.addEventListener('click', () => save(status === 'published' ? 'draft' : 'published'));
  main.querySelector('#back').addEventListener('click', () => renderBlog(main));
}

// ── Depoimentos ────────────────────────────────────────────
async function renderDepoimentos(main) {
  let editing = null;
  main.innerHTML = `
    <div class="page-head"><div>
      <h1>Depoimentos</h1>
      <p>Aparecem como carrossel na página inicial. A seção fica oculta no site enquanto não houver nenhum publicado.</p>
    </div></div>
    <div class="card">
      <div class="field"><label id="dformLabel">Novo depoimento</label><textarea id="dtext" rows="3" maxlength="400" placeholder="O que a pessoa disse…"></textarea><div class="counter" id="dcount"></div></div>
      <div class="field"><label>Autor</label><input id="dauthor" maxlength="80" placeholder="ex: Paciente · atendimento online"/></div>
      <label class="check"><input type="checkbox" id="dpub" checked/> Publicar no site</label>
      <div class="sticky-actions" style="margin-top:14px"><button class="btn btn-pri" id="dsave">Adicionar</button><button class="btn btn-ghost" id="dcancel" style="display:none">Cancelar</button></div>
    </div>
    <div id="dmsg"></div>
    <div id="dlist" class="art-list" style="margin-top:18px"><div class="placeholder">Carregando…</div></div>`;

  const tx = main.querySelector('#dtext'), au = main.querySelector('#dauthor'), pub = main.querySelector('#dpub');
  const cnt = main.querySelector('#dcount'), saveBtn = main.querySelector('#dsave'), cancelBtn = main.querySelector('#dcancel'), formLabel = main.querySelector('#dformLabel');
  const updc = () => { cnt.textContent = `${tx.value.length}/400`; };
  tx.addEventListener('input', updc); updc();

  function resetForm() {
    editing = null; tx.value = ''; au.value = ''; pub.checked = true; updc();
    saveBtn.textContent = 'Adicionar'; cancelBtn.style.display = 'none'; formLabel.textContent = 'Novo depoimento';
  }
  cancelBtn.addEventListener('click', resetForm);

  async function load() {
    const list = main.querySelector('#dlist');
    let data;
    try { data = await api('/testimonials?all=1'); }
    catch (e) { list.innerHTML = `<div class="msg msg-err">${esc(e.message)}</div>`; return; }
    if (!data.testimonials.length) { list.innerHTML = `<div class="card placeholder">Nenhum depoimento ainda. Adicione o primeiro acima.</div>`; return; }
    list.innerHTML = '';
    data.testimonials.forEach((t) => {
      const item = el(`<div class="art-item"><div class="info"><h4>${esc(t.text)}</h4><div class="sub">${t.status === 'published' ? '<span class="pill pill-pub">Publicado</span>' : '<span class="pill pill-draft">Rascunho</span>'}${t.author ? ' · ' + esc(t.author) : ''}</div></div><div class="acts"><button class="btn btn-ghost btn-sm tog">${t.status === 'published' ? 'Despublicar' : 'Publicar'}</button><button class="btn btn-ghost btn-sm ed">Editar</button><button class="btn btn-danger btn-sm del">Excluir</button></div></div>`);
      item.querySelector('.tog').addEventListener('click', async () => {
        try { await api('/testimonials/' + t.id, { method: 'PUT', body: { text: t.text, author: t.author, status: t.status === 'published' ? 'draft' : 'published', position: t.position } }); toast('Atualizado.'); load(); }
        catch (e) { toast(e.message, true); }
      });
      item.querySelector('.ed').addEventListener('click', () => {
        editing = t.id; tx.value = t.text; au.value = t.author || ''; pub.checked = t.status === 'published'; updc();
        saveBtn.textContent = 'Salvar'; cancelBtn.style.display = ''; formLabel.textContent = 'Editar depoimento';
        main.scrollTo({ top: 0, behavior: 'smooth' });
      });
      item.querySelector('.del').addEventListener('click', async () => {
        if (!confirm('Excluir este depoimento?')) return;
        try { await api('/testimonials/' + t.id, { method: 'DELETE' }); toast('Excluído.'); if (editing === t.id) resetForm(); load(); }
        catch (e) { toast(e.message, true); }
      });
      list.appendChild(item);
    });
  }

  saveBtn.addEventListener('click', async () => {
    const body = { text: tx.value, author: au.value, status: pub.checked ? 'published' : 'draft' };
    saveBtn.disabled = true;
    main.querySelector('#dmsg').innerHTML = '';
    try {
      if (editing) await api('/testimonials/' + editing, { method: 'PUT', body });
      else await api('/testimonials', { method: 'POST', body });
      toast(editing ? 'Depoimento salvo.' : 'Depoimento adicionado.');
      resetForm(); load();
    } catch (e) { main.querySelector('#dmsg').innerHTML = `<div class="msg msg-err">${esc(e.message)}</div>`; toast(e.message, true); }
    saveBtn.disabled = false;
  });

  load();
}

// ── Helpers de imagem e toast ──────────────────────────────
function downscaleImage(file, maxW = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (file.type === 'image/gif') { resolve(file); return; }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width <= maxW) { resolve(file); return; }
      const scale = maxW / img.width;
      const c = document.createElement('canvas');
      c.width = maxW; c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((b) => resolve(b ? new File([b], 'img.jpg', { type: 'image/jpeg' }) : file), 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Imagem inválida.')); };
    img.src = url;
  });
}
async function uploadImage(file) {
  const small = await downscaleImage(file);
  const fd = new FormData(); fd.append('file', small);
  const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'same-origin' });
  let data = null; try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error((data && data.error) || 'Falha no upload da imagem.');
  return data.url;
}
let toastTimer = null;
function toast(msg, isErr = false) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.className = 'toast' + (isErr ? ' err' : '');
  requestAnimationFrame(() => t.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

boot();
