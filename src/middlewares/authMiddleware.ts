import { NextFunction, Request, Response } from 'express';
import { UserModel, Papel } from '../models/User';
import { AppError } from '../shared/errors/AppError';
import { verificarToken } from '../shared/utils/jwt';

/**
 * Extrai o token do cabeçalho `Authorization: Bearer TOKEN`.
 * Não existe fallback para credenciais fixas.
 */
const extrairToken = (req: Request): string | null => {
  const cabecalho = req.headers.authorization;

  if (!cabecalho) return null;

  const [esquema, token] = cabecalho.split(' ');

  if (!token || esquema?.toLowerCase() !== 'bearer') return null;

  return token.trim();
};

/** Autenticação obrigatória: valida o JWT e carrega o usuário ativo. */
export const autenticar = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extrairToken(req);

    if (!token) {
      throw new AppError('Token de autenticação não fornecido.', 401);
    }

    let payload;
    try {
      payload = verificarToken(token);
    } catch {
      throw new AppError('Token inválido ou expirado.', 401);
    }

    const usuario = await UserModel.findById(payload.sub);

    if (!usuario) {
      throw new AppError('Usuário do token não existe mais.', 401);
    }

    if (!usuario.ativo) {
      throw new AppError('Usuário desativado.', 403);
    }

    req.usuario = usuario;
    next();
  } catch (erro) {
    next(erro);
  }
};

/** Autorização por papel. Deve ser usada depois de `autenticar`. */
export const autorizar =
  (...papeisPermitidos: Papel[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.usuario) {
      return next(new AppError('Autenticação necessária.', 401));
    }

    if (!papeisPermitidos.includes(req.usuario.role)) {
      return next(new AppError('Acesso negado. Permissão insuficiente.', 403));
    }

    next();
  };

/** Atalho: apenas professores autenticados. */
export const apenasProfessor = [autenticar, autorizar('professor')];