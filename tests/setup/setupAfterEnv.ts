import mongoose from 'mongoose';
import fs from 'node:fs';
import path from 'node:path';

const ARQUIVO_URI = path.join(__dirname, '.mongo-uri');

/** Conecta ao MongoDB em memória antes de cada arquivo de teste. */
beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    const uri = fs.readFileSync(ARQUIVO_URI, 'utf8').trim();
    await mongoose.connect(uri);
  }
});

/** Limpa as coleções entre testes para manter isolamento. */
afterEach(async () => {
  const colecoes = await mongoose.connection.db?.collections();

  for (const colecao of colecoes ?? []) {
    await colecao.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});
