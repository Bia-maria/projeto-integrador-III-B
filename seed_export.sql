CREATE TABLE arquivos (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        tipo TEXT NOT NULL,
        mime_type TEXT,
        tamanho INTEGER NOT NULL DEFAULT 0,
        total_chunks INTEGER NOT NULL DEFAULT 1,
        enviado_por TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
-- Dados de arquivos omitidos (gerados via upload)
CREATE TABLE arquivos_chunks (
        id TEXT NOT NULL,
        chunk_idx INTEGER NOT NULL,
        data TEXT NOT NULL,
        PRIMARY KEY (id, chunk_idx)
      );
-- Dados de arquivos_chunks omitidos (gerados via upload)
CREATE TABLE aulas (
        id TEXT PRIMARY KEY,
        curso_id TEXT NOT NULL,
        titulo TEXT NOT NULL,
        descricao TEXT,
        tipo TEXT NOT NULL CHECK(tipo IN ('pdf', 'video', 'youtube', 'texto')),
        url_ou_arquivo TEXT,
        conteudo_texto TEXT,
        ordem INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
CREATE TABLE certificados (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        curso_id TEXT NOT NULL,
        data_emissao TEXT NOT NULL DEFAULT (datetime('now')),
        codigo_validacao TEXT UNIQUE NOT NULL,
        UNIQUE(user_id, curso_id)
      );
INSERT OR IGNORE INTO "certificados" (id, user_id, curso_id, data_emissao, codigo_validacao) VALUES ('84b0e066-2511-4d11-9399-66202e78abc5', '5aa2a4ff-fb20-4f79-9828-078eb57b64f5', '5ed15f12-6a8a-4a88-96a8-ff37528c8283', '2026-03-22T01:16:46.381Z', 'HRD-783P-BQ2O-8PKU');
CREATE TABLE cursos (
        id TEXT PRIMARY KEY,
        titulo TEXT NOT NULL,
        descricao TEXT,
        thumbnail TEXT,
        criado_por TEXT NOT NULL,
        ativo INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
INSERT OR IGNORE INTO "cursos" (id, titulo, descricao, thumbnail, criado_por, ativo, created_at) VALUES ('5ed15f12-6a8a-4a88-96a8-ff37528c8283', 'Curso Teste Upload', 'Teste de upload de arquivos', NULL, 'e0f3c137-2375-4c3f-abe8-a80fbcde0471', 0, '2026-03-21 23:50:59');
CREATE TABLE matriculas (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        curso_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(user_id, curso_id)
      );
INSERT OR IGNORE INTO "matriculas" (id, user_id, curso_id, created_at) VALUES ('548970df-0595-4a81-ba07-2e1d5036876d', '5aa2a4ff-fb20-4f79-9828-078eb57b64f5', '5ed15f12-6a8a-4a88-96a8-ff37528c8283', '2026-03-22 01:16:07');
CREATE TABLE progresso (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        aula_id TEXT NOT NULL,
        concluido INTEGER NOT NULL DEFAULT 0,
        data TEXT,
        UNIQUE(user_id, aula_id)
      );
INSERT OR IGNORE INTO "progresso" (id, user_id, aula_id, concluido, data) VALUES ('308b0b85-b2c8-46e7-9158-ce89999c65dc', '5aa2a4ff-fb20-4f79-9828-078eb57b64f5', '794b3a58-e8fc-468d-b843-b787375f4a76', 1, '2026-03-22T01:16:46.381Z');
CREATE TABLE usuarios (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha_hash TEXT NOT NULL,
        perfil TEXT NOT NULL CHECK(perfil IN ('ADMIN', 'RH', 'COLABORADOR')),
        ativo INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
INSERT OR IGNORE INTO "usuarios" (id, nome, email, senha_hash, perfil, ativo, created_at) VALUES ('a49cad7c-ce4e-48f6-bf11-cc7f24ae0333', 'Administrador', 'admin@hrd.com', 'pbkdf2:c357dace80b33e6ce2275c2694c6f8b1:924a3ab1da57d69c1392d3820282e10797508483e03673b0855f30a8d06e3304', 'ADMIN', 1, '2026-03-21 23:47:11');
INSERT OR IGNORE INTO "usuarios" (id, nome, email, senha_hash, perfil, ativo, created_at) VALUES ('e0f3c137-2375-4c3f-abe8-a80fbcde0471', 'Gestor de RH', 'rh@hrd.com', 'pbkdf2:64414ce51e5ff9ba701ddc320f513dfd:4414efacb7161b422635b37a0fa2fae8a1812bac3cdda9e7b1d5e151e231c13f', 'RH', 1, '2026-03-21 23:47:11');
INSERT OR IGNORE INTO "usuarios" (id, nome, email, senha_hash, perfil, ativo, created_at) VALUES ('5aa2a4ff-fb20-4f79-9828-078eb57b64f5', 'João Silva', 'joao@hrd.com', 'pbkdf2:a86f2cf83e4c23c9c3281d1c6de9cc16:9fbdf3575426d40b641dded9b42dabc212085fa8f7fb4ccac65c29fcdca9b374', 'COLABORADOR', 1, '2026-03-21 23:47:11');