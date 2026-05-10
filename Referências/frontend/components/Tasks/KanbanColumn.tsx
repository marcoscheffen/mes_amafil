import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import type { Task, TaskStatus } from '../../types';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onAddTask: (statusId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

const TYPE_ICON: Record<string, string> = {
  active: 'radio_button_unchecked',
  terminal_done: 'check_circle',
  terminal_cancel: 'cancel',
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: status.id });

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: status.color }}
          />
          <span className="text-sm font-bold text-white truncate max-w-[140px]">{status.name}</span>
          <span className="text-xs font-semibold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(status.id)}
          className="p-1 text-slate-500 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
          title="Adicionar tarefa"
        >
          <span className="material-symbols-outlined text-lg">add</span>
        </button>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[120px] rounded-xl border-2 border-dashed p-2 space-y-2 transition-colors ${
          isOver
            ? 'border-blue-500/60 bg-blue-500/5'
            : 'border-slate-700/50 bg-slate-900/30'
        }`}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <KanbanCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-20 text-slate-600 text-xs">
            <span className="material-symbols-outlined text-2xl mb-1">
              {TYPE_ICON[status.type] ?? 'inbox'}
            </span>
            Vazio
          </div>
        )}
      </div>
    </div>
  );
};
