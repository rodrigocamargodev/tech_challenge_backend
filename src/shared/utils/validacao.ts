import { Types } from 'mongoose';
import { z } from 'zod';
import { AppError } from '../errors/AppError';

/** Valida um ObjectId do MongoDB, evitando CastError (500) em IDs malformados. */
export const validarObjectId = (id: string, campo = 'id'): string => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(`Identificador inválido: ${campo}.`, 400);
  }
  return id;
};

/**
 * Executa um schema Zod e lança AppError 422 com a lista de campos inválidos.
 * Retorna apenas os campos declarados no schema (proteção contra mass assignment).
 */
export const validarComSchema = <T extends z.ZodTypeAny>(schema: T, dados: unknown): z.infer<T> => {
  const resultado = schema.safeParse(dados ?? {});

  if (!resultado.success) {
    const detalhes = resultado.error.issues.map((issue) => ({
      campo: issue.path.join('.') || '(corpo)',
      mensagem: issue.message,
    }));

    throw new AppError('Dados inválidos na requisição.', 422, detalhes);
  }

  return resultado.data;
};
