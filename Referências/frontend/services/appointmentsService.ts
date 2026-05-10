import { supabase } from '../lib/supabase';

export interface Appointment {
  id:                string;
  service_id:        string | null;
  service_name:      string | null;
  service_color:     string | null;
  service_duration:  number | null;
  client_id:         string | null;
  client_name:       string | null;
  assigned_to:       string | null;
  professional_name: string | null;
  scheduled_at:      string;
  ends_at:           string | null;
  status:            'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes:             string | null;
  google_event_id:   string | null;
  sync_status:       'pending' | 'synced' | 'error' | 'not_connected';
  is_external:       boolean;
  confirmation_status: 'not_requested' | 'requested' | 'confirmed' | 'declined' | 'no_response';
  confirmation_requested_at: string | null;
  confirmation_responded_at: string | null;
  confirmation_message_id: string | null;
  created_at:        string;
}

export interface CompanyService {
  id:               string;
  name:             string;
  duration_minutes: number;
  color:            string;
  price:            number | null;
  is_active:        boolean;
}

export interface Professional {
  user_id:   string;
  full_name: string;
  email:     string;
}

export interface ClientBasic {
  id:    string;
  name:  string;
  phone: string | null;
}

export interface AvailableSlot {
  label: string;
  start: string;
  end:   string;
}

// ─── Agendamentos ─────────────────────────────────────────────────────────────

export async function getAppointments(params: {
  companyId:       string;
  dateFrom?:       string;  // YYYY-MM-DD
  dateTo?:         string;  // YYYY-MM-DD
  professionalId?: string;
  status?:         string;
}): Promise<Appointment[]> {
  const { data, error } = await supabase.rpc('get_appointments', {
    p_company_id:   params.companyId,
    p_date_from:    params.dateFrom  || null,
    p_date_to:      params.dateTo    || null,
    p_professional: params.professionalId || null,
    p_status:       params.status    || null,
  });
  if (error) throw error;
  return data || [];
}

export async function getAppointmentById(
  companyId: string,
  appointmentId: string,
): Promise<Appointment | null> {
  const { data, error } = await supabase
    .from('company_appointments')
    .select(`
      id, service_id, client_id, assigned_to, scheduled_at, ends_at,
      status, notes, google_event_id, sync_status, created_at,
      company_services!service_id(name, color, duration_minutes),
      user_profiles!assigned_to(full_name)
    `)
    .eq('id', appointmentId)
    .eq('company_id', companyId)
    .single();
  if (error) return null;
  if (!data) return null;
  const d = data as Record<string, unknown>;
  const svc = d['company_services'] as Record<string, unknown> | null;
  const prof = d['user_profiles'] as Record<string, unknown> | null;
  return {
    id: d['id'] as string,
    service_id: d['service_id'] as string | null,
    service_name: svc ? (svc['name'] as string) : null,
    service_color: svc ? (svc['color'] as string) : null,
    service_duration: svc ? (svc['duration_minutes'] as number) : null,
    client_id: d['client_id'] as string | null,
    client_name: null,
    assigned_to: d['assigned_to'] as string | null,
    professional_name: prof ? (prof['full_name'] as string) : null,
    scheduled_at: d['scheduled_at'] as string,
    ends_at: d['ends_at'] as string | null,
    status: d['status'] as Appointment['status'],
    notes: d['notes'] as string | null,
    google_event_id: d['google_event_id'] as string | null,
    sync_status: d['sync_status'] as Appointment['sync_status'],
    is_external: false,
    confirmation_status: 'not_requested',
    confirmation_requested_at: null,
    confirmation_responded_at: null,
    confirmation_message_id: null,
    created_at: d['created_at'] as string,
  };
}

export async function createAppointment(params: {
  companyId:      string;
  serviceId:      string;
  scheduledAt:    string;
  assignedTo?:    string;
  clientId?:      string;
  notes?:         string;
  reminderAt?:    string;
}): Promise<string> {
  const { data, error } = await supabase.rpc('create_appointment', {
    p_company_id:   params.companyId,
    p_service_id:   params.serviceId,
    p_scheduled_at: params.scheduledAt,
    p_assigned_to:  params.assignedTo  || null,
    p_client_id:    params.clientId    || null,
    p_notes:        params.notes       || null,
    p_reminder_at:  params.reminderAt  || null,
  });
  if (error) throw error;
  return data as string;
}

export async function updateAppointment(params: {
  id:          string;
  companyId:   string;
  serviceId?:  string;
  scheduledAt?: string;
  assignedTo?: string;
  clientId?:   string;
  status?:     string;
  notes?:      string;
  reminderAt?: string;
}): Promise<void> {
  const { error } = await supabase.rpc('update_appointment', {
    p_id:           params.id,
    p_company_id:   params.companyId,
    p_service_id:   params.serviceId   || null,
    p_scheduled_at: params.scheduledAt || null,
    p_assigned_to:  params.assignedTo  || null,
    p_client_id:    params.clientId    || null,
    p_status:       params.status      || null,
    p_notes:        params.notes       || null,
    p_reminder_at:  params.reminderAt  || null,
  });
  if (error) throw error;
}

export async function cancelAppointment(id: string, companyId: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_appointment', {
    p_id:         id,
    p_company_id: companyId,
  });
  if (error) throw error;
}

// ─── Serviços ─────────────────────────────────────────────────────────────────

export async function getServices(
  companyId: string,
  options?: { includeInactive?: boolean }
): Promise<CompanyService[]> {
  const { data, error } = await supabase.rpc('get_company_services', {
    p_company_id:       companyId,
    p_include_inactive: options?.includeInactive ?? false,
  });
  if (error) throw error;
  return data || [];
}

export async function upsertService(params: {
  companyId: string;
  id?:       string;
  name:      string;
  duration:  number;
  color?:    string;
  price?:    number | null;
  isActive?: boolean;
}): Promise<string> {
  const { data, error } = await supabase.rpc('upsert_company_service', {
    p_company_id: params.companyId,
    p_id:         params.id       || null,
    p_name:       params.name,
    p_duration:   params.duration,
    p_color:      params.color    || '#3B82F6',
    p_price:      params.price    ?? null,
    p_is_active:  params.isActive ?? true,
  });
  if (error) throw error;
  return data as string;
}

// ─── Profissionais ────────────────────────────────────────────────────────────

export async function getProfessionals(companyId: string): Promise<Professional[]> {
  const { data, error } = await supabase.rpc('get_company_professionals', {
    p_company_id: companyId,
  });
  if (error) throw error;
  return data || [];
}

// ─── Clientes (autocomplete) ──────────────────────────────────────────────────

export async function searchClients(companyId: string, search?: string): Promise<ClientBasic[]> {
  const { data, error } = await supabase.rpc('get_company_clients_basic', {
    p_company_id: companyId,
    p_search:     search || null,
  });
  if (error) throw error;
  return data || [];
}

// ─── Slots disponíveis ────────────────────────────────────────────────────────

export async function getAvailableSlots(params: {
  companyId:      string;
  professionalId: string;
  serviceId:      string;
  date:           string;  // YYYY-MM-DD
}): Promise<AvailableSlot[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado');

  const supabaseUrl = (supabase as any).supabaseUrl as string;
  const res = await fetch(`${supabaseUrl}/functions/v1/get-available-slots`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      company_id:      params.companyId,
      professional_id: params.professionalId,
      service_id:      params.serviceId,
      date:            params.date,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Erro ao buscar slots');
  }

  const result = await res.json();
  return result.slots || [];
}

// ─── Agendamentos não sincronizados ──────────────────────────────────────────

/**
 * Retorna todos os agendamentos da empresa que precisam ser sincronizados:
 * pending (aguardando envio), not_connected (token indisponível na criação) e
 * error (falha anterior). Exclui agendamentos externos e cancelados.
 */
export async function getUnsyncedAppointments(
  companyId: string
): Promise<{ id: string; sync_status: string }[]> {
  const { data, error } = await supabase
    .from('company_appointments')
    .select('id, sync_status')
    .eq('company_id', companyId)
    .eq('is_external', false)
    .in('sync_status', ['pending', 'not_connected', 'error'])
    .neq('status', 'cancelled');
  if (error) throw error;
  return data || [];
}

// ─── Sync com Google Calendar ─────────────────────────────────────────────────

async function callSyncFunction(fnName: string, body: Record<string, string>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const supabaseUrl = (supabase as any).supabaseUrl as string;
  await fetch(`${supabaseUrl}/functions/v1/${fnName}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }).catch(e => console.warn(`[${fnName}] Sync falhou:`, e));
}

export async function syncNewAppointment(appointmentId: string): Promise<void> {
  await callSyncFunction('create-appointment-event', { appointment_id: appointmentId });
}

export async function syncUpdatedAppointment(appointmentId: string): Promise<void> {
  await callSyncFunction('update-appointment-event', { appointment_id: appointmentId, action: 'update' });
}

export async function syncCancelledAppointment(appointmentId: string): Promise<void> {
  await callSyncFunction('update-appointment-event', { appointment_id: appointmentId, action: 'cancel' });
}

export async function syncGoogleEvents(params: {
  companyId: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<{ cancelled: number; imported: number }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { cancelled: 0, imported: 0 };
  const supabaseUrl = (supabase as any).supabaseUrl as string;
  const res = await fetch(`${supabaseUrl}/functions/v1/sync-google-events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      company_id: params.companyId,
      date_from:  params.dateFrom,
      date_to:    params.dateTo,
    }),
  });
  if (!res.ok) return { cancelled: 0, imported: 0 };
  return res.json();
}
