import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      setAuthState({
        user: session?.user ?? null,
        session: session,
        loading: false,
        error: error?.message ?? null
      });
    });

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState({
        user: session?.user ?? null,
        session: session,
        loading: false,
        error: null
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
    
    setAuthState(prev => ({ ...prev, loading: false }));
    return data;
  };

  const signOut = async () => {
    console.log('🔴 useAuth.signOut chamado');
    setAuthState(prev => ({ ...prev, loading: true }));
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Erro no signOut do Supabase:', error);
        setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
        throw error;
      }
      console.log('✅ signOut do Supabase realizado com sucesso');
      setAuthState(prev => ({ ...prev, user: null, session: null, loading: false }));
    } catch (err) {
      console.error('❌ Erro no signOut:', err);
      // Mesmo com erro, limpar o estado local
      setAuthState(prev => ({ ...prev, user: null, session: null, loading: false }));
      throw err;
    }
  };

  const signUp = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (error) {
      setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
      throw error;
    }
    
    setAuthState(prev => ({ ...prev, loading: false }));
    return data;
  };

  return {
    ...authState,
    signIn,
    signOut,
    signUp
  };
}

