-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  perfil TEXT NOT NULL CHECK(perfil IN ('ADMIN', 'RH', 'COLABORADOR')),
  ativo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tabela de cursos
CREATE TABLE IF NOT EXISTS cursos (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  thumbnail TEXT,
  criado_por TEXT NOT NULL,
  ativo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (criado_por) REFERENCES usuarios(id)
);

-- Tabela de aulas
CREATE TABLE IF NOT EXISTS aulas (
  id TEXT PRIMARY KEY,
  curso_id TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL CHECK(tipo IN ('pdf', 'video', 'youtube', 'texto')),
  url_ou_arquivo TEXT,
  conteudo_texto TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (curso_id) REFERENCES cursos(id)
);

-- Tabela de progresso
CREATE TABLE IF NOT EXISTS progresso (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  aula_id TEXT NOT NULL,
  concluido INTEGER NOT NULL DEFAULT 0,
  data TEXT,
  UNIQUE(user_id, aula_id),
  FOREIGN KEY (user_id) REFERENCES usuarios(id),
  FOREIGN KEY (aula_id) REFERENCES aulas(id)
);

-- Tabela de certificados
CREATE TABLE IF NOT EXISTS certificados (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  curso_id TEXT NOT NULL,
  data_emissao TEXT NOT NULL DEFAULT (datetime('now')),
  codigo_validacao TEXT UNIQUE NOT NULL,
  UNIQUE(user_id, curso_id),
  FOREIGN KEY (user_id) REFERENCES usuarios(id),
  FOREIGN KEY (curso_id) REFERENCES cursos(id)
);

-- Tabela de matrículas (cursos atribuídos a colaboradores)
CREATE TABLE IF NOT EXISTS matriculas (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  curso_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, curso_id),
  FOREIGN KEY (user_id) REFERENCES usuarios(id),
  FOREIGN KEY (curso_id) REFERENCES cursos(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_aulas_curso ON aulas(curso_id);
CREATE INDEX IF NOT EXISTS idx_progresso_user ON progresso(user_id);
CREATE INDEX IF NOT EXISTS idx_progresso_aula ON progresso(aula_id);
CREATE INDEX IF NOT EXISTS idx_certificados_user ON certificados(user_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_user ON matriculas(user_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_curso ON matriculas(curso_id);
