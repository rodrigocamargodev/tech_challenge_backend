import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'node:fs';
import path from 'node:path';

const ARQUIVO_URI = path.join(__dirname, '.mongo-uri');

export default async function globalTeardown(): Promise<void> {
  const servidor = (globalThis as { __MONGOMS__?: MongoMemoryServer }).__MONGOMS__;

  if (servidor) {
    await servidor.stop();
  }

  if (fs.existsSync(ARQUIVO_URI)) {
    fs.unlinkSync(ARQUIVO_URI);
  }
}
