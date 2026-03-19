import { createMiddleware } from 'hono/factory';
import { verifyJWT, getTokenFromHeader } from '../utils/jwt';
import type { Env, JWTPayload, Perfil } from '../types';

type Variables = {
  user: JWTPayload;
};

export const authMiddleware = createMiddleware<{ Bindings: Env; Variables: Variables }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization');
    const token = getTokenFromHeader(authHeader);
    
    if (!token) {
      return c.json({ error: 'Token não fornecido' }, 401);
    }
    
    const secret = c.env.JWT_SECRET || 'hrd-consultoria-secret-key-2024-very-secure';
    const payload = await verifyJWT(token, secret);
    
    if (!payload) {
      return c.json({ error: 'Token inválido ou expirado' }, 401);
    }
    
    c.set('user', payload);
    await next();
  }
);

export function requireRole(...roles: Perfil[]) {
  return createMiddleware<{ Bindings: Env; Variables: Variables }>(async (c, next) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Não autenticado' }, 401);
    }
    if (!roles.includes(user.perfil)) {
      return c.json({ error: 'Sem permissão' }, 403);
    }
    await next();
  });
}
