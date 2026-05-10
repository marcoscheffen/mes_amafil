import { supabase } from '../lib/supabase';
import { Agent } from '../types';

/**
 * Obtém ou cria um client padrão para a company
 * Usa função RPC SECURITY DEFINER para acesso seguro
 */
async function getOrCreateDefaultClient(companyId: string): Promise<string> {
  try {
    // Usar função RPC SECURITY DEFINER (bypassa RLS e valida company_id)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('get_or_create_default_client', {
      p_company_id: companyId
    });

    if (rpcError) {
      console.error('Erro ao obter/criar client padrão via RPC:', {
        error: rpcError,
        code: rpcError.code,
        message: rpcError.message,
        details: rpcError.details,
        hint: rpcError.hint,
        companyId
      });
      
      // Mensagens de erro mais específicas baseadas no código do erro
      let errorMessage = 'Não foi possível obter ou criar um cliente padrão.';
      
      if (rpcError.code === 'P0001') {
        // Exceção customizada do PostgreSQL
        if (rpcError.message?.includes('não autenticado')) {
          errorMessage = 'Usuário não autenticado. Por favor, faça login novamente.';
        } else if (rpcError.message?.includes('não tem acesso')) {
          errorMessage = 'Usuário não tem acesso a esta empresa. Verifique suas permissões.';
        } else {
          errorMessage = rpcError.message || errorMessage;
        }
      } else if (rpcError.code === '42883') {
        errorMessage = 'Função get_or_create_default_client não existe no banco de dados. Contate o administrador.';
      } else if (rpcError.code === '23505') {
        errorMessage = 'Erro de duplicação. Tente novamente ou crie um cliente manualmente.';
      }
      
      throw new Error(
        errorMessage + ' ' +
        'Por favor, crie um cliente manualmente na página de Clientes primeiro.'
      );
    }

    // A função RPC retorna o client completo como JSON
    if (!rpcResult || !rpcResult.id) {
      console.error('Resposta inválida da função get_or_create_default_client:', rpcResult);
      throw new Error('Resposta inválida da função get_or_create_default_client. O cliente padrão não pôde ser criado.');
    }

    return rpcResult.id;
  } catch (error: any) {
    console.error('Erro ao obter/criar client padrão:', error);
    // Se o erro já tem uma mensagem personalizada, manter; caso contrário, adicionar contexto
    if (error.message && !error.message.includes('Não foi possível')) {
      throw new Error(`Erro ao criar cliente padrão: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Gera um slug a partir do nome
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Lista todos os agentes da company atual
 */
export async function getAgents(
  companyId: string,
  clientId?: string,
  isActive?: boolean,
  tagSlugs?: string[]
): Promise<Agent[]> {
  try {
    // Usar função RPC SECURITY DEFINER (bypassa RLS)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('get_agents', {
      p_company_id: companyId,
      p_client_id: clientId || null,
      p_is_active: isActive !== undefined ? isActive : null,
      p_tag_slugs: tagSlugs || null
    });

    if (rpcError) {
      console.error('Erro ao buscar agentes via RPC:', rpcError);
      throw rpcError;
    }

    // A função retorna { success, data } — extrair o array de data
    if (rpcResult && !rpcResult.success) {
      throw new Error(rpcResult.error || 'Erro ao buscar agentes');
    }
    const agents: any[] = Array.isArray(rpcResult?.data) ? rpcResult.data : [];
    return agents.map((item: any) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description || '',
      temperature: parseFloat(item.temperature) || 0.7,
      max_tokens: item.max_tokens || 2000,
      is_active: item.is_active ?? true,
      tags: item.tags || [],
      company_id: item.company_id,
      client_id: item.client_id,
      created_at: item.created_at
    }));
  } catch (error: any) {
    console.error('Erro ao buscar agentes:', error);
    throw error;
  }
}

/**
 * Obtém um agente por ID
 */
export async function getAgentById(agentId: string): Promise<Agent | null> {
  try {
    // Usar função RPC SECURITY DEFINER (bypassa RLS)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('get_agent_by_id', {
      p_agent_id: agentId
    });

    if (rpcError) {
      console.error('Erro ao buscar agente via RPC:', rpcError);
      throw rpcError;
    }

    // Se não encontrado, retornar null
    // Verificar se rpcResult é null ou se não tem id
    if (rpcResult === null || rpcResult === undefined || rpcResult === 'null' || !rpcResult.id) {
      return null;
    }

    return {
      id: rpcResult.id,
      name: rpcResult.name,
      slug: rpcResult.slug,
      description: rpcResult.description || '',
      temperature: parseFloat(rpcResult.temperature) || 0.7,
      max_tokens: rpcResult.max_tokens || 2000,
      is_active: rpcResult.is_active ?? true,
      tags: rpcResult.tags || [],
      company_id: rpcResult.company_id,
      client_id: rpcResult.client_id,
      created_at: rpcResult.created_at
    };
  } catch (error: any) {
    console.error('Erro ao buscar agente:', error);
    throw error;
  }
}

/**
 * Cria um novo agente
 */
export async function createAgent(
  companyId: string,
  agentData: {
    name: string;
    description?: string;
    temperature?: number;
    max_tokens?: number;
    tags?: string[];
    is_active?: boolean;
    client_id?: string;
  }
): Promise<Agent> {
  try {
    // Obter ou criar client padrão se não fornecido
    let clientId = agentData.client_id;
    if (!clientId) {
      clientId = await getOrCreateDefaultClient(companyId);
    }

    // Gerar slug a partir do nome
    const slug = generateSlug(agentData.name);

    // Verificar se slug já existe
    const { data: existing } = await supabase
      .from('agents')
      .select('id')
      .eq('company_id', companyId)
      .eq('client_id', clientId)
      .eq('slug', slug)
      .single();

    if (existing) {
      throw new Error('Já existe um agente com este nome. Escolha outro nome.');
    }

    // Criar agente usando função RPC SECURITY DEFINER (bypassa RLS)
    console.log('🚀 Chamando create_agent RPC com:', {
      p_company_id: companyId,
      p_client_id: clientId,
      p_name: agentData.name,
      p_slug: slug
    });

    const { data: rpcResult, error: rpcError } = await supabase.rpc('create_agent', {
      p_company_id: companyId,
      p_client_id: clientId,
      p_name: agentData.name,
      p_slug: slug,
      p_description: agentData.description || null,
      p_temperature: agentData.temperature ?? 0.7,
      p_max_tokens: agentData.max_tokens ?? 2000,
      p_tags: agentData.tags || [],
      p_is_active: agentData.is_active ?? true
    });

    console.log('📦 Resposta do create_agent RPC:', { rpcResult, rpcError });

    if (rpcError) {
      console.error('❌ Erro ao criar agente via RPC:', rpcError);
      // Se o erro for sobre coerção JSON, pode ser problema de formato
      if (rpcError.message?.includes('coerce') || rpcError.message?.includes('JSON')) {
        throw new Error('Erro ao processar resposta do servidor. Tente novamente.');
      }
      throw rpcError;
    }

    // A função retorna o agente completo como JSON
    // Verificar se o resultado é válido
    if (!rpcResult) {
      throw new Error('Erro ao criar agente: nenhuma resposta recebida');
    }

    // Se rpcResult pode ser um objeto JSON parseado ou uma string
    let agentData_result = rpcResult;
    if (typeof rpcResult === 'string') {
      try {
        agentData_result = JSON.parse(rpcResult);
      } catch (e) {
        console.error('❌ Erro ao fazer parse do JSON:', e);
        throw new Error('Erro ao processar resposta do servidor');
      }
    }

    if (!agentData_result || !agentData_result.id) {
      console.error('❌ Resposta inválida:', agentData_result);
      throw new Error('Erro ao criar agente: resposta inválida do servidor');
    }

    return {
      id: agentData_result.id,
      name: agentData_result.name,
      slug: agentData_result.slug,
      description: agentData_result.description || '',
      temperature: parseFloat(agentData_result.temperature) || 0.7,
      max_tokens: agentData_result.max_tokens || 2000,
      is_active: agentData_result.is_active ?? true,
      tags: agentData_result.tags || [],
      company_id: agentData_result.company_id,
      client_id: agentData_result.client_id,
      created_at: agentData_result.created_at
    };
  } catch (error: any) {
    console.error('Erro ao criar agente:', error);
    throw error;
  }
}

/**
 * Atualiza um agente existente
 */
export async function updateAgent(
  agentId: string,
  updates: {
    name?: string;
    description?: string;
    temperature?: number;
    max_tokens?: number;
    tags?: string[];
    is_active?: boolean;
  }
): Promise<Agent> {
  try {
    // Preparar dados para a função RPC
    let slug: string | null = null;
    if (updates.name !== undefined) {
      slug = generateSlug(updates.name);
    }

    // Atualizar agente usando função RPC SECURITY DEFINER (bypassa RLS)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('update_agent', {
      p_agent_id: agentId,
      p_name: updates.name || null,
      p_slug: slug,
      p_description: updates.description || null,
      p_temperature: updates.temperature !== undefined ? updates.temperature : null,
      p_max_tokens: updates.max_tokens !== undefined ? updates.max_tokens : null,
      p_tags: updates.tags || null,
      p_is_active: updates.is_active !== undefined ? updates.is_active : null
    });

    if (rpcError) {
      console.error('Erro ao atualizar agente via RPC:', rpcError);
      throw rpcError;
    }

    // A função retorna o agente completo como JSON
    if (!rpcResult) {
      throw new Error('Erro ao atualizar agente: nenhuma resposta recebida');
    }

    // O Supabase pode retornar o JSON já parseado ou como string
    let agentData_result = rpcResult;
    if (typeof rpcResult === 'string') {
      try {
        agentData_result = JSON.parse(rpcResult);
      } catch (e) {
        throw new Error('Erro ao processar resposta do servidor');
      }
    }

    if (!agentData_result || !agentData_result.id) {
      console.error('Resposta inválida da função update_agent:', agentData_result);
      throw new Error('Erro ao atualizar agente: resposta inválida do servidor');
    }

    return {
      id: agentData_result.id,
      name: agentData_result.name,
      slug: agentData_result.slug,
      description: agentData_result.description || '',
      temperature: parseFloat(agentData_result.temperature) || 0.7,
      max_tokens: agentData_result.max_tokens || 2000,
      is_active: agentData_result.is_active ?? true,
      tags: agentData_result.tags || [],
      company_id: agentData_result.company_id,
      client_id: agentData_result.client_id,
      created_at: agentData_result.created_at
    };
  } catch (error: any) {
    console.error('Erro ao atualizar agente:', error);
    throw error;
  }
}

/**
 * Deleta um agente
 */
export async function deleteAgent(agentId: string): Promise<void> {
  try {
    // Usar função RPC SECURITY DEFINER (bypassa RLS)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('delete_agent', {
      p_agent_id: agentId
    });

    if (rpcError) {
      console.error('Erro ao deletar agente via RPC:', rpcError);
      throw rpcError;
    }

    if (!rpcResult || !rpcResult.success) {
      throw new Error(rpcResult?.message || 'Erro ao deletar agente');
    }
  } catch (error: any) {
    console.error('Erro ao deletar agente:', error);
    throw error;
  }
}

/**
 * Duplica um agente (cria cópia inativa com slug "-copia")
 */
export async function duplicateAgent(agentId: string): Promise<Agent> {
  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc('duplicate_agent', {
      p_agent_id: agentId
    });

    if (rpcError) {
      console.error('Erro ao duplicar agente via RPC:', rpcError);
      throw rpcError;
    }

    if (!rpcResult || !rpcResult.success) {
      throw new Error(rpcResult?.error || 'Erro ao duplicar agente');
    }

    const a = rpcResult.agent;
    return {
      id: a.id,
      name: a.name,
      slug: a.slug,
      description: a.description || '',
      temperature: parseFloat(a.temperature) || 0.7,
      max_tokens: a.max_tokens || 2000,
      is_active: a.is_active ?? false,
      tags: a.tags || [],
      company_id: a.company_id,
      client_id: a.client_id,
      created_at: a.created_at
    };
  } catch (error: any) {
    console.error('Erro ao duplicar agente:', error);
    throw error;
  }
}
