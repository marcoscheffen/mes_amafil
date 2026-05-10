import { supabase } from '../lib/supabase';

export interface GoogleCalendarStatus {
  connected: boolean;
  google_email: string | null;
  expires_at: string | null;
  token_expired: boolean;
}

export interface ProfessionalCalendarInfo {
  user_id: string;
  user_email: string;
  full_name: string;
  google_calendar_id: string | null;
  has_calendar: boolean;
}

/**
 * Verifica se a empresa já tem credenciais OAuth Google configuradas (Client ID)
 */
export async function hasGoogleOAuthCredentials(companyId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('has_google_oauth_credentials', {
      p_company_id: companyId
    });
    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
}

/**
 * Salva o Google OAuth Client ID e Client Secret no Vault
 */
export async function setGoogleOAuthCredentials(
  companyId: string,
  clientId: string,
  clientSecret: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('set_google_oauth_credentials', {
      p_company_id: companyId,
      p_client_id: clientId,
      p_client_secret: clientSecret
    });
    if (error) throw error;
    return !!data;
  } catch (error: any) {
    console.error('Erro ao salvar credenciais Google:', error);
    throw error;
  }
}

/**
 * Retorna o status de conexão Google Calendar da empresa
 */
export async function getGoogleCalendarStatus(companyId: string): Promise<GoogleCalendarStatus> {
  try {
    const { data, error } = await supabase
      .from('company_google_calendar_tokens')
      .select('google_email, expires_at')
      .eq('company_id', companyId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { connected: false, google_email: null, expires_at: null, token_expired: false };

    // Token é considerado quebrado se expires_at está > 2h no passado.
    // Access tokens expiram em ~1h e são renovados on-demand — um atraso maior indica falha no refresh.
    const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000;
    const tokenExpired = data.expires_at
      ? new Date(data.expires_at).getTime() + STALE_THRESHOLD_MS < Date.now()
      : false;

    return {
      connected: true,
      google_email: data.google_email,
      expires_at: data.expires_at,
      token_expired: tokenExpired,
    };
  } catch (error: any) {
    console.error('Erro ao verificar status Google Calendar:', error);
    return { connected: false, google_email: null, expires_at: null, token_expired: false };
  }
}

/**
 * Gera a URL de autorização OAuth Google e redireciona o admin
 */
export async function startGoogleOAuthFlow(companyId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Usuário não autenticado');

  const supabaseUrl = (supabase as any).supabaseUrl as string;
  const oauthUrl = `${supabaseUrl}/functions/v1/google-oauth-start?company_id=${companyId}`;

  const response = await fetch(oauthUrl, {
    headers: { Authorization: `Bearer ${session.access_token}` }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao iniciar autenticação Google');
  }

  const { auth_url } = await response.json();
  if (!auth_url) throw new Error('URL de autenticação não retornada');

  window.location.href = auth_url;
}

/**
 * Desconecta a conta Google da empresa
 */
export async function disconnectGoogleCalendar(companyId: string): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Usuário não autenticado');

    const supabaseUrl = (supabase as any).supabaseUrl as string;
    const response = await fetch(`${supabaseUrl}/functions/v1/google-oauth-disconnect`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ company_id: companyId }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao desconectar conta Google');
    }
  } catch (error: any) {
    console.error('Erro ao desconectar Google Calendar:', error);
    throw error;
  }
}

/**
 * Lista os profissionais da empresa com status de calendário Google
 */
export async function getProfessionalsCalendarStatus(
  companyId: string
): Promise<ProfessionalCalendarInfo[]> {
  try {
    const { data, error } = await supabase.rpc('get_professionals_calendar_status', {
      p_company_id: companyId
    });
    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Erro ao buscar status dos calendários:', error);
    return [];
  }
}

/**
 * Cria o calendário Google para um profissional que ainda não tem
 */
export async function createProfessionalCalendar(
  companyId: string,
  userId: string
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Usuário não autenticado');

  const supabaseUrl = (supabase as any).supabaseUrl as string;
  const response = await fetch(`${supabaseUrl}/functions/v1/create-professional-calendar`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ company_id: companyId, user_id: userId }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao criar calendário do profissional');
  }
}
