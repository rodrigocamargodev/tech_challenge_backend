import { Types } from 'mongoose';
import { env } from '../config/env';
import { conectarBanco, desconectarBanco } from '../config/db';
import { PostModel } from '../models/Post';
import { AuthService } from '../services/AuthService';
import { garantirUsuarioSeed, ResultadoSeedUsuario } from './shared/seedUsuario';
import { POSTS_DEMO } from './seedDemoData';

/** Credenciais padrão de demonstração (apenas para desenvolvimento/avaliação local). */
export const DEMO_PADRAO = {
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
} as const;

export interface ConfigSeedDemo {
  professor: { nome: string; email: string; senha: string };
  aluno: { nome: string; email: string; senha: string };
}

export interface ResumoSeedDemo {
  professoresCriados: number;
  alunosCriados: number;
  postagensCriadas: number;
  registrosReutilizados: number;
  /** Avisos não fatais (ex.: usuário existente incompatível, post de outro autor). */
  avisos: string[];
}

/** Lê a configuração de demonstração das variáveis de ambiente, com padrões seguros. */
export const resolverConfigDemo = (): ConfigSeedDemo => ({
  professor: {
    nome: process.env.DEMO_PROFESSOR_NOME?.trim() || DEMO_PADRAO.professor.nome,
    email: process.env.DEMO_PROFESSOR_EMAIL?.trim() || DEMO_PADRAO.professor.email,
    senha: process.env.DEMO_PROFESSOR_PASSWORD || DEMO_PADRAO.professor.senha,
  },
  aluno: {
    nome: process.env.DEMO_ALUNO_NOME?.trim() || DEMO_PADRAO.aluno.nome,
    email: process.env.DEMO_ALUNO_EMAIL?.trim() || DEMO_PADRAO.aluno.email,
    senha: process.env.DEMO_ALUNO_PASSWORD || DEMO_PADRAO.aluno.senha,
  },
});

/** Hosts considerados locais (seguros para o seed de demonstração). */
const HOSTS_LOCAIS = new Set(['localhost', '127.0.0.1', '::1', 'mongodb']);

const extrairHost = (uri: string): string | null => {
  // Aceita mongodb:// e mongodb+srv://
  const match = uri.match(/^mongodb(?:\+srv)?:\/\/(?:[^@/]*@)?([^:/?,]+)/i);
  return match ? match[1].toLowerCase() : null;
};

/**
 * Proteção contra execução acidental em produção.
 *
 * Bloqueia quando:
 * - `NODE_ENV === 'production'`; ou
 * - a conexão aponta para um host que não é local (localhost/127.0.0.1/::1/mongodb).
 *
 * A verificação do host pode ser dispensada explicitamente com
 * `SEED_DEMO_PERMITIR_REMOTO=true` (uso consciente, nunca silencioso).
 */
export const validarAmbienteDemo = (uri: string = env.mongoUri): void => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Seed de demonstração bloqueado: NODE_ENV=production. ' +
        'Este comando é exclusivo para desenvolvimento e avaliação local.'
    );
  }

  const host = extrairHost(uri);
  const permitirRemoto = process.env.SEED_DEMO_PERMITIR_REMOTO === 'true';

  if (host && !HOSTS_LOCAIS.has(host) && !permitirRemoto) {
    throw new Error(
      `Seed de demonstração bloqueado: a conexão aponta para um host não local ("${host}"). ` +
        'Use um MongoDB local ou defina SEED_DEMO_PERMITIR_REMOTO=true conscientemente.'
    );
  }
};

const validarSenha = (rotulo: string, senha: string): void => {
  if (senha.length < 8) {
    throw new Error(`A senha de demonstração de ${rotulo} deve ter no mínimo 8 caracteres.`);
  }
};

/**
 * Executa o seed de demonstração assumindo que a conexão com o MongoDB já está aberta.
 * É idempotente e não destrutivo: nunca apaga, sobrescreve senhas ou altera papéis.
 */
export const executarSeedDemo = async (
  config: ConfigSeedDemo = resolverConfigDemo(),
  authService: AuthService = new AuthService()
): Promise<ResumoSeedDemo> => {
  validarSenha('professor', config.professor.senha);
  validarSenha('aluno', config.aluno.senha);

  const avisos: string[] = [];

  const resultadoProfessor: ResultadoSeedUsuario = await garantirUsuarioSeed(
    { ...config.professor, role: 'professor' },
    authService
  );

  if (resultadoProfessor.status === 'incompativel') {
    throw new Error(
      `O e-mail do professor de demonstração (${resultadoProfessor.email}) já existe, ` +
        `mas está incompatível: ${resultadoProfessor.motivo}. ` +
        'Nenhuma alteração foi feita. Ajuste o registro manualmente ou use outro e-mail.'
    );
  }

  const resultadoAluno: ResultadoSeedUsuario = await garantirUsuarioSeed(
    { ...config.aluno, role: 'aluno' },
    authService
  );

  if (resultadoAluno.status === 'incompativel') {
    throw new Error(
      `O e-mail do aluno de demonstração (${resultadoAluno.email}) já existe, ` +
        `mas está incompatível: ${resultadoAluno.motivo}. ` +
        'Nenhuma alteração foi feita. Ajuste o registro manualmente ou use outro e-mail.'
    );
  }

  const professor = resultadoProfessor.usuario!;
  const professorId = professor._id as Types.ObjectId;

  let postagensCriadas = 0;
  let postagensReutilizadas = 0;

  for (const post of POSTS_DEMO) {
    // Identificador estável: título exato da postagem de demonstração.
    const existente = await PostModel.findOne({ titulo: post.titulo });

    if (existente) {
      postagensReutilizadas += 1;

      if (existente.autorId && String(existente.autorId) !== String(professorId)) {
        avisos.push(
          `A postagem "${post.titulo}" já existe, mas pertence a outro autor. ` +
            'Foi preservada sem alterações.'
        );
      }

      continue;
    }

    await PostModel.create({
      titulo: post.titulo,
      conteudo: post.conteudo,
      autor: professor.nome,
      autorId: professorId,
    });

    postagensCriadas += 1;
  }

  const professoresCriados = resultadoProfessor.status === 'criado' ? 1 : 0;
  const alunosCriados = resultadoAluno.status === 'criado' ? 1 : 0;

  const registrosReutilizados =
    (resultadoProfessor.status === 'reutilizado' ? 1 : 0) +
    (resultadoAluno.status === 'reutilizado' ? 1 : 0) +
    postagensReutilizadas;

  return {
    professoresCriados,
    alunosCriados,
    postagensCriadas,
    registrosReutilizados,
    avisos,
  };
};

/** Monta o resumo textual exibido no terminal. */
export const formatarResumo = (resumo: ResumoSeedDemo): string => {
  const linhas = [
    '====================================',
    ' BLOG DE GIZ — SEED DE DEMONSTRAÇÃO',
    '====================================',
    '',
    '[OK] Conexão com MongoDB estabelecida.',
    '[OK] Professor de demonstração verificado.',
    '[OK] Aluno de demonstração verificado.',
    `[OK] ${POSTS_DEMO.length} postagens de demonstração verificadas.`,
    '',
    'Resumo:',
    `- Professores criados: ${resumo.professoresCriados}`,
    `- Alunos criados: ${resumo.alunosCriados}`,
    `- Postagens criadas: ${resumo.postagensCriadas}`,
    `- Registros reutilizados: ${resumo.registrosReutilizados}`,
  ];

  if (resumo.avisos.length > 0) {
    linhas.push('', 'Avisos:');
    for (const aviso of resumo.avisos) {
      linhas.push(`- ${aviso}`);
    }
  }

  linhas.push('', '[OK] Ambiente de demonstração preparado.');
  return linhas.join('\n');
};

/**
 * Orquestra a execução completa do seed de demonstração (usada pelo CLI e testável).
 *
 * Garante:
 * - validação do ambiente ANTES de conectar;
 * - encerramento da conexão tanto em sucesso quanto em erro.
 */
export const executarCliSeedDemo = async (
  uri: string = env.mongoUri
): Promise<ResumoSeedDemo> => {
  validarAmbienteDemo(uri);

  let conectado = false;

  try {
    await conectarBanco(uri);
    conectado = true;

    const resumo = await executarSeedDemo(resolverConfigDemo());
    console.log(formatarResumo(resumo));
    return resumo;
  } finally {
    if (conectado) {
      await desconectarBanco();
    }
  }
};
