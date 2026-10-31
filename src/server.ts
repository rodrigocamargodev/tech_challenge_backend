import { createApp } from './app';
import { conectarBanco, desconectarBanco } from './config/db';
import { env } from './config/env';

/**
 * Ponto de entrada da aplicação.
 * O servidor HTTP só começa a escutar depois que o MongoDB está conectado.
 */
const iniciar = async (): Promise<void> => {
  try {
    await conectarBanco();

    const app = createApp();
    const server = app.listen(env.port, () => {
      console.log(`🚀 Servidor Back-end rodando na porta ${env.port}`);
    });

    const encerrar = async (sinal: string): Promise<void> => {
      console.log(`\n${sinal} recebido. Encerrando servidor...`);
      server.close(async () => {
        await desconectarBanco();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => void encerrar('SIGINT'));
    process.on('SIGTERM', () => void encerrar('SIGTERM'));
  } catch (erro) {
    console.error('❌ Falha ao iniciar a aplicação:', erro);
    process.exit(1);
  }
};

void iniciar();