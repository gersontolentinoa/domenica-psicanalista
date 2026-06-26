-- ============================================================
-- Domênica de Podestá — schema D1
-- ============================================================

-- Usuário(s) administrador(es) do painel
CREATE TABLE IF NOT EXISTS admin_users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

-- Conteúdo da landing page (documento JSON único, chave 'landing')
CREATE TABLE IF NOT EXISTS content (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,            -- JSON
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Artigos do blog
CREATE TABLE IF NOT EXISTS articles (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slug         TEXT UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  excerpt      TEXT,
  cover_image  TEXT,
  body_html    TEXT NOT NULL,          -- HTML já sanitizado
  category     TEXT,
  status       TEXT NOT NULL DEFAULT 'draft',   -- draft | published
  published_at TEXT,
  created_at   TEXT DEFAULT (datetime('now')),
  updated_at   TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_articles_pub ON articles(status, published_at DESC);

-- Tentativas de login (rate limiting simples por IP)
CREATE TABLE IF NOT EXISTS login_attempts (
  ip TEXT NOT NULL,
  ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_login_ip ON login_attempts(ip, ts);
