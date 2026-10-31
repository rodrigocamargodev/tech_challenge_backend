import { AuthService } from './AuthService';
import { IUser, Papel, UserModel, paraUsuarioPublico, UsuarioPublico } from '../models/User';
import { AppError } from '../shared/errors/AppError';
import { normalizarEmail } from '../shared/utils/texto';

export interface DadosCriacaoUsuario {
  nome: string;
  email: string;
  senha: string;
  role: Papel;
}

export interface DadosEdicaoUsuario {
  nome?: string;
  email?: string;
  senha?: string;
  role?: Papel;
  ativo?: boolean;
}

export class UserService {
  constructor(private authService = new AuthService()) {}

  async listar(role?: Papel): Promise<UsuarioPublico[]> {
    const filtro = role ? { role } : {};
    const usuarios = await UserModel.find(filtro).sort({ nome: 1 });
    return usuarios.map(paraUsuarioPublico);
  }

  async buscarPorId(id: string): Promise<UsuarioPublico> {
    const usuario = await UserModel.findById(id);

    if (!usuario) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    return paraUsuarioPublico(usuario);
  }

  /** Criação por professor: pode definir o papel explicitamente. */
  async criar(dados: DadosCriacaoUsuario): Promise<UsuarioPublico> {
    return this.authService.criarUsuario(dados);
  }

  /**
   * Atualiza um usuário.
   * Regras: ninguém altera o próprio papel; o papel só pode ser alterado
   * por um professor (garantido na rota) e nunca para um valor inválido.
   */
  async atualizar(
    id: string,
    dados: DadosEdicaoUsuario,
    solicitante: IUser
  ): Promise<UsuarioPublico> {
    const usuario = await UserModel.findById(id);

    if (!usuario) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    const ehProprioUsuario = String(usuario._id) === String(solicitante._id);

    if (dados.role !== undefined && dados.role !== usuario.role) {
      if (ehProprioUsuario) {
        throw new AppError('Você não pode alterar o seu próprio papel.', 403);
      }
      usuario.role = dados.role;
    }

    if (dados.nome !== undefined) {
      usuario.nome = dados.nome.trim();
    }

    if (dados.email !== undefined) {
      const email = normalizarEmail(dados.email);
      const emUso = await UserModel.exists({ email, _id: { $ne: usuario._id } });

      if (emUso) {
        throw new AppError('Já existe um usuário cadastrado com este e-mail.', 409);
      }

      usuario.email = email;
    }

    if (dados.senha !== undefined) {
      usuario.passwordHash = await this.authService.gerarHashSenha(dados.senha);
    }

    if (dados.ativo !== undefined) {
      if (ehProprioUsuario && dados.ativo === false) {
        throw new AppError('Você não pode desativar o seu próprio usuário.', 403);
      }
      usuario.ativo = dados.ativo;
    }

    await usuario.save();
    return paraUsuarioPublico(usuario);
  }

  /** DELETE lógico: desativa o usuário preservando o histórico. */
  async desativar(id: string, solicitante: IUser): Promise<UsuarioPublico> {
    const usuario = await UserModel.findById(id);

    if (!usuario) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    if (String(usuario._id) === String(solicitante._id)) {
      throw new AppError('Você não pode desativar o seu próprio usuário.', 403);
    }

    usuario.ativo = false;
    await usuario.save();

    return paraUsuarioPublico(usuario);
  }
}
