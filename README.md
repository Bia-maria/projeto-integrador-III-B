# HRD Consultoria T&D — Sistema de Treinamento e Certificados

Plataforma web completa para gestão de treinamentos, cursos e emissão de certificados digitais.

---

## 🚀 Como Rodar Localmente

### Pré-requisito: instalar o Node.js

Acesse **https://nodejs.org** e baixe a versão **LTS (18 ou superior)**.  
Instale normalmente (avance em todas as telas).

---

### ▶️ Windows

1. Descompacte a pasta do projeto
2. Dê **dois cliques** no arquivo `start.bat`
3. Aguarde a mensagem `Sistema rodando em: http://localhost:3000`
4. Abra o navegador em **http://localhost:3000**

---

### ▶️ Mac / Linux

1. Descompacte a pasta do projeto
2. Abra o **Terminal** dentro da pasta do projeto
3. Execute:
   ```bash
   chmod +x start.sh
   ./start.sh
   ```
4. Abra o navegador em **http://localhost:3000**

---

### ▶️ Método manual (qualquer sistema)

Abra o terminal/prompt na pasta do projeto e execute:

```bash
npm install
npm run build
npx wrangler pages dev dist --d1=webapp-production --local --ip 0.0.0.0 --port 3000
```

---

## 🔑 Contas de Acesso

| Perfil       | E-mail             | Senha      |
|--------------|--------------------|------------|
| ADMIN        | admin@hrd.com      | admin123   |
| Gestor RH    | rh@hrd.com         | rh123456   |
| Colaborador  | joao@hrd.com       | colab123   |

---

## 📋 Funcionalidades

| Etapa | Recurso                        | Perfis          |
|-------|--------------------------------|-----------------|
| 1     | Login com JWT + RBAC           | Todos           |
| 2     | CRUD de Usuários               | ADMIN, RH       |
| 3     | Gestão de Cursos e Aulas       | RH, ADMIN       |
| 4     | Upload de PDF e Vídeo          | RH, ADMIN       |
| 5     | Área do Colaborador            | COLABORADOR     |
| 6     | Certificados automáticos A4    | Todos           |

### Tipos de conteúdo suportados nas aulas
- 🔴 **YouTube** — cole o link do vídeo
- 🎥 **Vídeo URL** — link direto para MP4/WebM
- 📄 **PDF URL** — link direto para PDF online
- 📤 **PDF Upload** — envie um arquivo PDF (até 50 MB)
- 📤 **Vídeo Upload** — envie um arquivo de vídeo (até 50 MB)
- 📝 **Texto** — conteúdo em texto livre

---

## 🗂️ Estrutura do Projeto

```
hrd-consultoria/
├── src/                  ← Código backend (Hono / TypeScript)
│   ├── index.tsx         ← Ponto de entrada + criação do banco
│   ├── routes/           ← Rotas da API
│   └── utils/            ← JWT, criptografia
├── public/static/        ← Frontend (HTML/CSS/JS)
│   └── app.js            ← SPA completo
├── dist/                 ← Build gerado (não editar)
├── wrangler.jsonc        ← Configuração Cloudflare/Wrangler
├── seed_export.sql       ← Backup do banco de dados
├── start.bat             ← Iniciar no Windows
├── start.sh              ← Iniciar no Mac/Linux
└── package.json
```

---

## 🔧 Tecnologias

- **Backend:** [Hono](https://hono.dev) + TypeScript rodando em Cloudflare Workers
- **Frontend:** HTML + JavaScript + [Tailwind CSS](https://tailwindcss.com)
- **Banco de dados:** SQLite local via [Cloudflare D1](https://developers.cloudflare.com/d1/) (wrangler)
- **Autenticação:** JWT (jose) + PBKDF2 hash de senha
- **Runtime local:** [Wrangler](https://developers.cloudflare.com/workers/wrangler/) (incluído no projeto)

---

## ❓ Perguntas Frequentes

**O sistema fica lento na primeira vez?**  
Sim, o `npm install` baixa as dependências (~100 MB). Nas próximas vezes é instantâneo.

**Preciso instalar mais alguma coisa além do Node.js?**  
Não. O Wrangler (servidor local) já vem incluído nas dependências do projeto.

**O banco de dados some quando fecho o servidor?**  
Não. Os dados ficam salvos em `.wrangler/state/v3/d1/` dentro da pasta do projeto.

**Posso usar em rede local (outros computadores)?**  
Sim. O servidor já está configurado para aceitar conexões externas (`--ip 0.0.0.0`).  
Acesse pelo IP da máquina: `http://SEU-IP:3000`

---

## 📞 Suporte

Sistema desenvolvido para **HRD Consultoria T&D**.  
© 2026 HRD Consultoria. Todos os direitos reservados.
