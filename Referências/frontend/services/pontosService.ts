import { supabase } from '../lib/supabase';
import { Ponto, PontoRanking } from '../types';

export async function addPonto(
  companyId: string,
  clientId: string,
  points: number = 1,
  description?: string,
  attendanceId?: string | null
): Promise<{ success: boolean; id: string; total: number }> {
  const { data, error } = await supabase.rpc('add_ponto', {
    p_company_id:    companyId,
    p_client_id:     clientId,
    p_points:        points,
    p_description:   description ?? null,
    p_attendance_id: attendanceId ?? null,
  });
  if (error) throw error;
  return data as { success: boolean; id: string; total: number };
}

export async function getPontos(
  companyId: string,
  clientId: string
): Promise<Ponto[]> {
  const { data, error } = await supabase.rpc('get_pontos', {
    p_company_id: companyId,
    p_client_id:  clientId,
  });
  if (error) throw error;
  const raw = Array.isArray(data) ? data : [];
  return raw.map((item: any) => ({
    id:                     item.id,
    company_id:             companyId,
    client_id:              clientId,
    inserted_by:            '',
    inserted_by_name:       item.inserted_by_name ?? '',
    points:                 item.points,
    description:            item.description ?? undefined,
    attendance_id:          item.attendance_id ?? null,
    attendance_type_name:   item.attendance_type_name ?? null,
    attendance_attended_at: item.attendance_attended_at ?? null,
    created_at:             item.created_at,
  }));
}

export async function getPontosTotal(
  companyId: string,
  clientId: string
): Promise<number> {
  const { data, error } = await supabase.rpc('get_pontos_total', {
    p_company_id: companyId,
    p_client_id:  clientId,
  });
  if (error) throw error;
  return typeof data === 'number' ? data : 0;
}

export async function getPontosRanking(
  companyId: string,
  limit: number = 10
): Promise<PontoRanking[]> {
  const { data, error } = await supabase.rpc('get_pontos_ranking', {
    p_company_id: companyId,
    p_limit:      limit,
  });
  if (error) throw error;
  const raw = Array.isArray(data) ? data : [];
  return raw.map((item: any) => ({
    client_id:    item.client_id,
    client_name:  item.client_name,
    phone:        item.phone,
    total_points: Number(item.total_points),
  }));
}

export async function deletePonto(pontoId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_ponto', {
    p_ponto_id: pontoId,
  });
  if (error) throw error;
}
