// Helpers compartidos por los controllers que consultan Mongo.

// Escapa los metacaracteres de regex para que un termino de busqueda no inyecte su propia regex
// (ReDoS o coincidencias no buscadas) en los filtros $regex.
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 11000 = violacion de indice unico (ej. un ISBN o un email repetido).
export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === 11000
  );
}

export function isValidationError(error: unknown): error is Error {
  return error instanceof Error && error.name === "ValidationError";
}
