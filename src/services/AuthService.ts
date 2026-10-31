import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { UserModel, IUser, Papel, paraUsuarioPublico, UsuarioPublico } from '../models/User';
import { AppError } from '../shared/errors/AppError';
import { gerarToken } from '../shared/utils/jwt';
import { normalizarEmail } from '../shared/utils/texto';

export interface DadosCadastro {
  nome: string;
  email: string;
  senha: string;
}

export interface ResultadoLogin {
  token: string;
  usuario: UsuarioPublico;
}

export class AuthService {
  /** Cria o hash da senha com bcrypt (custo configurável, padrão 12). */
  async gerarHashSenha(senha: string): Promise<string> {
    return bcrypt.hash(senha, env.bcryptSaltRounds);
  }

  async compararSenha(senha: string, hash: string): Promise<boolean> {
    return bcrypt.compare(senha, hash);
  }

  /**
   * Cadastro público: SEMPRE cria aluno.
   * O papel nunca vem do corpo da requisição.
   */
  async registrarAluno(dados: DadosCadastro): Promise<UsuarioPublico> {
    return this.criarUsuario({ ...dados, role: 'aluno' });
  }

  /** Criação interna de usuário (usada pelo cadastro público e por professores). */
  async criarUsuario(dados: DadosCadastro & { role: Papel }): Promise<UsuarioPublico> {
    const email = normalizarEmail(dados.email);

    const existente = await UserModel.exists({ email });
    if (existente) {
      throw new AppError('Já existe um usuário cadastrado com este e-mail.', 409);
    }

    const passwordHash = await this.gerarHashSenha(dados.senha);

    const usuario = await UserModel.create({
      nome: dados.nome.trim(),
      email,
      passwordHash,
      role: dados.role,
      ativo: true,
    });

    return paraUsuarioPublico(usuario);
  }

  /** Valida credenciais e devolve token + dados públicos do usuário. */
  async login(email: string, senha: string): Promise<ResultadoLogin> {
    const usuario = await UserModel.findOne({ email: normalizarEmail(email) }).select(
      '+passwordHash'
    );

    // Mensagem genérica: não revela se o e-mail existe.
    const credenciaisInvalidas = new AppError('E-mail ou senha inválidos.', 401);

    if (!usuario) {
      throw credenciaisInvalidas;
    }

    const senhaConfere = await this.compararSenha(senha, usuario.passwordHash);
    if (!senhaConfere) {
      throw credenciaisInvalidas;
    }

    if (!usuario.ativo) {
      throw new AppError('Usuário desativado. Procure um professor responsável.', 403);
    }

    return {
      token: gerarToken({ sub: String(usuario._id), role: usuario.role }),
      usuario: paraUsuarioPublico(usuario),
    };
  }

  /** Busca o usuário autenticado (usado por GET /auth/me). */
  async buscarPorId(id: string): Promise<IUser | null> {
    return UserModel.findById(id);
  }
}
