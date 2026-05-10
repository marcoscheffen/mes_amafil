import { supabase } from '../lib/supabase';
import { Tag } from '../types';

/**
 * Gera um slug a partir do nome
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Lista todas as tags de uma company
 */
export async function getTags(companyId: string): Promise<Tag[]> {
  try {
    // Usar função RPC SECURITY DEFINER (bypassa RLS)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('get_tags', {
      p_company_id: companyId
    });

    if (rpcError) {
      console.error('Erro ao buscar tags via RPC:', rpcError);
      throw rpcError;
    }

    const tags = Array.isArray(rpcResult) ? rpcResult : [];
    return tags.map((item: any) => ({
      id: item.id,
      company_id: item.company_id,
      name: item.name,
      slug: item.slug,
      description: item.description || '',
      color: item.color || '#3B82F6',
      is_active: item.is_active ?? true,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
  } catch (error: any) {
    console.error('Erro ao buscar tags:', error);
    throw error;
  }
}

/**
 * Obtém uma tag por ID
 */
export async function getTagById(tagId: string): Promise<Tag | null> {
  try {
    // Usar função RPC SECURITY DEFINER (bypassa RLS)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('get_tag_by_id', {
      p_tag_id: tagId
    });

    if (rpcError) {
      console.error('Erro ao buscar tag via RPC:', rpcError);
      throw rpcError;
    }

    // Se não encontrado, retornar null
    if (rpcResult === null || rpcResult === undefined || rpcResult === 'null' || !rpcResult.id) {
      return null;
    }

    return {
      id: rpcResult.id,
      company_id: rpcResult.company_id,
      name: rpcResult.name,
      slug: rpcResult.slug,
      description: rpcResult.description || '',
      color: rpcResult.color || '#3B82F6',
      is_active: rpcResult.is_active ?? true,
      created_at: rpcResult.created_at,
      updated_at: rpcResult.updated_at
    };
  } catch (error: any) {
    console.error('Erro ao buscar tag:', error);
    throw error;
  }
}

/**
 * Cria uma nova tag
 */
export async function createTag(
  companyId: string,
  tagData: {
    name: string;
    slug?: string;
    description?: string;
    color?: string;
    is_active?: boolean;
  }
): Promise<Tag> {
  try {
    // Gerar slug a partir do nome se não fornecido
    const slug = tagData.slug || generateSlug(tagData.name);

    // Criar tag usando função RPC SECURITY DEFINER (bypassa RLS)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('create_tag', {
      p_company_id: companyId,
      p_name: tagData.name,
      p_slug: slug,
      p_description: tagData.description || null,
      p_color: tagData.color || '#3B82F6',
      p_is_active: tagData.is_active ?? true
    });

    if (rpcError) {
      console.error('Erro ao criar tag via RPC:', rpcError);
      throw rpcError;
    }

    if (!rpcResult || !rpcResult.id) {
      throw new Error('Erro ao criar tag: resposta inválida');
    }

    return {
      id: rpcResult.id,
      company_id: rpcResult.company_id,
      name: rpcResult.name,
      slug: rpcResult.slug,
      description: rpcResult.description || '',
      color: rpcResult.color || '#3B82F6',
      is_active: rpcResult.is_active ?? true,
      created_at: rpcResult.created_at,
      updated_at: rpcResult.updated_at
    };
  } catch (error: any) {
    console.error('Erro ao criar tag:', error);
    throw error;
  }
}

/**
 * Atualiza uma tag existente
 */
export async function updateTag(
  tagId: string,
  updates: {
    name?: string;
    slug?: string;
    description?: string;
    color?: string;
    is_active?: boolean;
  }
): Promise<Tag> {
  try {
    // Se o nome mudou, recalcular o slug se não fornecido
    let slug: string | null = null;
    if (updates.name !== undefined && updates.slug === undefined) {
      slug = generateSlug(updates.name);
    } else if (updates.slug !== undefined) {
      slug = updates.slug;
    }

    // Atualizar tag usando função RPC SECURITY DEFINER (bypassa RLS)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('update_tag', {
      p_tag_id: tagId,
      p_name: updates.name || null,
      p_slug: slug,
      p_description: updates.description || null,
      p_color: updates.color || null,
      p_is_active: updates.is_active !== undefined ? updates.is_active : null
    });

    if (rpcError) {
      console.error('Erro ao atualizar tag via RPC:', rpcError);
      throw rpcError;
    }

    if (!rpcResult || !rpcResult.id) {
      throw new Error('Erro ao atualizar tag: resposta inválida');
    }

    return {
      id: rpcResult.id,
      company_id: rpcResult.company_id,
      name: rpcResult.name,
      slug: rpcResult.slug,
      description: rpcResult.description || '',
      color: rpcResult.color || '#3B82F6',
      is_active: rpcResult.is_active ?? true,
      created_at: rpcResult.created_at,
      updated_at: rpcResult.updated_at
    };
  } catch (error: any) {
    console.error('Erro ao atualizar tag:', error);
    throw error;
  }
}

/**
 * Deleta uma tag
 */
export async function deleteTag(tagId: string): Promise<void> {
  try {
    // Usar função RPC SECURITY DEFINER (bypassa RLS)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('delete_tag', {
      p_tag_id: tagId
    });

    if (rpcError) {
      console.error('Erro ao deletar tag via RPC:', rpcError);
      throw rpcError;
    }

    if (!rpcResult || !rpcResult.success) {
      throw new Error(rpcResult?.message || 'Erro ao deletar tag');
    }
  } catch (error: any) {
    console.error('Erro ao deletar tag:', error);
    throw error;
  }
}

