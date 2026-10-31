import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/AuthService';
import { AppError } from '../shared/errors/AppError';
import { asyncHandler } from '../shared/utils/asyncHandler';
import { validarComSchema } from '../shared/utils/validacao';
import { paraUsuarioPublico } from '../models/User';

const senhaSchema = z
  .string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres.')
  .max(72, 'A senha deve ter no máximo 72 caracteres.');

const cadastroSchema = z.object({
  nome: z.string().trim().min(2, 'O nome deve ter no mínimo 2 caracteres.').max(120),
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
  senha: senhaSchema,
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
  senha: z.string().min(1, 'A senha é obrigatória.'),
});

export class AuthController {
  constructor(private authService = new AuthService()) {}

  /** POST /auth/register — cadastro público, sempre cria ALUNO. */
  registrar = asyncHandler(async (req: Request, res: Response) => {
    const dados = validarComSchema(cadastroSchema, req.body);
    const usuario = await this.authService.registrarAluno(dados);

    return res.status(201).json({ usuario });
  });

  /** POST /auth/login */
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, senha } = validarComSchema(loginSchema, req.body);
    const resultado = await this.authService.login(email, senha);

    return res.status(200).json(resultado);
  });

  /** GET /auth/me */
  me = asyncHandler(async (req: Request, res: Response) => {
    if (!req.usuario) {
      throw new AppError('Autenticação necessária.', 401);
    }

    return res.status(200).json({ usuario: paraUsuarioPublico(req.usuario) });
  });
}
