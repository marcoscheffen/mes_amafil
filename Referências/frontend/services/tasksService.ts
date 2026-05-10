import { supabase } from '../lib/supabase';
import type { Task, TaskPriority } from '../types';

export interface GetTasksOptions {
  companyId: string;
  includeTerminal?: boolean;
  statusId?: string;
  clientId?: string;
  assignedTo?: string;
}

export interface CreateTaskPayload {
  companyId: string;
  statusId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  reminderAt?: string;
  assignedTo?: string;
  clientId?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  statusId?: string;
  dueDate?: string | null;
  reminderAt?: string | null;
  assignedTo?: string | null;
  clientId?: string | null;
}

export async function getTasks(opts: GetTasksOptions): Promise<Task[]> {
  const { data, error } = await supabase.rpc('get_company_tasks', {
    p_company_id: opts.companyId,
    p_include_terminal: opts.includeTerminal ?? false,
  });

  if (error) throw error;

  let tasks: Task[] = (Array.isArray(data) ? data : []).map((row: any) => ({
    ...row,
    // RPC returns task_position; normalize to position for local sorting
    position: row.task_position ?? row.position ?? 0,
  }));

  if (opts.statusId) tasks = tasks.filter(t => t.status_id === opts.statusId);
  if (opts.clientId) tasks = tasks.filter(t => t.client_id === opts.clientId);
  if (opts.assignedTo) tasks = tasks.filter(t => t.assigned_to === opts.assignedTo);

  return tasks;
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado.');

  const { data, error } = await supabase
    .from('company_tasks')
    .insert({
      company_id: payload.companyId,
      status_id: payload.statusId,
      title: payload.title,
      description: payload.description ?? null,
      priority: payload.priority ?? 'medium',
      due_date: payload.dueDate ?? null,
      reminder_at: payload.reminderAt ?? null,
      assigned_to: payload.assignedTo ?? null,
      client_id: payload.clientId ?? null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return { ...data, position: data.position ?? 0, tags: [] };
}

export async function updateTask(taskId: string, payload: UpdateTaskPayload): Promise<Task> {
  const updates: Record<string, any> = {};
  if (payload.title !== undefined) updates.title = payload.title;
  if (payload.description !== undefined) updates.description = payload.description;
  if (payload.priority !== undefined) updates.priority = payload.priority;
  if (payload.statusId !== undefined) updates.status_id = payload.statusId;
  if (payload.dueDate !== undefined) updates.due_date = payload.dueDate;
  if (payload.reminderAt !== undefined) updates.reminder_at = payload.reminderAt;
  if (payload.assignedTo !== undefined) updates.assigned_to = payload.assignedTo;
  if (payload.clientId !== undefined) updates.client_id = payload.clientId;

  const { data, error } = await supabase
    .from('company_tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return { ...data, position: data.position ?? 0, tags: [] };
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('company_tasks')
    .update({ is_archived: true })
    .eq('id', taskId);

  if (error) throw error;
}

export async function moveTask(
  taskId: string,
  newStatusId: string,
  newPosition: number
): Promise<void> {
  const { error } = await supabase.rpc('move_task', {
    p_task_id: taskId,
    p_new_status_id: newStatusId,
    p_new_position: newPosition,
  });

  if (error) throw error;
}
