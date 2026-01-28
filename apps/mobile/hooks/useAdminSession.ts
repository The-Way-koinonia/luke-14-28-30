import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AdminSession {
  expires_at: string;
  isActive: boolean;
  timeLeft: string;
}

export function useAdminSession() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('admin_sessions')
        .select('expires_at')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
        console.error('Error fetching admin session:', error);
      }

      if (data) {
        updateSessionState(data.expires_at);
      } else {
        setSession(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateSessionState = (expiresAt: string) => {
    const expiry = new Date(expiresAt).getTime();
    const now = new Date().getTime();
    const diff = expiry - now;

    if (diff > 0) {
      const minutes = Math.floor(diff / 60000);
      setSession({
        expires_at: expiresAt,
        isActive: true,
        timeLeft: `${minutes}m remaining`,
      });
    } else {
      setSession(null);
    }
  };

  const requestAccess = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('request_admin_access');
      
      if (error) {
        throw error;
      }

      if (data && data.success) {
        updateSessionState(data.expires_at);
        return true;
      }
    } catch (error: any) {
      console.error('Failed to request access:', error);
      alert(error.message || 'Failed to grant admin access.');
    } finally {
      setLoading(false);
    }
    return false;
  };

  useEffect(() => {
    fetchSession();
    const interval = setInterval(() => {
        if (session?.isActive) {
             updateSessionState(session.expires_at);
        }
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { session, loading, requestAccess };
}
