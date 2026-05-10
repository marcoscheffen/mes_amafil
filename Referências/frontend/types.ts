
export type Role = 'admin' | 'operator' | 'user';

export interface Company {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  settings?: any;
  // Extended fields (PRD 3.1)
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
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  user_id: string;
  full_name: string;
  phone_primary?: string;
}

export interface CompanyUser {
  id: string;
  user_id: string;
  company_id: string;
  role: Role;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Join fields for UI
  user_email?: string;
  user_name?: string;
  full_name?: string;
  phone_primary?: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: Role; // Role na empresa selecionada
  company_id: string;
  phone_primary?: string;
}

export interface DashboardMetrics {
  agents_active: number;
  conversations_today: number;
  clients_total: number;
  articles_total: number;
  faqs_total: number;
  knowledge_total: number;
}

export interface Agent {
  id: string;
  name: string;
  slug: string;
  description: string;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  tags: string[];
  company_id: string;
  client_id?: string;
  created_at: string;
}

/** Item de esporte/interesse (ai_sports JSONB) */
export interface SportItem {
  name?: string;
  type?: string;
  courts?: number;
}

export interface Customer {
  id: string;
  user_type: string;
  company_id: string;
  chatlid: string;
  phone: string;
  chatname: string;
  sendername?: string;
  senderphoto?: string;
  /** Dados da tabela clients_ai (IA) */
  ai_name?: string;
  ai_city?: string;
  ai_state?: string;
  ai_email?: string;
  ai_interest: string[];
  ai_marketing: boolean;
  /** Gestores (user_type: company) */
  ai_company?: string;
  ai_courts?: number;
  ai_social?: string;
  ai_client_type?: string;
  /** Esportes (JSONB no backend: array de { name, type, courts }) */
  ai_sports?: SportItem[];
  iaservice: boolean;
  isblock: boolean;
  created_at: string;
  updated_at: string;
}

export type MessageSource = 'client' | 'admin_manual' | 'admin_ia';

export interface ChatMessage {
  id: string;
  user_id: string;
  user_type: 'client' | 'admin';
  created_at: string;
  chatlid: string;
  phone: string;
  chatname?: string;
  rec_type?: string;
  message_type?: string;
  message_texto_text?: string;
  message_audio_ptt?: boolean;
  message_audio_seconds?: number;
  message_audio_url?: string;
  message_audio_mime_type?: string;
  message_image_url?: string;
  message_image_mime_type?: string;
  message_document_document_url?: string;
  message_document_mime_type?: string;
  message_document_title?: string;
  message_location_longitude?: number;
  message_location_latitude?: number;
  message_location_name?: string;
  message_location_address?: string;
  message_location_url?: string;
  message_contact_display_name?: string;
  message_contact_vcard?: string;
  message_contact_phones?: any; // JSONB
  rabbitmq_success: boolean;
  fromme?: boolean;
  messageid?: string;
  is_ia?: boolean; // Campo derivado de rec_type para facilitar uso no frontend
}

export type Message = ChatMessage;

export interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  language: string;
  priority: number;
  is_active: boolean;
  tags: string[]; // Array de slugs de tags
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  language: string;
  priority: number;
  allowed_agents: string[]; // Array de slugs de agentes
  is_active: boolean;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  is_active: boolean;
  company_id: string;
  created_at: string;
  updated_at: string;
}

// ─── Task Management ──────────────────────────────────────────────────────────

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatusType = 'active' | 'terminal_done' | 'terminal_cancel';

export interface TaskStatus {
  id: string;
  company_id: string;
  name: string;
  color: string;
  position: number;
  type: TaskStatusType;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  company_id: string;
  status_id: string;
  client_id?: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  due_date?: string;
  reminder_at?: string;
  assigned_to?: string;
  created_by: string;
  // RPC returns task_position to avoid reserved word conflict
  task_position?: number;
  position: number;
  tags: any[];
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  // Denormalized fields from get_company_tasks RPC
  status_name?: string;
  status_color?: string;
  status_type?: TaskStatusType;
  status_position?: number;
  client_name?: string;
  assignee_name?: string;
  creator_name?: string;
}

export interface TaskTag {
  id: string;
  task_id: string;
  tag_id: string;
  tag_name?: string;
  tag_color?: string;
}

// ─── Pontos ───────────────────────────────────────────────────────────────────

export interface Ponto {
  id: string;
  company_id: string;
  client_id: string;
  inserted_by: string;
  inserted_by_name?: string;
  points: number;
  description?: string;
  attendance_id?: string | null;
  attendance_type_name?: string | null;
  attendance_attended_at?: string | null;
  created_at: string;
}

export interface PontoRanking {
  client_id: string;
  client_name: string;
  phone: string;
  total_points: number;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface Settings {
  id: string;
  company_id: string;
  display_name?: string;
  logo_url?: string; // Fallback para compatibilidade
  logo_url_dark?: string; // Logo para tema escuro
  logo_url_light?: string; // Logo para tema claro
  favicon_url?: string | null; // Ícone da aba do navegador
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  surface_color: string;
  text_color: string;
  sidebar_width: number;
  header_height: number;
  theme: 'dark' | 'light';
  additional_settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ─── Followup de Agenda ───────────────────────────────────────────────────────

export type ConfirmationStatus = 'not_requested' | 'requested' | 'confirmed' | 'declined' | 'no_response';

export interface FollowupSettings {
  id: string;
  company_id: string;
  enabled: boolean;
  advance_hours_list: number[];
  timezone: string;
  template_message: string;
  auto_confirm_on_reply: boolean;
  cancel_appointment_on_decline: boolean;
  send_only_business_hours: boolean;
  max_retry_attempts: number;
  response_match_tolerance_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface MessagingCredentials {
  id: string;
  company_id: string;
  provider: 'uazapi';
  instance_url: string;
  token_vault_ref: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
