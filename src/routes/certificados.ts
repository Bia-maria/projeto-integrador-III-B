import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { Env } from '../types';

const certificados = new Hono<{ Bindings: Env; Variables: { user: any } }>();

// Listar meus certificados
certificados.get('/meus', authMiddleware, async (c) => {
  const user = c.get('user');
  
  const certs = await c.env.DB.prepare(`
    SELECT cert.id, cert.data_emissao, cert.codigo_validacao,
      c.titulo as curso_titulo, c.descricao as curso_descricao,
      u.nome as usuario_nome, u.email as usuario_email
    FROM certificados cert
    JOIN cursos c ON c.id = cert.curso_id
    JOIN usuarios u ON u.id = cert.user_id
    WHERE cert.user_id = ?
    ORDER BY cert.data_emissao DESC
  `).bind(user.sub).all();
  
  return c.json({ certificados: certs.results });
});

// Obter certificado por ID
certificados.get('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  
  const cert = await c.env.DB.prepare(`
    SELECT cert.id, cert.data_emissao, cert.codigo_validacao,
      c.titulo as curso_titulo, c.descricao as curso_descricao,
      u.nome as usuario_nome, u.email as usuario_email,
      cert.user_id, cert.curso_id
    FROM certificados cert
    JOIN cursos c ON c.id = cert.curso_id
    JOIN usuarios u ON u.id = cert.user_id
    WHERE cert.id = ?
  `).bind(id).first();
  
  if (!cert) return c.json({ error: 'Certificado não encontrado' }, 404);
  
  // Colaborador só acessa seus próprios certificados
  if (user.perfil === 'COLABORADOR' && (cert as any).user_id !== user.sub) {
    return c.json({ error: 'Sem permissão' }, 403);
  }
  
  return c.json({ certificado: cert });
});

// Listar todos certificados (ADMIN e RH)
certificados.get('/', authMiddleware, async (c) => {
  const { cursoId, userId, page = '1', limit = '10' } = c.req.query();
  const user = c.get('user');
  
  if (user.perfil === 'COLABORADOR') {
    return c.json({ error: 'Sem permissão' }, 403);
  }
  
  const pageN = parseInt(page);
  const limitN = parseInt(limit);
  const offset = (pageN - 1) * limitN;
  
  let query = `
    SELECT cert.id, cert.data_emissao, cert.codigo_validacao,
      c.titulo as curso_titulo,
      u.nome as usuario_nome, u.email as usuario_email
    FROM certificados cert
    JOIN cursos c ON c.id = cert.curso_id
    JOIN usuarios u ON u.id = cert.user_id
    WHERE 1=1
  `;
  let countQ = 'SELECT COUNT(*) as total FROM certificados cert WHERE 1=1';
  const params: any[] = [];
  const countParams: any[] = [];
  
  if (cursoId) {
    query += ' AND cert.curso_id = ?';
    countQ += ' AND cert.curso_id = ?';
    params.push(cursoId);
    countParams.push(cursoId);
  }
  
  if (userId) {
    query += ' AND cert.user_id = ?';
    countQ += ' AND cert.user_id = ?';
    params.push(userId);
    countParams.push(userId);
  }
  
  query += ' ORDER BY cert.data_emissao DESC LIMIT ? OFFSET ?';
  params.push(limitN, offset);
  
  const [results, countResult] = await Promise.all([
    c.env.DB.prepare(query).bind(...params).all(),
    c.env.DB.prepare(countQ).bind(...countParams).first<{ total: number }>()
  ]);
  
  return c.json({
    certificados: results.results,
    total: countResult?.total || 0,
    page: pageN,
    limit: limitN,
    totalPages: Math.ceil((countResult?.total || 0) / limitN)
  });
});

export default certificados;
