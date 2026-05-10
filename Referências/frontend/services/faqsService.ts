import { supabase } from '../lib/supabase';
import { FAQ } from '../types';

export async function getFaqs(
  companyId: string,
  category?: string,
  isActive?: boolean
): Promise<FAQ[]> {
  const { data: rpcResult, error: rpcError } = await supabase.rpc('get_faqs', {
    p_company_id: companyId,
    p_category:   category  ?? null,
    p_is_active:  isActive  !== undefined ? isActive : null
  });

  if (rpcError) throw rpcError;

  const raw = Array.isArray(rpcResult) ? rpcResult : [];
  return raw.map((item: any) => ({
    id:             item.id,
    company_id:     item.company_id,
    question:       item.question,
    answer:         item.answer,
    category:       item.category       || '',
    language:       item.language       || 'pt-BR',
    priority:       item.priority       || 0,
    allowed_agents: item.allowed_agents || [],
    is_active:      item.is_active      ?? true,
    created_at:     item.created_at,
    updated_at:     item.updated_at
  }));
}

export async function getFaqById(faqId: string): Promise<FAQ | null> {
  const { data: rpcResult, error: rpcError } = await supabase.rpc('get_faq_by_id', {
    p_faq_id: faqId
  });

  if (rpcError) throw rpcError;
  if (!rpcResult?.id) return null;

  return {
    id:             rpcResult.id,
    company_id:     rpcResult.company_id,
    question:       rpcResult.question,
    answer:         rpcResult.answer,
    category:       rpcResult.category       || '',
    language:       rpcResult.language       || 'pt-BR',
    priority:       rpcResult.priority       || 0,
    allowed_agents: rpcResult.allowed_agents || [],
    is_active:      rpcResult.is_active      ?? true,
    created_at:     rpcResult.created_at,
    updated_at:     rpcResult.updated_at
  };
}

export async function createFaq(
  companyId: string,
  faqData: {
    question:        string;
    answer:          string;
    category?:       string;
    language?:       string;
    priority?:       number;
    allowed_agents?: string[];
    is_active?:      boolean;
  }
): Promise<FAQ> {
  const { data: rpcResult, error: rpcError } = await supabase.rpc('create_faq', {
    p_company_id:     companyId,
    p_question:       faqData.question,
    p_answer:         faqData.answer,
    p_category:       faqData.category       ?? null,
    p_language:       faqData.language        || 'pt-BR',
    p_priority:       faqData.priority        || 0,
    p_allowed_agents: faqData.allowed_agents  || [],
    p_is_active:      faqData.is_active       ?? true
  });

  if (rpcError) throw rpcError;
  if (!rpcResult?.id) throw new Error('Erro ao criar FAQ: resposta inválida');

  return {
    id:             rpcResult.id,
    company_id:     rpcResult.company_id,
    question:       rpcResult.question,
    answer:         rpcResult.answer,
    category:       rpcResult.category       || '',
    language:       rpcResult.language       || 'pt-BR',
    priority:       rpcResult.priority       || 0,
    allowed_agents: rpcResult.allowed_agents || [],
    is_active:      rpcResult.is_active      ?? true,
    created_at:     rpcResult.created_at,
    updated_at:     rpcResult.updated_at
  };
}

export async function updateFaq(
  faqId: string,
  updates: {
    question?:       string;
    answer?:         string;
    category?:       string;
    language?:       string;
    priority?:       number;
    allowed_agents?: string[];
    is_active?:      boolean;
  }
): Promise<FAQ> {
  const { data: rpcResult, error: rpcError } = await supabase.rpc('update_faq', {
    p_faq_id:         faqId,
    p_question:       updates.question        ?? null,
    p_answer:         updates.answer          ?? null,
    p_category:       updates.category        ?? null,
    p_language:       updates.language        ?? null,
    p_priority:       updates.priority        !== undefined ? updates.priority : null,
    p_allowed_agents: updates.allowed_agents  ?? null,
    p_is_active:      updates.is_active       !== undefined ? updates.is_active : null
  });

  if (rpcError) throw rpcError;
  if (!rpcResult?.id) throw new Error('Erro ao atualizar FAQ: resposta inválida');

  return {
    id:             rpcResult.id,
    company_id:     rpcResult.company_id,
    question:       rpcResult.question,
    answer:         rpcResult.answer,
    category:       rpcResult.category       || '',
    language:       rpcResult.language       || 'pt-BR',
    priority:       rpcResult.priority       || 0,
    allowed_agents: rpcResult.allowed_agents || [],
    is_active:      rpcResult.is_active      ?? true,
    created_at:     rpcResult.created_at,
    updated_at:     rpcResult.updated_at
  };
}

export async function deleteFaq(faqId: string): Promise<void> {
  const { data: rpcResult, error: rpcError } = await supabase.rpc('delete_faq', {
    p_faq_id: faqId
  });

  if (rpcError) throw rpcError;
  if (!rpcResult?.success) throw new Error(rpcResult?.message || 'Erro ao deletar FAQ');
}
