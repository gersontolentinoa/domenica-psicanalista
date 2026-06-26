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
function renderConteudo(main) {
  main.innerHTML = `
    <div class="page-head"><div>
      <h1>Conteúdo da página</h1>
      <p>Edite os textos de cada seção da landing page, os contatos e os números. A estrutura do design fica protegida — você só troca o conteúdo.</p>
    </div></div>
    <div class="card"><div class="placeholder"><span class="badge-soon">Em breve</span> O editor de conteúdo entra na próxima atualização.</div></div>`;
}
function renderBlog(main) {
  main.innerHTML = `
    <div class="page-head"><div>
      <h1>Blog</h1>
      <p>Escreva, edite e publique artigos. Cada artigo ganha uma página própria no site.</p>
    </div></div>
    <div class="card"><div class="placeholder"><span class="badge-soon">Em breve</span> O editor de artigos entra na próxima atualização.</div></div>`;
}

boot();
