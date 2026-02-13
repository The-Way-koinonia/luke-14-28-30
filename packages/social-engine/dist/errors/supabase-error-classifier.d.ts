import { z } from 'zod';
/**
 * Canonical error classifications produced by analyzing a Supabase/Postgrest error.
 */
export declare enum SupabaseErrorKind {
    MfaRequired = "MFA_REQUIRED",
    RlsViolation = "RLS_VIOLATION",
    Generic = "GENERIC"
}
/**
 * Zod schema for the subset of PostgrestError fields we inspect.
 * Validates at the boundary so downstream logic operates on trusted data.
 */
export declare const PostgrestErrorSchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    message: z.ZodDefault<z.ZodString>;
    details: z.ZodOptional<z.ZodString>;
    hint: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type PostgrestErrorInput = z.infer<typeof PostgrestErrorSchema>;
export interface ClassifiedError {
    kind: SupabaseErrorKind;
    message: string;
    raw: PostgrestErrorInput;
}
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
export declare const classifySupabaseError: (error: unknown, operationRequiresMfa?: boolean) => ClassifiedError;
