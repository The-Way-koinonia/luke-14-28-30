import { z } from 'zod';

/**
 * Canonical error classifications produced by analyzing a Supabase/Postgrest error.
 */
export enum SupabaseErrorKind {
  MfaRequired = 'MFA_REQUIRED',
  RlsViolation = 'RLS_VIOLATION',
  Generic = 'GENERIC',
}

/**
 * Zod schema for the subset of PostgrestError fields we inspect.
 * Validates at the boundary so downstream logic operates on trusted data.
 */
export const PostgrestErrorSchema = z.object({
  code: z.string().optional().describe('The PostgreSQL error code (e.g. 42501 for RLS violation)'),
  message: z.string().default('An unexpected error occurred.').describe('Human-readable error message'),
  details: z.string().optional().describe('Technical details about the error'),
  hint: z.string().optional().describe('Hint for resolution'),
});

export type PostgrestErrorInput = z.infer<typeof PostgrestErrorSchema>;

export interface ClassifiedError {
  kind: SupabaseErrorKind;
  message: string;
  raw: PostgrestErrorInput;
}

const RLS_VIOLATION_CODE = '42501';

/**
 * Pure function: classifies a Supabase/Postgrest error into a domain-meaningful kind.
 *
 * Heuristic: code `42501` (RLS policy violation) in an app whose RLS policies
 * gate on `(auth.jwt() ->> 'aal') = 'aal2'` implies the caller has not
 * completed MFA.  All other `42501` errors are still surfaced as RLS violations
 * so the UI layer can decide how to present them.
 *
 * @param error - Raw error payload (will be validated via Zod).
 * @param operationRequiresMfa - Caller declares whether the operation that
 *   produced this error is known to require AAL2.  Defaults to `true` to
 *   preserve the existing behaviour.
 * @returns A {@link ClassifiedError} with the determined kind and a safe message.
 */
export const classifySupabaseError = (
  error: unknown,
  operationRequiresMfa = true,
): ClassifiedError => {
  const parsed = PostgrestErrorSchema.parse(error);

  if (parsed.code === RLS_VIOLATION_CODE && operationRequiresMfa) {
    return { kind: SupabaseErrorKind.MfaRequired, message: parsed.message, raw: parsed };
  }

  if (parsed.code === RLS_VIOLATION_CODE) {
    return { kind: SupabaseErrorKind.RlsViolation, message: parsed.message, raw: parsed };
  }

  return { kind: SupabaseErrorKind.Generic, message: parsed.message, raw: parsed };
};
