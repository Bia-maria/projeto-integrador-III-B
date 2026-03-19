import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload, Perfil } from '../types';

const JWT_SECRET_DEFAULT = 'hrd-consultoria-secret-key-2024-very-secure';

export async function signJWT(
  payload: { sub: string; nome: string; email: string; perfil: Perfil },
  secret: string = JWT_SECRET_DEFAULT
): Promise<string> {
  const secretKey = new TextEncoder().encode(secret);
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secretKey);
  return token;
}

export async function verifyJWT(
  token: string,
  secret: string = JWT_SECRET_DEFAULT
): Promise<JWTPayload | null> {
  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}
