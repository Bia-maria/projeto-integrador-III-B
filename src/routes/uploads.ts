import { Hono } from 'hono';
import { authMiddleware, requireRole } from '../middleware/auth';
import type { Env } from '../types';
import { v4 as uuidv4 } from 'uuid';

const uploads = new Hono<{ Bindings: Env; Variables: { user: any } }>();

// Tabela de arquivos: armazena arquivo em base64 no D1 (para arquivos < 5MB)
// Criar tabela de arquivos (feito no middleware de init do index.tsx)

// Upload de arquivo (PDF ou vídeo pequeno) — armazenado como base64 no D1
uploads.post('/', authMiddleware, requireRole('ADMIN', 'RH'), async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    const tipo = formData.get('tipo') as string | null; // 'pdf' | 'video'

    if (!file) return c.json({ error: 'Arquivo não enviado' }, 400);
    if (!tipo || !['pdf', 'video'].includes(tipo)) return c.json({ error: 'Tipo inválido' }, 400);

    // Limite: 8 MB
    const maxBytes = 8 * 1024 * 1024;
    if (file.size > maxBytes) {
      return c.json({ error: `Arquivo muito grande. Limite: 8MB (atual: ${(file.size / 1024 / 1024).toFixed(1)}MB)` }, 400);
    }

    // Validar tipo MIME
    const allowedPDF = ['application/pdf'];
    const allowedVideo = ['video/mp4', 'video/webm', 'video/ogg', 'video/mpeg', 'video/quicktime'];
    const allowed = tipo === 'pdf' ? allowedPDF : allowedVideo;

    if (file.type && !allowed.includes(file.type) && !file.type.startsWith('video/')) {
      return c.json({ error: `Tipo de arquivo não permitido: ${file.type}` }, 400);
    }

    // Ler como ArrayBuffer e converter para base64
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    // Converter para base64 em chunks para evitar stack overflow
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    const base64 = btoa(binary);
    const dataUrl = `data:${file.type || (tipo === 'pdf' ? 'application/pdf' : 'video/mp4')};base64,${base64}`;

    const user = c.get('user');
    const id = uuidv4();
    const nomeArquivo = file.name || `arquivo_${Date.now()}`;
    const agora = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO arquivos (id, nome, tipo, mime_type, tamanho, data_base64, enviado_por, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, nomeArquivo, tipo, file.type || '', file.size, dataUrl, user.sub, agora).run();

    return c.json({
      id,
      nome: nomeArquivo,
      tipo,
      tamanho: file.size,
      url: `/api/uploads/${id}`,
      created_at: agora
    }, 201);
  } catch (err: any) {
    console.error('Upload error:', err);
    return c.json({ error: 'Erro ao processar arquivo: ' + (err?.message || 'Desconhecido') }, 500);
  }
});

// Servir arquivo por ID (data URL para incorporação direta no navegador)
uploads.get('/:id', authMiddleware, async (c) => {
  const { id } = c.req.param();

  const arquivo = await c.env.DB.prepare(
    'SELECT * FROM arquivos WHERE id = ?'
  ).bind(id).first<{ id: string; nome: string; tipo: string; mime_type: string; tamanho: number; data_base64: string }>();

  if (!arquivo) return c.json({ error: 'Arquivo não encontrado' }, 404);

  // Extrair base64 do data URL
  const dataUrl = arquivo.data_base64;
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) return c.json({ error: 'Formato inválido' }, 500);

  const base64Data = dataUrl.substring(commaIdx + 1);
  const mimeType = arquivo.mime_type || (arquivo.tipo === 'pdf' ? 'application/pdf' : 'video/mp4');

  // Decodificar base64
  const binaryStr = atob(base64Data);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const disposition = arquivo.tipo === 'pdf' ? 'inline' : 'inline';

  return new Response(bytes.buffer, {
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': `${disposition}; filename="${arquivo.nome}"`,
      'Content-Length': String(arquivo.tamanho),
      'Cache-Control': 'public, max-age=3600',
    }
  });
});

// Listar arquivos do usuário / todos (ADMIN+RH)
uploads.get('/', authMiddleware, requireRole('ADMIN', 'RH'), async (c) => {
  const { tipo } = c.req.query();
  let query = 'SELECT id, nome, tipo, mime_type, tamanho, enviado_por, created_at FROM arquivos WHERE 1=1';
  const params: any[] = [];
  if (tipo) { query += ' AND tipo = ?'; params.push(tipo); }
  query += ' ORDER BY created_at DESC LIMIT 50';
  const result = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ arquivos: result.results });
});

// Excluir arquivo
uploads.delete('/:id', authMiddleware, requireRole('ADMIN', 'RH'), async (c) => {
  const { id } = c.req.param();
  await c.env.DB.prepare('DELETE FROM arquivos WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

export default uploads;
