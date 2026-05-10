import { supabase } from '../lib/supabase';
import type { TaskStatus } from '../types';

export async function getTaskStatuses(companyId: string, includeInactive = false): Promise<TaskStatus[]> {
  let query = supabase
    .from('company_task_statuses')
    .select('*')
    .eq('company_id', companyId)
    .order('position', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createTaskStatus(
  companyId: string,
  payload: { name: string; color?: string; type?: TaskStatus['type']; position?: number }
): Promise<TaskStatus> {
  const { data, error } = await supabase
    .from('company_task_statuses')
    .insert({
      company_id: companyId,
      name: payload.name,
      color: payload.color ?? '#3B82F6',
      type: payload.type ?? 'active',
      position: payload.position ?? 999,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTaskStatus(
  statusId: string,
  updates: Partial<Pick<TaskStatus, 'name' | 'color' | 'type' | 'is_default' | 'is_active'>>
): Promise<TaskStatus> {
  const { data, error } = await supabase
    .from('company_task_statuses')
    .update(updates)
    .eq('id', statusId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTaskStatus(statusId: string): Promise<void> {
  const { error } = await supabase
    .from('company_task_statuses')
    .delete()
    .eq('id', statusId);

  if (error) throw error;
}

export async function reorderTaskStatuses(companyId: string, orderedIds: string[]): Promise<void> {
  const { error } = await supabase.rpc('reorder_task_statuses', {
    p_company_id: companyId,
    p_ordered_ids: orderedIds,
  });

  if (error) throw error;
}
