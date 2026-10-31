import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/tests/**/*.test.ts'],
  // Define variáveis de ambiente antes de qualquer import da aplicação.
  setupFiles: ['<rootDir>/tests/setup/env.ts'],
  // Sobe o MongoDB em memória uma única vez para toda a suíte.
  globalSetup: '<rootDir>/tests/setup/globalSetup.ts',
  globalTeardown: '<rootDir>/tests/setup/globalTeardown.ts',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/setupAfterEnv.ts'],
  testTimeout: 30000,
  // Os arquivos de teste compartilham o mesmo MongoDB em memória.
  // Execução serial evita que a limpeza de um arquivo apague dados de outro.
  maxWorkers: 1,
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts',
    '!src/scripts/**',
    '!src/shared/types/**',
  ],
  // Meta realista para projeto acadêmico (foco em regras de negócio e segurança).
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

export default config;