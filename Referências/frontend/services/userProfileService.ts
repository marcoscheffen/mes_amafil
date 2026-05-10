import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

/**
 * Obtém o perfil de um usuário (próprio se p_user_id for omitido)
 */
export async function getUserProfile(userId?: string): Promise<UserProfile | null> {
  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc('get_user_profile', {
      p_user_id: userId || null
    });

    if (rpcError) {
      console.error('Erro ao buscar perfil via RPC:', rpcError);
      throw rpcError;
    }

    if (!rpcResult || !rpcResult.success) {
      return null;
    }

    // RPC retorna flat: { success, user_id, full_name, ... }
    const d = rpcResult.data ?? rpcResult;
    return {
      user_id: d.user_id,
      full_name: d.full_name || '',
      phone_primary: d.phone_primary || null,
    };
  } catch (error: any) {
    console.error('Erro ao buscar perfil de usuário:', error);
    throw error;
  }
}

/**
 * Atualiza o perfil do usuário autenticado
 */
export async function updateUserProfile(updates: {
  full_name?: string;
  phone_primary?: string | null;
}): Promise<UserProfile> {
  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc('update_user_profile', {
      p_full_name: updates.full_name ?? null,
      p_phone_primary: updates.phone_primary ?? null,
    });

    if (rpcError) {
      console.error('Erro ao atualizar perfil via RPC:', rpcError);
      throw rpcError;
    }

    if (!rpcResult || !rpcResult.success) {
      throw new Error(rpcResult?.error || 'Erro ao atualizar perfil');
    }

    // RPC retorna flat { success, user_id, message } — sem full_name/phone
    // Reconstrói o perfil a partir dos dados enviados
    return {
      user_id: rpcResult.user_id ?? (rpcResult.data?.user_id ?? ''),
      full_name: updates.full_name ?? '',
      phone_primary: updates.phone_primary ?? null,
    };
  } catch (error: any) {
    console.error('Erro ao atualizar perfil de usuário:', error);
    throw error;
  }
}
