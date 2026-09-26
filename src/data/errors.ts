/* =========================================================================
   FamilyFinanceSync — Repository Errors & User-Safe Translation
   Maps database SQLSTATE codes and network errors into clean UI messages.
   ========================================================================= */

export type RepositoryErrorKind =
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'duplicate'
  | 'conflict'
  | 'validation'
  | 'unavailable'
  | 'internal';

export class RepositoryError extends Error {
  readonly kind: RepositoryErrorKind;
  readonly code?: string;

  constructor(kind: RepositoryErrorKind, message: string, code?: string) {
    super(message);
    this.name = 'RepositoryError';
    this.kind = kind;
    this.code = code;
  }
}

/**
 * Translates PostgreSQL errors (from Supabase client) to user-friendly RepositoryErrors.
 */
export function toRepositoryError(err: unknown): RepositoryError {
  if (err instanceof RepositoryError) return err;
  if (!err || typeof err !== 'object') {
    return new RepositoryError('internal', 'An unexpected error occurred');
  }

  const e = err as { code?: string; message?: string; details?: string; hint?: string };
  const code = e.code ?? '';
  const message = e.message ?? '';

  // PostgreSQL SQLSTATE 23505: unique_violation (e.g. idempotency key reused)
  if (code === '23505') {
    return new RepositoryError('duplicate', 'This transaction or request was already submitted.', code);
  }

  // PostgreSQL SQLSTATE 42501: insufficient_privilege (RLS failure)
  if (code === '42501' || message.includes('permission denied')) {
    return new RepositoryError('forbidden', 'You do not have permission to perform this action.', code);
  }

  // PostgreSQL SQLSTATE P0001: raise_exception from custom RPC
  if (code === 'P0001') {
    if (message.includes('NOT_FOUND')) return new RepositoryError('not_found', 'The requested record was not found.', code);
    if (message.includes('CANNOT_APPROVE_OWN')) return new RepositoryError('forbidden', 'You cannot approve your own request.', code);
    if (message.includes('ALREADY_REVIEWED')) return new RepositoryError('conflict', 'This request has already been reviewed.', code);
    if (message.includes('AMOUNT_MUST_BE_POSITIVE')) return new RepositoryError('validation', 'Amount must be greater than zero.', code);
    return new RepositoryError('validation', message, code);
  }

  // Network failures
  if (message.includes('fetch') || message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return new RepositoryError('unavailable', 'Cannot connect to server. Live sync is temporarily unavailable.', code);
  }

  return new RepositoryError('internal', message || 'Database operation failed', code);
}
