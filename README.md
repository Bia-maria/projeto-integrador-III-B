<<<<<<< HEAD
# HRD Consultoria T&D

Sistema web de Treinamento e Desenvolvimento com gestão de cursos, aulas e emissão de certificados digitais.

---

## ⚡ Início Rápido

### Passo 1 — Instalar Node.js (só na primeira vez)

Acesse **https://nodejs.org** → clique no botão verde **"LTS"** → instale normalmente.

> ✅ Versão mínima: Node.js 18

### Passo 2 — Iniciar o sistema

| Sistema | O que fazer |
|---------|-------------|
| **Windows** | Clique duas vezes em `start.bat` |
| **Mac** | Terminal na pasta → `chmod +x start.sh && ./start.sh` |
| **Linux** | Terminal na pasta → `chmod +x start.sh && ./start.sh` |

O script vai:
1. Instalar dependências automaticamente (só na 1ª vez, ~1-2 min)
2. Compilar o projeto
3. Iniciar o servidor
4. **Abrir o navegador automaticamente** em `http://localhost:3000`

### Passo 3 — Fazer login

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Administrador | admin@hrd.com | admin123 |
| Gestor RH | rh@hrd.com | rh123456 |
| Colaborador | joao@hrd.com | colab123 |

---

## ❓ Resolução de Problemas

### "O navegador não abriu"
Abra manualmente: **http://localhost:3000**

### "node não é reconhecido" (Windows)
Instale o Node.js em https://nodejs.org, **reinicie o computador** e tente novamente.

### "Erro de compilação"
Execute no terminal dentro da pasta:
```
npm install
npm run build
```

### "Porta 3000 já está em uso"
Feche outros programas que usam a porta 3000 ou altere a porta em `start.bat`/`start.sh` de `--port 3000` para `--port 3001` e acesse `http://localhost:3001`.

### O servidor demora para iniciar?
Normal! O wrangler leva **10-15 segundos** na primeira inicialização. O script aguarda automaticamente.

---

## 🔧 Comando manual (alternativa aos scripts)

Abra o terminal na pasta do projeto e execute:

```bash
npm install
npm run build
npx wrangler pages dev dist --d1=webapp-production --local --ip 0.0.0.0 --port 3000
```

Aguarde a mensagem `Ready on http://0.0.0.0:3000` e acesse http://localhost:3000

---

## 📋 Funcionalidades

| Perfil | O que pode fazer |
|--------|-----------------|
| **ADMIN** | Gerenciar todos os usuários, cursos e visualizar certificados |
| **Gestor RH** | Criar/editar cursos, fazer upload de PDFs e vídeos, matricular colaboradores |
| **Colaborador** | Assistir aulas, marcar progresso, baixar certificados |

### Tipos de conteúdo nas aulas
- 🔴 **YouTube** — cola o link do vídeo
- 🎥 **Vídeo (URL)** — link direto MP4/WebM
- 📄 **PDF (URL)** — link direto para PDF online  
- 📤 **PDF Upload** — envia arquivo PDF (até 50 MB)
- 📤 **Vídeo Upload** — envia arquivo de vídeo (até 50 MB)
- 📝 **Texto** — conteúdo em texto livre

---

## 🗂️ Estrutura do Projeto

```
hrd-consultoria/
├── src/              ← Código backend (TypeScript + Hono)
├── public/static/    ← Frontend (HTML/CSS/JS)
│   └── app.js        ← Aplicação completa (SPA)
├── migrations/       ← Estrutura do banco de dados
├── wrangler.jsonc    ← Configurações do servidor local
├── start.bat         ← Iniciar no Windows  ⬅ use este
├── start.sh          ← Iniciar no Mac/Linux ⬅ use este
└── package.json      ← Dependências do projeto
```

> **Dados salvos em:** `.wrangler/state/v3/d1/` (criado automaticamente)  
> Os dados **não somem** ao fechar o servidor.

---

## 🛠️ Tecnologias

- **Backend:** Hono (TypeScript) rodando via Cloudflare Wrangler
- **Frontend:** JavaScript + Tailwind CSS (CDN)
- **Banco de dados:** SQLite local (via Wrangler D1)
- **Auth:** JWT + PBKDF2

---

© 2026 HRD Consultoria. Todos os direitos reservados.

# projeto-integrador-III-B
