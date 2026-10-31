import request from 'supertest';
import type { Express } from 'express';
import { UserModel, Papel } from '../../src/models/User';
import { AuthService } from '../../src/services/AuthService';
import { gerarToken } from '../../src/shared/utils/jwt';

export const SENHA_PADRAO = 'senhaSegura123';

export interface UsuarioCriado {
  id: string;
  nome: string;
  email: string;
  senha: string;
  role: Papel;
  token: string;
}

/** Cria um usuário direto no banco (sem passar pelas rotas). */
export const criarUsuario = async (
  role: Papel,
  opcoes: { nome?: string; email?: string; senha?: string; ativo?: boolean } = {}
): Promise<UsuarioCriado> => {
  const nome = opcoes.nome ?? (role === 'professor' ? 'Professor Teste' : 'Aluno Teste');
  const email = opcoes.email ?? `${role}.${Date.now()}.${Math.random().toString(36).slice(2)}@escola.com`;
  const senha = opcoes.senha ?? SENHA_PADRAO;

  const authService = new AuthService();
  const passwordHash = await authService.gerarHashSenha(senha);

  const ativo = opcoes.ativo ?? true;

  const usuario = await UserModel.create({
    nome,
    email,
    passwordHash,
    role,
    ativo,
  });

  // Usuários desativados não conseguem logar: gera o token direto.
  const token = ativo
    ? (await authService.login(email, senha)).token
    : gerarToken({ sub: String(usuario._id), role });

  return { id: String(usuario._id), nome, email, senha, role, token };
};

/** Cabeçalho Authorization no padrão Bearer. */
export const bearer = (token: string): string => `Bearer ${token}`;

/** Faz login via HTTP e devolve o token. */
export const loginHttp = async (
  app: Express,
  email: string,
  senha: string
): Promise<string> => {
  const resposta = await request(app).post('/auth/login').send({ email, senha });
  return resposta.body.token as string;
};
