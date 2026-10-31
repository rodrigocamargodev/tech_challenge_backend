import { NextFunction, Request, Response } from 'express';
import { Error as MongooseError } from 'mongoose';
import { AppError } from '../shared/errors/AppError';

interface RespostaErro {
  error: string;
  detalhes?: unknown;
}

/** Converte erros conhecidos em status HTTP + mensagem segura. */
const mapearErro = (erro: unknown): { status: number; corpo: RespostaErro } => {
  if (erro instanceof AppError) {
    return {
      status: erro.statusCode,
      corpo: { error: erro.message, ...(erro.detalhes ? { detalhes: erro.detalhes } : {}) },
    };
  }

  if (erro instanceof MongooseError.ValidationError) {
    const detalhes = Object.values(erro.errors).map((item) => ({
      campo: item.path,
      mensagem: item.message,
    }));
    return { status: 422, corpo: { error: 'Dados inválidos na requisição.', detalhes } };
  }

  if (erro instanceof MongooseError.CastError) {
    return { status: 400, corpo: { error: 'Identificador inválido.' } };
  }

  // Erro de chave duplicada do MongoDB (ex.: e-mail já cadastrado).
  if (typeof erro === 'object' && erro !== null && (erro as { code?: number }).code === 11000) {
    return { status: 409, corpo: { error: 'Registro já cadastrado.' } };
  }

  // JSON malformado enviado pelo cliente.
  if (erro instanceof SyntaxError && 'body' in erro) {
    return { status: 400, corpo: { error: 'JSON inválido no corpo da requisição.' } };
  }

  return { status: 500, corpo: { error: 'Erro interno do servidor.' } };
};

/** Middleware centralizado de erros (deve ser o último registrado). */
export const tratarErros = (
  erro: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const { status, corpo } = mapearErro(erro);

  // Log interno apenas; detalhes do banco nunca vão para o cliente.
  if (status >= 500) {
    console.error('❌ Erro não tratado:', erro);
  }

  res.status(status).json(corpo);
};

/** Rota não encontrada (404). */
export const rotaNaoEncontrada = (req: Request, res: Response): void => {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
};
