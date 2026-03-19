import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { Env } from '../types';
import { v4 as uuidv4 } from 'uuid';

const progresso = new Hono<{ Bindings: Env; Variables: { user: any } }>();

// Obter progresso de um curso
progresso.get('/curso/:cursoId', authMiddleware, async (c) => {
  const user = c.get('user');
  const { cursoId } = c.req.param();
  
  const aulas = await c.env.DB.prepare(
    'SELECT id FROM aulas WHERE curso_id = ?'
  ).bind(cursoId).all<{ id: string }>();
  
  if (aulas.results.length === 0) {
    return c.json({ progresso: [], percentual: 0, totalAulas: 0, concluidas: 0 });
  }
  
  const progressoData = await c.env.DB.prepare(`
    SELECT p.aula_id, p.concluido, p.data
    FROM progresso p
    WHERE p.user_id = ? AND p.aula_id IN (
      SELECT id FROM aulas WHERE curso_id = ?
    )
  `).bind(user.sub, cursoId).all();
  
  const concluidas = progressoData.results.filter((p: any) => p.concluido).length;
  const totalAulas = aulas.results.length;
  const percentual = totalAulas > 0 ? Math.round((concluidas / totalAulas) * 100) : 0;
  
  return c.json({
    progresso: progressoData.results,
    percentual,
    totalAulas,
    concluidas
  });
});

// Marcar aula como concluída / não concluída
progresso.post('/aula/:aulaId', authMiddleware, async (c) => {
  const user = c.get('user');
  const { aulaId } = c.req.param();
  const { concluido } = await c.req.json();
  
  const aula = await c.env.DB.prepare(
    'SELECT id, curso_id FROM aulas WHERE id = ?'
  ).bind(aulaId).first<{ id: string; curso_id: string }>();
  
  if (!aula) return c.json({ error: 'Aula não encontrada' }, 404);
  
  // Verificar se colaborador tem acesso ao curso
  if (user.perfil === 'COLABORADOR') {
    const matricula = await c.env.DB.prepare(
      'SELECT id FROM matriculas WHERE user_id = ? AND curso_id = ?'
    ).bind(user.sub, aula.curso_id).first();
    if (!matricula) return c.json({ error: 'Sem acesso a este curso' }, 403);
  }
  
  const existente = await c.env.DB.prepare(
    'SELECT id FROM progresso WHERE user_id = ? AND aula_id = ?'
  ).bind(user.sub, aulaId).first<{ id: string }>();
  
  const agora = new Date().toISOString();
  
  if (existente) {
    await c.env.DB.prepare(
      'UPDATE progresso SET concluido = ?, data = ? WHERE user_id = ? AND aula_id = ?'
    ).bind(concluido ? 1 : 0, concluido ? agora : null, user.sub, aulaId).run();
  } else {
    await c.env.DB.prepare(
      'INSERT INTO progresso (id, user_id, aula_id, concluido, data) VALUES (?, ?, ?, ?, ?)'
    ).bind(uuidv4(), user.sub, aulaId, concluido ? 1 : 0, concluido ? agora : null).run();
  }
  
  // Verificar se curso foi concluído e emitir certificado
  let certificado = null;
  if (concluido) {
    const totalAulas = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM aulas WHERE curso_id = ?'
    ).bind(aula.curso_id).first<{ total: number }>();
    
    const aulasConcluidas = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM progresso 
      WHERE user_id = ? AND concluido = 1 AND aula_id IN (
        SELECT id FROM aulas WHERE curso_id = ?
      )
    `).bind(user.sub, aula.curso_id).first<{ total: number }>();
    
    if (totalAulas && aulasConcluidas && 
        totalAulas.total > 0 && 
        aulasConcluidas.total >= totalAulas.total) {
      // Verificar se certificado já existe
      const certExistente = await c.env.DB.prepare(
        'SELECT * FROM certificados WHERE user_id = ? AND curso_id = ?'
      ).bind(user.sub, aula.curso_id).first();
      
      if (!certExistente) {
        const certId = uuidv4();
        const codigoValidacao = generateCertCode();
        await c.env.DB.prepare(
          'INSERT INTO certificados (id, user_id, curso_id, data_emissao, codigo_validacao) VALUES (?, ?, ?, ?, ?)'
        ).bind(certId, user.sub, aula.curso_id, agora, codigoValidacao).run();
        
        certificado = { id: certId, codigo_validacao: codigoValidacao, data_emissao: agora };
      } else {
        certificado = certExistente;
      }
    }
  }
  
  return c.json({ success: true, certificado });
});

// Meu progresso geral (todos os cursos matriculados)
progresso.get('/meu', authMiddleware, async (c) => {
  const user = c.get('user');
  
  const cursosMatriculados = await c.env.DB.prepare(`
    SELECT c.id, c.titulo, c.descricao, c.thumbnail,
      (SELECT COUNT(*) FROM aulas WHERE curso_id = c.id) as total_aulas,
      (SELECT COUNT(*) FROM progresso p 
       JOIN aulas a ON a.id = p.aula_id 
       WHERE p.user_id = ? AND p.concluido = 1 AND a.curso_id = c.id) as concluidas,
      (SELECT id FROM certificados WHERE user_id = ? AND curso_id = c.id) as certificado_id
    FROM cursos c
    INNER JOIN matriculas m ON m.curso_id = c.id AND m.user_id = ?
    WHERE c.ativo = 1
    ORDER BY c.created_at DESC
  `).bind(user.sub, user.sub, user.sub).all();
  
  const resultado = cursosMatriculados.results.map((c: any) => ({
    ...c,
    percentual: c.total_aulas > 0 ? Math.round((c.concluidas / c.total_aulas) * 100) : 0,
    concluido: c.total_aulas > 0 && c.concluidas >= c.total_aulas
  }));
  
  return c.json({ cursos: resultado });
});

function generateCertCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'HRD-';
  for (let i = 0; i < 12; i++) {
    if (i === 4 || i === 8) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default progresso;
