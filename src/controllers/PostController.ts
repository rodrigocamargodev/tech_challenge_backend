import { Request, Response } from 'express';
import { z } from 'zod';
import { PostService } from '../services/PostService';
import { AppError } from '../shared/errors/AppError';
import { asyncHandler } from '../shared/utils/asyncHandler';
import { validarComSchema, validarObjectId } from '../shared/utils/validacao';

const criarPostSchema = z.object({
  titulo: z.string().trim().min(1, 'O título é obrigatório.').max(200),
  conteudo: z.string().trim().min(1, 'O conteúdo é obrigatório.').max(20000),
});

const editarPostSchema = z.object({
  titulo: z.string().trim().min(1, 'O título não pode ser vazio.').max(200).optional(),
  conteudo: z.string().trim().min(1, 'O conteúdo não pode ser vazio.').max(20000).optional(),
});

export class PostController {
  // Recebe a instância do serviço dinamicamente (Injeção de Dependência)
  constructor(private postService = new PostService()) {}

  // POST /posts — restrito a professores autenticados
  criar = asyncHandler(async (req: Request, res: Response) => {
    if (!req.usuario) {
      throw new AppError('Autenticação necessária.', 401);
    }

    // Mass assignment: apenas titulo/conteudo são aceitos do cliente.
    const { titulo, conteudo } = validarComSchema(criarPostSchema, req.body);

    // Autoria vem do token, nunca de um campo livre do frontend.
    const novoPost = await this.postService.criar({
      titulo,
      conteudo,
      autor: req.usuario.nome,
      autorId: String(req.usuario._id),
    });

    return res.status(201).json(novoPost);
  });

  // GET /posts — público
  listar = asyncHandler(async (_req: Request, res: Response) => {
    const posts = await this.postService.listarTodos();
    return res.status(200).json(posts);
  });

  // GET /posts/search?termo= — público
  buscar = asyncHandler(async (req: Request, res: Response) => {
    const { termo } = req.query;

    if (typeof termo !== 'string' || termo.trim() === '') {
      throw new AppError("O parâmetro de busca 'termo' é obrigatório.", 400);
    }

    const posts = await this.postService.buscarPorTermo(termo);
    return res.status(200).json(posts);
  });

  // GET /posts/:id — público
  obterPorId = asyncHandler(async (req: Request, res: Response) => {
    const id = validarObjectId(req.params.id as string, 'id');
    const post = await this.postService.buscarPorId(id);

    if (!post) {
      throw new AppError('Postagem não encontrada.', 404);
    }

    return res.status(200).json(post);
  });

  // PUT /posts/:id — restrito a professores autenticados
  atualizar = asyncHandler(async (req: Request, res: Response) => {
    const id = validarObjectId(req.params.id as string, 'id');
    const dados = validarComSchema(editarPostSchema, req.body);

    const postAtualizado = await this.postService.editar(id, dados);

    if (!postAtualizado) {
      throw new AppError('Postagem não encontrada para edição.', 404);
    }

    return res.status(200).json(postAtualizado);
  });

  // DELETE /posts/:id — restrito a professores autenticados
  remover = asyncHandler(async (req: Request, res: Response) => {
    const id = validarObjectId(req.params.id as string, 'id');
    const postExcluido = await this.postService.excluir(id);

    if (!postExcluido) {
      throw new AppError('Postagem não encontrada para exclusão.', 404);
    }

    return res.status(200).json({ message: 'Postagem excluída com sucesso!' });
  });
}
