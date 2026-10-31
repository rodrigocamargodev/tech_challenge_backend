import { conectarBanco, desconectarBanco } from '../config/db';
import { garantirUsuarioSeed } from './shared/seedUsuario';

/**
 * Cria o primeiro professor (bootstrap do sistema).
 *
 * Uso:
 *   SEED_PROFESSOR_NOME="Prof. Exemplo" \
 *   SEED_PROFESSOR_EMAIL="professor@escola.com" \
 *   SEED_PROFESSOR_SENHA="senhaSegura123" \
 *   npm run seed:professor
 *
 * Se o e-mail já existir, nada é alterado (idempotente).
 *
 * Observação: para preparar o ambiente de demonstração completo (professor,
 * aluno e postagens) use `npm run seed:demo`.
 */
const executar = async (): Promise<void> => {
  const nome = process.env.SEED_PROFESSOR_NOME ?? 'Professor Administrador';
  const email = process.env.SEED_PROFESSOR_EMAIL;
  const senha = process.env.SEED_PROFESSOR_SENHA;

  if (!email || !senha) {
    console.error(
      '❌ Informe SEED_PROFESSOR_EMAIL e SEED_PROFESSOR_SENHA (e opcionalmente SEED_PROFESSOR_NOME).'
    );
    process.exit(1);
  }

  if (senha.length < 8) {
    console.error('❌ A senha do professor deve ter no mínimo 8 caracteres.');
    process.exit(1);
  }

  await conectarBanco();

  const resultado = await garantirUsuarioSeed({ nome, email, senha, role: 'professor' });

  if (resultado.status === 'criado') {
    console.log(`✅ Professor criado com sucesso: ${resultado.email}`);
  } else if (resultado.status === 'reutilizado') {
    console.log(`ℹ️  Já existe um usuário com o e-mail ${resultado.email}. Nada a fazer.`);
  } else {
    console.error(
      `⚠️  O e-mail ${resultado.email} já existe, mas está incompatível: ${resultado.motivo}. ` +
        'Nenhuma alteração foi feita.'
    );
  }

  await desconectarBanco();
};

executar().catch(async (erro) => {
  console.error('❌ Erro ao executar o seed:', erro);
  await desconectarBanco();
  process.exit(1);
});
