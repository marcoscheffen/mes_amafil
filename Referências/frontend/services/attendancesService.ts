import { supabase } from '../lib/supabase';

function parseJsonbArray<T>(data: unknown): T[] {
  if (data == null) return [];
  if (Array.isArray(data)) return data as T[];
  if (typeof data === 'string') {
    try {
      const p = JSON.parse(data);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

export interface AttendanceListItem {
  id: string;
  company_type_id: string;
  type_name: string;
  client_id: string;
  client_display: string;
  appointment_id: string | null;
  status: string;
  notes: string | null;
  attended_at: string | null;
  created_at: string;
  created_by: string | null;
}

export interface AttendanceCostRow {
  id?: string;
  description: string;
  value: number;
  position: number;
}

export interface CompanyAttendanceType {
  company_type_id: string;
  type_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  position: number;
  fields: AttendanceTypeField[];
}

export interface AttendanceTypeField {
  id: string;
  key: string;
  label: string;
  field_type: string;
  is_required: boolean;
  options: unknown;
  position: number;
  is_active: boolean;
}

export async function getCompanyAttendanceTypes(
  companyId: string
): Promise<CompanyAttendanceType[]> {
  const { data, error } = await supabase.rpc('get_company_attendance_types', {
    p_company_id: companyId,
  });
  if (error) throw error;
  return parseJsonbArray<CompanyAttendanceType>(data);
}

export async function toggleCompanyAttendanceType(params: {
  companyId: string;
  companyTypeId: string;
  isActive: boolean;
}): Promise<void> {
  const { error } = await supabase.rpc('toggle_company_attendance_type', {
    p_company_id: params.companyId,
    p_company_type_id: params.companyTypeId,
    p_is_active: params.isActive,
  });
  if (error) throw error;
}

export async function reorderCompanyAttendanceTypes(
  companyId: string,
  orderedCompanyTypeIds: string[]
): Promise<void> {
  const { error } = await supabase.rpc('reorder_company_attendance_types', {
    p_company_id: companyId,
    p_order: orderedCompanyTypeIds,
  });
  if (error) throw error;
}

export async function getAttendances(params: {
  companyId: string;
  clientId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<AttendanceListItem[]> {
  const { data, error } = await supabase.rpc('get_attendances', {
    p_company_id: params.companyId,
    p_client_id: params.clientId ?? null,
    p_status: params.status ?? null,
    p_date_from: params.dateFrom ?? null,
    p_date_to: params.dateTo ?? null,
  });
  if (error) throw error;
  return parseJsonbArray<AttendanceListItem>(data);
}

export async function getAttendanceById(
  attendanceId: string,
  companyId: string
): Promise<{
  attendance: Record<string, unknown>;
  costs: AttendanceCostRow[];
  fields: AttendanceTypeField[];
}> {
  const { data, error } = await supabase.rpc('get_attendance_by_id', {
    p_id: attendanceId,
    p_company_id: companyId,
  });
  if (error) throw error;
  const row = data as {
    attendance: Record<string, unknown>;
    costs: AttendanceCostRow[];
    fields: AttendanceTypeField[];
  };
  return row;
}

export async function createAttendance(params: {
  companyId: string;
  companyTypeId: string;
  clientId: string;
  appointmentId?: string | null;
  notes?: string | null;
  attendedAt?: string | null;
  fieldValues?: Record<string, unknown>;
  costs?: AttendanceCostRow[];
  status?: string;
}): Promise<{ id: string }> {
  const costsJson = (params.costs ?? []).map((c, i) => ({
    description: c.description,
    value: c.value,
    position: c.position ?? i,
  }));

  const { data, error } = await supabase.rpc('create_attendance', {
    p_company_id: params.companyId,
    p_company_type_id: params.companyTypeId,
    p_client_id: params.clientId,
    p_appointment_id: params.appointmentId ?? null,
    p_notes: params.notes ?? null,
    p_attended_at: params.attendedAt ?? null,
    p_field_values: params.fieldValues ?? {},
    p_costs: costsJson,
    p_status: params.status ?? 'open',
  });
  if (error) throw error;
  const d = data as { id?: string };
  return { id: d?.id ?? '' };
}

export async function updateAttendance(params: {
  attendanceId: string;
  companyId: string;
  status?: string | null;
  notes?: string | null;
  appointmentId?: string | null;
  attendedAt?: string | null;
  fieldValues?: Record<string, unknown> | null;
  clearAppointment?: boolean;
}): Promise<void> {
  const { error } = await supabase.rpc('update_attendance', {
    p_id: params.attendanceId,
    p_company_id: params.companyId,
    p_status: params.status ?? null,
    p_notes: params.notes ?? null,
    p_appointment_id: params.appointmentId ?? null,
    p_attended_at: params.attendedAt ?? null,
    p_field_values: params.fieldValues ?? null,
    p_clear_appointment: params.clearAppointment ?? false,
  });
  if (error) throw error;
}

export async function upsertAttendanceCosts(params: {
  attendanceId: string;
  companyId: string;
  costs: AttendanceCostRow[];
}): Promise<void> {
  const costsJson = params.costs.map((c, i) => ({
    description: c.description,
    value: c.value,
    position: c.position ?? i,
  }));
  const { error } = await supabase.rpc('upsert_attendance_costs', {
    p_attendance_id: params.attendanceId,
    p_company_id: params.companyId,
    p_costs: costsJson,
  });
  if (error) throw error;
}
