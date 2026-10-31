/**
 * Variáveis de ambiente usadas pela suíte de testes.
 * Executado antes de qualquer import da aplicação (setupFiles).
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'segredo-de-teste-nao-usar-em-producao';
process.env.JWT_EXPIRES_IN = '8h';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/tech_challenge_test';
// Custo baixo apenas em testes: mantém a suíte rápida.
process.env.BCRYPT_SALT_ROUNDS = '4';
process.env.CORS_ORIGIN = '*';
