import fs from 'node:fs';
import path from 'node:path';
import { UserModel } from '../src/models/User';
import { PostModel } from '../src/models/Post';
import { AuthService } from '../src/services/AuthService';
import * as db from '../src/config/db';
import {
  DEMO_PADRAO,
  ConfigSeedDemo,
  executarCliSeedDemo,
  executarSeedDemo,
  resolverConfigDemo,
  validarAmbienteDemo,
} from '../src/scripts/seedDemoCore';
import { POSTS_DEMO } from '../src/scripts/seedDemoData';

const ARQUIVO_URI = path.join(__dirname, 'setup', '.mongo-uri');
const uriMemoria = (): string => fs.readFileSync(ARQUIVO_URI, 'utf8').trim();

const configTeste: ConfigSeedDemo = {
  professor: {
    nome: 'Professor Demonstração',
    email: 'professor.demo@blogdegiz.local',
    senha: 'DemoProfessor123',
  },
  aluno: {
    nome: 'Aluno Demonstração',
    email: 'aluno.demo@blogdegiz.local',
    senha: 'DemoAluno123',
  },
};

describe('Seed de demonstração (seed:demo)', () => {
  describe('Criação de usuários', () => {
    it('cria o professor de demonstração com papel professor e ativo', async () => {
      const resumo = await executarSeedDemo(configTeste);

      expect(resumo.professoresCriados).toBe(1);

      const professor = await UserModel.findOne({ email: configTeste.professor.email });
      expect(professor).not.toBeNull();
      expect(professor?.role).toBe('professor');
      expect(professor?.ativo).toBe(true);
      expect(professor?.nome).toBe('Professor Demonstração');
    });

    it('cria o aluno de demonstração com papel aluno e ativo', async () => {
      const resumo = await executarSeedDemo(configTeste);

      expect(resumo.alunosCriados).toBe(1);

      const aluno = await UserModel.findOne({ email: configTeste.aluno.email });
      expect(aluno).not.toBeNull();
      expect(aluno?.role).toBe('aluno');
      expect(aluno?.ativo).toBe(true);
    });

    it('armazena as senhas com hash (nunca em texto puro)', async () => {
      await executarSeedDemo(configTeste);

      const professor = await UserModel.findOne({ email: configTeste.professor.email }).select(
        '+passwordHash'
      );

      expect(professor?.passwordHash).toBeDefined();
      expect(professor?.passwordHash).not.toBe(configTeste.professor.senha);

      const authService = new AuthService();
      await expect(
        authService.compararSenha(configTeste.professor.senha, professor!.passwordHash)
      ).resolves.toBe(true);
    });
  });

  describe('Criação de postagens', () => {
    it('cria as postagens fictícias (entre 4 e 6)', async () => {
      const resumo = await executarSeedDemo(configTeste);

      expect(POSTS_DEMO.length).toBeGreaterThanOrEqual(4);
      expect(POSTS_DEMO.length).toBeLessThanOrEqual(6);
      expect(resumo.postagensCriadas).toBe(POSTS_DEMO.length);

      const total = await PostModel.countDocuments();
      expect(total).toBe(POSTS_DEMO.length);
    });

    it('associa cada postagem ao professor de demonstração', async () => {
      await executarSeedDemo(configTeste);

      const professor = await UserModel.findOne({ email: configTeste.professor.email });
      const posts = await PostModel.find();

      expect(posts).toHaveLength(POSTS_DEMO.length);

      for (const post of posts) {
        expect(String(post.autorId)).toBe(String(professor!._id));
        expect(post.autor).toBe('Professor Demonstração');
      }
    });

    it('respeita os limites de tamanho do modelo', async () => {
      await executarSeedDemo(configTeste);

      const posts = await PostModel.find();
      for (const post of posts) {
        expect(post.titulo.length).toBeLessThanOrEqual(200);
        expect(post.conteudo.length).toBeLessThanOrEqual(20000);
        expect(post.conteudo.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Idempotência', () => {
    it('reutiliza usuários existentes sem duplicar', async () => {
      await executarSeedDemo(configTeste);
      const segundo = await executarSeedDemo(configTeste);

      expect(segundo.professoresCriados).toBe(0);
      expect(segundo.alunosCriados).toBe(0);
      expect(segundo.registrosReutilizados).toBeGreaterThanOrEqual(2);

      expect(await UserModel.countDocuments({ email: configTeste.professor.email })).toBe(1);
      expect(await UserModel.countDocuments({ email: configTeste.aluno.email })).toBe(1);
    });

    it('reutiliza postagens existentes sem duplicar', async () => {
      await executarSeedDemo(configTeste);
      const segundo = await executarSeedDemo(configTeste);

      expect(segundo.postagensCriadas).toBe(0);
      expect(await PostModel.countDocuments()).toBe(POSTS_DEMO.length);
    });

    it('não duplica nada após múltiplas execuções', async () => {
      await executarSeedDemo(configTeste);
      await executarSeedDemo(configTeste);
      await executarSeedDemo(configTeste);

      expect(await UserModel.countDocuments()).toBe(2);
      expect(await PostModel.countDocuments()).toBe(POSTS_DEMO.length);
    });

    it('preserva a senha de um usuário preexistente', async () => {
      const authService = new AuthService();
      const hashOriginal = await authService.gerarHashSenha('senhaOriginal123');

      await UserModel.create({
        nome: 'Professor Demonstração',
        email: configTeste.professor.email,
        passwordHash: hashOriginal,
        role: 'professor',
        ativo: true,
      });

      await executarSeedDemo(configTeste);

      const professor = await UserModel.findOne({ email: configTeste.professor.email }).select(
        '+passwordHash'
      );

      expect(professor?.passwordHash).toBe(hashOriginal);
    });

    it('não altera usuário existente incompatível (papel divergente)', async () => {
      await UserModel.create({
        nome: 'Aluno Demonstração',
        email: configTeste.aluno.email,
        passwordHash: await new AuthService().gerarHashSenha('senhaQualquer123'),
        role: 'professor',
        ativo: true,
      });

      await expect(executarSeedDemo(configTeste)).rejects.toThrow(/incompatível/i);

      const usuario = await UserModel.findOne({ email: configTeste.aluno.email });
      expect(usuario?.role).toBe('professor');
    });

    it('não reativa conta desativada silenciosamente', async () => {
      await UserModel.create({
        nome: 'Aluno Demonstração',
        email: configTeste.aluno.email,
        passwordHash: await new AuthService().gerarHashSenha('senhaQualquer123'),
        role: 'aluno',
        ativo: false,
      });

      await expect(executarSeedDemo(configTeste)).rejects.toThrow(/incompatível/i);

      const usuario = await UserModel.findOne({ email: configTeste.aluno.email });
      expect(usuario?.ativo).toBe(false);
    });
  });

  describe('Configuração e proteção de ambiente', () => {
    it('usa os valores padrão de demonstração quando não há variáveis', () => {
      const chaves = [
        'DEMO_PROFESSOR_EMAIL',
        'DEMO_PROFESSOR_PASSWORD',
        'DEMO_ALUNO_EMAIL',
        'DEMO_ALUNO_PASSWORD',
      ] as const;
      const anteriores = chaves.map((chave) => process.env[chave]);

      for (const chave of chaves) {
        delete process.env[chave];
      }

      try {
        const config = resolverConfigDemo();

        expect(config.professor.email).toBe(DEMO_PADRAO.professor.email);
        expect(config.aluno.email).toBe(DEMO_PADRAO.aluno.email);
      } finally {
        chaves.forEach((chave, indice) => {
          const valor = anteriores[indice];
          if (valor === undefined) {
            delete process.env[chave];
          } else {
            process.env[chave] = valor;
          }
        });
      }
    });

    it('bloqueia a execução quando NODE_ENV=production', () => {
      const anterior = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        expect(() => validarAmbienteDemo('mongodb://localhost:27017/db')).toThrow(
          /production/i
        );
      } finally {
        process.env.NODE_ENV = anterior;
      }
    });

    it('bloqueia host remoto por padrão e permite com opt-in explícito', () => {
      expect(() => validarAmbienteDemo('mongodb://db.remoto.example.com:27017/db')).toThrow(
        /não local/i
      );

      process.env.SEED_DEMO_PERMITIR_REMOTO = 'true';
      try {
        expect(() =>
          validarAmbienteDemo('mongodb://db.remoto.example.com:27017/db')
        ).not.toThrow();
      } finally {
        delete process.env.SEED_DEMO_PERMITIR_REMOTO;
      }
    });

    it('rejeita senha de demonstração com menos de 8 caracteres', async () => {
      await expect(
        executarSeedDemo({
          ...configTeste,
          professor: { ...configTeste.professor, senha: 'curta' },
        })
      ).rejects.toThrow(/mínimo 8 caracteres/i);
    });
  });

  describe('Ciclo de vida da conexão (CLI)', () => {
    it('encerra a conexão após sucesso', async () => {
      const spyDesconectar = jest.spyOn(db, 'desconectarBanco').mockResolvedValue(undefined);

      try {
        await executarCliSeedDemo(uriMemoria());
        expect(spyDesconectar).toHaveBeenCalledTimes(1);
      } finally {
        spyDesconectar.mockRestore();
      }
    });

    it('encerra a conexão mesmo quando o seed falha após conectar', async () => {
      const spyDesconectar = jest.spyOn(db, 'desconectarBanco').mockResolvedValue(undefined);
      const senhaAnterior = process.env.DEMO_PROFESSOR_PASSWORD;
      process.env.DEMO_PROFESSOR_PASSWORD = 'curta';

      try {
        await expect(executarCliSeedDemo(uriMemoria())).rejects.toThrow(/mínimo 8 caracteres/i);
        expect(spyDesconectar).toHaveBeenCalledTimes(1);
      } finally {
        spyDesconectar.mockRestore();
        if (senhaAnterior === undefined) {
          delete process.env.DEMO_PROFESSOR_PASSWORD;
        } else {
          process.env.DEMO_PROFESSOR_PASSWORD = senhaAnterior;
        }
      }
    });

    it('trata falha de conexão sem tentar desconectar', async () => {
      const spyConectar = jest
        .spyOn(db, 'conectarBanco')
        .mockRejectedValueOnce(new Error('falha simulada de conexão'));
      const spyDesconectar = jest.spyOn(db, 'desconectarBanco').mockResolvedValue(undefined);

      try {
        await expect(executarCliSeedDemo(uriMemoria())).rejects.toThrow(
          /falha simulada de conexão/i
        );
        expect(spyDesconectar).not.toHaveBeenCalled();
      } finally {
        spyConectar.mockRestore();
        spyDesconectar.mockRestore();
      }
    });
  });

  describe('Integração com a API', () => {
    it('permite login do professor e do aluno criados pelo seed', async () => {
      await executarSeedDemo(configTeste);
      const authService = new AuthService();

      const loginProfessor = await authService.login(
        configTeste.professor.email,
        configTeste.professor.senha
      );
      const loginAluno = await authService.login(configTeste.aluno.email, configTeste.aluno.senha);

      expect(loginProfessor.usuario.role).toBe('professor');
      expect(loginAluno.usuario.role).toBe('aluno');
      expect(loginProfessor.token).toBeTruthy();
      expect(loginAluno.token).toBeTruthy();
    });
  });
});
