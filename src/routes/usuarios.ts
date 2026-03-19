import { Hono } from 'hono';
import { authMiddleware, requireRole } from '../middleware/auth';
import { hashPassword } from '../utils/crypto';
import type { Env, Usuario } from '../types';
import { v4 as uuidv4 } from 'uuid';

const usuarios = new Hono<{ Bindings: Env; Variables: { user: any } }>();

// Listar usuários (ADMIN e RH)
usuarios.get('/', authMiddleware, requireRole('ADMIN', 'RH'), async (c) => {
  const { perfil: filtroP, busca, page = '1', limit = '10' } = c.req.query();
  const pageN = parseInt(page);
  const limitN = parseInt(limit);
  const offset = (pageN - 1) * limitN;
  
  let query = 'SELECT id, nome, email, perfil, ativo, created_at FROM usuarios WHERE 1=1';
  let countQ = 'SELECT COUNT(*) as total FROM usuarios WHERE 1=1';
  const params: string[] = [];
  const countParams: string[] = [];
  
  if (filtroP) {
    query += ' AND perfil = ?';
    countQ += ' AND perfil = ?';
    params.push(filtroP);
    countParams.push(filtroP);
  }
  
  if (busca) {
    query += ' AND (nome LIKE ? OR email LIKE ?)';
    countQ += ' AND (nome LIKE ? OR email LIKE ?)';
    const termo = `%${busca}%`;
    params.push(termo, termo);
    countParams.push(termo, termo);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(String(limitN), String(offset));
  
  const [results, countResult] = await Promise.all([
    c.env.DB.prepare(query).bind(...params).all<Omit<Usuario, 'senha_hash'>>(),
    c.env.DB.prepare(countQ).bind(...countParams).first<{ total: number }>()
  ]);
  
  return c.json({
    usuarios: results.results,
    total: countResult?.total || 0,
    page: pageN,
    limit: limitN,
    totalPages: Math.ceil((countResult?.total || 0) / limitN)
  });
});

// Obter usuário por ID
usuarios.get('/:id', authMiddleware, requireRole('ADMIN', 'RH'), async (c) => {
  const { id } = c.req.param();
  const user = await c.env.DB.prepare(
    'SELECT id, nome, email, perfil, ativo, created_at FROM usuarios WHERE id = ?'
  ).bind(id).first<Omit<Usuario, 'senha_hash'>>();
  
  if (!user) return c.json({ error: 'Usuário não encontrado' }, 404);
  return c.json({ usuario: user });
});

// Criar usuário
usuarios.post('/', authMiddleware, requireRole('ADMIN', 'RH'), async (c) => {
  const currentUser = c.get('user');
  const body = await c.req.json();
  const { nome, email, senha, perfil } = body;
  
  if (!nome || !email || !senha || !perfil) {
    return c.json({ error: 'Todos os campos são obrigatórios' }, 400);
  }
  
  if (senha.length < 6) {
    return c.json({ error: 'Senha deve ter pelo menos 6 caracteres' }, 400);
  }
  
  // RH só pode criar COLABORADOR
  if (currentUser.perfil === 'RH' && perfil !== 'COLABORADOR') {
    return c.json({ error: 'RH só pode criar colaboradores' }, 403);
  }
  
  // Apenas ADMIN pode criar ADMIN
  if (perfil === 'ADMIN' && currentUser.perfil !== 'ADMIN') {
    return c.json({ error: 'Apenas ADMIN pode criar outros administradores' }, 403);
  }
  
  if (!['ADMIN', 'RH', 'COLABORADOR'].includes(perfil)) {
    return c.json({ error: 'Perfil inválido' }, 400);
  }
  
  const emailNorm = email.toLowerCase().trim();
  const existing = await c.env.DB.prepare(
    'SELECT id FROM usuarios WHERE email = ?'
  ).bind(emailNorm).first();
  
  if (existing) {
    return c.json({ error: 'Email já cadastrado' }, 409);
  }
  
  const id = uuidv4();
  const senhaHash = await hashPassword(senha);
  
  await c.env.DB.prepare(
    'INSERT INTO usuarios (id, nome, email, senha_hash, perfil, ativo) VALUES (?, ?, ?, ?, ?, 1)'
  ).bind(id, nome.trim(), emailNorm, senhaHash, perfil).run();
  
  return c.json({
    usuario: { id, nome: nome.trim(), email: emailNorm, perfil, ativo: 1 }
  }, 201);
});

// Editar usuário
usuarios.put('/:id', authMiddleware, requireRole('ADMIN', 'RH'), async (c) => {
  const currentUser = c.get('user');
  const { id } = c.req.param();
  const body = await c.req.json();
  const { nome, email, senha, perfil } = body;
  
  const user = await c.env.DB.prepare(
    'SELECT * FROM usuarios WHERE id = ?'
  ).bind(id).first<Usuario>();
  
  if (!user) return c.json({ error: 'Usuário não encontrado' }, 404);
  
  // RH não pode editar ADMIN ou RH
  if (currentUser.perfil === 'RH' && user.perfil !== 'COLABORADOR') {
    return c.json({ error: 'Sem permissão para editar este usuário' }, 403);
  }
  
  const emailNorm = email ? email.toLowerCase().trim() : user.email;
  
  if (email && email !== user.email) {
    const existing = await c.env.DB.prepare(
      'SELECT id FROM usuarios WHERE email = ? AND id != ?'
    ).bind(emailNorm, id).first();
    if (existing) return c.json({ error: 'Email já em uso' }, 409);
  }
  
  let senhaHash = user.senha_hash;
  if (senha) {
    if (senha.length < 6) return c.json({ error: 'Senha deve ter pelo menos 6 caracteres' }, 400);
    senhaHash = await hashPassword(senha);
  }
  
  const perfilFinal = currentUser.perfil === 'ADMIN' ? (perfil || user.perfil) : user.perfil;
  
  await c.env.DB.prepare(
    'UPDATE usuarios SET nome = ?, email = ?, senha_hash = ?, perfil = ? WHERE id = ?'
  ).bind(nome?.trim() || user.nome, emailNorm, senhaHash, perfilFinal, id).run();
  
  return c.json({
    usuario: { id, nome: nome?.trim() || user.nome, email: emailNorm, perfil: perfilFinal, ativo: user.ativo }
  });
});

// Desativar/Ativar usuário (soft delete)
usuarios.patch('/:id/status', authMiddleware, requireRole('ADMIN', 'RH'), async (c) => {
  const currentUser = c.get('user');
  const { id } = c.req.param();
  const { ativo } = await c.req.json();
  
  if (id === currentUser.sub) {
    return c.json({ error: 'Não pode desativar sua própria conta' }, 400);
  }
  
  const user = await c.env.DB.prepare('SELECT * FROM usuarios WHERE id = ?').bind(id).first<Usuario>();
  if (!user) return c.json({ error: 'Usuário não encontrado' }, 404);
  
  if (currentUser.perfil === 'RH' && user.perfil !== 'COLABORADOR') {
    return c.json({ error: 'Sem permissão' }, 403);
  }
  
  await c.env.DB.prepare('UPDATE usuarios SET ativo = ? WHERE id = ?')
    .bind(ativo ? 1 : 0, id).run();
  
  return c.json({ success: true, ativo });
});

// Resetar senha
usuarios.patch('/:id/senha', authMiddleware, requireRole('ADMIN'), async (c) => {
  const { id } = c.req.param();
  const { senha } = await c.req.json();
  
  if (!senha || senha.length < 6) {
    return c.json({ error: 'Senha deve ter pelo menos 6 caracteres' }, 400);
  }
  
  const user = await c.env.DB.prepare('SELECT id FROM usuarios WHERE id = ?').bind(id).first();
  if (!user) return c.json({ error: 'Usuário não encontrado' }, 404);
  
  const hash = await hashPassword(senha);
  await c.env.DB.prepare('UPDATE usuarios SET senha_hash = ? WHERE id = ?').bind(hash, id).run();
  
  return c.json({ success: true });
});

export default usuarios;
