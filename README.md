# HRD Consultoria T&D

Sistema web de Treinamento e Desenvolvimento com gestão de cursos, aulas e emissão de certificados digitais.

---

## 🎓 Projeto Acadêmico

Disciplina: Projeto Integrador III-B  
Curso: Análise e Desenvolvimento de Sistemas  
Instituição: Pontifícia Universidade Católica de Goiás  

Alunos:
- Beatriz de Freitas Ribeiro Silva  
- Eduardo Sales Sousa  

Professor:
- Thalles Santos  

---

## 🔗 Links do Projeto

- 🎨 Protótipo no Figma:  
https://www.figma.com/design/ebH1eN8tvy0vQamnFNiWFh/Sistema-para-Consultoria-de-RH

- 📋 Gestão do Projeto (Trello):  
https://trello.com/invite/b/69c561eb5b6bccc4102faca5/ATTIb63f70aa3c03e37eb02902b96df156d13B6737CB/projeto-integrador-iii-b

---

## ⚡ Início Rápido

### Passo 1 — Instalar Node.js

Acesse https://nodejs.org → clique em **LTS** → instale normalmente.

> ✅ Versão mínima: Node.js 18

---

### Passo 2 — Iniciar o sistema

| Sistema | O que fazer |
|---------|-------------|
| Windows | Clique duas vezes em `start.bat` |
| Mac | `chmod +x start.sh && ./start.sh` |
| Linux | `chmod +x start.sh && ./start.sh` |

---

### Passo 3 — Acessar

Abra no navegador:

http://localhost:3000

---

### Passo 4 — Login

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Administrador | admin@hrd.com | admin123 |
| Gestor RH | rh@hrd.com | rh123456 |
| Colaborador | joao@hrd.com | colab123 |

---

## 📋 Funcionalidades

- Cadastro e autenticação de usuários  
- Gestão de cursos e aulas  
- Upload de conteúdos (PDF e vídeo)  
- Acompanhamento de progresso  
- Emissão de certificados  
- Controle de acesso por perfil  

---

## 🗂️ Estrutura do Projeto
hrd-consultoria/

├── src/

├── public/static/

├── migrations/

├── wrangler.jsonc

├── start.bat

├── start.sh

└── package.json

---

## 🛠️ Tecnologias Utilizadas

- Backend: Hono (TypeScript)  
- Frontend: JavaScript + Tailwind CSS  
- Banco de dados: SQLite (Wrangler D1)  
- Autenticação: JWT  

---

## ❓ Problemas Comuns

- Porta ocupada → trocar para 3001  
- Node não reconhecido → reinstalar e reiniciar  
- Erro → rodar:
npm install
npm run build

---

## 📌 Observações

Este projeto foi desenvolvido como parte da disciplina Projeto Integrador III-B, com foco na aplicação prática de conceitos de desenvolvimento web, organização de projetos e prototipação.

---

© 2026 HRD Consultoria. Todos os direitos reservados.
