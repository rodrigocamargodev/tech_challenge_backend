import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'node:fs';
import path from 'node:path';

const ARQUIVO_URI = path.join(__dirname, '.mongo-uri');

/** Sobe um MongoDB em memória compartilhado por toda a suíte. */
export default async function globalSetup(): Promise<void> {
  const servidor = await MongoMemoryServer.create();
  fs.writeFileSync(ARQUIVO_URI, servidor.getUri(), 'utf8');

  // Guarda a instância para o teardown encerrar o processo do mongod.
  (globalThis as { __MONGOMS__?: MongoMemoryServer }).__MONGOMS__ = servidor;
}
