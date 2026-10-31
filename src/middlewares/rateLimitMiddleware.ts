import rateLimit from 'express-rate-limit';
import { ehAmbienteDeTeste } from '../config/env';

/**
 * Limita tentativas de login por IP para dificultar força bruta.
 * Desativado nos testes para não interferir na suíte.
 */
export const limitarLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => ehAmbienteDeTeste,
  message: { error: 'Muitas tentativas de login. Tente novamente em alguns minutos.' },
});
