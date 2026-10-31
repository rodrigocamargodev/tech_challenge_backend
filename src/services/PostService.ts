import { PostModel, IPost } from '../models/Post';
import { AppError } from '../shared/errors/AppError';
import { escaparRegex } from '../shared/utils/texto';

export interface DadosCriacaoPost {
  titulo: string;
  conteudo: string;
  /** Nome do autor derivado do usuário autenticado (nunca do corpo da requisição). */
  autor: string;
  autorId?: string;
}

export interface DadosEdicaoPost {
  titulo?: string;
  conteudo?: string;
}

export class PostService {
  async criar(dados: DadosCriacaoPost): Promise<IPost> {
    if (!dados.titulo || !dados.conteudo || !dados.autor) {
      throw new AppError('Todos os campos (titulo, conteudo, autor) são obrigatórios.', 400);
    }

    const novoPost = new PostModel({
      titulo: dados.titulo,
      conteudo: dados.conteudo,
      autor: dados.autor,
      autorId: dados.autorId,
    });

    return novoPost.save();
  }

  async listarTodos(): Promise<IPost[]> {
    return PostModel.find().sort({ criadoEm: -1 });
  }

  /** Busca por termo no título ou conteúdo (case-insensitive, regex escapada). */
  async buscarPorTermo(termo: string): Promise<IPost[]> {
    const termoLimpo = termo.trim();

    if (!termoLimpo) {
      throw new AppError("O parâmetro de busca 'termo' é obrigatório.", 400);
    }

    const padrao = escaparRegex(termoLimpo);

    return PostModel.find({
      $or: [
        { titulo: { $regex: padrao, $options: 'i' } },
        { conteudo: { $regex: padrao, $options: 'i' } },
      ],
    }).sort({ criadoEm: -1 });
  }

  async buscarPorId(id: string): Promise<IPost | null> {
    return PostModel.findById(id);
  }

  /** Edita apenas campos permitidos; autoria e campos internos são imutáveis. */
  async editar(id: string, dados: DadosEdicaoPost): Promise<IPost | null> {
    const alteracoes: DadosEdicaoPost = {};

    if (dados.titulo !== undefined) alteracoes.titulo = dados.titulo;
    if (dados.conteudo !== undefined) alteracoes.conteudo = dados.conteudo;

    if (Object.keys(alteracoes).length === 0) {
      throw new AppError('Informe ao menos um campo para atualização (titulo ou conteudo).', 400);
    }

    return PostModel.findByIdAndUpdate(id, alteracoes, {
      returnDocument: 'after',
      runValidators: true,
    });
  }

  async excluir(id: string): Promise<IPost | null> {
    return PostModel.findByIdAndDelete(id);
  }
}