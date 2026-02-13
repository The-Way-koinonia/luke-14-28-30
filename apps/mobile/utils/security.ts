import { Alert } from 'react-native';
import { PostgrestError } from '@supabase/supabase-js';
// Fixed Import Path: Importing from the package index
import {
  classifySupabaseError,
  SupabaseErrorKind,
  type ClassifiedError,
} from '@the-way/social-engine'; 

/**
 * Callbacks the UI layer can supply to react to specific error classifications.
 */
export interface ErrorHandlerCallbacks {
  /** Invoked when the error indicates the user must complete MFA. */
  onMfaRequired?: () => void;
}

/**
 * Handles a Supabase error by classifying it via pure domain logic
 * and dispatching to the appropriate UI side-effect.
 *
 * @param error - The raw {@link PostgrestError} (or `null`).
 * @param callbacks - Optional UI callbacks for specific error kinds.
 * @param operationRequiresMfa - Hint: did the failing operation require AAL2?
 * @returns `true` if the error was intercepted and handled (e.g. MFA flow
 *   triggered); `false` otherwise (a generic alert was shown, or error was null).
 */
export const handleSupabaseError = (
  error: PostgrestError | null,
  callbacks: ErrorHandlerCallbacks = {},
  operationRequiresMfa = true,
): boolean => {
  if (!error) return false;

  let classified: ClassifiedError;
  try {
    classified = classifySupabaseError(error, operationRequiresMfa);
  } catch {
    // Zod validation failed – treat as fully generic.
    console.error('Supabase Error (unclassifiable):', error);
    Alert.alert('Error', 'An unexpected error occurred.');
    return false;
  }

  console.error(`Supabase Error [${classified.kind}]:`, classified.raw);

  switch (classified.kind) {
    case SupabaseErrorKind.MfaRequired: {
      if (callbacks.onMfaRequired) {
        callbacks.onMfaRequired();
        return true;
      }
      // No MFA handler supplied – fall through to generic alert.
      Alert.alert('Authentication Required', 'This action requires additional verification.');
      return false;
    }

    case SupabaseErrorKind.RlsViolation: {
      Alert.alert('Permission Denied', classified.message);
      return false;
    }

    case SupabaseErrorKind.Generic:
    default: {
      Alert.alert('Error', classified.message);
      return false;
    }
  }
};