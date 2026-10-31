/**
 * Escapa caracteres especiais de expressão regular.
 * Impede "regex injection" (ex.: termo ".*" retornando a coleção inteira
 * ou um padrão catastrófico travando o banco).
 */
export const escaparRegex = (texto: string): string =>
  texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const normalizarEmail = (email: string): string => email.trim().toLowerCase();
