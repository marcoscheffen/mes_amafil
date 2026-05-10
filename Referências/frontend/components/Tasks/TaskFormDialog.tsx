import React, { useState, useEffect } from 'react';
import type { Task, TaskStatus, TaskPriority, Customer } from '../../types';
import * as tasksService from '../../services/tasksService';
import { getClients } from '../../services/clientsService';

interface TaskFormDialogProps {
  open: boolean;
  task?: Task | null;
  statuses: TaskStatus[];
  defaultStatusId?: string;
  /** Pré-seleciona o cliente ao criar uma nova tarefa */
  defaultClientId?: string;
  companyId: string;
  onClose: () => void;
  onSaved: (task: Task) => void;
}

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'low',    label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high',   label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
];

export const TaskFormDialog: React.FC<TaskFormDialogProps> = ({
  open,
  task,
  statuses,
  defaultStatusId,
  defaultClientId,
  companyId,
  onClose,
  onSaved,
}) => {
  const isEdit = !!task;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [statusId, setStatusId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [clientId, setClientId] = useState('');
  const [clients, setClients] = useState<Customer[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load clients once when dialog opens
  useEffect(() => {
    if (!open) return;
    getClients(companyId).then(setClients).catch(() => setClients([]));
  }, [open, companyId]);

  // Populate form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setPriority(task.priority);
      setStatusId(task.status_id);
      setDueDate(task.due_date ? task.due_date.slice(0, 10) : '');
      setClientId(task.client_id ?? '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatusId(defaultStatusId ?? statuses[0]?.id ?? '');
      setDueDate('');
      setClientId(defaultClientId ?? '');
    }
    setClientSearch('');
    setError(null);
  }, [task, defaultStatusId, defaultClientId, statuses, open]);

  if (!open) return null;

  const filteredClients = clientSearch.trim()
    ? clients.filter(c =>
        (c.chatname ?? '').toLowerCase().includes(clientSearch.toLowerCase()) ||
        (c.phone ?? '').includes(clientSearch)
      )
    : clients;

  const selectedClient = clients.find(c => c.id === clientId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Título obrigatório.'); return; }
    if (!statusId) { setError('Selecione uma etapa.'); return; }

    try {
      setSaving(true);
      setError(null);

      let saved: Task;
      if (isEdit && task) {
        saved = await tasksService.updateTask(task.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          statusId,
          dueDate: dueDate || null,
          clientId: clientId || null,
        });
      } else {
        saved = await tasksService.createTask({
          companyId,
          statusId,
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          dueDate: dueDate || undefined,
          clientId: clientId || undefined,
        });
      }

      // Enrich with client_name (not returned by table INSERT/UPDATE, only by RPC)
      onSaved({ ...saved, client_name: selectedClient?.chatname ?? undefined });
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Erro ao salvar tarefa.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">
            {isEdit ? 'Editar Tarefa' : 'Nova Tarefa'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Título *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Descreva a tarefa..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detalhes adicionais..."
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Etapa *
              </label>
              <select
                value={statusId}
                onChange={e => setStatusId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                {statuses.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              >
                {PRIORITIES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Data de Vencimento
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Client */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Cliente
            </label>
            {selectedClient && (
              <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <span className="material-symbols-outlined text-base text-blue-400">person</span>
                <span className="text-sm text-blue-300 flex-1 truncate">{selectedClient.chatname}</span>
                <button
                  type="button"
                  onClick={() => setClientId('')}
                  className="text-slate-400 hover:text-white"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
            )}
            {!selectedClient && (
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-base">search</span>
                <input
                  type="text"
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                  placeholder="Buscar cliente por nome ou telefone..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            )}
            {!selectedClient && clientSearch && filteredClients.length > 0 && (
              <div className="mt-1 max-h-36 overflow-y-auto bg-slate-800 border border-slate-700 rounded-xl divide-y divide-slate-700">
                {filteredClients.slice(0, 8).map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setClientId(c.id); setClientSearch(''); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base text-slate-400">person</span>
                    <span className="text-sm text-white truncate">{c.chatname}</span>
                    <span className="text-xs text-slate-500 ml-auto flex-shrink-0">{c.phone}</span>
                  </button>
                ))}
              </div>
            )}
            {!selectedClient && clientSearch && filteredClients.length === 0 && (
              <p className="mt-1 text-xs text-slate-500 px-1">Nenhum cliente encontrado.</p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center gap-2"
            >
              {saving && (
                <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {isEdit ? 'Salvar' : 'Criar Tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
