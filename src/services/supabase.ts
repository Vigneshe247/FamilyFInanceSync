/* =========================================================
   SUPABASE CLIENT & AUTH SERVICE WRAPPER
   URL: https://srabbqfnpibohwdzjfuo.supabase.co
   ========================================================= */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://srabbqfnpibohwdzjfuo.supabase.co';

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_7kLSYd9oAWHuNsyxSK5yQw_NnQ3XppV';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const supabaseAuthService = {
  async signUp(email: string, password: string, metadata?: Record<string, any>) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      console.warn('Supabase Auth SignUp (falling back to client session):', err.message);
      return { success: false, error: err.message };
    }
  },

  async signInWithPassword(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      console.warn('Supabase Auth SignIn (falling back to client session):', err.message);
      return { success: false, error: err.message };
    }
  },

  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      console.warn('Supabase Google OAuth (simulated locally):', err.message);
      return { success: false, error: err.message };
    }
  },

  async resetPasswordForEmail(email: string) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      console.warn('Supabase Reset Password:', err.message);
      return { success: false, error: err.message };
    }
  },
};
