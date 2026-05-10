import { supabase } from '../lib/supabase';
import { CompanyUser, Role } from '../types';

/**
 * Lista todos os usuários de uma company
 */
export async function getCompanyUsers(companyId: string): Promise<CompanyUser[]> {
  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc('get_company_users', {
      p_company_id: companyId
    });

    if (rpcError) {
      console.error('Erro ao buscar usuários via RPC:', rpcError);
      throw rpcError;
    }

    // RPC retorna { success, data: [...] } ou array direto
    const rows: any[] = Array.isArray(rpcResult)
      ? rpcResult
      : Array.isArray(rpcResult?.data)
        ? rpcResult.data
        : [];

    return rows.map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      company_id: item.company_id || companyId,
      role: item.role as Role,
      is_active: item.is_active,
      created_at: item.created_at,
      updated_at: item.updated_at,
      user_email: item.user_email || item.email || '',
      user_name: item.user_name || item.full_name || item.email || item.user_email || '',
      full_name: item.full_name || '',
      phone_primary: item.phone_primary || null,
    }));
  } catch (error: any) {
    console.error('Erro ao buscar usuários:', error);
    throw error;
  }
}

/**
 * Busca um usuário específico por ID
 */
export async function getCompanyUserById(companyId: string, companyUserId: string): Promise<CompanyUser> {
  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc('get_company_user_by_id', {
      p_company_id: companyId,
      p_company_user_id: companyUserId
    });

    if (rpcError) {
      console.error('Erro ao buscar usuário via RPC:', rpcError);
      throw rpcError;
    }

    return {
      id: rpcResult.id,
      user_id: rpcResult.user_id,
      company_id: rpcResult.company_id,
      role: rpcResult.role as Role,
      is_active: rpcResult.is_active,
      created_at: rpcResult.created_at,
      updated_at: rpcResult.updated_at,
      user_email: rpcResult.user_email || '',
      user_name: rpcResult.user_name || rpcResult.full_name || rpcResult.user_email || '',
      full_name: rpcResult.full_name || '',
      phone_primary: rpcResult.phone_primary || null,
    };
  } catch (error: any) {
    console.error('Erro ao buscar usuário:', error);
    throw error;
  }
}

/**
 * Cria um novo vínculo de usuário à company
 * NOTA: O usuário precisa já existir no auth.users
 */
export async function createCompanyUser(
  companyId: string,
  userEmail: string,
  role: Role = 'user',
  isActive: boolean = true
): Promise<CompanyUser> {
  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc('create_company_user', {
      p_company_id: companyId,
      p_user_email: userEmail,
      p_role: role,
      p_is_active: isActive
    });

    if (rpcError) {
      console.error('Erro ao criar usuário via RPC:', rpcError);
      throw rpcError;
    }

    return {
      id: rpcResult.id,
      user_id: rpcResult.user_id,
      company_id: rpcResult.company_id,
      role: rpcResult.role as Role,
      is_active: rpcResult.is_active,
      created_at: rpcResult.created_at,
      updated_at: rpcResult.updated_at,
      user_email: rpcResult.user_email || '',
      user_name: rpcResult.user_name || rpcResult.full_name || rpcResult.user_email || '',
      full_name: rpcResult.full_name || '',
      phone_primary: rpcResult.phone_primary || null,
    };
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error);
    throw error;
  }
}

/**
 * Atualiza role e status de um usuário
 */
export async function updateCompanyUser(
  companyId: string,
  companyUserId: string,
  updates: {
    role?: Role;
    is_active?: boolean;
  }
): Promise<CompanyUser> {
  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc('update_company_user', {
      p_company_id: companyId,
      p_company_user_id: companyUserId,
      p_role: updates.role || null,
      p_is_active: updates.is_active !== undefined ? updates.is_active : null
    });

    if (rpcError) {
      console.error('Erro ao atualizar usuário via RPC:', rpcError);
      throw rpcError;
    }

    return {
      id: rpcResult.id,
      user_id: rpcResult.user_id,
      company_id: rpcResult.company_id,
      role: rpcResult.role as Role,
      is_active: rpcResult.is_active,
      created_at: rpcResult.created_at,
      updated_at: rpcResult.updated_at,
      user_email: rpcResult.user_email || '',
      user_name: rpcResult.user_name || rpcResult.full_name || rpcResult.user_email || '',
      full_name: rpcResult.full_name || '',
      phone_primary: rpcResult.phone_primary || null,
    };
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error);
    throw error;
  }
}

/**
 * Remove vínculo de usuário à company
 */
export async function deleteCompanyUser(companyId: string, companyUserId: string): Promise<void> {
  try {
    const { error: rpcError } = await supabase.rpc('delete_company_user', {
      p_company_id: companyId,
      p_company_user_id: companyUserId
    });

    if (rpcError) {
      console.error('Erro ao deletar usuário via RPC:', rpcError);
      throw rpcError;
    }
  } catch (error: any) {
    console.error('Erro ao deletar usuário:', error);
    throw error;
  }
}

