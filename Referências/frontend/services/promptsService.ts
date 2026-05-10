import { supabase } from '../lib/supabase';

export type PromptType = 'system' | 'instruction' | 'constraint';

export interface Prompt {
  id: string;
  agent_id: string;
  company_id: string;
  client_id: string;
  prompt_type: PromptType;
  title: string;
  content: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Lista todos os prompts de um agente
 */
export async function getPrompts(agentId: string): Promise<Prompt[]> {
  try {
    // Usar função RPC SECURITY DEFINER (bypassa RLS)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('get_prompts', {
      p_agent_id: agentId
    });

    if (rpcError) {
      console.error('Erro ao buscar prompts via RPC:', rpcError);
      throw rpcError;
    }

    const prompts = Array.isArray(rpcResult) ? rpcResult : [];
    return prompts.map((item: any) => ({
      id: item.id,
      agent_id: item.agent_id,
      company_id: item.company_id,
      client_id: item.client_id,
      prompt_type: item.prompt_type,
      title: item.title,
      content: item.content,
      order_index: item.order_index || 0,
      is_active: item.is_active ?? true,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
  } catch (error: any) {
    console.error('Erro ao buscar prompts:', error);
    throw error;
  }
}

/**
 * Obtém um prompt por ID
 */
export async function getPromptById(promptId: string): Promise<Prompt | null> {
  try {
    // Usar função RPC SECURITY DEFINER (bypassa RLS)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('get_prompt_by_id', {
      p_prompt_id: promptId
    });

    if (rpcError) {
      console.error('Erro ao buscar prompt via RPC:', rpcError);
      throw rpcError;
    }

    // Se não encontrado, retornar null
    // Verificar se rpcResult é null ou se não tem id
    if (rpcResult === null || rpcResult === undefined || rpcResult === 'null' || !rpcResult.id) {
      return null;
    }

    return {
      id: rpcResult.id,
      agent_id: rpcResult.agent_id,
      company_id: rpcResult.company_id,
      client_id: rpcResult.client_id,
      prompt_type: rpcResult.prompt_type,
      title: rpcResult.title,
      content: rpcResult.content,
      order_index: rpcResult.order_index || 0,
      is_active: rpcResult.is_active ?? true,
      created_at: rpcResult.created_at,
      updated_at: rpcResult.updated_at
    };
  } catch (error: any) {
    console.error('Erro ao buscar prompt:', error);
    throw error;
  }
}

/**
 * Cria um novo prompt
 */
export async function createPrompt(
  agentId: string,
  companyId: string,
  clientId: string,
  promptData: {
    prompt_type: PromptType;
    title: string;
    content: string;
    order_index?: number;
    is_active?: boolean;
  }
): Promise<Prompt> {
  try {
    // Usar função RPC SECURITY DEFINER (bypassa RLS)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('create_prompt', {
      p_agent_id: agentId,
      p_company_id: companyId,
      p_client_id: clientId,
      p_prompt_type: promptData.prompt_type,
      p_title: promptData.title,
      p_content: promptData.content,
      p_order_index: promptData.order_index || null,
      p_is_active: promptData.is_active ?? true
    });

    if (rpcError) {
      console.error('Erro ao criar prompt via RPC:', rpcError);
      throw rpcError;
    }

    if (!rpcResult || !rpcResult.id) {
      throw new Error('Erro ao criar prompt');
    }

    // Retornar prompt criado
    return {
      id: rpcResult.id,
      agent_id: rpcResult.agent_id,
      company_id: rpcResult.company_id,
      client_id: rpcResult.client_id,
      prompt_type: rpcResult.prompt_type,
      title: rpcResult.title,
      content: rpcResult.content,
      order_index: rpcResult.order_index || 0,
      is_active: rpcResult.is_active ?? true,
      created_at: rpcResult.created_at,
      updated_at: rpcResult.updated_at
    };
  } catch (error: any) {
    console.error('Erro ao criar prompt:', error);
    throw error;
  }
}

/**
 * Atualiza um prompt existente
 */
export async function updatePrompt(
  promptId: string,
  updates: {
    prompt_type?: PromptType;
    title?: string;
    content?: string;
    order_index?: number;
    is_active?: boolean;
  }
): Promise<Prompt> {
  try {
    // Usar função RPC SECURITY DEFINER (bypassa RLS)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('update_prompt', {
      p_prompt_id: promptId,
      p_prompt_type: updates.prompt_type || null,
      p_title: updates.title || null,
      p_content: updates.content || null,
      p_order_index: updates.order_index !== undefined ? updates.order_index : null,
      p_is_active: updates.is_active !== undefined ? updates.is_active : null
    });

    if (rpcError) {
      console.error('Erro ao atualizar prompt via RPC:', rpcError);
      throw rpcError;
    }

    if (!rpcResult || !rpcResult.id) {
      throw new Error('Erro ao atualizar prompt');
    }

    // Retornar prompt atualizado
    return {
      id: rpcResult.id,
      agent_id: rpcResult.agent_id,
      company_id: rpcResult.company_id,
      client_id: rpcResult.client_id,
      prompt_type: rpcResult.prompt_type,
      title: rpcResult.title,
      content: rpcResult.content,
      order_index: rpcResult.order_index || 0,
      is_active: rpcResult.is_active ?? true,
      created_at: rpcResult.created_at,
      updated_at: rpcResult.updated_at
    };
  } catch (error: any) {
    console.error('Erro ao atualizar prompt:', error);
    throw error;
  }
}

/**
 * Deleta um prompt
 */
export async function deletePrompt(promptId: string): Promise<void> {
  try {
    // Usar função RPC SECURITY DEFINER (bypassa RLS)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('delete_prompt', {
      p_prompt_id: promptId
    });

    if (rpcError) {
      console.error('Erro ao deletar prompt via RPC:', rpcError);
      throw rpcError;
    }

    if (!rpcResult || !rpcResult.success) {
      throw new Error(rpcResult?.message || 'Erro ao deletar prompt');
    }
  } catch (error: any) {
    console.error('Erro ao deletar prompt:', error);
    throw error;
  }
}

/**
 * Reordena prompts de um agente
 */
export async function reorderPrompts(agentId: string, promptIds: string[]): Promise<void> {
  try {
    // Atualizar order_index de cada prompt
    const updates = promptIds.map((id, index) => ({
      id,
      order_index: index + 1
    }));

    for (const update of updates) {
      await supabase
        .from('prompts')
        .update({ order_index: update.order_index })
        .eq('id', update.id);
    }
  } catch (error: any) {
    console.error('Erro ao reordenar prompts:', error);
    throw error;
  }
}

