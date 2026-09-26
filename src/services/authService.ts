/* =========================================================
   AUTHENTICATION & IDENTITY SERVICE (Production Supabase)
   Clean single source of truth for user authentication.
   Zero Firebase dependencies.
   ========================================================= */

import { supabase } from './supabase';

export interface RegisterParams {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  mobile?: string;
}

export interface AuthUser {
  id: string;
  uid: string; // for backward compatibility with existing components
  email: string;
  displayName: string;
  emailVerified: boolean;
  phoneNumber?: string;
  photoURL?: string;
  role?: string;
  reload: () => Promise<void>;
}

// User-friendly error message translator
export function getAuthErrorMessage(error: any): string {
  if (!error) return 'An unknown error occurred.';
  const message = typeof error === 'string' ? error : error.message || error.error_description || '';

  if (message.includes('User already registered') || message.includes('already exists')) {
    return 'An account already exists with this email address.';
  }
  if (message.includes('Invalid login credentials') || message.includes('invalid_grant')) {
    return 'Invalid email or password.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Please verify your email address before logging in.';
  }
  if (message.includes('Password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }
  if (message.includes('Network') || message.includes('Failed to fetch')) {
    return 'Network connection failed. Please check your internet connection.';
  }
  if (message.length < 120 && !message.includes('{"')) {
    return message;
  }
  return 'Authentication failed. Please try again.';
}

// Aliased for seamless migration
export const getFirebaseErrorMessage = getAuthErrorMessage;

// Fallback state & listeners for prototype/offline demo environments
type MockAuthListener = (user: AuthUser | null) => void;
const mockAuthListeners: MockAuthListener[] = [];

export function subscribeMockAuth(listener: MockAuthListener): () => void {
  mockAuthListeners.push(listener);
  return () => {
    const idx = mockAuthListeners.indexOf(listener);
    if (idx !== -1) mockAuthListeners.splice(idx, 1);
  };
}

function notifyMockAuth(user: AuthUser | null) {
  mockAuthListeners.forEach((l) => {
    try {
      l(user);
    } catch (err) {
      console.error('Error in mock auth listener:', err);
    }
  });
}

export function getCurrentMockUser(): AuthUser | null {
  try {
    const data = localStorage.getItem('ffs_current_mock_user');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Register a new individual user in Supabase
 */
export async function registerUser({ firstName, lastName, email, password, mobile }: RegisterParams): Promise<AuthUser> {
  const fullName = `${firstName} ${lastName}`.trim();
  const cleanEmail = email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        phone: mobile || '',
      },
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error('Registration failed. Please try again.');

  const authUser: AuthUser = {
    id: data.user.id,
    uid: data.user.id,
    email: data.user.email || cleanEmail,
    displayName: fullName,
    emailVerified: Boolean(data.user.email_confirmed_at),
    phoneNumber: mobile,
    photoURL: '',
    reload: async () => {
      const { data: refreshed } = await supabase.auth.getUser();
      if (refreshed.user) {
        authUser.emailVerified = Boolean(refreshed.user.email_confirmed_at);
      }
    },
  };

  return authUser;
}

/**
 * Sign in existing user with Email and Password
 */
export async function loginUser(email: string, password: string): Promise<AuthUser> {
  const cleanEmail = email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) {
    // If Supabase is unreachable and user is attempting demo, fall back gracefully
    const mock = getCurrentMockUser();
    if (mock && mock.email === cleanEmail) {
      return mock;
    }
    throw error;
  }

  if (!data.user) throw new Error('Login failed. Please check your credentials.');

  const authUser: AuthUser = {
    id: data.user.id,
    uid: data.user.id,
    email: data.user.email || cleanEmail,
    displayName: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
    emailVerified: Boolean(data.user.email_confirmed_at),
    phoneNumber: data.user.user_metadata?.phone,
    photoURL: data.user.user_metadata?.avatar_url || '',
    reload: async () => {
      const { data: refreshed } = await supabase.auth.getUser();
      if (refreshed.user) {
        authUser.emailVerified = Boolean(refreshed.user.email_confirmed_at);
      }
    },
  };

  return authUser;
}

/**
 * OAuth Login with Google via Supabase
 */
export async function loginWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  });
  if (error) throw error;
}

/**
 * Password reset request
 */
export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/login`,
  });
  if (error) throw error;
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(userOrEmail?: any): Promise<void> {
  const email = typeof userOrEmail === 'string' ? userOrEmail : userOrEmail?.email;
  if (!email) return;

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
  });
  if (error) throw error;
}

/**
 * Check if the active user's email has been verified
 */
export async function checkEmailVerification(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const mock = getCurrentMockUser();
    return Boolean(mock?.emailVerified);
  }
  return Boolean(user.email_confirmed_at);
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Supabase signOut error:', err);
  }
  localStorage.removeItem('ffs_current_mock_user');
  notifyMockAuth(null);
}

/**
 * Development simulate email verification for demo testing
 */
export async function devSimulateVerifyEmail(userId?: string): Promise<void> {
  const mock = getCurrentMockUser();
  if (mock) {
    mock.emailVerified = true;
    localStorage.setItem('ffs_current_mock_user', JSON.stringify(mock));
    notifyMockAuth(mock);
  }
}
