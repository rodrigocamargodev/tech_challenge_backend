import { IUser, Papel, UserModel } from '../../models/User';
import { AuthService } from '../../services/AuthService';
import { normalizarEmail } from '../../shared/utils/texto';

/**
 * Resultado da garantia de existência de um usuário de seed.
 * - `criado`: o usuário não existia e foi criado agora.
 * - `reutilizado`: já existia e está compatível (nada foi alterado).
 * - `incompativel`: já existia, mas diverge do esperado (nada foi alterado).
 */
export type StatusSeedUsuario = 'criado' | 'reutilizado' | 'incompativel';

export interface DadosSeedUsuario {
  nome: string;
  email: string;
  senha: string;
  role: Papel;
}

export interface ResultadoSeedUsuario {
  status: StatusSeedUsuario;
  email: string;
  usuario?: IUser;
  /** Motivo da incompatibilidade (apenas quando status === 'incompativel'). */
  motivo?: string;
}

/**
 * Garante a existência de um usuário de seed de forma idempotente e não destrutiva.
 *
 * Regras de segurança:
 * - Nunca sobrescreve senha, papel, nome ou status de um usuário existente.
 * - Nunca reativa contas desativadas silenciosamente.
 * - Se o registro existente divergir do esperado, apenas reporta (não altera).
 * - A senha é sempre armazenada com o mesmo hash bcrypt usado pelo backend.
 */
export const garantirUsuarioSeed = async (
  dados: DadosSeedUsuario,
  authService: AuthService = new AuthService()
): Promise<ResultadoSeedUsuario> => {
  const email = normalizarEmail(dados.email);
  const existente = await UserModel.findOne({ email });

  if (existente) {
    const divergencias: string[] = [];

    if (existente.role !== dados.role) {
      divergencias.push(`papel esperado "${dados.role}", encontrado "${existente.role}"`);
    }

    if (!existente.ativo) {
      divergencias.push('conta está desativada (ativo: false)');
    }

    if (divergencias.length > 0) {
      return {
        status: 'incompativel',
        email,
        usuario: existente,
        motivo: divergencias.join('; '),
      };
    }

    return { status: 'reutilizado', email, usuario: existente };
  }

  const passwordHash = await authService.gerarHashSenha(dados.senha);

  const usuario = await UserModel.create({
    nome: dados.nome.trim(),
    email,
    passwordHash,
    role: dados.role,
    ativo: true,
  });

  return { status: 'criado', email, usuario };
};
