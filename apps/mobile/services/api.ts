import { ApiClient } from '@the-way/api-client';
import { API_BASE_URL } from '@/constants/config';
import { supabase } from '@/lib/supabase';

// Initialize the API Client with the dynamic base URL
export const api = new ApiClient({
  baseUrl: API_BASE_URL,
});

// Automatically attach auth token if user is signed in
supabase.auth.onAuthStateChange(async (event, session) => {
  if (session?.access_token) {
    api.setAuthToken(session.access_token);
  } else {
    api.setAuthToken('');
  }
});
