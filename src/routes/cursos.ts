import { Hono } from 'hono';
import { authMiddleware, requireRole } from '../middleware/auth';
import type { Env, Curso, Aula } from '../types';
import { v4 as uuidv4 } from 'uuid';

const cursos = new Hono<{ Bindings: Env; Variables: { user: any } }>();

// Listar cursos
cursos.get('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const { ativo, busca, page = '1', limit = '12' } = c.req.query();
  const pageN = parseInt(page);
  const limitN = parseInt(limit);
  const offset = (pageN - 1) * limitN;
  
  let query = `
    SELECT c.*, u.nome as criado_por_nome,
      (SELECT COUNT(*) FROM aulas WHERE curso_id = c.id) as total_aulas
    FROM cursos c
    LEFT JOIN usuarios u ON c.criado_por = u.id
    WHERE 1=1
  `;
  let countQ = 'SELECT COUNT(*) as total FROM cursos WHERE 1=1';
  const params: any[] = [];
  const countParams: any[] = [];
  
  // Colaboradores só veem cursos ativos nos quais estão matriculados
  if (user.perfil === 'COLABORADOR') {
    query = `
      SELECT c.*, u.nome as criado_por_nome,
        (SELECT COUNT(*) FROM aulas WHERE curso_id = c.id) as total_aulas
      FROM cursos c
      LEFT JOIN usuarios u ON c.criado_por = u.id
      INNER JOIN matriculas m ON m.curso_id = c.id AND m.user_id = ?
      WHERE c.ativo = 1
    `;
    countQ = `SELECT COUNT(*) as total FROM cursos c INNER JOIN matriculas m ON m.curso_id = c.id AND m.user_id = ? WHERE c.ativo = 1`;
    params.push(user.sub);
    countParams.push(user.sub);
  } else {
    if (ativo !== undefined) {
      query += ' AND c.ativo = ?';
      countQ += ' AND ativo = ?';
      params.push(parseInt(ativo));
      countParams.push(parseInt(ativo));
    }
  }
  
  if (busca && user.perfil !== 'COLABORADOR') {
    query += ' AND (c.titulo LIKE ? OR c.descricao LIKE ?)';
    countQ += ' AND (titulo LIKE ? OR descricao LIKE ?)';
    const termo = `%${busca}%`;
    params.push(termo, termo);
    countParams.push(termo, termo);
  } else if (busca) {
    query += ' AND (c.titulo LIKE ? OR c.descricao LIKE ?)';
    countQ += ' AND (c.titulo LIKE ? OR c.descricao LIKE ?)';
    const termo = `%${busca}%`;
    params.push(termo, termo);
    countParams.push(termo, termo);
  }
  
  query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
  params.push(limitN, offset);
  
  const [results, countResult] = await Promise.all([
    c.env.DB.prepare(query).bind(...params).all(),
    c.env.DB.prepare(countQ).bind(...countParams).first<{ total: number }>()
  ]);
  
  return c.json({
    cursos: results.results,
    total: countResult?.total || 0,
    page: pageN,
    limit: limitN,
    totalPages: Math.ceil((countResult?.total || 0) / limitN)
  });
});

// Obter curso por ID com aulas
cursos.get('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  
  const curso = await c.env.DB.prepare(`
    SELECT c.*, u.nome as criado_por_nome
    FROM cursos c
    LEFT JOIN usuarios u ON c.criado_por = u.id
    WHERE c.id = ?
  `).bind(id).first();
  
  if (!curso) return c.json({ error: 'Curso não encontrado' }, 404);
  
  // Colaborador só acessa curso ativo e matriculado
  if (user.perfil === 'COLABORADOR') {
    const matricula = await c.env.DB.prepare(
      'SELECT id FROM matriculas WHERE user_id = ? AND curso_id = ?'
    ).bind(user.sub, id).first();
    if (!matricula || !(curso as any).ativo) {
      return c.json({ error: 'Sem acesso a este curso' }, 403);
    }
  }
  
  const aulas = await c.env.DB.prepare(
    'SELECT * FROM aulas WHERE curso_id = ? ORDER BY ordem ASC'
  ).bind(id).all<Aula>();
  
  return c.json({ curso, aulas: aulas.results });
});

// Criar curso (RH e ADMIN)
cursos.post('/', authMiddleware, requireRole('ADMIN', 'RH'), async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { titulo, descricao, thumbnail } = body;
  
  if (!titulo) return c.json({ error: 'Título é obrigatório' }, 400);
  
  const id = uuidv4();
  await c.env.DB.prepare(
    'INSERT INTO cursos (id, titulo, descricao, thumbnail, criado_por, ativo) VALUES (?, ?, ?, ?, ?, 1)'
  ).bind(id, titulo.trim(), descricao || null, thumbnail || null, user.sub).run();
  
  return c.json({ curso: { id, titulo, descricao, thumbnail, criado_por: user.sub, ativo: 1 } }, 201);
});

// Atualizar curso
cursos.put('/:id', authMiddleware, requireRole('ADMIN', 'RH'), async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const { titulo, descricao, thumbnail, ativo } = body;
  
  const curso = await c.env.DB.prepare('SELECT * FROM cursos WHERE id = ?').bind(id).first<Curso>();
  if (!curso) return c.json({ error: 'Curso não encontrado' }, 404);
  
  await c.env.DB.prepare(
    'UPDATE cursos SET titulo = ?, descricao = ?, thumbnail = ?, ativo = ? WHERE id = ?'
  ).bind(titulo || curso.titulo, descricao ?? curso.descricao, thumbnail ?? curso.thumbnail, ativo !== undefined ? (ativo ? 1 : 0) : curso.ativo, id).run();
  
  return c.json({ success: true });
});

// Excluir curso
cursos.delete('/:id', authMiddleware, requireRole('ADMIN'), async (c) => {
  const { id } = c.req.param();
  await c.env.DB.prepare('UPDATE cursos SET ativo = 0 WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

// ===== AULAS =====

// Listar aulas de um curso
cursos.get('/:id/aulas', authMiddleware, async (c) => {
  const { id } = c.req.param();
  const aulas = await c.env.DB.prepare(
    'SELECT * FROM aulas WHERE curso_id = ? ORDER BY ordem ASC'
  ).bind(id).all<Aula>();
  return c.json({ aulas: aulas.results });
});

// Criar aula
cursos.post('/:id/aulas', authMiddleware, requireRole('ADMIN', 'RH'), async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const { titulo, descricao, tipo, url_ou_arquivo, conteudo_texto, ordem } = body;
  
  if (!titulo || !tipo) return c.json({ error: 'Título e tipo são obrigatórios' }, 400);
  if (!['pdf', 'video', 'youtube', 'texto'].includes(tipo)) {
    return c.json({ error: 'Tipo inválido' }, 400);
  }
  
  const curso = await c.env.DB.prepare('SELECT id FROM cursos WHERE id = ?').bind(id).first();
  if (!curso) return c.json({ error: 'Curso não encontrado' }, 404);
  
  // Calcular ordem automaticamente se não fornecida
  let ordemFinal = ordem;
  if (ordemFinal === undefined) {
    const lastAula = await c.env.DB.prepare(
      'SELECT MAX(ordem) as maxOrdem FROM aulas WHERE curso_id = ?'
    ).bind(id).first<{ maxOrdem: number }>();
    ordemFinal = (lastAula?.maxOrdem || 0) + 1;
  }
  
  const aulaId = uuidv4();
  await c.env.DB.prepare(
    'INSERT INTO aulas (id, curso_id, titulo, descricao, tipo, url_ou_arquivo, conteudo_texto, ordem) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(aulaId, id, titulo.trim(), descricao || null, tipo, url_ou_arquivo || null, conteudo_texto || null, ordemFinal).run();
  
  return c.json({ aula: { id: aulaId, curso_id: id, titulo, tipo, ordem: ordemFinal } }, 201);
});

// Atualizar aula
cursos.put('/:id/aulas/:aulaId', authMiddleware, requireRole('ADMIN', 'RH'), async (c) => {
  const { id, aulaId } = c.req.param();
  const body = await c.req.json();
  const { titulo, descricao, tipo, url_ou_arquivo, conteudo_texto, ordem } = body;
  
  const aula = await c.env.DB.prepare(
    'SELECT * FROM aulas WHERE id = ? AND curso_id = ?'
  ).bind(aulaId, id).first<Aula>();
  
  if (!aula) return c.json({ error: 'Aula não encontrada' }, 404);
  
  await c.env.DB.prepare(
    'UPDATE aulas SET titulo = ?, descricao = ?, tipo = ?, url_ou_arquivo = ?, conteudo_texto = ?, ordem = ? WHERE id = ?'
  ).bind(
    titulo || aula.titulo,
    descricao ?? aula.descricao,
    tipo || aula.tipo,
    url_ou_arquivo ?? aula.url_ou_arquivo,
    conteudo_texto ?? aula.conteudo_texto,
    ordem !== undefined ? ordem : aula.ordem,
    aulaId
  ).run();
  
  return c.json({ success: true });
});

// Excluir aula
cursos.delete('/:id/aulas/:aulaId', authMiddleware, requireRole('ADMIN', 'RH'), async (c) => {
  const { id, aulaId } = c.req.param();
  await c.env.DB.prepare('DELETE FROM aulas WHERE id = ? AND curso_id = ?').bind(aulaId, id).run();
  return c.json({ success: true });
});

// Reordenar aulas
cursos.patch('/:id/aulas/reorder', authMiddleware, requireRole('ADMIN', 'RH'), async (c) => {
  const { id } = c.req.param();
  const { ordem } = await c.req.json(); // Array de { id, ordem }
  
  const stmts = ordem.map((item: { id: string; ordem: number }) =>
    c.env.DB.prepare('UPDATE aulas SET ordem = ? WHERE id = ? AND curso_id = ?')
      .bind(item.ordem, item.id, id)
  );
  
  await c.env.DB.batch(stmts);
  return c.json({ success: true });
});

// Matrículas
cursos.post('/:id/matriculas', authMiddleware, requireRole('ADMIN', 'RH'), async (c) => {
  const { id } = c.req.param();
  const { user_ids } = await c.req.json();
  
  if (!Array.isArray(user_ids) || user_ids.length === 0) {
    return c.json({ error: 'Lista de usuários é obrigatória' }, 400);
  }
  
  const stmts = user_ids.map((userId: string) =>
    c.env.DB.prepare(
      'INSERT OR IGNORE INTO matriculas (id, user_id, curso_id) VALUES (?, ?, ?)'
    ).bind(uuidv4(), userId, id)
  );
  
  await c.env.DB.batch(stmts);
  return c.json({ success: true });
});

cursos.get('/:id/matriculas', authMiddleware, requireRole('ADMIN', 'RH'), async (c) => {
  const { id } = c.req.param();
  const matriculas = await c.env.DB.prepare(`
    SELECT u.id, u.nome, u.email, m.created_at as matriculado_em
    FROM matriculas m
    JOIN usuarios u ON u.id = m.user_id
    WHERE m.curso_id = ?
    ORDER BY u.nome
  `).bind(id).all();
  return c.json({ matriculas: matriculas.results });
});

cursos.delete('/:id/matriculas/:userId', authMiddleware, requireRole('ADMIN', 'RH'), async (c) => {
  const { id, userId } = c.req.param();
  await c.env.DB.prepare('DELETE FROM matriculas WHERE curso_id = ? AND user_id = ?').bind(id, userId).run();
  return c.json({ success: true });
});

export default cursos;
