import { Hono } from 'hono';
import { signJWT } from '../utils/jwt';
import { hashPassword, comparePassword } from '../utils/crypto';
import type { Env, Usuario } from '../types';
import { v4 as uuidv4 } from 'uuid';

const auth = new Hono<{ Bindings: Env }>();

// Login
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, senha } = body;
    
    if (!email || !senha) {
      return c.json({ error: 'Email e senha são obrigatórios' }, 400);
    }
    
    const user = await c.env.DB.prepare(
      'SELECT * FROM usuarios WHERE email = ? AND ativo = 1'
    ).bind(email.toLowerCase().trim()).first<Usuario>();
    
    if (!user) {
      return c.json({ error: 'Credenciais inválidas' }, 401);
    }
    
    const senhaValida = await comparePassword(senha, user.senha_hash);
    if (!senhaValida) {
      return c.json({ error: 'Credenciais inválidas' }, 401);
    }
    
    const secret = c.env.JWT_SECRET || 'hrd-consultoria-secret-key-2024-very-secure';
    const token = await signJWT(
      { sub: user.id, nome: user.nome, email: user.email, perfil: user.perfil },
      secret
    );
    
    return c.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        perfil: user.perfil
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

// Obter dados do usuário logado
auth.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) return c.json({ error: 'Não autenticado' }, 401);
  
  const token = authHeader.split(' ')[1];
  if (!token) return c.json({ error: 'Token inválido' }, 401);
  
  const { verifyJWT } = await import('../utils/jwt');
  const secret = c.env.JWT_SECRET || 'hrd-consultoria-secret-key-2024-very-secure';
  const payload = await verifyJWT(token, secret);
  
  if (!payload) return c.json({ error: 'Token inválido' }, 401);
  
  const user = await c.env.DB.prepare(
    'SELECT id, nome, email, perfil, ativo, created_at FROM usuarios WHERE id = ?'
  ).bind(payload.sub).first<Omit<Usuario, 'senha_hash'>>();
  
  if (!user) return c.json({ error: 'Usuário não encontrado' }, 404);
  
  return c.json({ user });
});

export default auth;
