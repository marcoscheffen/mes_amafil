import { supabase } from '../lib/supabase';

// --- Types ---

export interface AiForm {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiFormQuestion {
  id: string;
  form_id: string;
  question_text: string;
  order_index: number;
  created_at: string;
}

export interface AiFormWithQuestions extends AiForm {
  questions: AiFormQuestion[];
}

export interface AiTranscription {
  id: string;
  company_id: string;
  user_id: string | null;
  form_id: string | null;
  client_id: string | null;
  attendance_id: string | null;
  audio_url: string | null;
  audio_filename: string | null;
  audio_duration_seconds: number | null;
  transcription_text: string | null;
  status: 'pending' | 'processing' | 'done' | 'error';
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientOption {
  id: string;
  name: string;
}

export interface AttendanceOption {
  id: string;
  type_name: string;
  client_display: string;
  client_id: string;
  appointment_id: string | null;
  attended_at: string | null;
  created_at: string | null;
}

export interface AiTranscriptionAnswer {
  id: string;
  transcription_id: string;
  question_id: string;
  question_text: string;
  ai_answer: string | null;
  current_answer: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiTranscriptionAnswerEdit {
  id: string;
  answer_id: string;
  previous_value: string | null;
  new_value: string | null;
  edited_by: string | null;
  edited_at: string;
}

export interface TranscricaoApiAnswer {
  question_id: string;
  question_text: string;
  ai_answer: string;
}

export interface TranscricaoResult {
  transcription_text: string;
  answers: TranscricaoApiAnswer[];
}

// --- Forms ---

export async function listForms(companyId: string): Promise<AiForm[]> {
  const { data, error } = await supabase
    .from('ai_forms')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getFormWithQuestions(formId: string): Promise<AiFormWithQuestions | null> {
  const { data: form, error: formError } = await supabase
    .from('ai_forms')
    .select('*')
    .eq('id', formId)
    .maybeSingle();
  if (formError) throw formError;
  if (!form) return null;

  const { data: questions, error: qError } = await supabase
    .from('ai_form_questions')
    .select('*')
    .eq('form_id', formId)
    .order('order_index', { ascending: true });
  if (qError) throw qError;

  return { ...form, questions: questions ?? [] };
}

export async function createForm(params: {
  companyId: string;
  name: string;
  description?: string;
}): Promise<AiForm> {
  const { data, error } = await supabase
    .from('ai_forms')
    .insert({
      company_id: params.companyId,
      name: params.name,
      description: params.description ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateForm(params: {
  formId: string;
  name: string;
  description?: string | null;
}): Promise<void> {
  const { error } = await supabase
    .from('ai_forms')
    .update({ name: params.name, description: params.description ?? null })
    .eq('id', params.formId);
  if (error) throw error;
}

export async function deleteForm(formId: string): Promise<void> {
  const { error } = await supabase
    .from('ai_forms')
    .update({ is_active: false })
    .eq('id', formId);
  if (error) throw error;
}

// --- Questions ---

export async function saveFormQuestions(
  formId: string,
  questions: Array<{ question_text: string; order_index: number }>
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('ai_form_questions')
    .delete()
    .eq('form_id', formId);
  if (deleteError) throw deleteError;

  if (questions.length === 0) return;

  const { error: insertError } = await supabase
    .from('ai_form_questions')
    .insert(
      questions.map((q, i) => ({
        form_id: formId,
        question_text: q.question_text,
        order_index: q.order_index ?? i,
      }))
    );
  if (insertError) throw insertError;
}

// --- Audio Upload ---

export async function uploadAudio(
  companyId: string,
  transcriptionId: string,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `${companyId}/${transcriptionId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('assistente-ia-audios')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (uploadError) throw uploadError;

  const { data: signedData, error: signedError } = await supabase.storage
    .from('assistente-ia-audios')
    .createSignedUrl(path, 600); // 10 minutos — tempo suficiente para o n8n baixar
  if (signedError || !signedData?.signedUrl) {
    throw signedError ?? new Error('Falha ao gerar signed URL do áudio');
  }

  return signedData.signedUrl;
}

// --- Transcription ---

export async function listClientsForSelect(companyId: string): Promise<ClientOption[]> {
  const { data, error } = await supabase.rpc('get_clients', {
    p_company_id: companyId,
    p_search: null,
    p_ia_active: null,
    p_is_blocked: null,
    p_date_from: null,
    p_date_to: null,
    p_limit: 500,
    p_offset: 0,
  });
  if (error) throw error;
  const raw = data && typeof data === 'object' && 'data' in data ? (data as any).data : data;
  const list = Array.isArray(raw) ? raw : [];
  return list.map((c: any) => ({ id: c.id, name: c.chatname ?? c.ai_name ?? c.phone ?? c.id }));
}

export async function listAttendancesForSelect(
  companyId: string,
  clientId?: string
): Promise<AttendanceOption[]> {
  if (!clientId) return [];

  const { data, error } = await supabase.rpc('get_attendances', {
    p_company_id: companyId,
    p_client_id: clientId,
    p_status: null,
    p_date_from: null,
    p_date_to: null,
  });
  if (error) throw error;
  const list: any[] = Array.isArray(data) ? data : (typeof data === 'string' ? JSON.parse(data) : []);
  return list.map((a: any) => ({
    id: a.id,
    type_name: a.type_name ?? '',
    client_display: a.client_display ?? '',
    client_id: a.client_id ?? '',
    appointment_id: a.appointment_id ?? null,
    attended_at: a.attended_at ?? null,
    created_at: a.created_at ?? null,
  })).sort((a, b) => {
    const dateA = new Date(a.attended_at ?? a.created_at ?? 0).getTime();
    const dateB = new Date(b.attended_at ?? b.created_at ?? 0).getTime();
    return dateB - dateA;
  });
}

export async function getAppointmentScheduledAt(appointmentId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('company_appointments')
    .select('scheduled_at')
    .eq('id', appointmentId)
    .maybeSingle();
  if (error) throw error;
  return data?.scheduled_at ?? null;
}

export async function createTranscription(params: {
  companyId: string;
  userId: string;
  formId: string;
  audioFilename?: string;
  clientId?: string | null;
  attendanceId?: string | null;
}): Promise<AiTranscription> {
  const { data, error } = await supabase
    .from('ai_transcriptions')
    .insert({
      company_id: params.companyId,
      user_id: params.userId,
      form_id: params.formId,
      audio_filename: params.audioFilename ?? null,
      client_id: params.clientId ?? null,
      attendance_id: params.attendanceId ?? null,
      status: 'pending',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function transcribeAudio(params: {
  audioUrl: string;
  transcriptionId: string;
  formId: string;
  companyId: string;
  /** Ex.: file.type do input; ajuda o MIME na Edge / Gemini */
  mimeType?: string | null;
}): Promise<TranscricaoResult> {
  const res = await supabase.functions.invoke('transcricao-audio', {
    body: {
      audio_url: params.audioUrl,
      transcription_id: params.transcriptionId,
      form_id: params.formId,
      company_id: params.companyId,
      ...(params.mimeType ? { mime_type: params.mimeType } : {}),
    },
  });

  if (res.error) {
    let message = res.error.message ?? 'Erro ao transcrever áudio';
    const resp = res.response;
    if (resp) {
      const ct = resp.headers.get('content-type') ?? '';
      if (ct.includes('application/json')) {
        try {
          const body = await resp.clone().json();
          if (body && typeof body.error === 'string' && body.error.trim()) {
            message = body.error.trim();
          }
        } catch {
          /* manter message */
        }
      }
    }
    throw new Error(message);
  }

  return res.data as TranscricaoResult;
}

// --- Answers ---

export async function getTranscriptionAnswers(
  transcriptionId: string
): Promise<AiTranscriptionAnswer[]> {
  const { data, error } = await supabase
    .from('ai_transcription_answers')
    .select('*, ai_form_questions(question_text)')
    .eq('transcription_id', transcriptionId)
    .order('created_at', { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    ...row,
    question_text: row.ai_form_questions?.question_text ?? '',
  }));
}

export async function saveAnswerEdit(params: {
  answerId: string;
  previousValue: string;
  newValue: string;
  userId: string;
}): Promise<void> {
  const { error: editError } = await supabase
    .from('ai_transcription_answer_edits')
    .insert({
      answer_id: params.answerId,
      previous_value: params.previousValue,
      new_value: params.newValue,
      edited_by: params.userId,
    });
  if (editError) throw editError;

  const { error: updateError } = await supabase
    .from('ai_transcription_answers')
    .update({ current_answer: params.newValue })
    .eq('id', params.answerId);
  if (updateError) throw updateError;
}

export async function getAnswerEdits(
  answerId: string
): Promise<AiTranscriptionAnswerEdit[]> {
  const { data, error } = await supabase
    .from('ai_transcription_answer_edits')
    .select('*')
    .eq('answer_id', answerId)
    .order('edited_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// --- History ---

export interface TranscriptionListItem {
  id: string;
  company_id: string;
  user_id: string | null;
  form_id: string | null;
  form_name: string | null;
  client_id: string | null;
  attendance_id: string | null;
  audio_filename: string | null;
  audio_duration_seconds: number | null;
  transcription_text: string | null;
  status: 'pending' | 'processing' | 'done' | 'error';
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface AllAnswerEdit {
  id: string;
  answer_id: string;
  question_text: string;
  previous_value: string | null;
  new_value: string | null;
  edited_by: string | null;
  edited_at: string;
}

export interface AiTranscriptionEdit {
  id: string;
  transcription_id: string;
  field_name: string;
  previous_value_id: string | null;
  previous_value_label: string | null;
  new_value_id: string | null;
  new_value_label: string | null;
  edited_by: string | null;
  edited_at: string;
}

function mapTranscriptionListRow(row: Record<string, unknown>): TranscriptionListItem {
  const forms = row.ai_forms as { name?: string } | null;
  return {
    id: row.id as string,
    company_id: row.company_id as string,
    user_id: row.user_id as string | null,
    form_id: row.form_id as string | null,
    form_name: forms?.name ?? null,
    client_id: row.client_id as string | null,
    attendance_id: row.attendance_id as string | null,
    audio_filename: row.audio_filename as string | null,
    audio_duration_seconds: row.audio_duration_seconds as number | null,
    transcription_text: row.transcription_text as string | null,
    status: row.status as TranscriptionListItem['status'],
    error_message: row.error_message as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function getTranscriptionById(
  transcriptionId: string,
  companyId: string
): Promise<TranscriptionListItem | null> {
  const { data, error } = await supabase
    .from('ai_transcriptions')
    .select('*, ai_forms(name)')
    .eq('id', transcriptionId)
    .eq('company_id', companyId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapTranscriptionListRow(data as Record<string, unknown>);
}

export async function getTranscriptionLinkedToAttendance(
  companyId: string,
  attendanceId: string
): Promise<TranscriptionListItem | null> {
  const { data, error } = await supabase
    .from('ai_transcriptions')
    .select('*, ai_forms(name)')
    .eq('company_id', companyId)
    .eq('attendance_id', attendanceId)
    .limit(1);
  if (error) throw error;
  const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
  if (!row) return null;
  return mapTranscriptionListRow(row as Record<string, unknown>);
}

/**
 * Define qual transcrição está vinculada ao atendimento (uma por atendimento).
 * Atualiza client_id da transcrição quando ainda estava nulo e coincide com o cliente do atendimento.
 */
export async function setTranscriptionAttendanceLink(params: {
  companyId: string;
  attendanceId: string;
  attendanceClientId: string;
  transcriptionId: string | null;
  userId: string;
}): Promise<void> {
  const { companyId, attendanceId, attendanceClientId, transcriptionId, userId } = params;

  if (!transcriptionId) {
    const { data: linked, error: lErr } = await supabase
      .from('ai_transcriptions')
      .select('id')
      .eq('company_id', companyId)
      .eq('attendance_id', attendanceId);
    if (lErr) throw lErr;
    for (const r of linked ?? []) {
      const { error: uErr } = await supabase
        .from('ai_transcriptions')
        .update({ attendance_id: null })
        .eq('id', r.id);
      if (uErr) throw uErr;
      const { error: eErr } = await supabase.from('ai_transcription_edits').insert({
        transcription_id: r.id,
        field_name: 'attendance_id',
        previous_value_id: attendanceId,
        previous_value_label: null,
        new_value_id: null,
        new_value_label: null,
        edited_by: userId,
      });
      if (eErr) throw eErr;
    }
    return;
  }

  const { data: target, error: tErr } = await supabase
    .from('ai_transcriptions')
    .select('id, client_id, attendance_id')
    .eq('id', transcriptionId)
    .eq('company_id', companyId)
    .maybeSingle();
  if (tErr) throw tErr;
  if (!target) throw new Error('Transcrição não encontrada.');

  if (target.client_id && target.client_id !== attendanceClientId) {
    throw new Error('Esta transcrição pertence a outro cliente.');
  }

  const prevAttendanceId = target.attendance_id;

  const { data: others, error: oErr } = await supabase
    .from('ai_transcriptions')
    .select('id')
    .eq('company_id', companyId)
    .eq('attendance_id', attendanceId)
    .neq('id', transcriptionId);
  if (oErr) throw oErr;
  for (const r of others ?? []) {
    const { error: uErr } = await supabase.from('ai_transcriptions').update({ attendance_id: null }).eq('id', r.id);
    if (uErr) throw uErr;
  }

  const updateBody: { attendance_id: string; client_id?: string } = { attendance_id: attendanceId };
  if (!target.client_id) {
    updateBody.client_id = attendanceClientId;
  }

  const { error: upErr } = await supabase.from('ai_transcriptions').update(updateBody).eq('id', transcriptionId);
  if (upErr) throw upErr;

  if (prevAttendanceId !== attendanceId) {
    const { error: edErr } = await supabase.from('ai_transcription_edits').insert({
      transcription_id: transcriptionId,
      field_name: 'attendance_id',
      previous_value_id: prevAttendanceId,
      previous_value_label: null,
      new_value_id: attendanceId,
      new_value_label: null,
      edited_by: userId,
    });
    if (edErr) throw edErr;
  }
}

export async function listTranscriptions(
  companyId: string,
  filters?: { dateFrom?: string; dateTo?: string; clientId?: string }
): Promise<TranscriptionListItem[]> {
  let query = supabase
    .from('ai_transcriptions')
    .select('*, ai_forms(name)')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (filters?.dateFrom) query = query.gte('created_at', `${filters.dateFrom}T00:00:00`);
  if (filters?.dateTo) query = query.lte('created_at', `${filters.dateTo}T23:59:59`);
  if (filters?.clientId) query = query.eq('client_id', filters.clientId);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => mapTranscriptionListRow(row as Record<string, unknown>));
}

export async function getAudioSignedUrl(
  companyId: string,
  transcriptionId: string
): Promise<string | null> {
  const { data: files, error } = await supabase.storage
    .from('assistente-ia-audios')
    .list(`${companyId}/${transcriptionId}`);
  if (error || !files || files.length === 0) return null;
  const path = `${companyId}/${transcriptionId}/${files[0].name}`;
  const { data, error: urlError } = await supabase.storage
    .from('assistente-ia-audios')
    .createSignedUrl(path, 3600);
  if (urlError || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function getAllEditsForTranscription(
  transcriptionId: string
): Promise<AllAnswerEdit[]> {
  const { data: answers, error: aErr } = await supabase
    .from('ai_transcription_answers')
    .select('id, ai_form_questions(question_text)')
    .eq('transcription_id', transcriptionId);
  if (aErr) throw aErr;
  if (!answers || answers.length === 0) return [];

  const answerMap = Object.fromEntries(
    (answers as any[]).map(a => [a.id, (a.ai_form_questions as any)?.question_text ?? ''])
  );
  const answerIds = answers.map((a: any) => a.id);

  const { data: edits, error: eErr } = await supabase
    .from('ai_transcription_answer_edits')
    .select('*')
    .in('answer_id', answerIds)
    .order('edited_at', { ascending: false });
  if (eErr) throw eErr;

  return (edits ?? []).map((ed: any) => ({
    id: ed.id,
    answer_id: ed.answer_id,
    question_text: answerMap[ed.answer_id] ?? '',
    previous_value: ed.previous_value,
    new_value: ed.new_value,
    edited_by: ed.edited_by,
    edited_at: ed.edited_at,
  }));
}

export async function getTranscriptionEdits(
  transcriptionId: string
): Promise<AiTranscriptionEdit[]> {
  const { data, error } = await supabase
    .from('ai_transcription_edits')
    .select('*')
    .eq('transcription_id', transcriptionId)
    .order('edited_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateTranscriptionLinks(params: {
  transcriptionId: string;
  userId: string;
  clientId: string | null;
  clientLabel: string | null;
  attendanceId: string | null;
  attendanceLabel: string | null;
  prevClientId: string | null;
  prevClientLabel: string | null;
  prevAttendanceId: string | null;
  prevAttendanceLabel: string | null;
}): Promise<void> {
  const { error: upError } = await supabase
    .from('ai_transcriptions')
    .update({ client_id: params.clientId, attendance_id: params.attendanceId })
    .eq('id', params.transcriptionId);
  if (upError) throw upError;

  const edits: object[] = [];
  if (params.clientId !== params.prevClientId) {
    edits.push({
      transcription_id: params.transcriptionId,
      field_name: 'client_id',
      previous_value_id: params.prevClientId,
      previous_value_label: params.prevClientLabel,
      new_value_id: params.clientId,
      new_value_label: params.clientLabel,
      edited_by: params.userId,
    });
  }
  if (params.attendanceId !== params.prevAttendanceId) {
    edits.push({
      transcription_id: params.transcriptionId,
      field_name: 'attendance_id',
      previous_value_id: params.prevAttendanceId,
      previous_value_label: params.prevAttendanceLabel,
      new_value_id: params.attendanceId,
      new_value_label: params.attendanceLabel,
      edited_by: params.userId,
    });
  }
  if (edits.length === 0) return;

  const { error: editError } = await supabase
    .from('ai_transcription_edits')
    .insert(edits);
  if (editError) throw editError;
}
