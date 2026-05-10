import React, { useState, useEffect, useCallback } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { KanbanBoard } from '../components/Tasks/KanbanBoard';
import { TaskListView } from '../components/Tasks/TaskListView';
import { TaskFormDialog } from '../components/Tasks/TaskFormDialog';
import * as taskStatusesService from '../services/taskStatusesService';
import * as tasksService from '../services/tasksService';
import type { Task, TaskStatus } from '../types';

type ViewMode = 'kanban' | 'list';

export const TasksPage: React.FC = () => {
  const { currentCompany } = useCompany();

  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [showTerminal, setShowTerminal] = useState(true);
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultStatusId, setDefaultStatusId] = useState<string | undefined>();

  // Delete confirm
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!currentCompany) return;
    try {
      setLoading(true);
      setError(null);
      const [s, t] = await Promise.all([
        taskStatusesService.getTaskStatuses(currentCompany.id),
        tasksService.getTasks({ companyId: currentCompany.id, includeTerminal: showTerminal }),
      ]);
      setStatuses(s);
      setTasks(t);
    } catch (err: any) {
      setError(err.message ?? 'Erro ao carregar tarefas.');
    } finally {
      setLoading(false);
    }
  }, [currentCompany, showTerminal]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddTask = (statusId?: string) => {
    setEditingTask(null);
    setDefaultStatusId(statusId);
    setFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setDefaultStatusId(undefined);
    setFormOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    setDeletingTask(task);
  };

  const confirmDelete = async () => {
    if (!deletingTask) return;
    try {
      setDeleting(true);
      await tasksService.deleteTask(deletingTask.id);
      setTasks(prev => prev.filter(t => t.id !== deletingTask.id));
      setDeletingTask(null);
    } catch (err: any) {
      setError(err.message ?? 'Erro ao excluir tarefa.');
    } finally {
      setDeleting(false);
    }
  };

  const handleTaskSaved = (saved: Task) => {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  };

  // Filtered statuses based on showTerminal toggle
  const visibleStatuses = showTerminal
    ? statuses
    : statuses.filter(s => s.type === 'active');

  const visibleTasks = showTerminal
    ? tasks
    : tasks.filter(t => {
        const status = statuses.find(s => s.id === t.status_id);
        return status?.type === 'active';
      });

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Tarefas</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {tasks.length} tarefa{tasks.length !== 1 ? 's' : ''} no total
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Toggle terminal columns */}
          <button
            onClick={() => setShowTerminal(v => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${
              showTerminal
                ? 'border-blue-500/50 bg-blue-500/10 text-blue-300'
                : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {showTerminal ? 'visibility' : 'visibility_off'}
            </span>
            {showTerminal ? 'Ocultar concluídas' : 'Mostrar concluídas'}
          </button>

          {/* View mode toggle */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-base">view_kanban</span>
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-base">list</span>
              Lista
            </button>
          </div>

          {/* Settings */}
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('aios:navigate', { detail: { view: 'tasks-settings' } }));
            }}
            className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors"
            title="Configurar etapas"
          >
            <span className="material-symbols-outlined text-lg">settings</span>
          </button>

          {/* Add task (list mode only — kanban has per-column add) */}
          {viewMode === 'list' && (
            <button
              onClick={() => handleAddTask()}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Nova Tarefa
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="size-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="flex-1 overflow-x-auto">
          <KanbanBoard
            statuses={visibleStatuses}
            tasks={visibleTasks}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onTasksChange={setTasks}
          />
        </div>
      ) : (
        <TaskListView
          tasks={visibleTasks}
          statuses={visibleStatuses}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          onAddTask={handleAddTask}
        />
      )}

      {/* Task Form Dialog */}
      <TaskFormDialog
        open={formOpen}
        task={editingTask}
        statuses={statuses.filter(s => s.is_active)}
        defaultStatusId={defaultStatusId}
        companyId={currentCompany?.id ?? ''}
        onClose={() => { setFormOpen(false); setEditingTask(null); }}
        onSaved={handleTaskSaved}
      />

      {/* Delete Confirm Dialog */}
      {deletingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeletingTask(null)} />
          <div className="relative z-10 w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 bg-red-500/15 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-red-400">delete</span>
              </div>
              <div>
                <h3 className="text-white font-bold">Excluir Tarefa</h3>
                <p className="text-slate-400 text-xs">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 mb-6">
              Deseja excluir <strong className="text-white">"{deletingTask.title}"</strong>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeletingTask(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-xl transition-colors flex items-center gap-2"
              >
                {deleting && <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
