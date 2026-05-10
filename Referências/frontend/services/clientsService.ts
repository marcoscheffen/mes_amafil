import { supabase } from '../lib/supabase';
import { Customer } from '../types';

export interface GetClientsFilters {
  search?: string;
  iaActive?: boolean;
  isBlocked?: boolean;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface GetClientsResult {
  data: Customer[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Lista todos os clients de uma company com suporte a filtros e paginação
 */
export async function getClients(companyId: string, filters?: GetClientsFilters): Promise<Customer[]> {
  try {
    // Usar função RPC SECURITY DEFINER (bypassa RLS e valida company_id)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('get_clients', {
      p_company_id: companyId,
      p_search: filters?.search || null,
      p_ia_active: filters?.iaActive !== undefined ? filters.iaActive : null,
      p_is_blocked: filters?.isBlocked !== undefined ? filters.isBlocked : null,
      p_date_from: filters?.dateFrom || null,
      p_date_to: filters?.dateTo || null,
      p_limit: filters?.limit || 50,
      p_offset: filters?.offset || 0
    });

    if (rpcError) {
      console.error('Erro ao buscar clients via RPC:', rpcError);
      throw rpcError;
    }

    // Nova assinatura retorna objeto paginado com { success, total, data }
    const raw = rpcResult && typeof rpcResult === 'object' && 'data' in rpcResult ? rpcResult.data : rpcResult;
    const clients = Array.isArray(raw) ? raw : [];
    return clients.map((item: any) => mapRawToCustomer(item));
  } catch (error: any) {
    console.error('Erro ao buscar clients:', error);
    throw error;
  }
}

/**
 * Obtém um client por ID
 */
export async function getClientById(clientId: string): Promise<Customer | null> {
  try {
    // Usar função RPC SECURITY DEFINER (bypassa RLS e valida company_id)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('get_client_by_id', {
      p_client_id: clientId
    });

    if (rpcError) {
      console.error('Erro ao buscar client via RPC:', rpcError);
      throw rpcError;
    }

    // Se não encontrado, retornar null
    if (rpcResult === null || rpcResult === undefined || rpcResult === 'null' || !rpcResult.id) {
      return null;
    }

    return mapRawToCustomer(rpcResult);
  } catch (error: any) {
    console.error('Erro ao buscar client:', error);
    throw error;
  }
}

/**
 * Mapeia um objeto bruto (RPC/list) para Customer (inclui campos clients_ai)
 */
function mapRawToCustomer(raw: any): Customer {
  const aiInterest = raw.ai_interest ?? (Array.isArray(raw.ai_sports) ? raw.ai_sports : []);
  return {
    id: raw.id,
    user_type: raw.user_type,
    company_id: raw.company_id,
    chatlid: raw.chatlid,
    phone: raw.phone,
    chatname: raw.chatname || '',
    sendername: raw.sendername,
    senderphoto: raw.senderphoto,
    ai_name: raw.ai_name,
    ai_city: raw.ai_city,
    ai_state: raw.ai_state,
    ai_email: raw.ai_email,
    ai_interest: Array.isArray(aiInterest) ? aiInterest : [],
    ai_marketing: raw.ai_marketing || false,
    ai_company: raw.ai_company,
    ai_courts: raw.ai_courts != null ? Number(raw.ai_courts) : undefined,
    ai_social: raw.ai_social,
    ai_client_type: raw.ai_client_type,
    ai_sports: Array.isArray(raw.ai_sports) ? raw.ai_sports : undefined,
    iaservice: raw.iaservice ?? true,
    isblock: raw.isblock ?? false,
    created_at: raw.created_at,
    updated_at: raw.updated_at || raw.created_at
  };
}

/**
 * Obtém ou cria um client padrão para a company
 * Usa função RPC SECURITY DEFINER para acesso seguro
 */
export async function getOrCreateDefaultClient(companyId: string): Promise<string> {
  try {
    // Usar função RPC SECURITY DEFINER (bypassa RLS e valida company_id)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('get_or_create_default_client', {
      p_company_id: companyId
    });

    if (rpcError) {
      console.error('Erro ao obter/criar client padrão via RPC:', rpcError);
      throw new Error(
        'Não foi possível obter ou criar um cliente padrão. ' +
        'Por favor, crie um cliente manualmente na página de Clientes primeiro.'
      );
    }

    // A função RPC retorna o client completo como JSON
    if (!rpcResult || !rpcResult.id) {
      throw new Error('Resposta inválida da função get_or_create_default_client');
    }

    return rpcResult.id;
  } catch (error: any) {
    console.error('Erro ao obter/criar client padrão:', error);
    throw error;
  }
}

/**
 * Cria um novo client
 */
export async function createClient(
  companyId: string,
  clientData: {
    user_type?: string;
    chatlid: string;
    phone: string;
    chatname?: string;
    sendername?: string;
    senderphoto?: string;
    ai_name?: string;
    ai_city?: string;
    ai_state?: string;
    ai_email?: string;
    ai_interest?: string[];
    ai_marketing?: boolean;
    ai_client_type?: string;
    iaservice?: boolean;
    isblock?: boolean;
  }
): Promise<Customer> {
  try {
    // Criar client usando função RPC SECURITY DEFINER (bypassa RLS)
    // IMPORTANTE: phone é a referência principal e deve ser único
    const { data: rpcResult, error: rpcError } = await supabase.rpc('create_client', {
      p_company_id: companyId,
      p_chatlid: clientData.chatlid,
      p_phone: clientData.phone,
      p_user_type: clientData.user_type || 'client',
      p_chatname: clientData.chatname || null,
      p_sendername: clientData.sendername || null,
      p_senderphoto: clientData.senderphoto || null,
      p_ai_name: clientData.ai_name || null,
      p_ai_city: clientData.ai_city || null,
      p_ai_state: clientData.ai_state || null,
      p_ai_email: clientData.ai_email || null,
      p_ai_interest: clientData.ai_interest || null,
      p_ai_marketing: clientData.ai_marketing ?? false,
      p_ai_client_type: clientData.ai_client_type || null,
      p_iaservice: clientData.iaservice ?? true,
      p_isblock: clientData.isblock ?? false
    });

    if (rpcError) {
      console.error('Erro ao criar client via RPC:', rpcError);
      throw rpcError;
    }

    if (!rpcResult || !rpcResult.id) {
      throw new Error('Erro ao criar client: resposta inválida');
    }

    return mapRawToCustomer(rpcResult);
  } catch (error: any) {
    console.error('Erro ao criar client:', error);
    throw error;
  }
}

/**
 * Atualiza um client existente
 */
export async function updateClient(
  clientId: string,
  updates: {
    user_type?: string;
    chatlid?: string;
    phone?: string;
    chatname?: string;
    sendername?: string;
    senderphoto?: string;
    ai_name?: string;
    ai_city?: string;
    ai_state?: string;
    ai_email?: string;
    ai_interest?: string[];
    ai_marketing?: boolean;
    ai_company?: string;
    ai_courts?: number;
    ai_social?: string;
    ai_client_type?: string;
    iaservice?: boolean;
    isblock?: boolean;
  }
): Promise<Customer> {
  try {
    // Atualizar client usando função RPC SECURITY DEFINER (bypassa RLS)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('update_client', {
      p_client_id: clientId,
      p_user_type: updates.user_type || null,
      p_chatlid: updates.chatlid || null,
      p_phone: updates.phone || null,
      p_chatname: updates.chatname || null,
      p_sendername: updates.sendername || null,
      p_senderphoto: updates.senderphoto || null,
      p_ai_name: updates.ai_name || null,
      p_ai_city: updates.ai_city || null,
      p_ai_state: updates.ai_state || null,
      p_ai_email: updates.ai_email || null,
      p_ai_interest: updates.ai_interest?.length ? updates.ai_interest : null,
      p_ai_marketing: updates.ai_marketing !== undefined ? updates.ai_marketing : null,
      p_ai_company: updates.ai_company ?? null,
      p_ai_courts: updates.ai_courts ?? null,
      p_ai_social: updates.ai_social ?? null,
      p_ai_client_type: updates.ai_client_type ?? null,
      p_iaservice: updates.iaservice !== undefined ? updates.iaservice : null,
      p_isblock: updates.isblock !== undefined ? updates.isblock : null
    });

    if (rpcError) {
      console.error('Erro ao atualizar client via RPC:', rpcError);
      throw rpcError;
    }

    if (!rpcResult || !rpcResult.id) {
      throw new Error('Erro ao atualizar client: resposta inválida');
    }

    return mapRawToCustomer(rpcResult);
  } catch (error: any) {
    console.error('Erro ao atualizar client:', error);
    throw error;
  }
}

/**
 * Deleta um client (soft delete: marca isblock = true)
 */
export async function deleteClient(clientId: string): Promise<void> {
  try {
    // Usar função RPC SECURITY DEFINER (bypassa RLS)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('delete_client', {
      p_client_id: clientId
    });

    if (rpcError) {
      console.error('Erro ao deletar client via RPC:', rpcError);
      throw rpcError;
    }

    if (!rpcResult || !rpcResult.success) {
      throw new Error(rpcResult?.message || 'Erro ao deletar client');
    }
  } catch (error: any) {
    console.error('Erro ao deletar client:', error);
    throw error;
  }
}


/**
 * Normaliza número de telefone para apenas dígitos.
 * Ex: '+554599934556' → '554599934556'
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Gera a variante do número de celular brasileiro com/sem o 9º dígito.
 * Brasil (55 + 2 DDD + 8 ou 9 dígitos):
 *   13 dígitos → remove o 9 inicial do celular → 12 dígitos
 *   12 dígitos → adiciona o 9 inicial do celular → 13 dígitos
 * Ex: '5545999934556' (13) → '554599934556' (12) e vice-versa
 */
function brPhoneVariant(normalized: string): string | null {
  if (!normalized.startsWith('55')) return null;
  if (normalized.length === 13) {
    // Remove o 9 extra (índice 4 = primeiro dígito do número após DDD)
    return normalized.slice(0, 4) + normalized.slice(5);
  }
  if (normalized.length === 12) {
    // Adiciona o 9 (inserido na posição 4, após código do país + DDD)
    return normalized.slice(0, 4) + '9' + normalized.slice(4);
  }
  return null;
}

/**
 * Busca um client pelo número de telefone (normalizado, sem + ou formatação).
 * Tenta também a variante do 9º dígito brasileiro para garantir match.
 * Retorna null se não encontrado.
 */
export async function findClientByPhone(companyId: string, phone: string): Promise<Customer | null> {
  if (!phone || !companyId) return null;

  const normalized = normalizePhone(phone);
  if (!normalized) return null;

  const variant = brPhoneVariant(normalized);
  // Tenta o número normalizado; se falhar, tenta a variante brasileira
  const searchTerms = variant ? [normalized, variant] : [normalized];

  for (const searchTerm of searchTerms) {
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('get_clients', {
        p_company_id: companyId,
        p_search: searchTerm,
        p_ia_active: null,
        p_is_blocked: null,
        p_date_from: null,
        p_date_to: null,
        p_limit: 10,
        p_offset: 0
      });

      if (rpcError || !rpcResult) continue;

      const raw = rpcResult && typeof rpcResult === 'object' && 'data' in rpcResult ? rpcResult.data : rpcResult;
      const clients: any[] = Array.isArray(raw) ? raw : [];

      // Match exato por telefone normalizado (aceita as duas variantes)
      const match = clients.find((c: any) => {
        const cPhone = normalizePhone(c.phone ?? '');
        return cPhone === normalized || (variant !== null && cPhone === variant);
      });

      if (match) return mapRawToCustomer(match);
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Lista clients retornando metadados de paginação
 */
export async function getClientsWithMeta(companyId: string, filters?: GetClientsFilters): Promise<GetClientsResult> {
  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc('get_clients', {
      p_company_id: companyId,
      p_search: filters?.search || null,
      p_ia_active: filters?.iaActive !== undefined ? filters.iaActive : null,
      p_is_blocked: filters?.isBlocked !== undefined ? filters.isBlocked : null,
      p_date_from: filters?.dateFrom || null,
      p_date_to: filters?.dateTo || null,
      p_limit: filters?.limit || 50,
      p_offset: filters?.offset || 0
    });

    if (rpcError) throw rpcError;

    const paged = rpcResult || {};
    const clients = Array.isArray(paged.data) ? paged.data : [];
    return {
      data: clients.map((item: any) => mapRawToCustomer(item)),
      total: paged.total || 0,
      limit: paged.limit || 50,
      offset: paged.offset || 0
    };
  } catch (error: any) {
    console.error('Erro ao buscar clients com meta:', error);
    throw error;
  }
}
