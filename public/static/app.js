// ===========================
// HRD - Sistema de T&D
// Frontend SPA - app.js
// ===========================

const API = '/api';
let currentUser = null;
let authToken = null;

// ===== UTILS =====
function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }
function html(strings, ...vals) { return strings.reduce((r, s, i) => r + s + (vals[i] ?? ''), ''); }

function notify(msg, type = 'success') {
  const container = document.getElementById('notification-container');
  const el = document.createElement('div');
  const colors = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-blue-600', warning: 'bg-amber-600' };
  const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle', warning: 'fa-triangle-exclamation' };
  el.className = `show flex items-center gap-3 px-4 py-3 rounded-lg text-white text-sm font-medium shadow-xl mb-2 ${colors[type]}`;
  el.innerHTML = `<i class="fas ${icons[type]}"></i><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300); }, 4000);
}

async function request(url, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  try {
    const res = await fetch(API + url, { ...opts, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
    return data;
  } catch (e) {
    if (e.message.includes('401')) { logout(); }
    throw e;
  }
}

function saveSession(token, user) {
  authToken = token;
  currentUser = user;
  localStorage.setItem('hrd_token', token);
  localStorage.setItem('hrd_user', JSON.stringify(user));
}

function loadSession() {
  authToken = localStorage.getItem('hrd_token');
  const u = localStorage.getItem('hrd_user');
  if (u) currentUser = JSON.parse(u);
  return !!(authToken && currentUser);
}

function logout() {
  authToken = null; currentUser = null;
  localStorage.removeItem('hrd_token');
  localStorage.removeItem('hrd_user');
  renderLogin();
}

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(d) {
  if (!d) return '-';
  return new Date(d).toLocaleString('pt-BR');
}

function perfilBadge(perfil) {
  const colors = { ADMIN: 'bg-purple-900/40 text-purple-300 border border-purple-700/50', RH: 'bg-blue-900/40 text-blue-300 border border-blue-700/50', COLABORADOR: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50' };
  const labels = { ADMIN: 'Admin', RH: 'Gestor RH', COLABORADOR: 'Colaborador' };
  return `<span class="px-2 py-0.5 rounded-full text-xs font-medium ${colors[perfil]}">${labels[perfil]}</span>`;
}

function progressBar(pct, colored = true) {
  const color = pct === 100 ? 'bg-emerald-500' : 'bg-blue-500';
  return `<div class="w-full bg-slate-700 rounded-full h-1.5"><div class="progress-bar ${colored ? color : 'bg-blue-500'} h-1.5 rounded-full" style="width:${pct}%"></div></div>`;
}

// ===== LOGO SVG =====
function logoSVG(size = 32) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="10" fill="url(#grad)"/>
    <defs><linearGradient id="grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
      <stop stop-color="#3B82F6"/><stop offset="1" stop-color="#1D4ED8"/>
    </linearGradient></defs>
    <path d="M8 12h5v16H8V12zm5 7h8c2 0 3-1 3-2.5S23 14 21 14h-8v5zm8 1H13v7h8c2.5 0 4-1.2 4-3.5S23.5 20 21 20z" fill="white" opacity="0.9"/>
    <circle cx="29" cy="14" r="3" fill="white" opacity="0.7"/>
    <path d="M26 19h6v9h-2v-7h-4v-2z" fill="white" opacity="0.7"/>
  </svg>`;
}

// ===== LAYOUT PRINCIPAL =====
function renderApp() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="flex h-screen overflow-hidden">
      <!-- Sidebar -->
      <aside id="sidebar" class="w-64 bg-primary-light flex flex-col border-r border-slate-700/50 flex-shrink-0">
        <!-- Logo -->
        <div class="h-16 flex items-center gap-3 px-5 border-b border-slate-700/50">
          ${logoSVG(36)}
          <div>
            <div class="font-bold text-white text-base leading-tight">HRD</div>
            <div class="text-xs text-slate-400 leading-tight">Consultoria T&D</div>
          </div>
        </div>
        <!-- User Info -->
        <div class="px-4 py-4 border-b border-slate-700/30">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              ${currentUser.nome.charAt(0).toUpperCase()}
            </div>
            <div class="min-w-0">
              <div class="text-sm font-medium text-white truncate">${currentUser.nome}</div>
              <div class="text-xs text-slate-400">${currentUser.perfil}</div>
            </div>
          </div>
        </div>
        <!-- Nav -->
        <nav class="flex-1 py-3 px-2 overflow-y-auto" id="sidebar-nav"></nav>
        <!-- Logout -->
        <div class="p-3 border-t border-slate-700/30">
          <button onclick="logout()" class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-900/20 text-sm transition-colors">
            <i class="fas fa-sign-out-alt w-5 text-center"></i>
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>
      <!-- Main Content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Header -->
        <header class="h-16 bg-primary-light border-b border-slate-700/50 flex items-center justify-between px-6 flex-shrink-0">
          <div>
            <h1 id="page-title" class="text-base font-semibold text-white">Dashboard</h1>
            <p id="page-subtitle" class="text-xs text-slate-400"></p>
          </div>
          <div class="flex items-center gap-3">
            <div class="text-xs text-slate-500">${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</div>
          </div>
        </header>
        <!-- Page Content -->
        <main id="page-content" class="flex-1 overflow-y-auto p-6 bg-surface/5 fade-in"></main>
      </div>
    </div>
  `;
  
  renderSidebar();
  navigateTo('dashboard');
}

function renderSidebar() {
  const nav = document.getElementById('sidebar-nav');
  const p = currentUser.perfil;
  
  const items = [
    { id: 'dashboard', icon: 'fa-gauge-high', label: 'Dashboard', roles: ['ADMIN','RH','COLABORADOR'] },
    { id: 'usuarios', icon: 'fa-users', label: 'Usuários', roles: ['ADMIN','RH'] },
    { id: 'cursos', icon: 'fa-graduation-cap', label: 'Cursos', roles: ['ADMIN','RH'] },
    { id: 'meus-cursos', icon: 'fa-book-open', label: 'Meus Cursos', roles: ['COLABORADOR'] },
    { id: 'certificados', icon: 'fa-certificate', label: 'Certificados', roles: ['ADMIN','RH','COLABORADOR'] },
  ];
  
  nav.innerHTML = items
    .filter(i => i.roles.includes(p))
    .map(i => `
      <button onclick="navigateTo('${i.id}')" data-page="${i.id}"
        class="sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white text-sm transition-all mb-0.5">
        <i class="fas ${i.icon} w-5 text-center opacity-80"></i>
        <span>${i.label}</span>
      </button>
    `).join('');
}

function navigateTo(page) {
  $$('[data-page]').forEach(el => el.classList.remove('active'));
  const btn = $(`[data-page="${page}"]`);
  if (btn) btn.classList.add('active');
  
  const pages = {
    dashboard: renderDashboard,
    usuarios: renderUsuarios,
    cursos: renderCursos,
    'meus-cursos': renderMeusCursos,
    certificados: renderCertificados,
  };
  
  const fn = pages[page];
  if (fn) fn();
}

function setPageTitle(title, subtitle = '') {
  const t = document.getElementById('page-title');
  const s = document.getElementById('page-subtitle');
  if (t) t.textContent = title;
  if (s) s.textContent = subtitle;
}

// ===== LOGIN =====
function renderLogin() {
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen bg-primary flex items-center justify-center p-4">
      <div class="w-full max-w-sm">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style="background:linear-gradient(135deg,#3B82F6,#1D4ED8)">
            ${logoSVG(40)}
          </div>
          <h1 class="text-2xl font-bold text-white">HRD Consultoria</h1>
          <p class="text-slate-400 text-sm mt-1">Treinamento & Desenvolvimento</p>
        </div>
        
        <!-- Card -->
        <div class="bg-primary-light rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
          <h2 class="text-lg font-semibold text-white mb-6">Entrar no sistema</h2>
          
          <form id="login-form" class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Email</label>
              <input type="email" id="login-email" placeholder="seu@email.com" value="admin@hrd.com"
                class="w-full bg-slate-800/80 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Senha</label>
              <div class="relative">
                <input type="password" id="login-senha" placeholder="••••••••" value="admin123"
                  class="w-full bg-slate-800/80 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition pr-10" />
                <button type="button" onclick="togglePass()" class="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300">
                  <i class="fas fa-eye text-sm" id="pass-icon"></i>
                </button>
              </div>
            </div>
            
            <button type="submit" id="login-btn"
              class="btn-primary w-full py-2.5 rounded-lg text-white font-semibold text-sm mt-2 flex items-center justify-center gap-2">
              <i class="fas fa-sign-in-alt"></i> Entrar
            </button>
          </form>
          
          <div class="mt-6 pt-5 border-t border-slate-700/50">
            <p class="text-xs text-slate-500 text-center mb-3">Contas de demonstração</p>
            <div class="grid grid-cols-3 gap-2">
              ${[['admin@hrd.com','admin123','Admin'],['rh@hrd.com','rh123456','Gestor RH'],['joao@hrd.com','colab123','Colaborador']].map(([e,s,l]) => `
                <button onclick="fillLogin('${e}','${s}')" class="bg-slate-800 hover:bg-slate-700 rounded-lg px-2 py-2 text-xs text-slate-400 hover:text-white transition text-center">
                  <div class="font-medium">${l}</div>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
        <p class="text-center text-xs text-slate-600 mt-4">© 2024 HRD Consultoria. Todos os direitos reservados.</p>
      </div>
    </div>
  `;
  
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
    
    try {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: document.getElementById('login-email').value,
          senha: document.getElementById('login-senha').value
        })
      });
      saveSession(data.token, data.user);
      renderApp();
    } catch (e) {
      notify(e.message, 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
    }
  });
}

window.fillLogin = (e, s) => {
  document.getElementById('login-email').value = e;
  document.getElementById('login-senha').value = s;
};

window.togglePass = () => {
  const input = document.getElementById('login-senha');
  const icon = document.getElementById('pass-icon');
  if (input.type === 'password') { input.type = 'text'; icon.className = 'fas fa-eye-slash text-sm'; }
  else { input.type = 'password'; icon.className = 'fas fa-eye text-sm'; }
};

// ===== DASHBOARD =====
async function renderDashboard() {
  setPageTitle('Dashboard', `Bem-vindo, ${currentUser.nome}`);
  const content = document.getElementById('page-content');
  content.innerHTML = '<div class="flex items-center justify-center h-32"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>';
  
  try {
    if (currentUser.perfil === 'COLABORADOR') {
      const data = await request('/dashboard/colaborador');
      renderDashboardColaborador(data);
    } else {
      const data = await request('/dashboard/admin');
      renderDashboardAdmin(data);
    }
  } catch (e) {
    notify(e.message, 'error');
  }
}

function renderDashboardAdmin(data) {
  const content = document.getElementById('page-content');
  const { stats, usuariosPorPerfil, cursosRecentes, certificadosRecentes } = data;
  
  const perfilMap = {};
  (usuariosPorPerfil || []).forEach(p => perfilMap[p.perfil] = p.total);
  
  content.innerHTML = `
    <div class="space-y-6 fade-in">
      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${[
          { icon: 'fa-users', label: 'Usuários Ativos', val: stats.totalUsuarios, color: 'blue', sub: 'cadastrados' },
          { icon: 'fa-graduation-cap', label: 'Cursos Ativos', val: stats.totalCursos, color: 'purple', sub: 'disponíveis' },
          { icon: 'fa-certificate', label: 'Certificados', val: stats.totalCertificados, color: 'emerald', sub: 'emitidos' },
        ].map(s => `
          <div class="bg-primary-light rounded-xl p-5 border border-slate-700/50 stat-card">
            <div class="flex items-center justify-between mb-3">
              <div class="w-10 h-10 rounded-lg bg-${s.color}-500/20 flex items-center justify-center">
                <i class="fas ${s.icon} text-${s.color}-400"></i>
              </div>
              <span class="text-3xl font-bold text-white">${s.val}</span>
            </div>
            <div class="text-sm font-medium text-slate-300">${s.label}</div>
            <div class="text-xs text-slate-500">${s.sub}</div>
          </div>
        `).join('')}
      </div>
      
      <!-- Perfis -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-primary-light rounded-xl p-5 border border-slate-700/50">
          <h3 class="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <i class="fas fa-chart-pie text-blue-400"></i> Distribuição por Perfil
          </h3>
          <div class="space-y-3">
            ${[['ADMIN','purple','Admin'],['RH','blue','Gestores de RH'],['COLABORADOR','emerald','Colaboradores']].map(([k,c,l]) => `
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-${c}-400"></div>
                  <span class="text-sm text-slate-400">${l}</span>
                </div>
                <span class="text-sm font-semibold text-white">${perfilMap[k] || 0}</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="bg-primary-light rounded-xl p-5 border border-slate-700/50">
          <h3 class="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <i class="fas fa-certificate text-emerald-400"></i> Certificados Recentes
          </h3>
          ${certificadosRecentes && certificadosRecentes.length > 0 ? `
            <div class="space-y-2">
              ${certificadosRecentes.map(c => `
                <div class="flex items-center gap-3 py-1.5 border-b border-slate-700/30 last:border-0">
                  <div class="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-certificate text-emerald-400 text-xs"></i>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="text-xs font-medium text-white truncate">${c.usuario_nome}</div>
                    <div class="text-xs text-slate-500 truncate">${c.curso_titulo}</div>
                  </div>
                  <div class="text-xs text-slate-500 flex-shrink-0">${formatDate(c.data_emissao)}</div>
                </div>
              `).join('')}
            </div>
          ` : '<p class="text-slate-500 text-sm">Nenhum certificado emitido ainda.</p>'}
        </div>
      </div>
      
      <!-- Cursos Recentes -->
      <div class="bg-primary-light rounded-xl p-5 border border-slate-700/50">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <i class="fas fa-graduation-cap text-purple-400"></i> Cursos Recentes
          </h3>
          <button onclick="navigateTo('cursos')" class="text-xs text-blue-400 hover:text-blue-300">Ver todos →</button>
        </div>
        ${cursosRecentes && cursosRecentes.length > 0 ? `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            ${cursosRecentes.map(c => `
              <div class="bg-slate-800/60 rounded-lg p-4 border border-slate-700/30">
                <div class="font-medium text-white text-sm truncate mb-1">${c.titulo}</div>
                <div class="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  <span><i class="fas fa-book mr-1"></i>${c.total_aulas} aulas</span>
                  <span><i class="fas fa-users mr-1"></i>${c.matriculados} alunos</span>
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<p class="text-slate-500 text-sm">Nenhum curso cadastrado.</p>'}
      </div>
    </div>
  `;
}

function renderDashboardColaborador(data) {
  const content = document.getElementById('page-content');
  const { stats, cursosRecentes } = data;
  
  content.innerHTML = `
    <div class="space-y-6 fade-in">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        ${[
          { icon: 'fa-book', label: 'Matriculado em', val: stats.cursosMatriculados, color: 'blue', sub: 'cursos' },
          { icon: 'fa-spinner', label: 'Em Andamento', val: stats.cursosEmAndamento, color: 'amber', sub: 'cursos' },
          { icon: 'fa-check-circle', label: 'Concluídos', val: stats.cursosConcluidos, color: 'emerald', sub: 'cursos' },
          { icon: 'fa-certificate', label: 'Certificados', val: stats.certificadosEmitidos, color: 'purple', sub: 'emitidos' },
        ].map(s => `
          <div class="bg-primary-light rounded-xl p-4 border border-slate-700/50 stat-card">
            <div class="flex items-center justify-between mb-2">
              <div class="w-8 h-8 rounded-lg bg-${s.color}-500/20 flex items-center justify-center">
                <i class="fas ${s.icon} text-${s.color}-400 text-sm"></i>
              </div>
              <span class="text-2xl font-bold text-white">${s.val}</span>
            </div>
            <div class="text-xs font-medium text-slate-400">${s.label} <span class="text-slate-500">${s.sub}</span></div>
          </div>
        `).join('')}
      </div>
      
      <div class="bg-primary-light rounded-xl p-5 border border-slate-700/50">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <i class="fas fa-book-open text-blue-400"></i> Meus Cursos
          </h3>
          <button onclick="navigateTo('meus-cursos')" class="text-xs text-blue-400 hover:text-blue-300">Ver todos →</button>
        </div>
        ${cursosRecentes && cursosRecentes.length > 0 ? `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${cursosRecentes.map(c => `
              <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700/30 card-hover cursor-pointer" onclick="abrirCurso('${c.id}')">
                <div class="flex items-start justify-between mb-3">
                  <div class="w-10 h-10 rounded-lg ${c.concluido ? 'bg-emerald-500/20' : 'bg-blue-500/20'} flex items-center justify-center">
                    <i class="fas ${c.concluido ? 'fa-check-circle text-emerald-400' : 'fa-book text-blue-400'}"></i>
                  </div>
                  <span class="text-xs ${c.concluido ? 'text-emerald-400' : c.percentual > 0 ? 'text-amber-400' : 'text-slate-500'}">${c.percentual}%</span>
                </div>
                <div class="font-medium text-white text-sm mb-2 line-clamp-2">${c.titulo}</div>
                <div class="space-y-1">
                  ${progressBar(c.percentual)}
                  <div class="text-xs text-slate-500">${c.concluidas}/${c.total_aulas} aulas</div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="text-center py-10">
            <i class="fas fa-book-open text-4xl text-slate-700 mb-3"></i>
            <p class="text-slate-400">Você ainda não está matriculado em nenhum curso.</p>
          </div>
        `}
      </div>
    </div>
  `;
}

// ===== USUÁRIOS =====
let usuariosState = { page: 1, busca: '', perfil: '', total: 0 };

async function renderUsuarios() {
  setPageTitle('Usuários', 'Gerenciar usuários do sistema');
  const content = document.getElementById('page-content');
  
  content.innerHTML = `
    <div class="space-y-4 fade-in">
      <!-- Toolbar -->
      <div class="flex flex-wrap gap-3 items-center justify-between">
        <div class="flex gap-2 flex-wrap">
          <div class="relative">
            <i class="fas fa-search absolute left-3 top-2.5 text-slate-500 text-sm"></i>
            <input type="text" id="busca-usuario" placeholder="Buscar nome ou email..."
              class="bg-primary-light border border-slate-600 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-56"
              value="${usuariosState.busca}" oninput="filtrarUsuarios()" />
          </div>
          <select id="filtro-perfil" onchange="filtrarUsuarios()"
            class="bg-primary-light border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
            <option value="">Todos os perfis</option>
            <option value="ADMIN" ${usuariosState.perfil==='ADMIN'?'selected':''}>Admin</option>
            <option value="RH" ${usuariosState.perfil==='RH'?'selected':''}>Gestor RH</option>
            <option value="COLABORADOR" ${usuariosState.perfil==='COLABORADOR'?'selected':''}>Colaborador</option>
          </select>
        </div>
        <button onclick="openModalUsuario()" class="btn-primary px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2">
          <i class="fas fa-plus"></i> Novo Usuário
        </button>
      </div>
      
      <!-- Tabela -->
      <div class="bg-primary-light rounded-xl border border-slate-700/50 overflow-hidden">
        <div id="tabela-usuarios">
          <div class="flex items-center justify-center h-32"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>
        </div>
      </div>
    </div>
    ${modalUsuarioHTML()}
  `;
  
  await carregarUsuarios();
}

let buscaTimeout = null;
window.filtrarUsuarios = () => {
  usuariosState.busca = document.getElementById('busca-usuario')?.value || '';
  usuariosState.perfil = document.getElementById('filtro-perfil')?.value || '';
  usuariosState.page = 1;
  clearTimeout(buscaTimeout);
  buscaTimeout = setTimeout(carregarUsuarios, 300);
};

async function carregarUsuarios() {
  const params = new URLSearchParams({ page: usuariosState.page, limit: 10 });
  if (usuariosState.busca) params.set('busca', usuariosState.busca);
  if (usuariosState.perfil) params.set('perfil', usuariosState.perfil);
  
  try {
    const data = await request(`/usuarios?${params}`);
    usuariosState.total = data.total;
    renderTabelaUsuarios(data);
  } catch (e) {
    notify(e.message, 'error');
  }
}

function renderTabelaUsuarios({ usuarios, total, page, totalPages }) {
  const tabela = document.getElementById('tabela-usuarios');
  if (!tabela) return;
  
  if (usuarios.length === 0) {
    tabela.innerHTML = `
      <div class="text-center py-12 text-slate-500">
        <i class="fas fa-users text-3xl mb-3"></i>
        <p>Nenhum usuário encontrado</p>
      </div>`;
    return;
  }
  
  tabela.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-slate-700/50">
            <th class="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Nome</th>
            <th class="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Email</th>
            <th class="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Perfil</th>
            <th class="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Status</th>
            <th class="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Criado em</th>
            <th class="text-right px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${usuarios.map(u => `
            <tr class="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors">
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    ${u.nome.charAt(0).toUpperCase()}
                  </div>
                  <span class="text-sm font-medium text-white">${u.nome}</span>
                </div>
              </td>
              <td class="px-5 py-3.5 text-sm text-slate-400">${u.email}</td>
              <td class="px-5 py-3.5">${perfilBadge(u.perfil)}</td>
              <td class="px-5 py-3.5">
                <span class="px-2 py-0.5 rounded-full text-xs font-medium ${u.ativo ? 'bg-emerald-900/40 text-emerald-300' : 'bg-red-900/40 text-red-300'}">
                  ${u.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td class="px-5 py-3.5 text-sm text-slate-500">${formatDate(u.created_at)}</td>
              <td class="px-5 py-3.5 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button onclick="editarUsuario('${u.id}')" title="Editar"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 transition-colors">
                    <i class="fas fa-edit text-sm"></i>
                  </button>
                  ${u.id !== currentUser.id ? `
                    <button onclick="toggleAtivoUsuario('${u.id}', ${u.ativo})" title="${u.ativo ? 'Desativar' : 'Ativar'}"
                      class="p-1.5 rounded-lg text-slate-400 hover:text-${u.ativo ? 'red' : 'emerald'}-400 hover:bg-${u.ativo ? 'red' : 'emerald'}-900/20 transition-colors">
                      <i class="fas fa-${u.ativo ? 'ban' : 'check'} text-sm"></i>
                    </button>
                  ` : ''}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <!-- Paginação -->
    <div class="flex items-center justify-between px-5 py-3 border-t border-slate-700/30">
      <span class="text-xs text-slate-500">${total} usuário${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}</span>
      <div class="flex gap-1">
        <button onclick="mudarPaginaUsuario(${page - 1})" ${page <= 1 ? 'disabled' : ''}
          class="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition">
          ← Anterior
        </button>
        <span class="px-3 py-1.5 text-xs text-slate-400">Pág. ${page}/${totalPages || 1}</span>
        <button onclick="mudarPaginaUsuario(${page + 1})" ${page >= totalPages ? 'disabled' : ''}
          class="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition">
          Próxima →
        </button>
      </div>
    </div>
  `;
}

window.mudarPaginaUsuario = (p) => { usuariosState.page = p; carregarUsuarios(); };

window.toggleAtivoUsuario = async (id, ativo) => {
  if (!confirm(`Deseja ${ativo ? 'desativar' : 'ativar'} este usuário?`)) return;
  try {
    await request(`/usuarios/${id}/status`, { method: 'PATCH', body: JSON.stringify({ ativo: !ativo }) });
    notify(ativo ? 'Usuário desativado' : 'Usuário ativado');
    carregarUsuarios();
  } catch (e) { notify(e.message, 'error'); }
};

function modalUsuarioHTML() {
  return `
    <div id="modal-usuario" class="hidden fixed inset-0 z-50 flex items-center justify-center modal-overlay bg-black/60">
      <div class="bg-primary-light rounded-2xl border border-slate-700/50 w-full max-w-md mx-4 shadow-2xl">
        <div class="flex items-center justify-between p-5 border-b border-slate-700/30">
          <h3 id="modal-titulo" class="font-semibold text-white">Novo Usuário</h3>
          <button onclick="fecharModalUsuario()" class="text-slate-400 hover:text-white"><i class="fas fa-times"></i></button>
        </div>
        <form id="form-usuario" class="p-5 space-y-4">
          <input type="hidden" id="usuario-id" />
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Nome completo</label>
            <input type="text" id="usuario-nome" placeholder="Nome do usuário"
              class="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" required />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Email</label>
            <input type="email" id="usuario-email" placeholder="email@empresa.com"
              class="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" required />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Senha</label>
            <input type="password" id="usuario-senha" placeholder="Mínimo 6 caracteres"
              class="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
            <p class="text-xs text-slate-500 mt-1">Deixe em branco para manter a senha atual (ao editar)</p>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Perfil</label>
            <select id="usuario-perfil"
              class="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" required>
              ${currentUser.perfil === 'ADMIN' ? '<option value="ADMIN">Administrador</option><option value="RH">Gestor de RH</option>' : ''}
              <option value="COLABORADOR">Colaborador</option>
            </select>
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" onclick="fecharModalUsuario()" 
              class="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-400 hover:text-white text-sm transition">
              Cancelar
            </button>
            <button type="submit" 
              class="btn-primary flex-1 py-2.5 rounded-lg text-white font-medium text-sm flex items-center justify-center gap-2">
              <i class="fas fa-save"></i> Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

window.openModalUsuario = () => {
  document.getElementById('modal-titulo').textContent = 'Novo Usuário';
  document.getElementById('usuario-id').value = '';
  document.getElementById('form-usuario').reset();
  document.getElementById('usuario-senha').required = true;
  document.getElementById('modal-usuario').classList.remove('hidden');
  
  document.getElementById('form-usuario').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('usuario-id').value;
    const body = {
      nome: document.getElementById('usuario-nome').value,
      email: document.getElementById('usuario-email').value,
      senha: document.getElementById('usuario-senha').value,
      perfil: document.getElementById('usuario-perfil').value
    };
    if (!body.senha) delete body.senha;
    
    try {
      if (id) await request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      else await request('/usuarios', { method: 'POST', body: JSON.stringify(body) });
      notify(id ? 'Usuário atualizado!' : 'Usuário criado!');
      fecharModalUsuario();
      carregarUsuarios();
    } catch (e) { notify(e.message, 'error'); }
  };
};

window.editarUsuario = async (id) => {
  try {
    const data = await request(`/usuarios/${id}`);
    const u = data.usuario;
    document.getElementById('modal-titulo').textContent = 'Editar Usuário';
    document.getElementById('usuario-id').value = u.id;
    document.getElementById('usuario-nome').value = u.nome;
    document.getElementById('usuario-email').value = u.email;
    document.getElementById('usuario-senha').value = '';
    document.getElementById('usuario-senha').required = false;
    document.getElementById('usuario-perfil').value = u.perfil;
    document.getElementById('modal-usuario').classList.remove('hidden');
  } catch (e) { notify(e.message, 'error'); }
};

window.fecharModalUsuario = () => {
  document.getElementById('modal-usuario').classList.add('hidden');
};

// ===== CURSOS =====
let cursosState = { page: 1, busca: '', ativo: '' };

async function renderCursos() {
  setPageTitle('Cursos', 'Gerenciar cursos de treinamento');
  const content = document.getElementById('page-content');
  
  content.innerHTML = `
    <div class="space-y-4 fade-in">
      <div class="flex flex-wrap gap-3 items-center justify-between">
        <div class="flex gap-2">
          <div class="relative">
            <i class="fas fa-search absolute left-3 top-2.5 text-slate-500 text-sm"></i>
            <input type="text" id="busca-curso" placeholder="Buscar curso..."
              class="bg-primary-light border border-slate-600 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-56"
              oninput="filtrarCursos()" />
          </div>
          <select id="filtro-ativo" onchange="filtrarCursos()"
            class="bg-primary-light border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
            <option value="">Todos</option>
            <option value="1">Ativos</option>
            <option value="0">Inativos</option>
          </select>
        </div>
        <button onclick="openModalCurso()" class="btn-primary px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2">
          <i class="fas fa-plus"></i> Novo Curso
        </button>
      </div>
      
      <div id="grid-cursos">
        <div class="flex items-center justify-center h-32"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>
      </div>
    </div>
    ${modalCursoHTML()}
    ${modalAulaHTML()}
    ${modalMatriculaHTML()}
  `;
  
  await carregarCursos();
}

window.filtrarCursos = () => {
  cursosState.busca = document.getElementById('busca-curso')?.value || '';
  cursosState.ativo = document.getElementById('filtro-ativo')?.value || '';
  cursosState.page = 1;
  clearTimeout(buscaTimeout);
  buscaTimeout = setTimeout(carregarCursos, 300);
};

async function carregarCursos() {
  const params = new URLSearchParams({ page: cursosState.page, limit: 12 });
  if (cursosState.busca) params.set('busca', cursosState.busca);
  if (cursosState.ativo !== '') params.set('ativo', cursosState.ativo);
  
  try {
    const data = await request(`/cursos?${params}`);
    renderGridCursos(data);
  } catch (e) { notify(e.message, 'error'); }
}

function renderGridCursos({ cursos, total, page, totalPages }) {
  const grid = document.getElementById('grid-cursos');
  if (!grid) return;
  
  if (cursos.length === 0) {
    grid.innerHTML = `
      <div class="text-center py-16 text-slate-500 bg-primary-light rounded-xl border border-slate-700/50">
        <i class="fas fa-graduation-cap text-5xl mb-4 opacity-30"></i>
        <p class="text-lg">Nenhum curso encontrado</p>
        <button onclick="openModalCurso()" class="mt-4 text-blue-400 hover:text-blue-300 text-sm">
          + Criar primeiro curso
        </button>
      </div>`;
    return;
  }
  
  grid.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      ${cursos.map(c => `
        <div class="bg-primary-light rounded-xl border border-slate-700/50 overflow-hidden card-hover">
          <div class="h-2 ${c.ativo ? 'bg-gradient-to-r from-blue-500 to-blue-700' : 'bg-slate-600'}"></div>
          <div class="p-5">
            <div class="flex items-start justify-between gap-2 mb-3">
              <div class="w-10 h-10 rounded-lg ${c.ativo ? 'bg-blue-500/20' : 'bg-slate-700'} flex items-center justify-center flex-shrink-0">
                <i class="fas fa-graduation-cap ${c.ativo ? 'text-blue-400' : 'text-slate-500'}"></i>
              </div>
              <span class="px-2 py-0.5 rounded-full text-xs font-medium ${c.ativo ? 'bg-emerald-900/40 text-emerald-300' : 'bg-slate-700 text-slate-400'}">${c.ativo ? 'Ativo' : 'Inativo'}</span>
            </div>
            <h3 class="font-semibold text-white mb-1 line-clamp-2">${c.titulo}</h3>
            <p class="text-xs text-slate-500 line-clamp-2 mb-3">${c.descricao || 'Sem descrição'}</p>
            <div class="flex items-center gap-3 text-xs text-slate-500 mb-4">
              <span><i class="fas fa-book mr-1"></i>${c.total_aulas || 0} aulas</span>
              <span><i class="fas fa-user mr-1"></i>${c.criado_por_nome || 'N/A'}</span>
            </div>
            <div class="flex gap-2">
              <button onclick="abrirEditorCurso('${c.id}')" 
                class="flex-1 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs font-medium transition flex items-center justify-center gap-1">
                <i class="fas fa-edit"></i> Editar
              </button>
              <button onclick="abrirMatriculas('${c.id}', '${c.titulo}')" 
                class="flex-1 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 text-xs font-medium transition flex items-center justify-center gap-1">
                <i class="fas fa-users"></i> Matrículas
              </button>
              <button onclick="toggleAtivoCurso('${c.id}', ${c.ativo})"
                class="py-2 px-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 text-xs transition">
                <i class="fas fa-${c.ativo ? 'eye-slash' : 'eye'}"></i>
              </button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="flex items-center justify-between mt-4 px-1">
      <span class="text-xs text-slate-500">${total} curso${total !== 1 ? 's' : ''}</span>
      <div class="flex gap-1">
        <button onclick="mudarPaginaCurso(${page - 1})" ${page <= 1 ? 'disabled' : ''}
          class="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 transition">← Anterior</button>
        <span class="px-3 py-1.5 text-xs text-slate-400">Pág. ${page}/${totalPages || 1}</span>
        <button onclick="mudarPaginaCurso(${page + 1})" ${page >= totalPages ? 'disabled' : ''}
          class="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 transition">Próxima →</button>
      </div>
    </div>
  `;
}

window.mudarPaginaCurso = (p) => { cursosState.page = p; carregarCursos(); };
window.toggleAtivoCurso = async (id, ativo) => {
  try {
    await request(`/cursos/${id}`, { method: 'PUT', body: JSON.stringify({ ativo: !ativo }) });
    notify(ativo ? 'Curso desativado' : 'Curso ativado');
    carregarCursos();
  } catch (e) { notify(e.message, 'error'); }
};

function modalCursoHTML() {
  return `
    <div id="modal-curso" class="hidden fixed inset-0 z-50 flex items-center justify-center modal-overlay bg-black/60">
      <div class="bg-primary-light rounded-2xl border border-slate-700/50 w-full max-w-lg mx-4 shadow-2xl">
        <div class="flex items-center justify-between p-5 border-b border-slate-700/30">
          <h3 id="modal-curso-titulo" class="font-semibold text-white">Novo Curso</h3>
          <button onclick="fecharModalCurso()" class="text-slate-400 hover:text-white"><i class="fas fa-times"></i></button>
        </div>
        <form id="form-curso" class="p-5 space-y-4">
          <input type="hidden" id="curso-id" />
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Título do Curso</label>
            <input type="text" id="curso-titulo" placeholder="Ex: Comunicação Efetiva no Trabalho"
              class="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" required />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Descrição</label>
            <textarea id="curso-descricao" rows="3" placeholder="Descreva o objetivo e conteúdo do curso..."
              class="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"></textarea>
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" onclick="fecharModalCurso()"
              class="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-400 hover:text-white text-sm transition">Cancelar</button>
            <button type="submit"
              class="btn-primary flex-1 py-2.5 rounded-lg text-white font-medium text-sm flex items-center justify-center gap-2">
              <i class="fas fa-save"></i> Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

window.openModalCurso = (curso = null) => {
  document.getElementById('modal-curso-titulo').textContent = curso ? 'Editar Curso' : 'Novo Curso';
  document.getElementById('curso-id').value = curso?.id || '';
  document.getElementById('curso-titulo').value = curso?.titulo || '';
  document.getElementById('curso-descricao').value = curso?.descricao || '';
  document.getElementById('modal-curso').classList.remove('hidden');
  
  document.getElementById('form-curso').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('curso-id').value;
    const body = {
      titulo: document.getElementById('curso-titulo').value,
      descricao: document.getElementById('curso-descricao').value,
    };
    try {
      if (id) await request(`/cursos/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      else await request('/cursos', { method: 'POST', body: JSON.stringify(body) });
      notify(id ? 'Curso atualizado!' : 'Curso criado!');
      fecharModalCurso();
      carregarCursos();
    } catch (e) { notify(e.message, 'error'); }
  };
};

window.fecharModalCurso = () => document.getElementById('modal-curso').classList.add('hidden');

// Editor de Curso (Aulas)
window.abrirEditorCurso = async (cursoId) => {
  try {
    const data = await request(`/cursos/${cursoId}`);
    const { curso, aulas } = data;
    
    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="space-y-5 fade-in">
        <div class="flex items-center gap-3">
          <button onclick="renderCursos()" class="text-slate-400 hover:text-white transition">
            <i class="fas fa-arrow-left"></i>
          </button>
          <div>
            <h2 class="text-lg font-semibold text-white">${curso.titulo}</h2>
            <p class="text-xs text-slate-400">${aulas.length} aula${aulas.length !== 1 ? 's' : ''} cadastrada${aulas.length !== 1 ? 's' : ''}</p>
          </div>
          <div class="ml-auto flex gap-2">
            <button onclick="openModalCurso(${JSON.stringify(curso).replace(/"/g, '&quot;')})"
              class="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition flex items-center gap-2">
              <i class="fas fa-edit"></i> Editar Info
            </button>
            <button onclick="openModalAula('${cursoId}')"
              class="btn-primary px-4 py-2 rounded-lg text-white text-sm flex items-center gap-2">
              <i class="fas fa-plus"></i> Nova Aula
            </button>
          </div>
        </div>
        
        <div id="lista-aulas" class="space-y-2">
          ${renderListaAulas(aulas, cursoId)}
        </div>
      </div>
      ${modalAulaHTML()}
    `;
    setPageTitle('Editor de Curso', curso.titulo);
  } catch (e) { notify(e.message, 'error'); }
};

function renderListaAulas(aulas, cursoId) {
  if (aulas.length === 0) {
    return `
      <div class="bg-primary-light rounded-xl border border-slate-700/50 border-dashed p-12 text-center">
        <i class="fas fa-film text-4xl text-slate-700 mb-3"></i>
        <p class="text-slate-400 mb-3">Nenhuma aula cadastrada ainda</p>
        <button onclick="openModalAula('${cursoId}')" class="text-blue-400 hover:text-blue-300 text-sm">
          + Adicionar primeira aula
        </button>
      </div>`;
  }
  
  const tipoIcons = { pdf: 'fa-file-pdf text-red-400', video: 'fa-video text-blue-400', youtube: 'fa-brands fa-youtube text-red-500', texto: 'fa-align-left text-green-400' };
  const tipoLabels = { pdf: 'PDF', video: 'Vídeo', youtube: 'YouTube', texto: 'Texto' };
  
  return aulas.map((a, i) => `
    <div class="bg-primary-light rounded-xl border border-slate-700/50 p-4 flex items-center gap-4">
      <div class="w-8 h-8 rounded-lg bg-slate-700/60 flex items-center justify-center text-slate-400 font-semibold text-sm flex-shrink-0">
        ${i + 1}
      </div>
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <i class="fas ${tipoIcons[a.tipo]} text-base flex-shrink-0"></i>
        <div class="min-w-0">
          <div class="font-medium text-white text-sm truncate">${a.titulo}</div>
          <div class="text-xs text-slate-500">${tipoLabels[a.tipo]}${a.descricao ? ' · ' + a.descricao.substring(0, 60) : ''}</div>
        </div>
      </div>
      <div class="flex gap-2 flex-shrink-0">
        <button onclick="editarAula('${cursoId}', '${a.id}')"
          class="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 transition">
          <i class="fas fa-edit text-sm"></i>
        </button>
        <button onclick="excluirAula('${cursoId}', '${a.id}')"
          class="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition">
          <i class="fas fa-trash text-sm"></i>
        </button>
      </div>
    </div>
  `).join('');
}

function modalAulaHTML() {
  return `
    <div id="modal-aula" class="hidden fixed inset-0 z-50 flex items-center justify-center modal-overlay bg-black/60">
      <div class="bg-primary-light rounded-2xl border border-slate-700/50 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between p-5 border-b border-slate-700/30 sticky top-0 bg-primary-light z-10">
          <h3 id="modal-aula-titulo" class="font-semibold text-white">Nova Aula</h3>
          <button onclick="fecharModalAula()" class="text-slate-400 hover:text-white"><i class="fas fa-times"></i></button>
        </div>
        <form id="form-aula" class="p-5 space-y-4">
          <input type="hidden" id="aula-id" />
          <input type="hidden" id="aula-curso-id" />
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Título da Aula</label>
            <input type="text" id="aula-titulo" placeholder="Ex: Introdução ao módulo"
              class="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" required />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Tipo de Conteúdo</label>
            <select id="aula-tipo" onchange="atualizarCamposAula()"
              class="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500">
              <option value="youtube">YouTube (Link)</option>
              <option value="video">Vídeo (URL direta)</option>
              <option value="pdf">PDF (URL)</option>
              <option value="texto">Texto / Material</option>
            </select>
          </div>
          <div id="campo-url">
            <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">URL do Conteúdo</label>
            <input type="url" id="aula-url" placeholder="https://youtube.com/watch?v=..."
              class="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
            <p class="text-xs text-slate-500 mt-1" id="url-hint">Cole o link do vídeo do YouTube</p>
          </div>
          <div id="campo-texto" class="hidden">
            <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Conteúdo</label>
            <textarea id="aula-conteudo" rows="6" placeholder="Digite o conteúdo da aula aqui..."
              class="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 resize-y"></textarea>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Descrição (opcional)</label>
            <input type="text" id="aula-descricao" placeholder="Breve descrição da aula"
              class="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" onclick="fecharModalAula()"
              class="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-400 hover:text-white text-sm transition">Cancelar</button>
            <button type="submit"
              class="btn-primary flex-1 py-2.5 rounded-lg text-white font-medium text-sm flex items-center justify-center gap-2">
              <i class="fas fa-save"></i> Salvar Aula
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

window.atualizarCamposAula = () => {
  const tipo = document.getElementById('aula-tipo')?.value;
  const campoUrl = document.getElementById('campo-url');
  const campoTexto = document.getElementById('campo-texto');
  const urlHint = document.getElementById('url-hint');
  const aulaUrl = document.getElementById('aula-url');
  
  if (tipo === 'texto') {
    campoUrl?.classList.add('hidden');
    campoTexto?.classList.remove('hidden');
  } else {
    campoUrl?.classList.remove('hidden');
    campoTexto?.classList.add('hidden');
    if (tipo === 'youtube') { aulaUrl.placeholder = 'https://youtube.com/watch?v=...'; urlHint.textContent = 'Cole o link do YouTube'; }
    else if (tipo === 'pdf') { aulaUrl.placeholder = 'https://...'; urlHint.textContent = 'URL do arquivo PDF'; }
    else { aulaUrl.placeholder = 'https://...'; urlHint.textContent = 'URL direta do vídeo (MP4 etc.)'; }
  }
};

window.openModalAula = (cursoId, aula = null) => {
  document.getElementById('modal-aula-titulo').textContent = aula ? 'Editar Aula' : 'Nova Aula';
  document.getElementById('aula-id').value = aula?.id || '';
  document.getElementById('aula-curso-id').value = cursoId;
  document.getElementById('aula-titulo').value = aula?.titulo || '';
  document.getElementById('aula-tipo').value = aula?.tipo || 'youtube';
  document.getElementById('aula-url').value = aula?.url_ou_arquivo || '';
  document.getElementById('aula-conteudo').value = aula?.conteudo_texto || '';
  document.getElementById('aula-descricao').value = aula?.descricao || '';
  atualizarCamposAula();
  document.getElementById('modal-aula').classList.remove('hidden');
  
  document.getElementById('form-aula').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('aula-id').value;
    const cId = document.getElementById('aula-curso-id').value;
    const tipo = document.getElementById('aula-tipo').value;
    const body = {
      titulo: document.getElementById('aula-titulo').value,
      tipo,
      url_ou_arquivo: tipo !== 'texto' ? document.getElementById('aula-url').value : null,
      conteudo_texto: tipo === 'texto' ? document.getElementById('aula-conteudo').value : null,
      descricao: document.getElementById('aula-descricao').value || null,
    };
    try {
      if (id) await request(`/cursos/${cId}/aulas/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      else await request(`/cursos/${cId}/aulas`, { method: 'POST', body: JSON.stringify(body) });
      notify(id ? 'Aula atualizada!' : 'Aula criada!');
      fecharModalAula();
      abrirEditorCurso(cId);
    } catch (e) { notify(e.message, 'error'); }
  };
};

window.editarAula = async (cursoId, aulaId) => {
  try {
    const data = await request(`/cursos/${cursoId}`);
    const aula = data.aulas.find(a => a.id === aulaId);
    if (aula) openModalAula(cursoId, aula);
  } catch (e) { notify(e.message, 'error'); }
};

window.excluirAula = async (cursoId, aulaId) => {
  if (!confirm('Excluir esta aula?')) return;
  try {
    await request(`/cursos/${cursoId}/aulas/${aulaId}`, { method: 'DELETE' });
    notify('Aula excluída!');
    abrirEditorCurso(cursoId);
  } catch (e) { notify(e.message, 'error'); }
};

window.fecharModalAula = () => document.getElementById('modal-aula')?.classList.add('hidden');

// Matrículas
function modalMatriculaHTML() {
  return `
    <div id="modal-matricula" class="hidden fixed inset-0 z-50 flex items-center justify-center modal-overlay bg-black/60">
      <div class="bg-primary-light rounded-2xl border border-slate-700/50 w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] flex flex-col">
        <div class="flex items-center justify-between p-5 border-b border-slate-700/30">
          <div>
            <h3 class="font-semibold text-white">Gerenciar Matrículas</h3>
            <p id="matricula-curso-nome" class="text-xs text-slate-400 mt-0.5"></p>
          </div>
          <button onclick="fecharModalMatricula()" class="text-slate-400 hover:text-white"><i class="fas fa-times"></i></button>
        </div>
        <div class="p-5 flex-1 overflow-y-auto">
          <div class="flex gap-3 mb-4">
            <input type="text" id="busca-colab" placeholder="Buscar colaborador..."
              class="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              oninput="buscarColabsParaMatricula()" />
          </div>
          <div id="lista-colabs-disponiveis" class="space-y-1 mb-4 max-h-48 overflow-y-auto"></div>
          <div class="border-t border-slate-700/30 pt-4">
            <h4 class="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Matriculados</h4>
            <div id="lista-matriculados" class="space-y-1"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

let matriculaState = { cursoId: '', cursoNome: '' };

window.abrirMatriculas = async (cursoId, cursoNome) => {
  matriculaState = { cursoId, cursoNome };
  document.getElementById('modal-matricula').classList.remove('hidden');
  document.getElementById('matricula-curso-nome').textContent = cursoNome;
  await Promise.all([buscarColabsParaMatricula(), carregarMatriculados()]);
};

window.buscarColabsParaMatricula = async () => {
  const busca = document.getElementById('busca-colab')?.value || '';
  try {
    const data = await request(`/usuarios?perfil=COLABORADOR&limit=20&busca=${busca}&ativo=1`);
    const matriculados = await request(`/cursos/${matriculaState.cursoId}/matriculas`);
    const matriculadosIds = new Set(matriculados.matriculas.map(m => m.id));
    
    const disponiveis = data.usuarios.filter(u => !matriculadosIds.has(u.id));
    const container = document.getElementById('lista-colabs-disponiveis');
    if (!container) return;
    
    if (disponiveis.length === 0) {
      container.innerHTML = '<p class="text-xs text-slate-500 text-center py-2">Todos os colaboradores já matriculados</p>';
      return;
    }
    
    container.innerHTML = disponiveis.map(u => `
      <div class="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-700/50 transition">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-full bg-blue-500/30 flex items-center justify-center text-xs font-semibold text-blue-300">${u.nome.charAt(0)}</div>
          <div>
            <div class="text-sm text-white">${u.nome}</div>
            <div class="text-xs text-slate-500">${u.email}</div>
          </div>
        </div>
        <button onclick="matricularColab('${u.id}')" class="text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 transition">
          + Matricular
        </button>
      </div>
    `).join('');
  } catch (e) { }
};

async function carregarMatriculados() {
  try {
    const data = await request(`/cursos/${matriculaState.cursoId}/matriculas`);
    const container = document.getElementById('lista-matriculados');
    if (!container) return;
    
    if (data.matriculas.length === 0) {
      container.innerHTML = '<p class="text-xs text-slate-500 text-center py-2">Nenhum colaborador matriculado</p>';
      return;
    }
    
    container.innerHTML = data.matriculas.map(u => `
      <div class="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-700/50 transition">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-full bg-emerald-500/30 flex items-center justify-center text-xs font-semibold text-emerald-300">${u.nome.charAt(0)}</div>
          <div>
            <div class="text-sm text-white">${u.nome}</div>
            <div class="text-xs text-slate-500">${u.email}</div>
          </div>
        </div>
        <button onclick="desmatricularColab('${u.id}')" class="text-xs px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 transition">
          Remover
        </button>
      </div>
    `).join('');
  } catch (e) { }
}

window.matricularColab = async (userId) => {
  try {
    await request(`/cursos/${matriculaState.cursoId}/matriculas`, {
      method: 'POST',
      body: JSON.stringify({ user_ids: [userId] })
    });
    notify('Colaborador matriculado!');
    await Promise.all([buscarColabsParaMatricula(), carregarMatriculados()]);
  } catch (e) { notify(e.message, 'error'); }
};

window.desmatricularColab = async (userId) => {
  if (!confirm('Remover matrícula deste colaborador?')) return;
  try {
    await request(`/cursos/${matriculaState.cursoId}/matriculas/${userId}`, { method: 'DELETE' });
    notify('Matrícula removida');
    await Promise.all([buscarColabsParaMatricula(), carregarMatriculados()]);
  } catch (e) { notify(e.message, 'error'); }
};

window.fecharModalMatricula = () => document.getElementById('modal-matricula')?.classList.add('hidden');

// ===== MEUS CURSOS (COLABORADOR) =====
async function renderMeusCursos() {
  setPageTitle('Meus Cursos', 'Acompanhe seu progresso de aprendizagem');
  const content = document.getElementById('page-content');
  content.innerHTML = '<div class="flex items-center justify-center h-32"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>';
  
  try {
    const data = await request('/progresso/meu');
    const { cursos } = data;
    
    if (cursos.length === 0) {
      content.innerHTML = `
        <div class="text-center py-20 fade-in">
          <div class="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-book-open text-3xl text-slate-600"></i>
          </div>
          <h3 class="text-lg font-medium text-slate-300 mb-2">Nenhum curso disponível</h3>
          <p class="text-slate-500 text-sm">Entre em contato com o RH para ser matriculado em um curso.</p>
        </div>`;
      return;
    }
    
    content.innerHTML = `
      <div class="space-y-4 fade-in">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          ${cursos.map(c => `
            <div class="bg-primary-light rounded-xl border border-slate-700/50 overflow-hidden card-hover cursor-pointer" onclick="abrirCurso('${c.id}')">
              <div class="h-1.5 ${c.concluido ? 'bg-emerald-500' : c.percentual > 0 ? 'bg-blue-500' : 'bg-slate-700'}"
                style="${c.percentual > 0 && !c.concluido ? `background:linear-gradient(to right, #3B82F6 ${c.percentual}%, #334155 ${c.percentual}%)` : ''}"></div>
              <div class="p-5">
                <div class="flex items-start justify-between mb-3">
                  <div class="w-11 h-11 rounded-xl ${c.concluido ? 'bg-emerald-500/20' : 'bg-blue-500/20'} flex items-center justify-center">
                    <i class="fas ${c.concluido ? 'fa-check-circle text-emerald-400' : 'fa-graduation-cap text-blue-400'} text-lg"></i>
                  </div>
                  <div class="text-right">
                    <div class="text-2xl font-bold ${c.concluido ? 'text-emerald-400' : 'text-white'}">${c.percentual}%</div>
                    <div class="text-xs text-slate-500">${c.concluido ? 'Concluído!' : c.percentual > 0 ? 'Em andamento' : 'Não iniciado'}</div>
                  </div>
                </div>
                <h3 class="font-semibold text-white mb-1 line-clamp-2">${c.titulo}</h3>
                <p class="text-xs text-slate-500 line-clamp-2 mb-3">${c.descricao || ''}</p>
                <div class="space-y-2">
                  ${progressBar(c.percentual)}
                  <div class="flex items-center justify-between text-xs text-slate-500">
                    <span>${c.concluidas}/${c.total_aulas} aulas concluídas</span>
                    ${c.certificado_id ? `<span class="text-emerald-400"><i class="fas fa-certificate mr-1"></i>Certificado</span>` : ''}
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (e) { notify(e.message, 'error'); }
}

// Abrir curso para assistir aulas
window.abrirCurso = async (cursoId) => {
  try {
    const [cursoData, progressoData] = await Promise.all([
      request(`/cursos/${cursoId}`),
      request(`/progresso/curso/${cursoId}`)
    ]);
    
    const { curso, aulas } = cursoData;
    const progressoMap = {};
    (progressoData.progresso || []).forEach(p => progressoMap[p.aula_id] = p.concluido);
    
    if (aulas.length === 0) {
      notify('Este curso ainda não possui aulas.', 'info');
      return;
    }
    
    const content = document.getElementById('page-content');
    const primeiraAula = aulas[0];
    
    content.innerHTML = `
      <div class="flex gap-5 h-full fade-in">
        <!-- Sidebar de aulas -->
        <div class="w-72 flex-shrink-0 bg-primary-light rounded-xl border border-slate-700/50 flex flex-col">
          <div class="p-4 border-b border-slate-700/30">
            <button onclick="renderMeusCursos()" class="text-xs text-slate-400 hover:text-white mb-2 block">← Voltar</button>
            <h3 class="font-semibold text-white text-sm line-clamp-2">${curso.titulo}</h3>
            <div class="mt-2">${progressBar(progressoData.percentual)}</div>
            <div class="text-xs text-slate-500 mt-1">${progressoData.concluidas}/${progressoData.totalAulas} concluídas · ${progressoData.percentual}%</div>
          </div>
          <div class="flex-1 overflow-y-auto p-2">
            ${aulas.map((a, i) => `
              <button onclick="selecionarAula('${cursoId}', ${JSON.stringify(aulas).replace(/"/g, '&quot;')}, ${i})"
                id="aula-btn-${a.id}"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left mb-0.5 transition-all hover:bg-slate-700/50 ${a.id === primeiraAula.id ? 'bg-blue-900/30 border border-blue-700/30' : ''}">
                <div class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${progressoMap[a.id] ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}">
                  ${progressoMap[a.id] ? '<i class="fas fa-check text-xs"></i>' : (i + 1)}
                </div>
                <div class="min-w-0">
                  <div class="text-xs font-medium text-white truncate">${a.titulo}</div>
                  <div class="text-xs text-slate-500">${{pdf:'PDF',video:'Vídeo',youtube:'YouTube',texto:'Texto'}[a.tipo]}</div>
                </div>
              </button>
            `).join('')}
          </div>
        </div>
        
        <!-- Área de conteúdo -->
        <div class="flex-1 min-w-0">
          <div id="player-area" class="bg-primary-light rounded-xl border border-slate-700/50 h-full flex flex-col"></div>
        </div>
      </div>
    `;
    
    setPageTitle(curso.titulo, `${progressoData.percentual}% concluído`);
    exibirAula(cursoId, aulas, 0, progressoMap);
  } catch (e) { notify(e.message, 'error'); }
};

let progressoMapGlobal = {};

window.selecionarAula = (cursoId, aulas, idx) => {
  $$('[id^="aula-btn-"]').forEach(el => {
    el.className = el.className.replace('bg-blue-900/30 border border-blue-700/30', '').trim();
  });
  const aula = aulas[idx];
  const btn = document.getElementById(`aula-btn-${aula.id}`);
  if (btn) btn.className += ' bg-blue-900/30 border border-blue-700/30';
  exibirAula(cursoId, aulas, idx, progressoMapGlobal);
};

function exibirAula(cursoId, aulas, idx, progressoMap) {
  progressoMapGlobal = progressoMap;
  const aula = aulas[idx];
  const concluida = progressoMap[aula.id];
  const player = document.getElementById('player-area');
  if (!player) return;
  
  let conteudo = '';
  
  if (aula.tipo === 'youtube') {
    let videoId = '';
    try {
      const url = new URL(aula.url_ou_arquivo);
      videoId = url.searchParams.get('v') || url.pathname.split('/').pop() || '';
    } catch { videoId = aula.url_ou_arquivo || ''; }
    
    conteudo = `
      <div class="flex-1 bg-black rounded-t-xl overflow-hidden min-h-0">
        <iframe class="w-full h-full" style="min-height:400px"
          src="https://www.youtube.com/embed/${videoId}?rel=0"
          frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen>
        </iframe>
      </div>`;
  } else if (aula.tipo === 'video') {
    conteudo = `
      <div class="flex-1 bg-black rounded-t-xl overflow-hidden min-h-0">
        <video class="w-full h-full" style="min-height:400px" controls>
          <source src="${aula.url_ou_arquivo}" />
          Seu navegador não suporta vídeo.
        </video>
      </div>`;
  } else if (aula.tipo === 'pdf') {
    conteudo = `
      <div class="flex-1 min-h-0">
        <iframe class="w-full rounded-t-xl" style="height:450px"
          src="${aula.url_ou_arquivo}" frameborder="0">
        </iframe>
      </div>`;
  } else if (aula.tipo === 'texto') {
    conteudo = `
      <div class="flex-1 p-6 overflow-y-auto min-h-0" style="min-height:400px">
        <div class="prose prose-invert max-w-none">
          <div class="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">${aula.conteudo_texto || 'Sem conteúdo'}</div>
        </div>
      </div>`;
  }
  
  player.innerHTML = `
    ${conteudo}
    <div class="p-5 border-t border-slate-700/30">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h3 class="font-semibold text-white mb-1">${aula.titulo}</h3>
          ${aula.descricao ? `<p class="text-sm text-slate-400">${aula.descricao}</p>` : ''}
        </div>
        <div class="flex gap-3 flex-shrink-0 items-center">
          ${idx > 0 ? `<button onclick="selecionarAula('${cursoId}', ${JSON.stringify(aulas).replace(/"/g, '&quot;')}, ${idx-1})" class="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition">← Anterior</button>` : ''}
          
          <button onclick="marcarAula('${cursoId}', '${aula.id}', ${!concluida}, ${JSON.stringify(aulas).replace(/"/g, '&quot;')}, ${idx})"
            id="btn-concluir-${aula.id}"
            class="px-5 py-2 rounded-lg font-medium text-sm transition flex items-center gap-2 ${concluida ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-700/40' : 'btn-primary text-white'}">
            <i class="fas fa-${concluida ? 'check-circle' : 'circle-check'}"></i>
            ${concluida ? 'Concluída' : 'Marcar como concluída'}
          </button>
          
          ${idx < aulas.length - 1 ? `<button onclick="selecionarAula('${cursoId}', ${JSON.stringify(aulas).replace(/"/g, '&quot;')}, ${idx+1})" class="px-4 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-sm transition">Próxima →</button>` : ''}
        </div>
      </div>
    </div>
  `;
}

window.marcarAula = async (cursoId, aulaId, concluido, aulas, idx) => {
  try {
    const data = await request(`/progresso/aula/${aulaId}`, {
      method: 'POST',
      body: JSON.stringify({ concluido })
    });
    
    progressoMapGlobal[aulaId] = concluido ? 1 : 0;
    
    // Atualizar ícone na sidebar
    const aulaBtn = document.getElementById(`aula-btn-${aulaId}`);
    if (aulaBtn) {
      const circle = aulaBtn.querySelector('div');
      if (circle) {
        if (concluido) {
          circle.className = 'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs bg-emerald-500 text-white';
          circle.innerHTML = '<i class="fas fa-check text-xs"></i>';
        } else {
          circle.className = 'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs bg-slate-700 text-slate-400';
          circle.innerHTML = (idx + 1).toString();
        }
      }
    }
    
    // Atualizar progresso na sidebar
    const total = aulas.length;
    const concluidas = Object.values(progressoMapGlobal).filter(v => v).length;
    const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0;
    
    const progressSidebar = document.querySelector('.w-72 .mt-2');
    if (progressSidebar) progressSidebar.innerHTML = progressBar(pct);
    const progressText = document.querySelector('.w-72 .text-xs.text-slate-500');
    if (progressText) progressText.textContent = `${concluidas}/${total} concluídas · ${pct}%`;
    
    // Atualizar botão
    exibirAula(cursoId, aulas, idx, progressoMapGlobal);
    
    if (data.certificado) {
      setTimeout(() => {
        notify('🎉 Parabéns! Certificado emitido!', 'success');
        setTimeout(() => navigateTo('certificados'), 2000);
      }, 500);
    } else {
      notify(concluido ? 'Aula marcada como concluída!' : 'Marcação removida', concluido ? 'success' : 'info');
    }
  } catch (e) { notify(e.message, 'error'); }
};

// ===== CERTIFICADOS =====
async function renderCertificados() {
  setPageTitle('Certificados', currentUser.perfil === 'COLABORADOR' ? 'Meus certificados de conclusão' : 'Certificados emitidos');
  const content = document.getElementById('page-content');
  content.innerHTML = '<div class="flex items-center justify-center h-32"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>';
  
  try {
    let certs;
    if (currentUser.perfil === 'COLABORADOR') {
      const data = await request('/certificados/meus');
      certs = data.certificados;
    } else {
      const data = await request('/certificados?limit=50');
      certs = data.certificados;
    }
    
    if (certs.length === 0) {
      content.innerHTML = `
        <div class="text-center py-20 fade-in">
          <div class="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-5">
            <i class="fas fa-certificate text-4xl text-slate-600"></i>
          </div>
          <h3 class="text-lg font-medium text-slate-300 mb-2">Nenhum certificado</h3>
          <p class="text-slate-500 text-sm">${currentUser.perfil === 'COLABORADOR' ? 'Conclua um curso para obter seu certificado.' : 'Nenhum certificado emitido ainda.'}</p>
        </div>`;
      return;
    }
    
    content.innerHTML = `
      <div class="space-y-4 fade-in">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${certs.map(c => `
            <div class="bg-primary-light rounded-xl border border-slate-700/50 p-5 card-hover">
              <div class="flex items-start gap-4 mb-4">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/30 to-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <i class="fas fa-award text-amber-400 text-xl"></i>
                </div>
                <div class="min-w-0">
                  <h3 class="font-semibold text-white text-sm line-clamp-2 mb-1">${c.curso_titulo}</h3>
                  <p class="text-xs text-slate-400">${c.usuario_nome}</p>
                </div>
              </div>
              <div class="flex items-center justify-between text-xs text-slate-500 mb-4">
                <span><i class="fas fa-calendar mr-1"></i>${formatDate(c.data_emissao)}</span>
                <span class="font-mono text-slate-600 truncate ml-2" title="${c.codigo_validacao}">${c.codigo_validacao}</span>
              </div>
              <button onclick="visualizarCertificado('${c.id}')"
                class="w-full py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-sm font-medium transition flex items-center justify-center gap-2">
                <i class="fas fa-eye"></i> Ver Certificado
              </button>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Modal Certificado -->
      <div id="modal-cert" class="hidden fixed inset-0 z-50 flex items-center justify-center modal-overlay bg-black/70">
        <div class="bg-white rounded-2xl w-full max-w-2xl mx-4 shadow-2xl overflow-hidden">
          <div class="flex items-center justify-between p-4 bg-slate-100 border-b">
            <h3 class="font-semibold text-slate-800">Certificado de Conclusão</h3>
            <div class="flex gap-2">
              <button onclick="imprimirCertificado()" class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm flex items-center gap-2">
                <i class="fas fa-download"></i> Imprimir/PDF
              </button>
              <button onclick="document.getElementById('modal-cert').classList.add('hidden')" class="text-slate-500 hover:text-slate-800 px-2">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
          <div id="cert-content" class="p-6 bg-white"></div>
        </div>
      </div>
    `;
  } catch (e) { notify(e.message, 'error'); }
}

window.visualizarCertificado = async (id) => {
  try {
    const data = await request(`/certificados/${id}`);
    const c = data.certificado;
    
    document.getElementById('cert-content').innerHTML = `
      <div id="certificado-pdf" class="cert-preview p-8 bg-white border-4 border-double border-amber-400 rounded-xl mx-auto" style="max-width:600px">
        <!-- Cabeçalho -->
        <div class="text-center mb-6 pb-4 border-b-2 border-amber-200">
          <div class="flex items-center justify-center gap-3 mb-3">
            ${logoSVG(48)}
            <div class="text-left">
              <div class="text-2xl font-bold text-slate-800" style="font-family:Georgia,serif">HRD Consultoria</div>
              <div class="text-sm text-slate-500">Treinamento & Desenvolvimento</div>
            </div>
          </div>
          <h1 class="text-3xl font-bold text-amber-600 tracking-wider uppercase" style="font-family:Georgia,serif">
            CERTIFICADO
          </h1>
          <p class="text-slate-500 text-sm mt-1">DE CONCLUSÃO DE CURSO</p>
        </div>
        
        <!-- Corpo -->
        <div class="text-center my-6">
          <p class="text-slate-600 text-base mb-4">Certificamos que</p>
          <h2 class="text-3xl font-bold text-slate-800 mb-4 border-b-2 border-slate-200 pb-3 inline-block px-8" style="font-family:Georgia,serif">${c.usuario_nome}</h2>
          <p class="text-slate-600 mb-2">concluiu com êxito o curso</p>
          <h3 class="text-xl font-semibold text-slate-700 mb-4 mt-2" style="font-family:Georgia,serif">"${c.curso_titulo}"</h3>
          <p class="text-slate-500 text-sm">com aproveitamento total do conteúdo programático</p>
        </div>
        
        <!-- Data e assinatura -->
        <div class="flex items-end justify-between mt-8 pt-5 border-t border-slate-200">
          <div class="text-center">
            <div class="w-32 border-b border-slate-400 mb-1"></div>
            <div class="text-xs text-slate-500">Data de conclusão</div>
            <div class="text-sm font-medium text-slate-700">${formatDate(c.data_emissao)}</div>
          </div>
          <div class="text-center">
            <div class="text-3xl text-amber-500 mb-1">★</div>
            <div class="text-xs font-mono text-slate-400 bg-slate-100 px-3 py-1 rounded">
              ${c.codigo_validacao}
            </div>
            <div class="text-xs text-slate-400 mt-0.5">Código de validação</div>
          </div>
          <div class="text-center">
            <div class="w-32 border-b border-slate-400 mb-1"></div>
            <div class="text-xs text-slate-500">Diretor(a) de T&D</div>
            <div class="text-sm font-medium text-slate-700" style="font-family:cursive">HRD Consultoria</div>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('modal-cert').classList.remove('hidden');
  } catch (e) { notify(e.message, 'error'); }
};

window.imprimirCertificado = () => {
  const el = document.getElementById('certificado-pdf');
  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html><html><head>
    <title>Certificado HRD</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; padding: 20px; background: white; font-family: Georgia, serif; }
      .cert { border: 4px double #F59E0B; border-radius: 12px; padding: 40px; max-width: 700px; margin: auto; }
      .text-center { text-align: center; }
      @media print { body { padding: 0; } .cert { border-radius: 0; max-width: 100%; } }
    </style>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
    </head><body>
    ${el.outerHTML}
    <script>window.onload = () => { window.print(); window.close(); }</script>
    </body></html>
  `);
  win.document.close();
};

// ===== INICIALIZAÇÃO =====
window.logout = logout;
window.navigateTo = navigateTo;

function init() {
  if (loadSession()) {
    renderApp();
  } else {
    renderLogin();
  }
}

document.addEventListener('DOMContentLoaded', init);
