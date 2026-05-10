import { supabase } from '../lib/supabase';

export interface MessageLogRow {
  id: string;
  client_id: string;
  message_id: string | null;
  content: string | null;
  message_type: string | null;
  media_type: string | null;
  from_me: boolean;
  was_sent_by_api: boolean;
  sender_name: string | null;
  created_at: string;
  total_count: number;
}

export interface TokenUsageForMessage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  model: string;
}

export interface TokenUsageByModel {
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  count: number;
}

export interface TokenUsageSummary {
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_tokens: number;
  by_model: TokenUsageByModel[] | null;
}

export async function getMessageLog(params: {
  companyId: string;
  clientId?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  limit?: number;
  offset?: number;
}): Promise<{ rows: MessageLogRow[]; error: string | null }> {
  const { data, error } = await supabase.rpc('get_message_log', {
    p_company_id: params.companyId,
    p_client_id: params.clientId ?? null,
    p_date_from: params.dateFrom ?? null,
    p_date_to: params.dateTo ?? null,
    p_limit: params.limit ?? 100,
    p_offset: params.offset ?? 0,
  });
  if (error) {
    console.error('get_message_log', error);
    return { rows: [], error: error.message };
  }
  return { rows: (data || []) as MessageLogRow[], error: null };
}

export async function getTokenUsageSummary(params: {
  companyId: string;
  clientId?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}): Promise<{ summary: TokenUsageSummary | null; error: string | null }> {
  const { data, error } = await supabase.rpc('get_token_usage_summary', {
    p_company_id: params.companyId,
    p_client_id: params.clientId ?? null,
    p_date_from: params.dateFrom ?? null,
    p_date_to: params.dateTo ?? null,
  });
  if (error) {
    console.error('get_token_usage_summary', error);
    return { summary: null, error: error.message };
  }
  if (data == null || typeof data !== 'object') {
    return { summary: null, error: null };
  }
  return { summary: data as TokenUsageSummary, error: null };
}

export async function getTokenUsageByMessages(params: {
  companyId: string;
  messageIds: string[];
}): Promise<{ data: Map<string, TokenUsageForMessage>; error: string | null }> {
  if (params.messageIds.length === 0) return { data: new Map(), error: null };
  const { data, error } = await supabase.rpc('get_token_usage_by_messages', {
    p_company_id: params.companyId,
    p_message_ids: params.messageIds,
  });
  if (error) {
    console.error('get_token_usage_by_messages', error);
    return { data: new Map(), error: error.message };
  }
  const map = new Map<string, TokenUsageForMessage>();
  for (const row of (data || []) as Array<{
    message_id: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    model: string;
  }>) {
    if (!row.message_id) continue;
    map.set(row.message_id, {
      prompt_tokens: row.prompt_tokens ?? 0,
      completion_tokens: row.completion_tokens ?? 0,
      total_tokens: row.total_tokens ?? 0,
      model: row.model ?? '',
    });
  }
  return { data: map, error: null };
}
