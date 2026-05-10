import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import * as attendancesService from '../services/attendancesService';
import type { AttendanceListItem } from '../services/attendancesService';
import * as clientsService from '../services/clientsService';
import type { Customer } from '../types';
import { AttendanceFormDialog } from '../components/Attendance/AttendanceFormDialog';
import { formatSupabaseError } from '../lib/errors';
import { EntityShortId } from '../components/EntityShortId';

function formatWhen(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_LABEL: Record<string, string> = {
  open: 'Aberto',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Status: Todos' },
  { value: 'open', label: 'Status: Aberto' },
  { value: 'in_progress', label: 'Status: Em andamento' },
  { value: 'completed', label: 'Status: Concluído' },
  { value: 'cancelled', label: 'Status: Cancelado' },
];

function dateToIsoStart(d: string | null): string | null {
  if (!d) return null;
  return `${d}T00:00:00`;
}

function dateToIsoEnd(d: string | null): string | null {
  if (!d) return null;
  return `${d}T23:59:59`;
}

interface AttendancePageProps {
  onOpenSettings?: () => void;
  initialAttendanceId?: string | null;
  onAttendanceIdHandled?: () => void;
}

export const AttendancePage: React.FC<AttendancePageProps> = ({ onOpenSettings, initialAttendanceId, onAttendanceIdHandled }) => {
  const { currentCompany } = useCompany();
  const [rows, setRows] = useState<AttendanceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<'closed' | 'view' | 'edit'>('closed');
  const [dialogAttendanceId, setDialogAttendanceId] = useState<string | null>(null);

  // Filtros
  const [filterClientId, setFilterClientId] = useState<string>('');
  const [filterClientSearch, setFilterClientSearch] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [clients, setClients] = useState<Customer[]>([]);

  const filteredClientOptions = useMemo(() => {
    const q = filterClientSearch.trim().toLowerCase();
    const digits = filterClientSearch.replace(/\D/g, '');
    if (!q) return clients.slice(0, 200);
    return clients
      .filter(
        (c) =>
          (c.chatname ?? '').toLowerCase().includes(q) ||
          (c.sendername ?? '').toLowerCase().includes(q) ||
          (c.ai_name ?? '').toLowerCase().includes(q) ||
          (digits && (c.phone ?? '').includes(digits))
      )
      .slice(0, 200);
  }, [clients, filterClientSearch]);

  const hasActiveFilters =
    Boolean(filterClientId) ||
    Boolean(filterStatus) ||
    Boolean(filterDateFrom) ||
    Boolean(filterDateTo);

  const load = useCallback(async () => {
    if (!currentCompany) return;
    try {
      setLoading(true);
      setError(null);
      const list = await attendancesService.getAttendances({
        companyId: currentCompany.id,
        clientId: filterClientId || undefined,
        status: filterStatus || undefined,
        dateFrom: dateToIsoStart(filterDateFrom) || undefined,
        dateTo: dateToIsoEnd(filterDateTo) || undefined,
      });
      setRows(list);
    } catch (e: unknown) {
      setError(formatSupabaseError(e, 'Erro ao carregar atendimentos.'));
    } finally {
      setLoading(false);
    }
  }, [currentCompany, filterClientId, filterStatus, filterDateFrom, filterDateTo]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!currentCompany) return;
    clientsService
      .getClients(currentCompany.id, { limit: 500 })
      .then(setClients)
      .catch(() => setClients([]));
  }, [currentCompany]);

  // Abrir atendimento diretamente pelo ID (vindo da busca global)
  useEffect(() => {
    if (!initialAttendanceId) return;
    setDialogAttendanceId(initialAttendanceId);
    setDialogMode('view');
    setTimeout(() => { onAttendanceIdHandled?.(); }, 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAttendanceId]);

  const openNew = () => {
    setDialogAttendanceId(null);
    setDialogMode('edit');
  };

  const openView = (id: string) => {
    setDialogAttendanceId(id);
    setDialogMode('view');
  };

  const openEdit = (id: string) => {
    setDialogAttendanceId(id);
    setDialogMode('edit');
  };

  const closeDialog = () => {
    setDialogMode('closed');
    setDialogAttendanceId(null);
  };

  const clearFilters = () => {
    setFilterClientId('');
    setFilterClientSearch('');
    setFilterStatus('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const selectedClient = clients.find((c) => c.id === filterClientId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Atendimentos</h1>
          <p className="text-sm text-slate-400 mt-1">
            Registre o que foi feito para cada cliente — tipo, custos e anotações.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-200 hover:bg-slate-800 text-sm font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-lg">tune</span>
              Ajustes
            </button>
          )}
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/20 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Novo atendimento
          </button>
        </div>
      </div>

      {/* Barra de filtros */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <span className="material-symbols-outlined text-base text-slate-400">filter_alt</span>
            Filtros
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              Limpar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Cliente */}
          <div className="lg:col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
              Cliente
            </label>
            {filterClientId && selectedClient ? (
              <div className="flex items-center gap-2 h-11 bg-slate-900 border border-slate-700 rounded-xl px-3">
                <span className="material-symbols-outlined text-base text-blue-400">person</span>
                <span className="text-sm text-white flex-1 truncate">
                  {selectedClient.chatname || selectedClient.sendername || selectedClient.ai_name || selectedClient.phone}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFilterClientId('');
                    setFilterClientSearch('');
                  }}
                  className="text-slate-400 hover:text-red-400"
                  title="Remover filtro de cliente"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={filterClientSearch}
                  onChange={(e) => setFilterClientSearch(e.target.value)}
                  placeholder="Buscar nome ou telefone…"
                  className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 text-lg">
                  search
                </span>
                {filterClientSearch.trim() && filteredClientOptions.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
                    {filteredClientOptions.slice(0, 20).map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => {
                          setFilterClientId(c.id);
                          setFilterClientSearch('');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-800 text-sm text-white flex items-center justify-between gap-2"
                      >
                        <span className="truncate">{c.chatname || c.sendername || c.ai_name || '—'}</span>
                        <span className="text-xs text-slate-500 font-mono">{c.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Data */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
              Período
            </label>
            <div className="flex gap-1 items-center">
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="flex-1 h-11 bg-slate-900 border border-slate-700 rounded-xl px-2 text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none"
                title="Data inicial"
              />
              <span className="text-slate-500 text-xs">até</span>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="flex-1 h-11 bg-slate-900 border border-slate-700 rounded-xl px-2 text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none"
                title="Data final"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4 text-sm text-red-300">{error}</div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/50 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider w-28">
                  ID
                </th>
                <th className="px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                  Cliente
                </th>
                <th className="px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                  Data
                </th>
                <th className="px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                  Tipo
                </th>
                <th className="px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 font-bold text-slate-400 uppercase text-[10px] tracking-wider text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <div className="inline-flex items-center gap-2">
                      <div className="size-5 border-2 border-slate-500/30 border-t-blue-400 rounded-full animate-spin" />
                      Carregando…
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    {hasActiveFilters
                      ? 'Nenhum atendimento encontrado com os filtros aplicados.'
                      : 'Nenhum atendimento ainda. Clique em "Novo atendimento".'}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 align-top">
                      <EntityShortId kind="attendance" id={r.id} className="text-slate-400" />
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{r.client_display}</td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {formatWhen(r.attended_at || r.created_at)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{r.type_name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-lg bg-slate-700/80 text-slate-200 text-xs">
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openView(r.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-400 hover:bg-slate-800 border border-transparent hover:border-slate-600 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          Visualizar
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(r.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800 border border-slate-600 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {currentCompany && dialogMode !== 'closed' && (
        <AttendanceFormDialog
          open
          companyId={currentCompany.id}
          attendanceId={dialogAttendanceId}
          mode={dialogMode === 'view' ? 'view' : 'edit'}
          onClose={closeDialog}
          onSaved={load}
          onRequestEdit={
            dialogMode === 'view' && dialogAttendanceId
              ? () => openEdit(dialogAttendanceId)
              : undefined
          }
        />
      )}
    </div>
  );
};
