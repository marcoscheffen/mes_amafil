import { supabase } from '../lib/supabase';
import type { AttendanceTypeField } from './attendancesService';

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

export interface GlobalAttendanceType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  position: number;
  created_at: string;
  fields: AttendanceTypeField[];
}

export async function getGlobalAttendanceTypes(): Promise<GlobalAttendanceType[]> {
  const { data, error } = await supabase.rpc('get_global_attendance_types');
  if (error) throw error;
  return parseJsonbArray<GlobalAttendanceType>(data);
}

export async function upsertGlobalAttendanceType(params: {
  id?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  isActive?: boolean;
  position?: number;
}): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.rpc('upsert_global_attendance_type', {
    p_name: params.name,
    p_slug: params.slug,
    p_id: params.id ?? null,
    p_description: params.description ?? null,
    p_is_active: params.isActive ?? true,
    p_position: params.position ?? 0,
  });
  if (error) throw error;
  return data as Record<string, unknown>;
}

export async function upsertAttendanceTypeField(params: {
  typeId: string;
  fieldId?: string | null;
  key: string;
  label: string;
  fieldType: string;
  required?: boolean;
  options?: unknown;
  position?: number;
  isActive?: boolean;
}): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.rpc('upsert_attendance_type_field', {
    p_type_id: params.typeId,
    p_key: params.key,
    p_label: params.label,
    p_field_type: params.fieldType,
    p_required: params.required ?? false,
    p_options: params.options ?? null,
    p_position: params.position ?? 0,
    p_is_active: params.isActive ?? true,
    p_id: params.fieldId ?? null,
  });
  if (error) throw error;
  return data as Record<string, unknown>;
}

export async function deleteAttendanceTypeField(fieldId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_attendance_type_field', {
    p_field_id: fieldId,
  });
  if (error) throw error;
}

export async function linkAttendanceTypeToCompany(params: {
  companyId: string;
  typeId: string;
  isActive?: boolean;
  position?: number;
}): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.rpc('link_attendance_type_to_company', {
    p_company_id: params.companyId,
    p_type_id: params.typeId,
    p_is_active: params.isActive ?? true,
    p_position: params.position ?? 0,
  });
  if (error) throw error;
  return data as Record<string, unknown>;
}

export async function unlinkAttendanceTypeFromCompany(
  companyId: string,
  typeId: string
): Promise<void> {
  const { error } = await supabase.rpc('unlink_attendance_type_from_company', {
    p_company_id: companyId,
    p_type_id: typeId,
  });
  if (error) throw error;
}

export async function getCompaniesForAttendanceType(typeId: string): Promise<
  {
    company_id: string;
    company_name: string;
    is_linked: boolean;
    company_type_id: string;
    link_is_active: boolean;
  }[]
> {
  const { data, error } = await supabase.rpc('get_companies_for_attendance_type', {
    p_type_id: typeId,
  });
  if (error) throw error;
  return parseJsonbArray<{
    company_id: string;
    company_name: string;
    is_linked: boolean;
    company_type_id: string;
    link_is_active: boolean;
  }>(data);
}
