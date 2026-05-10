import { supabase } from '../lib/supabase';

export type ClientInfoAnswerType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'email'
  | 'uf'
  | 'instagram'
  | 'client_type'
  | 'sports_json'
  | 'select'
  | 'multi_select';

export type ClientInfoTargetField =
  | 'custom'
  | 'ai_name'
  | 'ai_company'
  | 'ai_city'
  | 'ai_state'
  | 'ai_sports'
  | 'ai_courts'
  | 'ai_email'
  | 'ai_social'
  | 'ai_client_type'
  | 'ai_marketing';

export interface ClientInfoForm {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  locked_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  questions: ClientInfoFormQuestion[];
}

export interface ClientInfoFormSummary {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  locked_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientInfoFormQuestion {
  id: string;
  form_id: string;
  question_text: string;
  help_text: string | null;
  order_index: number;
  answer_type: ClientInfoAnswerType;
  target_field: ClientInfoTargetField;
  options: unknown[];
  is_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientInfoAnswer {
  id: string;
  company_id: string;
  client_id: string;
  form_id: string;
  form_name: string;
  question_id: string;
  question_text: string;
  answer_type: ClientInfoAnswerType;
  target_field: ClientInfoTargetField;
  raw_answer: string | null;
  normalized_value: unknown | null;
  confidence: number | null;
  source_message_id: string | null;
  source_execution_id: string | null;
  updated_by: 'ai' | 'user';
  created_at: string;
  updated_at: string;
}

export interface ClientInfoQuestionDraft {
  question_text: string;
  help_text?: string | null;
  answer_type: ClientInfoAnswerType;
  target_field: ClientInfoTargetField;
  options?: unknown[];
  is_required: boolean;
  order_index: number;
}

// ─── Read (company member + global admin) ────────────────────────────────────

export async function listClientInfoForms(companyId: string): Promise<ClientInfoForm[]> {
  const { data, error } = await supabase.rpc('get_client_info_forms', {
    p_company_id: companyId,
  });
  if (error) throw error;
  return Array.isArray(data) ? (data as ClientInfoForm[]) : [];
}

export async function getClientInfoAnswers(clientId: string): Promise<ClientInfoAnswer[]> {
  const { data, error } = await supabase.rpc('get_client_info_answers', {
    p_client_id: clientId,
  });
  if (error) throw error;
  return Array.isArray(data) ? (data as ClientInfoAnswer[]) : [];
}

// ─── Admin functions (global_admin only) ─────────────────────────────────────

export async function adminListAllForms(): Promise<ClientInfoFormSummary[]> {
  const { data, error } = await supabase
    .from('client_info_forms')
    .select('id, company_id, name, description, is_active, locked_at, created_by, created_at, updated_at')
    .order('company_id')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ClientInfoFormSummary[];
}

export async function adminGetFormWithQuestions(formId: string): Promise<ClientInfoForm | null> {
  const { data: form, error: formError } = await supabase
    .from('client_info_forms')
    .select('*')
    .eq('id', formId)
    .single();
  if (formError) throw formError;
  if (!form) return null;

  const { data: questions, error: qError } = await supabase
    .from('client_info_form_questions')
    .select('*')
    .eq('form_id', formId)
    .eq('is_active', true)
    .order('order_index')
    .order('created_at');
  if (qError) throw qError;

  return {
    ...(form as Omit<ClientInfoForm, 'questions'>),
    questions: (questions ?? []) as ClientInfoFormQuestion[],
  };
}

export async function adminCreateForm(params: {
  companyId: string;
  name: string;
  description?: string | null;
}): Promise<ClientInfoForm> {
  const { data, error } = await supabase.rpc('create_client_info_form', {
    p_company_id: params.companyId,
    p_name: params.name,
    p_description: params.description ?? null,
  });
  if (error) throw error;
  return { ...(data as Omit<ClientInfoForm, 'questions'>), questions: [] };
}

export async function adminArchiveForm(formId: string): Promise<void> {
  const { error } = await supabase.rpc('archive_client_info_form', {
    p_form_id: formId,
  });
  if (error) throw error;
}

export async function adminUpdateFormMetadata(params: {
  formId: string;
  name: string;
  description?: string | null;
}): Promise<void> {
  const { error } = await supabase
    .from('client_info_forms')
    .update({ name: params.name, description: params.description ?? null })
    .eq('id', params.formId);
  if (error) throw error;
}

export async function adminSaveFormQuestions(
  formId: string,
  questions: ClientInfoQuestionDraft[]
): Promise<void> {
  const { error: deactivateError } = await supabase
    .from('client_info_form_questions')
    .update({ is_active: false })
    .eq('form_id', formId)
    .eq('is_active', true);
  if (deactivateError) throw deactivateError;

  if (questions.length === 0) return;

  const { error: insertError } = await supabase
    .from('client_info_form_questions')
    .insert(
      questions.map((q, i) => ({
        form_id: formId,
        question_text: q.question_text,
        help_text: q.help_text ?? null,
        order_index: q.order_index ?? i,
        answer_type: q.answer_type,
        target_field: q.target_field,
        options: q.options ?? [],
        is_required: q.is_required,
      }))
    );
  if (insertError) throw insertError;
}

// ─── Kept for backward compatibility ─────────────────────────────────────────

export async function saveClientInfoFormQuestions(
  formId: string,
  questions: ClientInfoQuestionDraft[]
): Promise<void> {
  return adminSaveFormQuestions(formId, questions);
}

// ─── Answer upsert ───────────────────────────────────────────────────────────

export async function upsertClientInfoAnswer(params: {
  companyId: string;
  clientId: string;
  formId: string;
  questionId: string;
  rawAnswer: string | null;
  normalizedValue?: unknown | null;
  confidence?: number | null;
  updatedBy?: 'ai' | 'user';
}): Promise<ClientInfoAnswer> {
  const { data, error } = await supabase.rpc('upsert_client_info_answer', {
    p_company_id: params.companyId,
    p_client_id: params.clientId,
    p_form_id: params.formId,
    p_question_id: params.questionId,
    p_raw_answer: params.rawAnswer,
    p_normalized_value: params.normalizedValue ?? null,
    p_confidence: params.confidence ?? null,
    p_source_message_id: null,
    p_source_execution_id: null,
    p_updated_by: params.updatedBy ?? 'user',
  });
  if (error) throw error;
  return data as ClientInfoAnswer;
}
