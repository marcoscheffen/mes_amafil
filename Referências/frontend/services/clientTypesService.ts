import { supabase } from '../lib/supabase';

export interface ClientType {
  id: string;
  company_id: string;
  value: string;
  label: string;
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DeleteClientTypeResult {
  success: boolean;
  clients_reassigned: number;
  default_type: string;
}

export async function getClientTypes(companyId: string): Promise<ClientType[]> {
  const { data, error } = await supabase.rpc('get_client_types', {
    p_company_id: companyId,
  });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function createClientType(
  companyId: string,
  value: string,
  label: string
): Promise<ClientType> {
  const { data, error } = await supabase.rpc('create_client_type', {
    p_company_id: companyId,
    p_value: value,
    p_label: label,
  });
  if (error) throw error;
  return data as ClientType;
}

export async function updateClientType(
  typeId: string,
  label: string
): Promise<ClientType> {
  const { data, error } = await supabase.rpc('update_client_type', {
    p_type_id: typeId,
    p_label: label,
  });
  if (error) throw error;
  return data as ClientType;
}

export async function deleteClientType(typeId: string): Promise<DeleteClientTypeResult> {
  const { data, error } = await supabase.rpc('delete_client_type', {
    p_type_id: typeId,
  });
  if (error) throw error;
  return data as DeleteClientTypeResult;
}
