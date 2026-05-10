import { supabase } from '../lib/supabase';
import { Settings } from '../types';

/**
 * Obtém as configurações de uma company
 */
export async function getSettings(companyId: string): Promise<Settings> {
  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc('get_settings', {
      p_company_id: companyId
    });

    if (rpcError) {
      console.error('Erro ao buscar settings via RPC:', rpcError);
      throw rpcError;
    }

    // Se não existe settings, rpcResult pode ter id null (valores padrão)
    // Isso é normal, vamos usar os valores retornados
    if (!rpcResult) {
      throw new Error('Erro ao buscar settings: resposta inválida');
    }

    // Se id é null, significa que settings não existe ainda (valores padrão)
    // O registro será criado quando update_settings for chamado
    return {
      id: rpcResult.id || '', // Pode ser null se não existe ainda
      company_id: rpcResult.company_id,
      display_name: rpcResult.display_name || null,
      logo_url: rpcResult.logo_url || null,
      logo_url_dark: rpcResult.logo_url_dark || null,
      logo_url_light: rpcResult.logo_url_light || null,
      favicon_url: rpcResult.favicon_url || null,
      primary_color: rpcResult.primary_color || '#3B82F6',
      secondary_color: rpcResult.secondary_color || '#8B5CF6',
      accent_color: rpcResult.accent_color || '#10B981',
      background_color: rpcResult.background_color || '#0F172A',
      surface_color: rpcResult.surface_color || '#1E293B',
      text_color: rpcResult.text_color || '#F1F5F9',
      sidebar_width: rpcResult.sidebar_width || 280,
      header_height: rpcResult.header_height || 64,
      theme: rpcResult.theme || 'dark',
      additional_settings: rpcResult.additional_settings || {},
      created_at: rpcResult.created_at || new Date().toISOString(),
      updated_at: rpcResult.updated_at || new Date().toISOString()
    };
  } catch (error: any) {
    console.error('Erro ao buscar settings:', error);
    throw error;
  }
}

/**
 * Atualiza as configurações de uma company
 */
export async function updateSettings(
  companyId: string,
  updates: {
    display_name?: string;
    logo_url?: string;
    logo_url_dark?: string;
    logo_url_light?: string;
    favicon_url?: string | null;
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
    background_color?: string;
    surface_color?: string;
    text_color?: string;
    sidebar_width?: number;
    header_height?: number;
    theme?: 'dark' | 'light';
    additional_settings?: Record<string, any>;
  }
): Promise<Settings> {
  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc('update_settings', {
      p_company_id: companyId,
      p_display_name: updates.display_name !== undefined ? updates.display_name : null,
      p_logo_url: updates.logo_url !== undefined ? updates.logo_url : null,
      p_logo_url_dark: updates.logo_url_dark !== undefined ? updates.logo_url_dark : null,
      p_logo_url_light: updates.logo_url_light !== undefined ? updates.logo_url_light : null,
      p_favicon_url: updates.favicon_url !== undefined ? updates.favicon_url : null,
      p_primary_color: updates.primary_color !== undefined ? updates.primary_color : null,
      p_secondary_color: updates.secondary_color !== undefined ? updates.secondary_color : null,
      p_accent_color: updates.accent_color !== undefined ? updates.accent_color : null,
      p_background_color: updates.background_color !== undefined ? updates.background_color : null,
      p_surface_color: updates.surface_color !== undefined ? updates.surface_color : null,
      p_text_color: updates.text_color !== undefined ? updates.text_color : null,
      p_sidebar_width: updates.sidebar_width !== undefined ? updates.sidebar_width : null,
      p_header_height: updates.header_height !== undefined ? updates.header_height : null,
      p_theme: updates.theme !== undefined ? updates.theme : null,
      p_additional_settings: updates.additional_settings !== undefined ? updates.additional_settings : null
    });

    if (rpcError) {
      console.error('Erro ao atualizar settings via RPC:', rpcError);
      throw rpcError;
    }

    if (!rpcResult || !rpcResult.id) {
      throw new Error('Erro ao atualizar settings: resposta inválida');
    }

    return {
      id: rpcResult.id,
      company_id: rpcResult.company_id,
      display_name: rpcResult.display_name || null,
      logo_url: rpcResult.logo_url || null,
      logo_url_dark: rpcResult.logo_url_dark || null,
      logo_url_light: rpcResult.logo_url_light || null,
      favicon_url: rpcResult.favicon_url || null,
      primary_color: rpcResult.primary_color || '#3B82F6',
      secondary_color: rpcResult.secondary_color || '#8B5CF6',
      accent_color: rpcResult.accent_color || '#10B981',
      background_color: rpcResult.background_color || '#0F172A',
      surface_color: rpcResult.surface_color || '#1E293B',
      text_color: rpcResult.text_color || '#F1F5F9',
      sidebar_width: rpcResult.sidebar_width || 280,
      header_height: rpcResult.header_height || 64,
      theme: rpcResult.theme || 'dark',
      additional_settings: rpcResult.additional_settings || {},
      created_at: rpcResult.created_at,
      updated_at: rpcResult.updated_at
    };
  } catch (error: any) {
    console.error('Erro ao atualizar settings:', error);
    throw error;
  }
}

/**
 * Faz upload de logo para Supabase Storage
 * @param companyId ID da empresa
 * @param file Arquivo de imagem
 * @param theme Tema do logo ('dark' ou 'light')
 */
export async function uploadLogo(
  companyId: string,
  file: File,
  theme: 'dark' | 'light' = 'dark'
): Promise<{ url: string }> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${companyId}/logo-${theme}.${fileExt}`;

    // Upload para Supabase Storage (tentar diretamente)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('company-assets')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true // Permite sobrescrever logo existente
      });

    if (uploadError) {
      console.error('Erro ao fazer upload do logo:', uploadError);
      
      // Mensagem mais amigável para erro de bucket
      if (uploadError.message?.includes('Bucket not found') || 
          uploadError.message?.includes('not found') ||
          uploadError.message?.includes('The resource was not found')) {
        throw new Error(
          'Bucket "company-assets" não encontrado. ' +
          'Por favor, crie o bucket no Supabase Dashboard: ' +
          'Storage > New bucket > Nome: company-assets > Public: Sim'
        );
      }
      
      // Outros erros de upload
      throw new Error(uploadError.message || 'Erro ao fazer upload do logo');
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('company-assets')
      .getPublicUrl(fileName);

    const separator = publicUrl.includes('?') ? '&' : '?';
    const cacheBustedUrl = `${publicUrl}${separator}v=${Date.now()}`;

    return { url: cacheBustedUrl };
  } catch (error: any) {
    console.error('Erro ao fazer upload de logo:', error);
    
    // Retornar mensagem de erro
    if (error.message) {
      throw error;
    }
    
    throw new Error('Erro ao fazer upload do logo. Verifique se o bucket "company-assets" foi criado no Supabase.');
  }
}

/**
 * Upload do favicon (mesmo bucket que logos).
 */
export async function uploadFavicon(companyId: string, file: File): Promise<{ url: string }> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${companyId}/favicon.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('company-assets')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      if (
        uploadError.message?.includes('Bucket not found') ||
        uploadError.message?.includes('not found') ||
        uploadError.message?.includes('The resource was not found')
      ) {
        throw new Error(
          'Bucket "company-assets" não encontrado. ' +
            'Por favor, crie o bucket no Supabase Dashboard: ' +
            'Storage > New bucket > Nome: company-assets > Public: Sim'
        );
      }
      throw new Error(uploadError.message || 'Erro ao fazer upload do favicon');
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('company-assets').getPublicUrl(fileName);

    const separator = publicUrl.includes('?') ? '&' : '?';
    return { url: `${publicUrl}${separator}v=${Date.now()}` };
  } catch (error: any) {
    if (error.message) throw error;
    throw new Error('Erro ao fazer upload do favicon.');
  }
}

/**
 * Verifica se a empresa possui token do Chatwoot configurado
 */
export async function hasChatwootToken(companyId: string): Promise<boolean> {
  try {
    const { data: hasToken, error } = await supabase.rpc('has_chatwoot_token', {
      p_company_id: companyId
    });

    if (error) {
      console.error('Erro ao verificar token do Chatwoot:', error);
      return false;
    }

    return !!hasToken;
  } catch (error) {
    console.error('Erro de rede ao verificar token do Chatwoot:', error);
    return false;
  }
}

/**
 * Salva o token individual Chatwoot do agente no Vault
 */
export async function setAgentChatwootToken(token: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  const { error } = await supabase.rpc('set_chatwoot_agent_token', {
    p_user_id: user.id,
    p_token: token,
  });
  if (error) throw error;
}

/**
 * Verifica se o agente possui token individual Chatwoot configurado
 */
export async function hasAgentChatwootToken(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data, error } = await supabase.rpc('get_chatwoot_agent_token', {
      p_user_id: user.id,
    });
    return !error && !!data;
  } catch {
    return false;
  }
}

/**
 * Salva o token do Chatwoot no Vault
 */
export async function setChatwootToken(companyId: string, token: string): Promise<boolean> {
  try {
    const { data: success, error } = await supabase.rpc('set_chatwoot_token', {
      p_company_id: companyId,
      p_token: token
    });

    if (error) {
      console.error('Erro ao salvar token do Chatwoot:', error);
      throw error;
    }

    return !!success;
  } catch (error) {
    console.error('Erro de rede ao salvar token do Chatwoot:', error);
    throw error;
  }
}
