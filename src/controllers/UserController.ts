import { Request, Response } from 'express';
import { z } from 'zod';
import { UserService } from '../services/UserService';
import { PAPEIS } from '../models/User';
import { AppError } from '../shared/errors/AppError';
import { asyncHandler } from '../shared/utils/asyncHandler';
import { validarComSchema, validarObjectId } from '../shared/utils/validacao';

const senhaSchema = z
  .string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres.')
  .max(72, 'A senha deve ter no máximo 72 caracteres.');

const emailSchema = z.string().trim().toLowerCase().email('E-mail inválido.');

const criarUsuarioSchema = z.object({
  nome: z.string().trim().min(2, 'O nome deve ter no mínimo 2 caracteres.').max(120),
  email: emailSchema,
  senha: senhaSchema,
  role: z.enum(PAPEIS, { message: "O papel deve ser 'professor' ou 'aluno'." }),
});

const editarUsuarioSchema = z.object({
  nome: z.string().trim().min(2, 'O nome deve ter no mínimo 2 caracteres.').max(120).optional(),
  email: emailSchema.optional(),
  senha: senhaSchema.optional(),
  role: z.enum(PAPEIS, { message: "O papel deve ser 'professor' ou 'aluno'." }).optional(),
  ativo: z.boolean().optional(),
});

const listarQuerySchema = z.object({
  role: z.enum(PAPEIS, { message: "O papel deve ser 'professor' ou 'aluno'." }).optional(),
});

export class UserController {
  constructor(private userService = new UserService()) {}

  // GET /users?role=professor|aluno
  listar = asyncHandler(async (req: Request, res: Response) => {
    const { role } = validarComSchema(listarQuerySchema, req.query);
    const usuarios = await this.userService.listar(role);
    return res.status(200).json(usuarios);
  });

  // GET /users/:id
  obterPorId = asyncHandler(async (req: Request, res: Response) => {
    const id = validarObjectId(req.params.id as string, 'id');
    const usuario = await this.userService.buscarPorId(id);
    return res.status(200).json(usuario);
  });

  // POST /users — professor cria professor ou aluno
  criar = asyncHandler(async (req: Request, res: Response) => {
    const dados = validarComSchema(criarUsuarioSchema, req.body);
    const usuario = await this.userService.criar(dados);
    return res.status(201).json(usuario);
  });

  // PUT /users/:id
  atualizar = asyncHandler(async (req: Request, res: Response) => {
    if (!req.usuario) {
      throw new AppError('Autenticação necessária.', 401);
    }

    const id = validarObjectId(req.params.id as string, 'id');
    const dados = validarComSchema(editarUsuarioSchema, req.body);
    const usuario = await this.userService.atualizar(id, dados, req.usuario);

    return res.status(200).json(usuario);
  });

  // DELETE /users/:id — desativação lógica
  remover = asyncHandler(async (req: Request, res: Response) => {
    if (!req.usuario) {
      throw new AppError('Autenticação necessária.', 401);
    }

    const id = validarObjectId(req.params.id as string, 'id');
    const usuario = await this.userService.desativar(id, req.usuario);

    return res.status(200).json({
      message: 'Usuário desativado com sucesso.',
      usuario,
    });
  });
}
