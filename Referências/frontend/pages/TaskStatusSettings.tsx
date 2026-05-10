import React, { useState, useEffect } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCompany } from '../contexts/CompanyContext';
import * as taskStatusesService from '../services/taskStatusesService';
import type { TaskStatus } from '../types';

const TYPE_OPTIONS: { value: TaskStatus['type']; label: string; desc: string }[] = [
  { value: 'active',          label: 'Ativa',          desc: 'Coluna de trabalho normal' },
  { value: 'terminal_done',   label: 'Concluído',       desc: 'Finalização positiva' },
  { value: 'terminal_cancel', label: 'Cancelado',       desc: 'Finalização negativa' },
];

const PRESET_COLORS = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

// ─── Sortable Row ──────────────────────────────────────────────────────────────
const SortableRow: React.FC<{
  status: TaskStatus;
  onEdit: (s: TaskStatus) => void;
  onToggle: (s: TaskStatus) => void;
  onDelete: (s: TaskStatus) => void;
}> = ({ status, onEdit, onToggle, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: status.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="flex items-center gap-4 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-1 text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing"
      >
        <span className="material-symbols-outlined text-lg">drag_indicator</span>
      </button>

      {/* Color dot */}
      <span
        className="w-4 h-4 rounded-full flex-shrink-0 border-2 border-slate-600"
        style={{ backgroundColor: status.color }}
      />

      {/* Name */}
      <span className="flex-1 text-sm font-semibold text-white">{status.name}</span>

      {/* Type badge */}
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
        status.type === 'terminal_done'   ? 'bg-emerald-500/15 text-emerald-400' :
        status.type === 'terminal_cancel' ? 'bg-red-500/15 text-red-400' :
                                            'bg-blue-500/15 text-blue-400'
      }`}>
        {TYPE_OPTIONS.find(t => t.value === status.type)?.label}
      </span>

      {/* Active toggle */}
      <button
        onClick={() => onToggle(status)}
        className={`text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${
          status.is_active
            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-red-500/10 hover:text-red-400'
            : 'bg-slate-700/50 text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-400'
        }`}
      >
        {status.is_active ? 'Ativa' : 'Inativa'}
      </button>

      {/* Edit */}
      <button
        onClick={() => onEdit(status)}
        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
      >
        <span className="material-symbols-outlined text-base">edit</span>
      </button>

      {/* Delete */}
      <button
        onClick={() => onDelete(status)}
        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
      >
        <span className="material-symbols-outlined text-base">delete</span>
      </button>
    </div>
  );
};

// ─── Status Form ──────────────────────────────────────────────────────────────
const StatusForm: React.FC<{
  status?: TaskStatus | null;
  companyId: string;
  onSaved: (s: TaskStatus) => void;
  onCancel: () => void;
}> = ({ status, companyId, onSaved, onCancel }) => {
  const isEdit = !!status;
  const [name, setName] = useState(status?.name ?? '');
  const [color, setColor] = useState(status?.color ?? PRESET_COLORS[0]);
  const [type, setType] = useState<TaskStatus['type']>(status?.type ?? 'active');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) { setError('Nome obrigatório.'); return; }
    try {
      setSaving(true);
      setError(null);
      let saved: TaskStatus;
      if (isEdit && status) {
        saved = await taskStatusesService.updateTaskStatus(status.id, { name: name.trim(), color, type });
      } else {
        saved = await taskStatusesService.createTaskStatus(companyId, { name: name.trim(), color, type });
      }
      onSaved(saved);
    } catch (err: any) {
      setError(err.message ?? 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
      <h3 className="text-sm font-bold text-white">{isEdit ? 'Editar Etapa' : 'Nova Etapa'}</h3>

      {/* Name */}
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Nome *</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ex: Em andamento..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Type */}
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Tipo</label>
        <div className="grid grid-cols-3 gap-2">
          {TYPE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className={`p-3 rounded-xl border text-left transition-all ${
                type === opt.value
                  ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                  : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
              }`}
            >
              <p className="text-xs font-bold">{opt.label}</p>
              <p className="text-[10px] mt-0.5 opacity-70">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Cor</label>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
          {/* Custom color picker */}
          <label className="relative cursor-pointer">
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="sr-only"
            />
            <div
              className="w-7 h-7 rounded-full border-2 border-dashed border-slate-500 hover:border-slate-300 flex items-center justify-center transition-colors"
              style={{ backgroundColor: PRESET_COLORS.includes(color) ? 'transparent' : color }}
            >
              {PRESET_COLORS.includes(color) && (
                <span className="material-symbols-outlined text-slate-400 text-sm">add</span>
              )}
            </div>
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 text-sm text-red-400">{error}</div>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center gap-2"
        >
          {saving && <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          Salvar
        </button>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
export const TaskStatusSettings: React.FC = () => {
  const { currentCompany } = useCompany();
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStatus, setEditingStatus] = useState<TaskStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    if (currentCompany) load();
  }, [currentCompany]);

  const load = async () => {
    if (!currentCompany) return;
    try {
      setLoading(true);
      const data = await taskStatusesService.getTaskStatuses(currentCompany.id, true);
      setStatuses(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = statuses.findIndex(s => s.id === active.id);
    const newIdx = statuses.findIndex(s => s.id === over.id);
    const reordered = arrayMove(statuses, oldIdx, newIdx) as TaskStatus[];
    setStatuses(reordered);

    try {
      await taskStatusesService.reorderTaskStatuses(currentCompany!.id, reordered.map(s => s.id));
    } catch {
      load(); // rollback
    }
  };

  const handleSaved = (saved: TaskStatus) => {
    setStatuses(prev => {
      const idx = prev.findIndex(s => s.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    setShowForm(false);
    setEditingStatus(null);
  };

  const handleToggle = async (status: TaskStatus) => {
    try {
      const updated = await taskStatusesService.updateTaskStatus(status.id, { is_active: !status.is_active });
      setStatuses(prev => prev.map(s => s.id === updated.id ? updated : s));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (status: TaskStatus) => {
    if (!confirm(`Deseja excluir a etapa "${status.name}"? Tarefas nela serão afetadas.`)) return;
    try {
      await taskStatusesService.deleteTaskStatus(status.id);
      setStatuses(prev => prev.filter(s => s.id !== status.id));
    } catch (err: any) {
      setError(err.message ?? 'Não é possível excluir: há tarefas nessa etapa.');
    }
  };

  const openEdit = (status: TaskStatus) => {
    setEditingStatus(status);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingStatus(null);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Etapas do Kanban</h2>
          <p className="text-sm text-slate-400 mt-1">Configure as colunas do seu quadro de tarefas.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Nova Etapa
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-white">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {showForm && (
        <StatusForm
          status={editingStatus}
          companyId={currentCompany?.id ?? ''}
          onSaved={handleSaved}
          onCancel={closeForm}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="size-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={statuses.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {statuses.map(s => (
                <SortableRow
                  key={s.id}
                  status={s}
                  onEdit={openEdit}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {!loading && statuses.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <span className="material-symbols-outlined text-4xl block mb-2">view_kanban</span>
          Nenhuma etapa criada ainda.
        </div>
      )}
    </div>
  );
};
