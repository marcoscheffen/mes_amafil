import { supabase } from '../lib/supabase';
import { ChatMessage } from '../types';
import type { Conversation } from './chatMessagesService';

export type ConversationPriority = 'low' | 'medium' | 'high' | 'urgent' | null;

// Estende Conversation com campos específicos do Chatwoot
export interface ChatwootConversation extends Conversation {
  cw_id: number;
  status: 'open' | 'resolved' | 'pending' | 'snoozed';
  channel: string;
  inbox_name: string;
  assignee_name?: string;
  assignee_id?: number;
  inbox_id?: number;
  priority?: ConversationPriority;
  labels?: string[];
}

// Chama a Edge Function chatwoot-proxy
async function callChatwoot<T>(
  path: string,
  method: string = 'GET',
  body?: unknown
): Promise<T> {
  const companyId = localStorage.getItem('current_company_id');
  const res = await supabase.functions.invoke('chatwoot-proxy', {
    body: { path, method, body, company_id: companyId },
  });

  const data = res.data;
  const error = res.error;

  if (error) {
    let extraDetails = "";
    try {
      if (error.context && typeof error.context.json === 'function') {
        const errBody = await error.context.json();
        extraDetails = ` | Body: ${JSON.stringify(errBody)}`;
      } else if (error.context && typeof error.context.text === 'function') {
        const errText = await error.context.text();
        extraDetails = ` | Body text: ${errText}`;
      } else {
        extraDetails = ` | Raw: ${JSON.stringify(error)}`;
      }
    } catch (e) {
      // ignore parsing errors
    }
    console.error("Chatwoot Proxy Invocation Error:", error, extraDetails);
    throw new Error(`Chatwoot proxy error: ${error.message}${extraDetails}`);
  }

  if (data?.success === false) {
    throw new Error(data.error || 'Erro ao chamar Chatwoot');
  }

  return data as T;
}

// Mapeia o canal Chatwoot para um label legível
function channelLabel(channelType: string): string {
  const map: Record<string, string> = {
    'Channel::Whatsapp': 'WhatsApp',
    'Channel::WebWidget': 'Web Chat',
    'Channel::Email': 'Email',
    'Channel::FacebookPage': 'Facebook',
    'Channel::Instagram': 'Instagram',
    'Channel::Telegram': 'Telegram',
    'Channel::Sms': 'SMS',
    'Channel::Api': 'API',
    'Channel::Twitter': 'Twitter',
    'Channel::TikTok': 'TikTok',
  };
  return map[channelType] ?? channelType;
}

// Mapeia mensagem do Chatwoot para ChatMessage do frontend
function mapChatwootMessage(msg: any): ChatMessage | null {
  // Ignorar mensagens de atividade (system events)
  if (msg.message_type === 2) return null;

  const isIncoming = msg.message_type === 0;
  const isOutgoing = msg.message_type === 1 || msg.message_type === 3;
  const isBotSender = msg.sender?.type === 'agent_bot';

  // Processar anexos
  let imageUrl: string | undefined;
  let imageMimeType: string | undefined;
  let audioUrl: string | undefined;
  let audioMime: string | undefined;
  let docUrl: string | undefined;
  let docMime: string | undefined;
  let docTitle: string | undefined;

  if (msg.attachments?.length > 0) {
    const att = msg.attachments[0];
    if (att.file_type === 0 || att.file_type === 'image') {
      imageUrl = att.data_url;
      imageMimeType = att.content_type ?? 'image/jpeg';
    } else if (att.file_type === 1 || att.file_type === 'audio') {
      audioUrl = att.data_url;
      audioMime = att.content_type ?? 'audio/ogg';
    } else if (att.file_type === 3 || att.file_type === 'file') {
      docUrl = att.data_url;
      docMime = att.content_type ?? 'application/octet-stream';
      docTitle = att.name ?? 'Documento';
    }
  }

  const privateFlag = msg.private ? ' 🔒' : '';
  const content = (msg.content ?? '') + privateFlag;

  return {
    id: String(msg.id),
    user_id: String(msg.conversation_id ?? ''),
    user_type: isIncoming ? 'client' : 'admin',
    created_at: msg.created_at,
    chatlid: String(msg.conversation_id ?? ''),
    phone: msg.sender?.phone_number ?? '',
    chatname: msg.sender?.name ?? '',
    rec_type: isBotSender ? 'ia' : 'manual',
    message_type: imageUrl ? 'image' : audioUrl ? 'audio' : docUrl ? 'document' : 'text',
    message_texto_text: content || undefined,
    message_image_url: imageUrl,
    message_image_mime_type: imageMimeType,
    message_audio_url: audioUrl,
    message_audio_mime_type: audioMime,
    message_document_document_url: docUrl,
    message_document_mime_type: docMime,
    message_document_title: docTitle,
    message_audio_ptt: false,
    message_audio_seconds: undefined,
    message_location_longitude: undefined,
    message_location_latitude: undefined,
    message_location_name: undefined,
    message_location_address: undefined,
    message_location_url: undefined,
    message_contact_display_name: undefined,
    message_contact_vcard: undefined,
    message_contact_phones: undefined,
    rabbitmq_success: true,
    fromme: isOutgoing,
    messageid: String(msg.id),
    is_ia: isBotSender,
  };
}

// Tipos para as novas funcionalidades
export interface ChatwootAgent {
  id: number;
  name: string;
  email: string;
  role: string;
  availability_status?: string;
  thumbnail?: string;
}

/**
 * Lista conversas do Chatwoot por status.
 * status: 'open' | 'resolved' | 'pending' | 'snoozed' | 'all'
 * assignee_type: 'assigned' | 'unassigned' | 'all' (padrão: todos)
 * labels: array de labels para filtrar
 */
export async function getConversations(
  status: string = 'open',
  page: number = 1,
  assigneeType?: 'assigned' | 'unassigned' | 'all',
  labels?: string[]
): Promise<ChatwootConversation[]> {
  const params = new URLSearchParams();
  if (status !== 'all') params.set('status', status);
  params.set('page', String(page));
  if (assigneeType && assigneeType !== 'all') params.set('assignee_type', assigneeType);
  if (labels?.length) labels.forEach(l => params.append('labels[]', l));

  const raw = await callChatwoot<any>(`conversations?${params.toString()}`);

  const items: any[] = raw?.data?.payload ?? raw?.payload ?? [];

  return items.map((conv: any): ChatwootConversation => {
    const sender = conv.meta?.sender ?? {};
    const lastMsg = conv.last_non_activity_message ?? conv.messages?.[0];

    return {
      // Campos de Conversation
      client_id: String(conv.id),
      client_name: sender.name ?? 'Sem nome',
      client_phone: sender.phone_number ?? '',
      client_chatlid: String(conv.id),
      client_photo: sender.thumbnail ?? sender.avatar_url ?? sender.avatar ?? undefined,
      last_message: lastMsg?.content ?? undefined,
      last_message_type: 'text',
      last_message_time: conv.last_activity_at ?? conv.updated_at,
      unread_count: conv.unread_count ?? 0,
      total_messages: conv.messages_count ?? 0,
      // Campos extras do Chatwoot
      cw_id: conv.id,
      status: conv.status ?? 'open',
      channel: channelLabel(conv.channel ?? conv.inbox_id?.channel_type ?? ''),
      inbox_name: conv.meta?.channel ?? '',
      assignee_name: conv.meta?.assignee?.name ?? undefined,
      assignee_id: conv.meta?.assignee?.id ?? undefined,
      inbox_id: conv.inbox_id,
      priority: conv.priority ?? null,
      labels: conv.labels ?? [],
    };
  });
}

/**
 * Busca mensagens de uma conversa específica do Chatwoot.
 */
export async function getMessages(conversationId: number): Promise<ChatMessage[]> {
  const raw = await callChatwoot<any>(`conversations/${conversationId}/messages`);

  const msgs: any[] = raw?.payload ?? raw?.messages ?? [];

  // Ordenar por data crescente (mais antigas primeiro)
  const sorted = [...msgs].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return sorted
    .map(mapChatwootMessage)
    .filter((m): m is ChatMessage => m !== null);
}

/**
 * Envia uma mensagem em uma conversa do Chatwoot.
 */
export async function sendMessage(
  conversationId: number,
  content: string,
  isPrivate: boolean = false
): Promise<void> {
  await callChatwoot(`conversations/${conversationId}/messages`, 'POST', {
    content,
    message_type: 'outgoing',
    private: isPrivate,
  });
}

/**
 * Envia anexo (imagem, PDF, áudio gravado, etc.) para uma conversa via proxy multipart.
 */
export async function sendAttachment(
  conversationId: number,
  file: File,
  content?: string,
  isPrivate: boolean = false
): Promise<void> {
  const companyId = localStorage.getItem('current_company_id');
  if (!companyId) {
    throw new Error('Empresa não selecionada');
  }

  const formData = new FormData();
  formData.append('path', `conversations/${conversationId}/messages`);
  formData.append('method', 'POST');
  formData.append('company_id', companyId);
  formData.append('file', file, file.name);
  if (content) formData.append('content', content);
  formData.append('private', String(isPrivate));

  const res = await supabase.functions.invoke('chatwoot-proxy', { body: formData });

  const data = res.data as { success?: boolean; error?: string } | null;
  const error = res.error;

  if (error) {
    let extraDetails = '';
    try {
      if (error.context && typeof error.context.json === 'function') {
        const errBody = await error.context.json();
        extraDetails = ` | Body: ${JSON.stringify(errBody)}`;
      } else if (error.context && typeof error.context.text === 'function') {
        const errText = await error.context.text();
        extraDetails = ` | Body text: ${errText}`;
      } else {
        extraDetails = ` | Raw: ${JSON.stringify(error)}`;
      }
    } catch {
      // ignore parsing errors
    }
    console.error('Chatwoot Proxy sendAttachment Error:', error, extraDetails);
    throw new Error(`Erro ao enviar arquivo: ${error.message}${extraDetails}`);
  }

  if (data?.success === false) {
    throw new Error(data.error || 'Erro ao enviar arquivo');
  }
}

/**
 * Altera o status de uma conversa (resolve, reabre, etc.).
 */
export async function toggleConversationStatus(
  conversationId: number,
  status: 'open' | 'resolved' | 'pending'
): Promise<void> {
  await callChatwoot(`conversations/${conversationId}/toggle_status`, 'POST', {
    status,
  });
}

/**
 * Lista os agentes disponíveis na conta do Chatwoot.
 */
export async function listAgents(): Promise<ChatwootAgent[]> {
  const raw = await callChatwoot<any>('agents');
  const items: any[] = Array.isArray(raw) ? raw : raw?.payload ?? [];
  return items.map((a: any): ChatwootAgent => ({
    id: a.id,
    name: a.name,
    email: a.email,
    role: a.role,
    availability_status: a.availability_status,
    thumbnail: a.thumbnail,
  }));
}

/**
 * Atribui uma conversa a um agente.
 * agentId: ID do agente (ou null para desatribuir)
 */
export async function assignConversation(
  conversationId: number,
  agentId: number | null
): Promise<void> {
  await callChatwoot(`conversations/${conversationId}/assignments`, 'POST', {
    assignee_id: agentId,
  });
}

/**
 * Define a prioridade de uma conversa.
 */
export async function setConversationPriority(
  conversationId: number,
  priority: ConversationPriority
): Promise<void> {
  await callChatwoot(`conversations/${conversationId}`, 'PATCH', { priority });
}

/**
 * Define os labels de uma conversa (substitui todos os existentes).
 * Para remover um label, enviar a lista sem ele.
 */
export async function setConversationLabels(
  conversationId: number,
  labels: string[]
): Promise<void> {
  await callChatwoot(`conversations/${conversationId}/labels`, 'POST', { labels });
}

/**
 * Busca conversas por texto.
 */
export async function searchConversations(
  query: string,
  page: number = 1
): Promise<ChatwootConversation[]> {
  const params = new URLSearchParams({ q: query, page: String(page) });
  const raw = await callChatwoot<any>(`search?${params.toString()}`);
  const items: any[] = raw?.data?.conversations?.payload ?? raw?.conversations?.payload ?? [];
  return items.map((conv: any): ChatwootConversation => {
    const sender = conv.meta?.sender ?? {};
    const lastMsg = conv.last_non_activity_message ?? conv.messages?.[0];
    return {
      client_id: String(conv.id),
      client_name: sender.name ?? 'Sem nome',
      client_phone: sender.phone_number ?? '',
      client_chatlid: String(conv.id),
      client_photo: sender.thumbnail ?? sender.avatar_url ?? undefined,
      last_message: lastMsg?.content ?? undefined,
      last_message_type: 'text',
      last_message_time: conv.last_activity_at ?? conv.updated_at,
      unread_count: conv.unread_count ?? 0,
      total_messages: conv.messages_count ?? 0,
      cw_id: conv.id,
      status: conv.status ?? 'open',
      channel: channelLabel(conv.channel ?? ''),
      inbox_name: conv.meta?.channel ?? '',
      assignee_name: conv.meta?.assignee?.name ?? undefined,
      assignee_id: conv.meta?.assignee?.id ?? undefined,
      inbox_id: conv.inbox_id,
      priority: conv.priority ?? null,
      labels: conv.labels ?? [],
    };
  });
}

/**
 * Busca detalhes de uma conversa específica.
 */
export async function getConversation(conversationId: number): Promise<ChatwootConversation | null> {
  try {
    const conv = await callChatwoot<any>(`conversations/${conversationId}`);
    if (!conv?.id) return null;

    const sender = conv.meta?.sender ?? {};
    const lastMsg = conv.last_non_activity_message ?? conv.messages?.[0];

    return {
      client_id: String(conv.id),
      client_name: sender.name ?? 'Sem nome',
      client_phone: sender.phone_number ?? '',
      client_chatlid: String(conv.id),
      client_photo: sender.thumbnail ?? sender.avatar_url ?? sender.avatar ?? undefined,
      last_message: lastMsg?.content ?? undefined,
      last_message_type: 'text',
      last_message_time: conv.last_activity_at ?? conv.updated_at,
      unread_count: conv.unread_count ?? 0,
      total_messages: conv.messages_count ?? 0,
      cw_id: conv.id,
      status: conv.status ?? 'open',
      channel: channelLabel(conv.channel ?? ''),
      inbox_name: conv.meta?.channel ?? '',
      assignee_name: conv.meta?.assignee?.name ?? undefined,
      assignee_id: conv.meta?.assignee?.id ?? undefined,
      inbox_id: conv.inbox_id,
      priority: conv.priority ?? null,
      labels: conv.labels ?? [],
    };
  } catch {
    return null;
  }
}
