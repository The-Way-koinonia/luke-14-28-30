"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifySupabaseError = exports.PostgrestErrorSchema = exports.SupabaseErrorKind = void 0;
const zod_1 = require("zod");
/**
 * Canonical error classifications produced by analyzing a Supabase/Postgrest error.
 */
var SupabaseErrorKind;
(function (SupabaseErrorKind) {
    SupabaseErrorKind["MfaRequired"] = "MFA_REQUIRED";
    SupabaseErrorKind["RlsViolation"] = "RLS_VIOLATION";
    SupabaseErrorKind["Generic"] = "GENERIC";
})(SupabaseErrorKind || (exports.SupabaseErrorKind = SupabaseErrorKind = {}));
/**
 * Zod schema for the subset of PostgrestError fields we inspect.
 * Validates at the boundary so downstream logic operates on trusted data.
 */
exports.PostgrestErrorSchema = zod_1.z.object({
    code: zod_1.z.string().optional().describe('The PostgreSQL error code (e.g. 42501 for RLS violation)'),
    message: zod_1.z.string().default('An unexpected error occurred.').describe('Human-readable error message'),
    details: zod_1.z.string().optional().describe('Technical details about the error'),
    hint: zod_1.z.string().optional().describe('Hint for resolution'),
});
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
const classifySupabaseError = (error, operationRequiresMfa = true) => {
    const parsed = exports.PostgrestErrorSchema.parse(error);
    if (parsed.code === RLS_VIOLATION_CODE && operationRequiresMfa) {
        return { kind: SupabaseErrorKind.MfaRequired, message: parsed.message, raw: parsed };
    }
    if (parsed.code === RLS_VIOLATION_CODE) {
        return { kind: SupabaseErrorKind.RlsViolation, message: parsed.message, raw: parsed };
    }
    return { kind: SupabaseErrorKind.Generic, message: parsed.message, raw: parsed };
};
exports.classifySupabaseError = classifySupabaseError;
