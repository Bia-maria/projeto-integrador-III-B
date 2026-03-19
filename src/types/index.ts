export type Perfil = 'ADMIN' | 'RH' | 'COLABORADOR';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha_hash: string;
  perfil: Perfil;
  ativo: number;
  created_at: string;
}

export interface Curso {
  id: string;
  titulo: string;
  descricao: string | null;
  thumbnail: string | null;
  criado_por: string;
  ativo: number;
  created_at: string;
}

export interface Aula {
  id: string;
  curso_id: string;
  titulo: string;
  descricao: string | null;
  tipo: 'pdf' | 'video' | 'youtube' | 'texto';
  url_ou_arquivo: string | null;
  conteudo_texto: string | null;
  ordem: number;
  created_at: string;
}

export interface Progresso {
  id: string;
  user_id: string;
  aula_id: string;
  concluido: number;
  data: string | null;
}

export interface Certificado {
  id: string;
  user_id: string;
  curso_id: string;
  data_emissao: string;
  codigo_validacao: string;
}

export interface Matricula {
  id: string;
  user_id: string;
  curso_id: string;
  created_at: string;
}

export interface JWTPayload {
  sub: string;
  nome: string;
  email: string;
  perfil: Perfil;
  iat: number;
  exp: number;
}

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}
