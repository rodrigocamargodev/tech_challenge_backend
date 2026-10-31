import { NextFunction, Request, RequestHandler, Response } from 'express';

type HandlerAssincrono = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

/**
 * Encapsula controllers/middlewares assíncronos para que qualquer rejeição
 * seja encaminhada ao tratamento centralizado de erros.
 */
export const asyncHandler = (fn: HandlerAssincrono): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
