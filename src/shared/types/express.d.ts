import type { IUser } from '../../models/User';

declare global {
  namespace Express {
    interface Request {
      /** Preenchido pelo middleware `autenticar` após validar o JWT. */
      usuario?: IUser;
    }
  }
}

export {};
