import { supabase } from '../lib/supabase';
import { ChatMessage } from '../types';

export interface Conversation {
  client_id: string;
  client_name: string;
  client_phone: string;
  client_chatlid: string;
  client_photo?: string;
  last_message?: string;
  last_message_type?: string;
  last_message_time?: string;
  unread_count: number;
  total_messages: number;
}

/**
 * Lista todas as conversas (agrupadas por cliente) de uma company
 * Com suporte a busca opcional
 */
export async function getConversationsList(
  companyId: string,
  searchTerm?: string
): Promise<Conversation[]> {
  try {
    if (!companyId) {
      throw new Error('Company ID é obrigatório');
    }

    const { data: rpcResult, error: rpcError } = await supabase.rpc('get_conversations_list', {
      p_company_id: companyId
    });

    if (rpcError) {
      console.error('Erro ao buscar conversas via RPC:', {
        error: rpcError,
        message: rpcError.message,
        details: rpcError.details,
        hint: rpcError.hint,
        code: rpcError.code
      });
      throw new Error(rpcError.message || 'Erro ao buscar conversas');
    }

    // Verificar se o resultado é válido
    if (rpcResult === null || rpcResult === undefined) {
      console.warn('get_conversations_list retornou null/undefined, retornando array vazio');
      return [];
    }

    // RPC retorna {success, data, total, limit, offset} (paginado)
    // ou diretamente um array (formato legado)
    const raw: any[] = Array.isArray(rpcResult)
      ? rpcResult
      : Array.isArray(rpcResult?.data) ? rpcResult.data : [];

    let conversations = raw;

    // Filtrar por termo de busca se fornecido
    if (searchTerm && searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      conversations = conversations.filter((item: any) =>
        (item.chatname ?? item.client_name)?.toLowerCase().includes(search) ||
        (item.phone ?? item.client_phone)?.toLowerCase().includes(search) ||
        item.last_message?.toLowerCase().includes(search)
      );
    }

    return conversations.map((item: any) => ({
      client_id: item.client_id,
      client_name: item.chatname ?? item.client_name ?? 'Sem nome',
      client_phone: item.phone ?? item.client_phone ?? '',
      client_chatlid: item.client_chatlid ?? '',
      client_photo: item.senderphoto ?? item.client_photo,
      last_message: item.last_message,
      last_message_type: item.last_message_type,
      last_message_time: item.last_message_at ?? item.last_message_time,
      unread_count: item.unread_count || 0,
      total_messages: item.message_count ?? item.total_messages ?? 0
    }));
  } catch (error: any) {
    console.error('Erro ao buscar conversas:', error);
    throw error;
  }
}

/**
 * Lista mensagens de um cliente específico ou de todos os clientes de uma company
 */
export async function getChatMessages(
  companyId: string,
  clientId?: string
): Promise<ChatMessage[]> {
  try {
    if (!companyId) {
      throw new Error('Company ID é obrigatório');
    }

    const { data: rpcResult, error: rpcError } = await supabase.rpc('get_chat_messages', {
      p_company_id: companyId,
      p_client_id: clientId || null
    });

    if (rpcError) {
      console.error('Erro ao buscar mensagens via RPC:', {
        error: rpcError,
        message: rpcError.message,
        details: rpcError.details,
        hint: rpcError.hint,
        code: rpcError.code,
        companyId,
        clientId
      });
      throw new Error(rpcError.message || 'Erro ao buscar mensagens');
    }

    // Verificar se o resultado é válido
    if (rpcResult === null || rpcResult === undefined) {
      console.warn('get_chat_messages retornou null/undefined, retornando array vazio');
      return [];
    }

    const messages = Array.isArray(rpcResult) ? rpcResult : [];
    return messages.map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      user_type: item.user_type,
      created_at: item.created_at,
      chatlid: item.chatlid,
      phone: item.phone,
      chatname: item.chatname,
      rec_type: item.rec_type,
      message_type: item.message_type,
      message_texto_text: item.message_texto_text,
      message_audio_ptt: item.message_audio_ptt,
      message_audio_seconds: item.message_audio_seconds,
      message_audio_url: item.message_audio_url,
      message_audio_mime_type: item.message_audio_mime_type,
      message_image_url: item.message_image_url,
      message_image_mime_type: item.message_image_mime_type,
      message_document_document_url: item.message_document_document_url,
      message_document_mime_type: item.message_document_mime_type,
      message_document_title: item.message_document_title,
      message_location_longitude: item.message_location_longitude,
      message_location_latitude: item.message_location_latitude,
      message_location_name: item.message_location_name,
      message_location_address: item.message_location_address,
      message_location_url: item.message_location_url,
      message_contact_display_name: item.message_contact_display_name,
      message_contact_vcard: item.message_contact_vcard,
      message_contact_phones: item.message_contact_phones,
      rabbitmq_success: item.rabbitmq_success ?? false,
      fromme: item.fromme ?? false,
      messageid: item.messageid,
      is_ia: item.is_ia ?? false
    }));
  } catch (error: any) {
    console.error('Erro ao buscar mensagens:', error);
    throw error;
  }
}

/**
 * Cria uma nova mensagem de chat (usado para mensagens manuais do admin ou IA)
 */
export async function createChatMessage(
  companyId: string,
  clientId: string,
  messageText: string,
  messageType: string = 'text',
  isIA: boolean = false,
  imageUrl?: string,
  imageMimeType?: string,
  documentUrl?: string,
  documentMimeType?: string,
  documentTitle?: string
): Promise<ChatMessage> {
  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc('create_chat_message', {
      p_company_id: companyId,
      p_client_id: clientId,
      p_message_texto_text: messageText,
      p_message_type: messageType,
      p_fromme: true,
      p_is_ia: isIA,
      p_message_image_url: imageUrl || null,
      p_message_image_mime_type: imageMimeType || null,
      p_message_document_document_url: documentUrl || null,
      p_message_document_mime_type: documentMimeType || null,
      p_message_document_title: documentTitle || null
    });

    if (rpcError) {
      console.error('Erro ao criar mensagem via RPC:', rpcError);
      throw rpcError;
    }

    if (!rpcResult || !rpcResult.id) {
      throw new Error('Erro ao criar mensagem: resposta inválida');
    }

    return {
      id: rpcResult.id,
      user_id: rpcResult.user_id,
      user_type: rpcResult.user_type,
      created_at: rpcResult.created_at,
      chatlid: rpcResult.chatlid,
      phone: rpcResult.phone,
      chatname: rpcResult.chatname,
      rec_type: rpcResult.rec_type,
      message_type: rpcResult.message_type,
      message_texto_text: rpcResult.message_texto_text,
      message_audio_ptt: rpcResult.message_audio_ptt,
      message_audio_seconds: rpcResult.message_audio_seconds,
      message_audio_url: rpcResult.message_audio_url,
      message_audio_mime_type: rpcResult.message_audio_mime_type,
      message_image_url: rpcResult.message_image_url,
      message_image_mime_type: rpcResult.message_image_mime_type,
      message_document_document_url: rpcResult.message_document_document_url,
      message_document_mime_type: rpcResult.message_document_mime_type,
      message_document_title: rpcResult.message_document_title,
      message_location_longitude: rpcResult.message_location_longitude,
      message_location_latitude: rpcResult.message_location_latitude,
      message_location_name: rpcResult.message_location_name,
      message_location_address: rpcResult.message_location_address,
      message_location_url: rpcResult.message_location_url,
      message_contact_display_name: rpcResult.message_contact_display_name,
      message_contact_vcard: rpcResult.message_contact_vcard,
      message_contact_phones: rpcResult.message_contact_phones,
      rabbitmq_success: rpcResult.rabbitmq_success ?? false,
      fromme: rpcResult.fromme ?? false,
      messageid: rpcResult.messageid,
      is_ia: rpcResult.rec_type === 'ia' || rpcResult.is_ia || false
    };
  } catch (error: any) {
    console.error('Erro ao criar mensagem:', error);
    throw error;
  }
}

/**
 * Faz upload de arquivo para Supabase Storage
 */
export async function uploadFile(
  companyId: string,
  clientId: string,
  file: File,
  fileType: 'image' | 'document'
): Promise<{ url: string; mimeType: string; title?: string }> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${companyId}/${clientId}/${Date.now()}.${fileExt}`;

    // Upload para Supabase Storage (o bucket já é especificado no .from())
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-files')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Erro ao fazer upload:', uploadError);
      throw uploadError;
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('chat-files')
      .getPublicUrl(fileName);

    return {
      url: publicUrl,
      mimeType: file.type,
      title: fileType === 'document' ? file.name : undefined
    };
  } catch (error: any) {
    console.error('Erro ao fazer upload de arquivo:', error);
    throw error;
  }
}

