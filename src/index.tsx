import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serveStatic } from 'hono/cloudflare-workers'
import type { Env } from './types'
import auth from './routes/auth'
import usuarios from './routes/usuarios'
import cursos from './routes/cursos'
import progresso from './routes/progresso'
import certificados from './routes/certificados'
import dashboard from './routes/dashboard'
import uploads from './routes/uploads'

const app = new Hono<{ Bindings: Env }>()

// Middlewares globais
app.use('*', logger())
app.use('/api/*', cors({
  origin: '*',
  allowHeaders: ['Authorization', 'Content-Type', 'Accept'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}))

// Inicializar banco de dados
app.use('/api/*', async (c, next) => {
  try {
    await c.env.DB.batch([
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha_hash TEXT NOT NULL,
        perfil TEXT NOT NULL CHECK(perfil IN ('ADMIN', 'RH', 'COLABORADOR')),
        ativo INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`),
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS cursos (
        id TEXT PRIMARY KEY,
        titulo TEXT NOT NULL,
        descricao TEXT,
        thumbnail TEXT,
        criado_por TEXT NOT NULL,
        ativo INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`),
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS aulas (
        id TEXT PRIMARY KEY,
        curso_id TEXT NOT NULL,
        titulo TEXT NOT NULL,
        descricao TEXT,
        tipo TEXT NOT NULL CHECK(tipo IN ('pdf', 'video', 'youtube', 'texto')),
        url_ou_arquivo TEXT,
        conteudo_texto TEXT,
        ordem INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`),
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS progresso (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        aula_id TEXT NOT NULL,
        concluido INTEGER NOT NULL DEFAULT 0,
        data TEXT,
        UNIQUE(user_id, aula_id)
      )`),
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS certificados (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        curso_id TEXT NOT NULL,
        data_emissao TEXT NOT NULL DEFAULT (datetime('now')),
        codigo_validacao TEXT UNIQUE NOT NULL,
        UNIQUE(user_id, curso_id)
      )`),
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS matriculas (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        curso_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(user_id, curso_id)
      )`),
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS arquivos (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        tipo TEXT NOT NULL,
        mime_type TEXT,
        tamanho INTEGER NOT NULL DEFAULT 0,
        total_chunks INTEGER NOT NULL DEFAULT 1,
        enviado_por TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`),
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS arquivos_chunks (
        id TEXT NOT NULL,
        chunk_idx INTEGER NOT NULL,
        data TEXT NOT NULL,
        PRIMARY KEY (id, chunk_idx)
      )`),
    ]);
  } catch {
    // Tables may already exist
  }
  await next();
});

// Seed admin inicial
app.use('/api/*', async (c, next) => {
  try {
    const admin = await c.env.DB.prepare(
      "SELECT id FROM usuarios WHERE perfil = 'ADMIN' LIMIT 1"
    ).first();
    
    if (!admin) {
      const { hashPassword } = await import('./utils/crypto');
      const { v4: uuidv4 } = await import('uuid');
      const id = uuidv4();
      const hash = await hashPassword('admin123');
      await c.env.DB.prepare(
        "INSERT INTO usuarios (id, nome, email, senha_hash, perfil, ativo) VALUES (?, ?, ?, ?, 'ADMIN', 1)"
      ).bind(id, 'Administrador', 'admin@hrd.com', hash).run();
      
      // Criar usuário RH demo
      const rhId = uuidv4();
      const rhHash = await hashPassword('rh123456');
      await c.env.DB.prepare(
        "INSERT OR IGNORE INTO usuarios (id, nome, email, senha_hash, perfil, ativo) VALUES (?, ?, ?, ?, 'RH', 1)"
      ).bind(rhId, 'Gestor de RH', 'rh@hrd.com', rhHash).run();
      
      // Criar colaborador demo
      const colabId = uuidv4();
      const colabHash = await hashPassword('colab123');
      await c.env.DB.prepare(
        "INSERT OR IGNORE INTO usuarios (id, nome, email, senha_hash, perfil, ativo) VALUES (?, ?, ?, ?, 'COLABORADOR', 1)"
      ).bind(colabId, 'João Silva', 'joao@hrd.com', colabHash).run();
    }
  } catch {
    // seed may fail silently
  }
  await next();
});

// Rotas de API
app.route('/api/auth', auth);
app.route('/api/usuarios', usuarios);
app.route('/api/cursos', cursos);
app.route('/api/progresso', progresso);
app.route('/api/certificados', certificados);
app.route('/api/dashboard', dashboard)
app.route('/api/uploads', uploads);

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', time: new Date().toISOString() }));

// Servir arquivos estáticos
app.use('/static/*', serveStatic({ root: './' }))

// SPA fallback - serve o index.html para todas as rotas não-API
app.get('*', async (c) => {
  return c.html(getIndexHTML());
});

function getIndexHTML(): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>HRD - Consultoria em Treinamento e Desenvolvimento</title>
  <link rel="icon" type="image/svg+xml" href="/static/favicon.svg" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: { DEFAULT: '#0F172A', light: '#1E293B', lighter: '#334155' },
            accent: { DEFAULT: '#3B82F6', dark: '#1D4ED8', light: '#60A5FA' },
            surface: { DEFAULT: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0' }
          },
          fontFamily: { sans: ['Inter', 'sans-serif'] }
        }
      }
    }
  </script>
  <style>
    * { font-family: 'Inter', sans-serif; }
    .sidebar-item.active { background: rgba(59,130,246,0.15); color: #60A5FA; border-left: 3px solid #3B82F6; }
    .sidebar-item:hover:not(.active) { background: rgba(255,255,255,0.05); }
    .card-hover { transition: all 0.2s ease; }
    .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
    .progress-bar { transition: width 0.6s ease; }
    .fade-in { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .modal-overlay { backdrop-filter: blur(4px); }
    .btn-primary { background: linear-gradient(135deg, #3B82F6, #1D4ED8); transition: all 0.2s; }
    .btn-primary:hover { background: linear-gradient(135deg, #60A5FA, #3B82F6); transform: translateY(-1px); }
    ::-webkit-scrollbar { width: 6px; } 
    ::-webkit-scrollbar-track { background: #1E293B; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
    .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.08); }
    .stat-card { background: linear-gradient(135deg, rgba(59,130,246,0.1), rgba(29,78,216,0.05)); border: 1px solid rgba(59,130,246,0.2); }
    .notification { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999; }
    .notification.show { animation: slideIn 0.3s ease; }
    @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .cert-preview { font-family: 'Times New Roman', serif; }
    .drag-over { border: 2px dashed #3B82F6 !important; background: rgba(59,130,246,0.05) !important; }
    input[type="range"] { accent-color: #3B82F6; }
  </style>
</head>
<body class="bg-primary text-slate-100 min-h-screen">
  <div id="app"></div>
  <div id="notification-container" class="notification"></div>
  <script src="/static/app.js"></script>
</body>
</html>`;
}

export default app;
