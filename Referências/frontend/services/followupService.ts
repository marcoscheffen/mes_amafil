import { supabase } from '../lib/supabase';
import { FollowupSettings, MessagingCredentials } from '../types';

export const followupService = {
  async getSettings(companyId: string): Promise<FollowupSettings> {
    const { data, error } = await supabase.rpc('get_company_followup_settings', {
      p_company_id: companyId,
    });
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Settings not found');
    return data[0];
  },

  async upsertSettings(params: {
    companyId: string;
    enabled: boolean;
    advanceHoursList: number[];
    timezone: string;
    templateMessage: string;
    autoConfirmOnReply: boolean;
    cancelAppointmentOnDecline: boolean;
    sendOnlyBusinessHours: boolean;
    maxRetryAttempts: number;
    responseMatchToleranceSeconds: number;
  }): Promise<void> {
    const { error } = await supabase.rpc('upsert_company_followup_settings', {
      p_company_id: params.companyId,
      p_enabled: params.enabled,
      p_advance_hours_list: params.advanceHoursList,
      p_timezone: params.timezone,
      p_template_message: params.templateMessage,
      p_auto_confirm_on_reply: params.autoConfirmOnReply,
      p_cancel_appointment_on_decline: params.cancelAppointmentOnDecline,
      p_send_only_business_hours: params.sendOnlyBusinessHours,
      p_max_retry_attempts: params.maxRetryAttempts,
      p_response_match_tolerance_seconds: params.responseMatchToleranceSeconds,
    });
    if (error) throw error;
  },

  async getMessagingCredentials(companyId: string): Promise<Partial<MessagingCredentials> | null> {
    const { data, error } = await supabase
      .from('company_messaging_credentials')
      .select('id, company_id, provider, instance_url, is_active, created_at, updated_at')
      .eq('company_id', companyId)
      .eq('provider', 'uazapi')
      .maybeSingle(); // Usar maybeSingle em vez de single pra não estourar erro se não existir
      
    if (error) throw error;
    return data;
  },

  async upsertMessagingCredentials(params: {
    companyId: string;
    provider: string;
    instanceUrl: string;
    token: string;
  }): Promise<void> {
    const { error } = await supabase.rpc('upsert_messaging_credentials', {
      p_company_id: params.companyId,
      p_provider: params.provider,
      p_instance_url: params.instanceUrl,
      p_token: params.token,
    });
    if (error) throw error;
  },

  async updateMessagingInstance(params: {
    companyId: string;
    provider: string;
    instanceUrl: string;
    isActive?: boolean;
  }): Promise<void> {
    const updates: Record<string, unknown> = {
      instance_url: params.instanceUrl,
    };
    if (typeof params.isActive === 'boolean') updates.is_active = params.isActive;

    const { error } = await supabase
      .from('company_messaging_credentials')
      .update(updates)
      .eq('company_id', params.companyId)
      .eq('provider', params.provider);
    if (error) throw error;
  },
  
  async testCredentials(instanceUrl: string, token: string): Promise<boolean> {
     try {
       // Tenta obter informações da instância uazapi. Substitua a URL por uma URL real válida para Uazapi se diferente
       const urlLimpa = instanceUrl.endsWith('/') ? instanceUrl.slice(0, -1) : instanceUrl;
       const res = await fetch(`${urlLimpa}/instance/connectionState`, {
          headers: { token, 'Content-Type': 'application/json' }
       });
       return res.ok;
     } catch (err) {
       return false;
     }
  }
};
