import { Alert } from 'react-native';
import { PostgrestError } from '@supabase/supabase-js';

// Define a custom error type or extended interface if necessary
interface SupabaseErrorWithDetails extends PostgrestError {
  details?: string;
  hint?: string;
}

/**
 * Handles Supabase errors, specifically checking for RLS violations and MFA requirements.
 * @param error The error object returned from Supabase.
 * @param onMfaRequired Callback to trigger the MFA challenge flow (e.g., open a modal).
 * @returns boolean - Returns true if the error was handled (e.g., MFA required), false otherwise.
 */
export const handleSupabaseError = (
  error: PostgrestError | null,
  onMfaRequired?: () => void
): boolean => {
  if (!error) return false;

  console.error('Supabase Error:', error);

  // Check for RLS Policy Violation (42501)
  // Note: Sometimes policies fail silent for SELECT, but for INSERT/UPDATE/DELETE they throw.
  if (error.code === '42501') {
    // We can infer MFA requirement if we know the policy relies on it,
    // or sometimes the error message might be generic.
    // However, if we specificially know the operation required MFA (like delete/update in our schema),
    // and it failed with RLS violation, it's likely due to missing AAL2 level.
    
    // In a real generic handler, we might need more specific checks or custom error codes raised from DB functions.
    // Deducing 'MFA Required' from 42501 is a heuristic for this specific app architecture
    // where we added (select auth.jwt() ->> 'aal') = 'aal2'.
    
    if (onMfaRequired) {
      // Trigger MFA flow
      onMfaRequired();
      return true;
    }
  }

  // Fallback generic alert
  Alert.alert('Error', error.message || 'An unexpected error occurred.');
  return false;
};
