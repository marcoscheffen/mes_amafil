import { supabase, ACTIVE_URL, ACTIVE_ANON_KEY } from '../lib/supabase';

const SUPABASE_URL = ACTIVE_URL;
const SUPABASE_ANON_KEY = ACTIVE_ANON_KEY;

export interface GlobalAdminCompany {
  company_id: string;
  company_name: string;
  company_slug: string;
  is_active: boolean;
  owner_email: string | null;
  users_count: number;
  created_at: string;
  // Extended fields (PRD 3.1)
  trade_name?: string;
  cnpj?: string;
  phone_primary?: string;
  contact_email?: string;
  city?: string;
  state?: string;
}

export interface GlobalAdminUser {
  user_id: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  company_id: string;
  company_name: string;
  created_at: string;
  is_active: boolean;
}

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || SUPABASE_ANON_KEY;
}

export async function isGlobalAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_global_admin');
  if (error) return false;
  return data === true;
}

export async function getAllCompanies(): Promise<GlobalAdminCompany[]> {
  const { data, error } = await supabase.rpc('get_all_companies');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function globalAdminUpdateCompany(
  companyId: string,
  updates: {
    name?: string;
    is_active?: boolean;
    settings?: any;
    trade_name?: string;
    cnpj?: string;
    zip_code?: string;
    street?: string;
    street_number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    phone_primary?: string;
    contact_email?: string;
  }
): Promise<any> {
  const { data, error } = await supabase.rpc('global_admin_update_company', {
    p_company_id: companyId,
    p_name: updates.name ?? null,
    p_is_active: updates.is_active ?? null,
    p_settings: updates.settings ?? null,
    p_trade_name: updates.trade_name ?? null,
    p_cnpj: updates.cnpj ?? null,
    p_zip_code: updates.zip_code ?? null,
    p_street: updates.street ?? null,
    p_street_number: updates.street_number ?? null,
    p_complement: updates.complement ?? null,
    p_neighborhood: updates.neighborhood ?? null,
    p_city: updates.city ?? null,
    p_state: updates.state ?? null,
    p_phone_primary: updates.phone_primary ?? null,
    p_contact_email: updates.contact_email ?? null,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function globalAdminDeleteCompany(companyId: string): Promise<any> {
  const { data, error } = await supabase.rpc('global_admin_delete_company', {
    p_company_id: companyId,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function getAdminUsers(): Promise<GlobalAdminUser[]> {
  const { data, error } = await supabase.rpc('get_all_admin_users');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createCompanyByAdmin(params: {
  company_name: string;
  company_slug: string;
  admin_email: string;
  admin_password: string;
  trade_name?: string;
  cnpj?: string;
  zip_code?: string;
  street?: string;
  street_number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  phone_primary?: string;
  contact_email?: string;
  admin_full_name?: string;
  admin_phone?: string;
}): Promise<any> {
  const token = await getAuthToken();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/create-company-by-admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(params),
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao criar empresa');
  }
  return result;
}

export async function createOperatorUser(params: {
  email: string;
  password: string;
  company_id: string;
  role: 'admin' | 'user';
  full_name?: string;
  phone_primary?: string;
  is_active?: boolean;
}): Promise<any> {
  const token = await getAuthToken();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/create-operator-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(params),
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao criar operador');
  }
  return result;
}

export async function globalAdminUpdateUser(
  userId: string,
  companyId: string,
  updates: {
    full_name?: string;
    phone?: string;
    role?: string;
    is_active?: boolean;
    email?: string;
  }
): Promise<any> {
  const { data, error } = await supabase.rpc('global_admin_update_user', {
    p_user_id:    userId,
    p_company_id: companyId,
    p_full_name:  updates.full_name  ?? null,
    p_phone:      updates.phone      ?? null,
    p_role:       updates.role       ?? null,
    p_is_active:  updates.is_active  ?? null,
    p_email:      updates.email      ?? null,
  });
  if (error) throw new Error(error.message);
  return data;
}

export interface GlobalOwner {
  user_id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export async function getGlobalOwners(): Promise<GlobalOwner[]> {
  const { data, error } = await supabase.rpc('get_global_owners');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function deactivateGlobalOwner(userId: string): Promise<void> {
  const { data, error } = await supabase.rpc('global_admin_deactivate_global_owner', {
    p_user_id: userId,
  });
  if (error) throw new Error(error.message);
  if (data && !data.success) throw new Error(data.error);
}

export async function createAdminUser(params: {
  full_name: string;
  email: string;
  password: string;
  phone_primary?: string;
  company_ids: string[];
  is_active?: boolean;
}): Promise<any> {
  const token = await getAuthToken();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/create-admin-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(params),
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao criar administrador');
  }
  return result;
}
