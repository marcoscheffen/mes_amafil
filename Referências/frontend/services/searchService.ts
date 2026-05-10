import { supabase } from '../lib/supabase';

export type SearchResultType = 'cliente' | 'servico' | 'agendamento' | 'atendimento' | 'transcricao';

export interface SearchResult {
  entity_id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
}

export async function searchGlobal(
  companyId: string,
  query: string,
  limit = 5,
): Promise<SearchResult[]> {
  const { data, error } = await supabase.rpc('search_global', {
    p_company_id: companyId,
    p_query: query,
    p_limit: limit,
  });
  if (error) throw error;
  return (data as SearchResult[]) || [];
}
