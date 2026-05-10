import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, TaskPriority } from '../../types';

interface KanbanCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; icon: string }> = {
  low:    { label: 'Baixa',   color: 'text-slate-400 bg-slate-700/50',   icon: 'arrow_downward' },
  medium: { label: 'Média',   color: 'text-blue-400 bg-blue-500/10',     icon: 'remove' },
  high:   { label: 'Alta',    color: 'text-amber-400 bg-amber-500/10',   icon: 'arrow_upward' },
  urgent: { label: 'Urgente', color: 'text-red-400 bg-red-500/10',       icon: 'priority_high' },
};

function formatDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso + 'T12:00:00');
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / 86400000);
  if (days < 0) return `${Math.abs(days)}d atraso`;
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Amanhã';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ task, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;
  const dueDateStr = formatDate(task.due_date);
  const isOverdue = task.due_date && new Date(task.due_date + 'T23:59:59') < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-md hover:border-slate-600 hover:shadow-lg transition-all group cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-white leading-tight flex-1">{task.title}</p>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onEdit(task); }}
            className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-base">edit</span>
          </button>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onDelete(task); }}
            className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-base">delete</span>
          </button>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-slate-400 mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Priority */}
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${priority.color}`}>
          <span className="material-symbols-outlined text-[11px]">{priority.icon}</span>
          {priority.label}
        </span>

        {/* Due date */}
        {dueDateStr && (
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
            isOverdue ? 'text-red-400 bg-red-500/10' : 'text-slate-400 bg-slate-700/50'
          }`}>
            <span className="material-symbols-outlined text-[11px]">calendar_today</span>
            {dueDateStr}
          </span>
        )}

        {/* Client */}
        <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md ${
          task.client_name
            ? 'text-slate-300 bg-slate-700/50'
            : 'text-slate-600 bg-slate-800/50'
        }`}>
          <span className="material-symbols-outlined text-[11px]">person</span>
          <span className="truncate max-w-[100px]">
            {task.client_name ?? 'Sem cliente'}
          </span>
        </span>
      </div>
    </div>
  );
};
