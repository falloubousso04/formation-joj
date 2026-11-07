const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';

interface PgError {
  code: string;
  constraint?: string;
}

/**
 * Vrai si l'erreur vient d'une contrainte d'unicité. Drizzle enveloppe l'erreur du driver
 * (pg ou PGlite) : on remonte la chaîne `cause` jusqu'à l'erreur Postgres.
 */
export function isUniqueViolation(error: unknown, constraint: string): boolean {
  return isViolation(error, UNIQUE_VIOLATION, constraint);
}

/**
 * Vrai si l'erreur vient d'une clé étrangère : une ligne en référence encore une autre.
 * Sans `constraint`, n'importe quelle clé étrangère.
 */
export function isForeignKeyViolation(error: unknown, constraint?: string): boolean {
  return isViolation(error, FOREIGN_KEY_VIOLATION, constraint);
}

function isViolation(error: unknown, code: string, constraint?: string): boolean {
  for (let current = error; current instanceof Error; current = current.cause) {
    if ('code' in current && typeof current.code === 'string') {
      const pgError = current as Error & PgError;
      return (
        pgError.code === code && (constraint === undefined || pgError.constraint === constraint)
      );
    }
  }
  return false;
}
