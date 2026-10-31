import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import type { Papel } from '../../models/User';

export interface TokenPayload {
  sub: string;
  role: Papel;
}

/** Gera o JWT de acesso (expiração padrão de 8 horas). */
export const gerarToken = (payload: TokenPayload): string => {
  const opcoes: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  };

  return jwt.sign({ role: payload.role }, env.jwtSecret, {
    ...opcoes,
    subject: payload.sub,
  });
};

/** Valida a assinatura/expiração e devolve o payload tipado. */
export const verificarToken = (token: string): TokenPayload => {
  const decodificado = jwt.verify(token, env.jwtSecret);

  if (typeof decodificado === 'string' || !decodificado.sub) {
    throw new Error('Token inválido.');
  }

  return {
    sub: String(decodificado.sub),
    role: (decodificado as { role?: Papel }).role ?? 'aluno',
  };
};
