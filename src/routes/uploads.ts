import { Hono } from 'hono';
import { authMiddleware, requireRole } from '../middleware/auth';
import type { Env } from '../types';
import { v4 as uuidv4 } from 'uuid';

const uploads = new Hono<{ Bindings: Env; Variables: { user: any } }>();

// Limite de tamanho por chunk (400KB em base64 ≈ ~300KB binário)
const CHUNK_SIZE = 300 * 1024; // 300KB por chunk
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Upload de arquivo (PDF ou vídeo) — armazenado em chunks no D1
uploads.post('/', authMiddleware, requireRole('ADMIN', 'RH'), async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    const tipo = formData.get('tipo') as string | null; // 'pdf' | 'video'

    if (!file) return c.json({ error: 'Arquivo não enviado' }, 400);
    if (!tipo || !['pdf', 'video'].includes(tipo)) return c.json({ error: 'Tipo inválido' }, 400);

    if (file.size > MAX_FILE_SIZE) {
      return c.json({ error: `Arquivo muito grande. Limite: ${MAX_FILE_SIZE / 1024 / 1024}MB (atual: ${(file.size / 1024 / 1024).toFixed(1)}MB)` }, 400);
    }

    // Validar tipo MIME
    const allowedPDF = ['application/pdf'];
    const allowedVideo = ['video/mp4', 'video/webm', 'video/ogg', 'video/mpeg', 'video/quicktime'];
    const allowed = tipo === 'pdf' ? allowedPDF : allowedVideo;

    if (file.type && !allowed.includes(file.type) && !file.type.startsWith('video/')) {
      return c.json({ error: `Tipo de arquivo não permitido: ${file.type}` }, 400);
    }

    const user = c.get('user');
    const id = uuidv4();
    const nomeArquivo = file.name || `arquivo_${Date.now()}`;
    const agora = new Date().toISOString();
    const mimeType = file.type || (tipo === 'pdf' ? 'application/pdf' : 'video/mp4');

    // Ler arquivo como ArrayBuffer
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const totalBytes = bytes.length;
    const totalChunks = Math.ceil(totalBytes / CHUNK_SIZE);

    // Garantir que a tabela de chunks existe
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS arquivos_chunks (
        id TEXT NOT NULL,
        chunk_idx INTEGER NOT NULL,
        data TEXT NOT NULL,
        PRIMARY KEY (id, chunk_idx)
      )
    `).run();

    // Salvar metadados do arquivo
    await c.env.DB.prepare(`
      INSERT INTO arquivos (id, nome, tipo, mime_type, tamanho, total_chunks, enviado_por, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, nomeArquivo, tipo, mimeType, totalBytes, totalChunks, user.sub, agora).run();

    // Salvar arquivo em chunks de 300KB
    for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
      const start = chunkIdx * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, totalBytes);
      const chunkBytes = bytes.subarray(start, end);

      // Converter chunk para base64
      let binary = '';
      for (let i = 0; i < chunkBytes.length; i += 8192) {
        const slice = chunkBytes.subarray(i, i + 8192);
        binary += String.fromCharCode(...slice);
      }
      const chunkBase64 = btoa(binary);

      await c.env.DB.prepare(`
        INSERT INTO arquivos_chunks (id, chunk_idx, data) VALUES (?, ?, ?)
      `).bind(id, chunkIdx, chunkBase64).run();
    }

    return c.json({
      id,
      nome: nomeArquivo,
      tipo,
      tamanho: totalBytes,
      totalChunks,
      url: `/api/uploads/${id}`,
      created_at: agora
    }, 201);
  } catch (err: any) {
    console.error('Upload error:', err);
    return c.json({ error: 'Erro ao processar arquivo: ' + (err?.message || 'Desconhecido') }, 500);
  }
});

// Servir arquivo por ID (reassembla os chunks e envia)
uploads.get('/:id', authMiddleware, async (c) => {
  const { id } = c.req.param();

  const arquivo = await c.env.DB.prepare(
    'SELECT * FROM arquivos WHERE id = ?'
  ).bind(id).first<{ id: string; nome: string; tipo: string; mime_type: string; tamanho: number; total_chunks: number }>();

  if (!arquivo) return c.json({ error: 'Arquivo não encontrado' }, 404);

  // Buscar todos os chunks em ordem
  const result = await c.env.DB.prepare(
    'SELECT data FROM arquivos_chunks WHERE id = ? ORDER BY chunk_idx ASC'
  ).bind(id).all<{ data: string }>();

  if (!result.results || result.results.length === 0) {
    return c.json({ error: 'Chunks não encontrados' }, 404);
  }

  // Reassemblar os chunks
  const allBase64 = result.results.map(r => r.data).join('');
  
  // Decodificar base64 concatenado
  const binaryStr = atob(allBase64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const mimeType = arquivo.mime_type || (arquivo.tipo === 'pdf' ? 'application/pdf' : 'video/mp4');

  return new Response(bytes.buffer, {
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${arquivo.nome}"`,
      'Content-Length': String(arquivo.tamanho),
      'Cache-Control': 'public, max-age=3600',
      'Accept-Ranges': 'bytes',
    }
  });
});

// Listar arquivos do usuário / todos (ADMIN+RH)
uploads.get('/', authMiddleware, requireRole('ADMIN', 'RH'), async (c) => {
  const { tipo } = c.req.query();
  let query = 'SELECT id, nome, tipo, mime_type, tamanho, total_chunks, enviado_por, created_at FROM arquivos WHERE 1=1';
  const params: any[] = [];
  if (tipo) { query += ' AND tipo = ?'; params.push(tipo); }
  query += ' ORDER BY created_at DESC LIMIT 50';
  const result = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ arquivos: result.results });
});

// Excluir arquivo e seus chunks
uploads.delete('/:id', authMiddleware, requireRole('ADMIN', 'RH'), async (c) => {
  const { id } = c.req.param();
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM arquivos WHERE id = ?').bind(id),
    c.env.DB.prepare('DELETE FROM arquivos_chunks WHERE id = ?').bind(id),
  ]);
  return c.json({ success: true });
});

export default uploads;
