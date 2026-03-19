# HRD Consultoria — Sistema de Treinamento & Desenvolvimento

![Status](https://img.shields.io/badge/status-ativo-brightgreen)
![Stack](https://img.shields.io/badge/stack-Hono%20%2B%20Cloudflare%20D1-blue)
![License](https://img.shields.io/badge/license-MIT-gray)

## Visão Geral

Plataforma web profissional e minimalista para gestão de treinamentos corporativos. Permite que gestores de RH criem e gerenciem cursos, colaboradores consumam os conteúdos e recebam certificados automaticamente ao concluir.

## Funcionalidades Implementadas

### ✅ Etapa 1 — Autenticação e Perfis
- Login com email/senha e JWT (8 horas de validade)
- 3 perfis: `ADMIN`, `RH`, `COLABORADOR`
- RBAC (controle de acesso baseado em papel)
- Hash de senha com PBKDF2 (Web Crypto API)

### ✅ Etapa 2 — Gestão de Usuários
- CRUD completo de usuários
- Filtro por perfil, busca por nome/email
- Paginação (10 por página)
- Soft delete (campo `ativo`)
- ADMIN cria todos os perfis; RH cria apenas COLABORADOR

### ✅ Etapa 3 — Gestão de Cursos
- CRUD de cursos (título, descrição, status)
- Estrutura de aulas por curso
- Tipos de aula: YouTube, Vídeo URL, PDF, Texto
- Ativar/desativar cursos
- Gerenciamento de matrículas (quais colaboradores têm acesso)

### ✅ Etapa 4 — Área do Colaborador
- Lista de cursos com barra de progresso
- Visualização de aulas (YouTube embed, vídeo, PDF iframe, texto)
- Marcar aula como concluída/não concluída
- Progresso calculado automaticamente (%)

### ✅ Etapa 5 — Certificados
- Geração automática ao completar 100% do curso
- Certificado com layout profissional
- Código único de validação (ex: `HRD-ABCD-EFGH-IJ12`)
- Download/impressão via `window.print()`

### ✅ Etapa 6 — Identidade Visual
- Logo SVG inline gerado dinamicamente
- Tema dark corporativo (#0F172A, #1E293B, #3B82F6)
- Tipografia Inter
- Animações suaves (fade-in, card-hover)
- Layout responsivo (sidebar + header + main)

## Contas de Demonstração

| Perfil       | Email             | Senha      |
|--------------|-------------------|------------|
| Administrador| admin@hrd.com     | admin123   |
| Gestor RH    | rh@hrd.com        | rh123456   |
| Colaborador  | joao@hrd.com      | colab123   |

## Arquitetura

```
webapp/
├── src/
│   ├── index.tsx          # Entry point Hono — rotas, middlewares, seed, SPA
│   ├── routes/
│   │   ├── auth.ts        # Login, /me
│   │   ├── usuarios.ts    # CRUD usuários
│   │   ├── cursos.ts      # CRUD cursos + aulas + matrículas
│   │   ├── progresso.ts   # Progresso por aula/curso
│   │   ├── certificados.ts# Listar certificados
│   │   └── dashboard.ts   # Stats e resumos por perfil
│   ├── middleware/
│   │   └── auth.ts        # JWT middleware + RBAC
│   ├── utils/
│   │   ├── jwt.ts         # SignJWT / VerifyJWT (jose)
│   │   └── crypto.ts      # PBKDF2 hash (Web Crypto API)
│   └── types/
│       └── index.ts       # Interfaces TypeScript
├── public/
│   └── static/
│       ├── app.js         # SPA completo em Vanilla JS (~1700 linhas)
│       └── favicon.svg    # Logo HRD
├── migrations/
│   └── 0001_initial.sql   # Schema SQL
├── ecosystem.config.cjs   # PM2 config
├── wrangler.jsonc         # Cloudflare Workers config
├── vite.config.ts         # Build config
└── package.json
```

## Banco de Dados (Cloudflare D1 / SQLite)

| Tabela        | Campos principais                                              |
|---------------|----------------------------------------------------------------|
| `usuarios`    | id, nome, email, senha_hash, perfil, ativo, created_at        |
| `cursos`      | id, titulo, descricao, thumbnail, criado_por, ativo           |
| `aulas`       | id, curso_id, titulo, tipo, url_ou_arquivo, conteudo_texto, ordem |
| `progresso`   | id, user_id, aula_id, concluido, data                         |
| `certificados`| id, user_id, curso_id, data_emissao, codigo_validacao         |
| `matriculas`  | id, user_id, curso_id, created_at                             |

## API Endpoints

```
POST   /api/auth/login          Autenticação
GET    /api/auth/me             Perfil do usuário logado

GET    /api/usuarios            Listar usuários (ADMIN, RH)
POST   /api/usuarios            Criar usuário
PUT    /api/usuarios/:id        Editar usuário
PATCH  /api/usuarios/:id/status Ativar/Desativar

GET    /api/cursos              Listar cursos
POST   /api/cursos              Criar curso (ADMIN, RH)
PUT    /api/cursos/:id          Editar curso
POST   /api/cursos/:id/aulas    Criar aula
PUT    /api/cursos/:id/aulas/:aulaId Editar aula
DELETE /api/cursos/:id/aulas/:aulaId Excluir aula
POST   /api/cursos/:id/matriculas    Matricular colaboradores
DELETE /api/cursos/:id/matriculas/:userId Desmatricular

POST   /api/progresso/aula/:aulaId    Marcar aula concluída
GET    /api/progresso/curso/:cursoId  Progresso no curso
GET    /api/progresso/meu             Meu progresso geral

GET    /api/certificados/meus        Meus certificados
GET    /api/certificados/:id         Certificado por ID

GET    /api/dashboard/admin          Stats para ADMIN/RH
GET    /api/dashboard/colaborador    Stats para colaborador
```

## Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Build
npm run build

# Iniciar servidor local (porta 3000)
pm2 start ecosystem.config.cjs

# Ou diretamente:
npx wrangler pages dev dist --d1=webapp-production --local --ip 0.0.0.0 --port 3000
```

## Deploy Cloudflare Pages

```bash
# 1. Criar banco D1
npx wrangler d1 create webapp-production

# 2. Atualizar database_id no wrangler.jsonc

# 3. Build e deploy
npm run build
npx wrangler pages deploy dist --project-name webapp
```

## Stack Técnica

| Tecnologia         | Uso                          |
|--------------------|------------------------------|
| Hono v4            | Framework backend edge       |
| Cloudflare D1      | Banco SQLite                 |
| Cloudflare Pages   | Hosting e deploy             |
| Jose               | JWT (HS256)                  |
| Web Crypto API     | Hash de senhas (PBKDF2)      |
| Vite               | Build tool                   |
| Wrangler           | CLI Cloudflare               |
| Tailwind CSS (CDN) | Estilização                  |
| Vanilla JS         | Frontend SPA                 |

## Roadmap / Próximos Passos

- [ ] Upload real de arquivos (PDF/vídeo via R2)
- [ ] Quizzes e avaliações por módulo
- [ ] Relatórios de desempenho exportáveis
- [ ] Temas claro/escuro
- [ ] Notificações por email (SendGrid/Resend)
- [ ] Suporte a múltiplas empresas (multi-tenant)
- [ ] App mobile (PWA)

---

© 2024 HRD Consultoria — Treinamento & Desenvolvimento
