import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import supabase from '../lib/supabase';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{
    error: AuthError | Error | null;
    data: Session | null;
  }>;
  signUp: (email: string, password: string) => Promise<{
    error: AuthError | Error | null;
    data: Session | null;
  }>;
  resetPassword: (email: string) => Promise<{
    error: AuthError | Error | null;
    data: null;
  }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear session and user state
      setUser(null);
      setSession(null);
      
      // Clear any stored auth data from localStorage
      localStorage.removeItem('supabase.auth.token');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Terjadi kesalahan saat keluar');
    }
  };

  useEffect(() => {
    const setData = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          if (error.message?.includes('refresh_token_not_found') || 
              error.message?.includes('Invalid Refresh Token')) {
            await handleSignOut();
            return;
          }
          throw error;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error fetching session:', error);
        toast.error('Terjadi kesalahan saat memuat sesi');
        await handleSignOut();
      } finally {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'TOKEN_REFRESHED') {
          setSession(session);
          setUser(session?.user ?? null);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
        setLoading(false);
      }
    );

    setData();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        if (error.message === 'Invalid login credentials') {
          return { 
            data: null, 
            error: new Error('Email atau kata sandi tidak valid. Silakan periksa kembali kredensial Anda.')
          };
        }
        throw error;
      }
      return { data: data.session, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Terjadi kesalahan saat masuk')
      };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Immediately sign out after successful registration
      await handleSignOut();
      
      return { data: null, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Terjadi kesalahan saat mendaftar')
      };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      return { data: null, error: null };
    } catch (error) {
      console.error('Password reset error:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Terjadi kesalahan saat mereset kata sandi')
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = handleSignOut;

  const value = {
    user,
    session,
    signIn,
    signUp,
    resetPassword,
    signOut,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};