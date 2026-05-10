import { supabase } from '../lib/supabase';

export interface BusinessHour {
  day_of_week: number;
  is_open:     boolean;
  start_time:  string;
  end_time:    string;
  break_start: string | null;
  break_end:   string | null;
}

export const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

/** Normaliza TIME do Postgres (ex. 08:00:00) para input type=time (HH:MM). */
export function formatTimeForInput(t: string | null | undefined): string {
  if (!t) return '';
  return t.length >= 5 ? t.slice(0, 5) : t;
}

/** Horários padrão da empresa (fallback quando o profissional não tem horários próprios). Usado por get-available-slots. */
export async function getCompanyBusinessHours(companyId: string): Promise<BusinessHour[]> {
  const { data, error } = await supabase
    .from('company_business_hours')
    .select('day_of_week, is_open, start_time, end_time, break_start, break_end')
    .eq('company_id', companyId)
    .order('day_of_week');

  if (error) throw error;

  const map = new Map<number, BusinessHour>();
  for (const row of data || []) {
    map.set(row.day_of_week, {
      day_of_week: row.day_of_week,
      is_open:     row.is_open,
      start_time:  formatTimeForInput(row.start_time as unknown as string),
      end_time:    formatTimeForInput(row.end_time as unknown as string),
      break_start: row.break_start ? formatTimeForInput(row.break_start as unknown as string) : null,
      break_end:   row.break_end ? formatTimeForInput(row.break_end as unknown as string) : null,
    });
  }

  return Array.from({ length: 7 }, (_, i) => map.get(i) ?? {
    day_of_week: i,
    is_open:     i >= 1 && i <= 5,
    start_time:  '08:00',
    end_time:    '18:00',
    break_start: null,
    break_end:   null,
  });
}

export async function saveCompanyBusinessHours(companyId: string, hours: BusinessHour[]): Promise<void> {
  const rows = hours.map(h => ({
    company_id:  companyId,
    day_of_week: h.day_of_week,
    is_open:     h.is_open,
    start_time:  h.start_time,
    end_time:    h.end_time,
    break_start: h.break_start || null,
    break_end:   h.break_end || null,
  }));

  const { error } = await supabase
    .from('company_business_hours')
    .upsert(rows, { onConflict: 'company_id,day_of_week' });

  if (error) throw error;
}

export async function getProfessionalBusinessHours(
  companyId: string,
  userId: string
): Promise<BusinessHour[]> {
  const { data, error } = await supabase.rpc('get_professional_business_hours', {
    p_company_id: companyId,
    p_user_id:    userId,
  });
  if (error) throw error;

  // Garantir que todos os 7 dias estão presentes
  const map = new Map<number, BusinessHour>();
  for (const row of (data || [])) map.set(row.day_of_week, row);

  return Array.from({ length: 7 }, (_, i) => map.get(i) ?? {
    day_of_week: i,
    is_open:     i >= 1 && i <= 5,
    start_time:  '08:00',
    end_time:    '18:00',
    break_start: null,
    break_end:   null,
  });
}

export async function saveProfessionalBusinessHours(
  companyId: string,
  userId: string,
  hours: BusinessHour[]
): Promise<void> {
  const results = await Promise.allSettled(
    hours.map(h =>
      supabase.rpc('upsert_professional_business_hours', {
        p_company_id:  companyId,
        p_user_id:     userId,
        p_day_of_week: h.day_of_week,
        p_is_open:     h.is_open,
        p_start_time:  h.start_time,
        p_end_time:    h.end_time,
        p_break_start: h.break_start || null,
        p_break_end:   h.break_end   || null,
      })
    )
  );

  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length > 0) throw new Error('Falha ao salvar alguns horários. Tente novamente.');
}
