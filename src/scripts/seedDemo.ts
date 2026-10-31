import { desconectarBanco } from '../config/db';
import { executarCliSeedDemo } from './seedDemoCore';

/**
 * Seed unificado do ambiente de demonstração do Blog de Giz.
 *
 * Uso:
 *   npm run seed:demo
 *
 * Cria (ou reutiliza) um professor, um aluno e as postagens fictícias.
 * É idempotente e bloqueado em produção. Veja o README para detalhes.
 */
executarCliSeedDemo()
  .then(() => {
    process.exit(0);
  })
  .catch(async (erro: unknown) => {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    console.error(`❌ Falha no seed de demonstração: ${mensagem}`);

    // Garante o encerramento da conexão mesmo em caso de erro.
    try {
      await desconectarBanco();
    } catch {
      // Ignora falha ao desconectar durante o tratamento de erro.
    }

    process.exit(1);
  });
