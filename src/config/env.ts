import dotenv from 'dotenv';

// `quiet` evita logs desnecessários do dotenv no console.
dotenv.config({ quiet: true });

/**
 * Lê uma variável de ambiente obrigatória.
 * Falha rápido (na inicialização) em vez de usar credenciais padrão inseguras.
 */
const obrigatoria = (nome: string): string => {
  const valor = process.env[nome];

  if (!valor || valor.trim() === '') {
    throw new Error(
      `Variável de ambiente obrigatória não definida: ${nome}. ` +
        'Copie o arquivo .env.example para .env e preencha os valores.'
    );
  }

  return valor;
};

const numero = (nome: string, padrao: number): number => {
  const valor = Number(process.env[nome]);
  return Number.isFinite(valor) && valor > 0 ? valor : padrao;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: numero('PORT', 3000),
  mongoUri: process.env.MONGO_URI ?? 'mongodb://localhost:27017/tech_challenge_blog',
  jwtSecret: obrigatoria('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  bcryptSaltRounds: numero('BCRYPT_SALT_ROUNDS', 12),
} as const;

export const ehAmbienteDeTeste = env.nodeEnv === 'test';
