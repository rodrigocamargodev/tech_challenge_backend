import mongoose from 'mongoose';
import { env } from './env';

/**
 * Abre a conexão com o MongoDB.
 * A Promise só resolve quando a conexão está realmente pronta,
 * permitindo que o servidor HTTP só suba depois do banco.
 */
export const conectarBanco = async (uri: string = env.mongoUri): Promise<void> => {
  await mongoose.connect(uri);
  console.log('🍃 Conectado ao MongoDB com sucesso!');
};

export const desconectarBanco = async (): Promise<void> => {
  await mongoose.disconnect();
};

export const bancoEstaConectado = (): boolean => mongoose.connection.readyState === 1;