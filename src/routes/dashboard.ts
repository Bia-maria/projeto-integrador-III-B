import { Hono } from 'hono';
import { authMiddleware, requireRole } from '../middleware/auth';
import type { Env } from '../types';

const dashboard = new Hono<{ Bindings: Env; Variables: { user: any } }>();

// Dashboard ADMIN/RH
dashboard.get('/admin', authMiddleware, requireRole('ADMIN', 'RH'), async (c) => {
  const [
    totalUsuarios,
    totalCursos,
    totalCertificados,
    usuariosPorPerfil,
    cursosRecentes,
    certificadosRecentes
  ] = await Promise.all([
    c.env.DB.prepare('SELECT COUNT(*) as total FROM usuarios WHERE ativo = 1').first<{ total: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) as total FROM cursos WHERE ativo = 1').first<{ total: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) as total FROM certificados').first<{ total: number }>(),
    c.env.DB.prepare(`
      SELECT perfil, COUNT(*) as total FROM usuarios WHERE ativo = 1 GROUP BY perfil
    `).all(),
    c.env.DB.prepare(`
      SELECT c.id, c.titulo, c.created_at,
        (SELECT COUNT(*) FROM aulas WHERE curso_id = c.id) as total_aulas,
        (SELECT COUNT(*) FROM matriculas WHERE curso_id = c.id) as matriculados
      FROM cursos c WHERE c.ativo = 1 ORDER BY c.created_at DESC LIMIT 5
    `).all(),
    c.env.DB.prepare(`
      SELECT cert.id, cert.data_emissao, cert.codigo_validacao,
        u.nome as usuario_nome, c.titulo as curso_titulo
      FROM certificados cert
      JOIN usuarios u ON u.id = cert.user_id
      JOIN cursos c ON c.id = cert.curso_id
      ORDER BY cert.data_emissao DESC LIMIT 5
    `).all()
  ]);
  
  return c.json({
    stats: {
      totalUsuarios: totalUsuarios?.total || 0,
      totalCursos: totalCursos?.total || 0,
      totalCertificados: totalCertificados?.total || 0
    },
    usuariosPorPerfil: usuariosPorPerfil.results,
    cursosRecentes: cursosRecentes.results,
    certificadosRecentes: certificadosRecentes.results
  });
});

// Dashboard COLABORADOR
dashboard.get('/colaborador', authMiddleware, async (c) => {
  const user = c.get('user');
  
  const [cursosMatriculados, certificadosEmitidos, progressoGeral] = await Promise.all([
    c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM matriculas WHERE user_id = ?
    `).bind(user.sub).first<{ total: number }>(),
    c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM certificados WHERE user_id = ?
    `).bind(user.sub).first<{ total: number }>(),
    c.env.DB.prepare(`
      SELECT c.id, c.titulo, c.thumbnail,
        (SELECT COUNT(*) FROM aulas WHERE curso_id = c.id) as total_aulas,
        (SELECT COUNT(*) FROM progresso p 
         JOIN aulas a ON a.id = p.aula_id 
         WHERE p.user_id = ? AND p.concluido = 1 AND a.curso_id = c.id) as concluidas
      FROM cursos c
      INNER JOIN matriculas m ON m.curso_id = c.id AND m.user_id = ?
      WHERE c.ativo = 1
      ORDER BY c.created_at DESC
      LIMIT 6
    `).bind(user.sub, user.sub).all()
  ]);
  
  const cursosComProgresso = progressoGeral.results.map((c: any) => ({
    ...c,
    percentual: c.total_aulas > 0 ? Math.round((c.concluidas / c.total_aulas) * 100) : 0,
    concluido: c.total_aulas > 0 && c.concluidas >= c.total_aulas
  }));
  
  const cursosEmAndamento = cursosComProgresso.filter((c: any) => c.percentual > 0 && !c.concluido).length;
  const cursosConcluidos = cursosComProgresso.filter((c: any) => c.concluido).length;
  
  return c.json({
    stats: {
      cursosMatriculados: cursosMatriculados?.total || 0,
      certificadosEmitidos: certificadosEmitidos?.total || 0,
      cursosEmAndamento,
      cursosConcluidos
    },
    cursosRecentes: cursosComProgresso
  });
});

export default dashboard;
