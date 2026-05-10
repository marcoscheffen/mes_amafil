import React, { useState } from 'react';
import type { Task, TaskStatus, TaskPriority } from '../../types';

interface TaskListViewProps {
  tasks: Task[];
  statuses: TaskStatus[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onAddTask: (statusId?: string) => void;
}

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  low:    { label: 'Baixa',   color: 'text-slate-400' },
  medium: { label: 'Média',   color: 'text-blue-400' },
  high:   { label: 'Alta',    color: 'text-amber-400' },
  urgent: { label: 'Urgente', color: 'text-red-400' },
};

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  statuses,
  onEditTask,
  onDeleteTask,
  onAddTask,
}) => {
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [search, setSearch] = useState('');

  const getStatusById = (id: string) => statuses.find(s => s.id === id);

  const filtered = tasks.filter(t => {
    if (filterStatus && t.status_id !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
          <input
            type="text"
            placeholder="Buscar tarefas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">Todas as etapas</option>
          {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">Todas as prioridades</option>
          <option value="low">Baixa</option>
          <option value="medium">Média</option>
          <option value="high">Alta</option>
          <option value="urgent">Urgente</option>
        </select>

        <button
          onClick={() => onAddTask()}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Nova Tarefa
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/50 border-b border-slate-700 text-xs uppercase text-slate-500 font-bold">
              <th className="px-6 py-4">Título</th>
              <th className="px-6 py-4">Etapa</th>
              <th className="px-6 py-4">Prioridade</th>
              <th className="px-6 py-4">Vencimento</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  <span className="material-symbols-outlined text-4xl block mb-2">task_alt</span>
                  Nenhuma tarefa encontrada.
                </td>
              </tr>
            ) : (
              filtered.map(task => {
                const status = getStatusById(task.status_id);
                const priority = PRIORITY_CONFIG[task.priority];
                const isOverdue = task.due_date && new Date(task.due_date + 'T23:59:59') < new Date();

                return (
                  <tr key={task.id} className="hover:bg-slate-700/30 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-white">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-slate-500 truncate max-w-[200px] mt-0.5">{task.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {status && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-700">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                          <span className="text-slate-300">{status.name}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold ${priority?.color}`}>
                        {priority?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>
                        {formatDate(task.due_date)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {task.client_name ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEditTask(task)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          onClick={() => onDeleteTask(task)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500 text-right">{filtered.length} tarefa(s)</p>
    </div>
  );
};
