import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import authRoutes from './routes/authRoutes';
import postRoutes from './routes/postRoutes';
import userRoutes from './routes/userRoutes';
import { rotaNaoEncontrada, tratarErros } from './middlewares/errorMiddleware';

/**
 * Fábrica única do app Express.
 * Usada tanto pelo servidor HTTP (server.ts) quanto pelos testes (Supertest),
 * garantindo que ambos exercitem exatamente a mesma configuração.
 */
export const createApp = (): Express => {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',').map((o) => o.trim()),
    })
  );
  app.use(express.json({ limit: '1mb' }));

  // Rota base para checagem rápida
  app.get('/', (_req, res) => {
    res.json({ message: 'Back-end do Tech Challenge rodando perfeitamente!' });
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(authRoutes);
  app.use(userRoutes);
  app.use(postRoutes);

  // 404 e tratamento centralizado de erros (sempre por último)
  app.use(rotaNaoEncontrada);
  app.use(tratarErros);

  return app;
};

export default createApp;
