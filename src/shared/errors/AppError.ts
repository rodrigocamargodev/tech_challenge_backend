/**
 * Erro de aplicação com status HTTP explícito.
 * Tudo que é lançado como AppError é considerado "esperado" e pode ser
 * devolvido ao cliente sem expor detalhes internos do banco.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly detalhes?: unknown;

  constructor(mensagem: string, statusCode = 400, detalhes?: unknown) {
    super(mensagem);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.detalhes = detalhes;
  }
}
