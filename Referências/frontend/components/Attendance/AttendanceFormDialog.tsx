import React, { useState, useEffect, useCallback } from 'react';
import * as attendancesService from '../../services/attendancesService';
import type {
  CompanyAttendanceType,
  AttendanceCostRow,
  AttendanceTypeField,
} from '../../services/attendancesService';
import * as clientsService from '../../services/clientsService';
import * as appointmentsService from '../../services/appointmentsService';
import type { Appointment } from '../../services/appointmentsService';
import type { Customer, Ponto } from '../../types';
import { TaskFormDialog } from '../Tasks/TaskFormDialog';
import * as taskStatusesService from '../../services/taskStatusesService';
import type { TaskStatus } from '../../types';
import * as pontosService from '../../services/pontosService';
import * as assistenteIAService from '../../services/assistanteIAService';
import type { TranscriptionListItem } from '../../services/assistanteIAService';
import { useAuth } from '../../hooks/useAuth';
import { EntityShortId } from '../EntityShortId';
import { formatEntityShortId } from '../../lib/shortId';

interface AttendanceFormDialogProps {
  open: boolean;
  companyId: string;
  attendanceId?: string | null;
  /**
   * Opcional: pré-seleciona o cliente ao abrir o dialog em modo "novo".
   * Em modo "edição" (quando attendanceId é passado), o clientId é
   * carregado do registro existente e este prop é ignorado.
   */
  clientId?: string | null;
  /** Somente leitura: visualização sem salvar (transcrição e atalho permanecem ativos). */
  mode?: 'edit' | 'view';
  /** Quando em modo view, troca para edição sem fechar o painel. */
  onRequestEdit?: () => void;
  onClose: () => void;
  onSaved: () => void;
}

function formatTranscriptionPickLabel(t: TranscriptionListItem, currentAttendanceId: string | null): string {
  const d = new Date(t.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  const form = t.form_name ? ` — ${t.form_name}` : '';
  const extra =
    t.attendance_id && currentAttendanceId && t.attendance_id !== currentAttendanceId
      ? ' (outro atendimento)'
      : '';
  return `${formatEntityShortId('transcription', t.id)} — ${d}${form}${extra}`;
}

function formatBRL(isoMoney: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(isoMoney);
}

export const AttendanceFormDialog: React.FC<AttendanceFormDialogProps> = ({
  open,
  companyId,
  attendanceId,
  clientId: initialClientId,
  mode = 'edit',
  onRequestEdit,
  onClose,
  onSaved,
}) => {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const readOnly = mode === 'view';
  const [types, setTypes] = useState<CompanyAttendanceType[]>([]);
  const [companyTypeId, setCompanyTypeId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clients, setClients] = useState<Customer[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notes, setNotes] = useState('');
  const [costs, setCosts] = useState<AttendanceCostRow[]>([{ description: '', value: 0, position: 0 }]);
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({});
  const [status, setStatus] = useState('open');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskStatuses, setTaskStatuses] = useState<TaskStatus[]>([]);

  // Pontos vinculados a este atendimento
  const [pontosRows, setPontosRows] = useState<Ponto[]>([]);
  const [newPontoValue, setNewPontoValue] = useState<number>(0);
  const [newPontoDesc, setNewPontoDesc] = useState<string>('');
  const [pontosError, setPontosError] = useState<string | null>(null);

  const [linkedTranscription, setLinkedTranscription] = useState<TranscriptionListItem | null>(null);
  const [transcriptionsForSelect, setTranscriptionsForSelect] = useState<TranscriptionListItem[]>([]);
  const [transcriptionLinkSaving, setTranscriptionLinkSaving] = useState(false);
  const [transcriptionLinkError, setTranscriptionLinkError] = useState<string | null>(null);

  const selectedClient = clients.find((c) => c.id === clientId);
  const selectedType = types.find((t) => t.company_type_id === companyTypeId);
  const fields: AttendanceTypeField[] = selectedType?.fields ?? [];
  const selectedAppointment = appointments.find((a) => a.id === appointmentId);

  const resetForm = useCallback(() => {
    setCompanyTypeId('');
    setClientId('');
    setAppointmentId(null);
    setNotes('');
    setCosts([{ description: '', value: 0, position: 0 }]);
    setFieldValues({});
    setStatus('open');
    setClientSearch('');
    setError(null);
    setPontosRows([]);
    setNewPontoValue(0);
    setNewPontoDesc('');
    setPontosError(null);
  }, []);

  const loadPontosForAttendance = useCallback(
    async (cid: string, aid: string) => {
      try {
        const list = await pontosService.getPontos(companyId, cid);
        setPontosRows(list.filter((p) => p.attendance_id === aid));
      } catch {
        setPontosRows([]);
      }
    },
    [companyId]
  );

  const loadTypes = useCallback(async () => {
    const list = await attendancesService.getCompanyAttendanceTypes(companyId);
    const active = list.filter((t) => t.is_active);
    setTypes(active);
    setCompanyTypeId((prev) => {
      if (prev) return prev;
      if (active.length === 1) return active[0].company_type_id;
      return '';
    });
  }, [companyId]);

  const loadEdit = useCallback(async () => {
    if (!attendanceId) return;
    const detail = await attendancesService.getAttendanceById(attendanceId, companyId);
    const att = detail.attendance as Record<string, string | null>;
    setCompanyTypeId(String(att.company_type_id ?? ''));
    setClientId(String(att.client_id ?? ''));
    setAppointmentId(att.appointment_id ? String(att.appointment_id) : null);
    setNotes(String(att.notes ?? ''));
    setStatus(String(att.status ?? 'open'));
    const fvRaw = att.field_values;
    if (fvRaw && typeof fvRaw === 'string') {
      try {
        setFieldValues(JSON.parse(fvRaw));
      } catch {
        setFieldValues({});
      }
    } else if (fvRaw && typeof fvRaw === 'object' && !Array.isArray(fvRaw)) {
      setFieldValues(fvRaw as Record<string, unknown>);
    } else {
      setFieldValues({});
    }
    const costRows = (detail.costs ?? []).map((c, i) => ({
      description: c.description,
      value: Number(c.value),
      position: c.position ?? i,
    }));
    setCosts(costRows.length ? costRows : [{ description: '', value: 0, position: 0 }]);

    const cid = String(att.client_id ?? '');
    if (cid && attendanceId) {
      await loadPontosForAttendance(cid, attendanceId);
    }
  }, [attendanceId, companyId, loadPontosForAttendance]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setLoading(true);
        await loadTypes();
        taskStatusesService.getTaskStatuses(companyId).then(setTaskStatuses).catch(() => {});
        if (attendanceId) await loadEdit();
        else {
          resetForm();
          if (initialClientId) setClientId(initialClientId);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar.');
      } finally {
        setLoading(false);
      }
    })();
  }, [open, attendanceId, companyId, loadTypes, loadEdit, resetForm, initialClientId]);

  useEffect(() => {
    if (!open || !companyId) return;
    clientsService.getClients(companyId, { limit: 500 }).then(setClients).catch(() => setClients([]));
  }, [open, companyId]);

  const refreshTranscriptionLinkData = useCallback(async () => {
    if (!companyId || !attendanceId) {
      setLinkedTranscription(null);
      setTranscriptionsForSelect([]);
      return;
    }
    setTranscriptionLinkError(null);

    let linked: TranscriptionListItem | null = null;
    try {
      linked = await assistenteIAService.getTranscriptionLinkedToAttendance(companyId, attendanceId);
    } catch (e) {
      console.error('[AttendanceFormDialog] transcrição vinculada:', e);
      setTranscriptionLinkError('Não foi possível carregar a transcrição vinculada.');
    }
    setLinkedTranscription(linked);

    if (!clientId) {
      setTranscriptionsForSelect(linked ? [linked] : []);
      return;
    }

    let list: TranscriptionListItem[] = [];
    try {
      list = await assistenteIAService.listTranscriptions(companyId, { clientId });
    } catch (e) {
      console.error('[AttendanceFormDialog] lista de transcrições:', e);
    }
    if (linked && !list.some((t) => t.id === linked.id)) {
      list = [linked, ...list];
    }
    setTranscriptionsForSelect(list);
  }, [companyId, attendanceId, clientId]);

  useEffect(() => {
    if (!open || !attendanceId || loading) return;
    refreshTranscriptionLinkData();
  }, [open, attendanceId, clientId, loading, refreshTranscriptionLinkData]);

  useEffect(() => {
    if (!open || !companyId || !clientId) {
      setAppointments([]);
      return;
    }
    const from = new Date();
    from.setFullYear(from.getFullYear() - 1);
    const to = new Date();
    to.setFullYear(to.getFullYear() + 1);
    appointmentsService
      .getAppointments({
        companyId,
        dateFrom: from.toISOString().slice(0, 10),
        dateTo: to.toISOString().slice(0, 10),
      })
      .then((list) => setAppointments(list.filter((a) => a.client_id === clientId)))
      .catch(() => setAppointments([]));
  }, [open, companyId, clientId]);

  const totalCosts = costs.reduce((s, c) => s + (Number.isFinite(c.value) ? c.value : 0), 0);

  const handleCostChange = (index: number, patch: Partial<AttendanceCostRow>) => {
    setCosts((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const addCostRow = () => setCosts((prev) => [...prev, { description: '', value: 0, position: prev.length }]);

  const removeCostRow = (index: number) =>
    setCosts((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));

  const renderDynamicField = (f: AttendanceTypeField) => {
    if (
      f.field_type === 'section_client' ||
      f.field_type === 'section_appointment' ||
      f.field_type === 'section_costs'
    ) {
      return null;
    }
    const v = fieldValues[f.key];
    const setVal = (val: unknown) => setFieldValues((prev) => ({ ...prev, [f.key]: val }));

    if (f.field_type === 'textarea') {
      if (f.key === 'notes') return null;
      return (
        <div key={f.id}>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">{f.label}</label>
          <textarea
            value={typeof v === 'string' ? v : ''}
            onChange={(e) => setVal(e.target.value)}
            rows={4}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      );
    }
    if (f.field_type === 'text') {
      return (
        <div key={f.id}>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">{f.label}</label>
          <input
            type="text"
            value={typeof v === 'string' ? v : ''}
            onChange={(e) => setVal(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      );
    }
    if (f.field_type === 'number') {
      return (
        <div key={f.id}>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">{f.label}</label>
          <input
            type="number"
            value={v !== undefined && v !== null ? String(v) : ''}
            onChange={(e) => setVal(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      );
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    if (!companyTypeId) {
      setError('Selecione um tipo de atendimento.');
      return;
    }
    if (!clientId) {
      setError('Selecione um cliente.');
      return;
    }
    const cleanedCosts = costs
      .filter((c) => c.description.trim())
      .map((c, i) => ({
        description: c.description.trim(),
        value: Number(c.value) || 0,
        position: i,
      }));

    try {
      setSaving(true);
      setError(null);
      const fv = { ...fieldValues };
      delete (fv as Record<string, unknown>).notes;

      let resolvedAttendanceId: string | null = attendanceId ?? null;

      if (attendanceId) {
        await attendancesService.updateAttendance({
          attendanceId,
          companyId,
          status,
          notes,
          appointmentId: appointmentId ?? undefined,
          clearAppointment: !appointmentId,
          fieldValues: fv,
        });
        await attendancesService.upsertAttendanceCosts({
          attendanceId,
          companyId,
          costs: cleanedCosts,
        });
      } else {
        const created = await attendancesService.createAttendance({
          companyId,
          companyTypeId,
          clientId,
          appointmentId: appointmentId ?? undefined,
          notes,
          fieldValues: fv,
          costs: cleanedCosts,
          status,
        });
        resolvedAttendanceId = created.id || null;
      }

      if (newPontoValue !== 0 && resolvedAttendanceId) {
        try {
          await pontosService.addPonto(
            companyId,
            clientId,
            newPontoValue,
            newPontoDesc || undefined,
            resolvedAttendanceId
          );
          setNewPontoValue(0);
          setNewPontoDesc('');
        } catch (pErr: unknown) {
          const msg = pErr instanceof Error ? pErr.message : 'Erro ao vincular ponto';
          throw new Error(`Atendimento salvo, mas falhou ao adicionar ponto: ${msg}`);
        }
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const goAgenda = () => {
    window.dispatchEvent(new CustomEvent('aios:navigate', { detail: { view: 'agenda' } }));
    onClose();
  };

  const openLinkedTranscriptionInAssistant = (transcriptionId: string) => {
    window.dispatchEvent(
      new CustomEvent('aios:navigate', {
        detail: { view: 'assistente-ia', transcriptionId },
      })
    );
    onClose();
  };

  const handleTranscriptionLinkChange = async (value: string) => {
    if (!userId || !attendanceId || !clientId) return;
    setTranscriptionLinkSaving(true);
    setTranscriptionLinkError(null);
    try {
      await assistenteIAService.setTranscriptionAttendanceLink({
        companyId,
        attendanceId,
        attendanceClientId: clientId,
        transcriptionId: value || null,
        userId,
      });
      await refreshTranscriptionLinkData();
    } catch (err: unknown) {
      setTranscriptionLinkError(err instanceof Error ? err.message : 'Erro ao atualizar vínculo.');
    } finally {
      setTranscriptionLinkSaving(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur z-10">
            <div>
              <h2 className="text-lg font-bold text-white">
                {readOnly
                  ? 'Visualizar atendimento'
                  : attendanceId
                    ? 'Editar atendimento'
                    : 'Novo atendimento'}
              </h2>
              {attendanceId ? (
                <p className="mt-1">
                  <EntityShortId kind="attendance" id={attendanceId} className="text-slate-500" />
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {loading ? (
              <div className="flex items-center gap-2 text-slate-400">
                <div className="size-5 border-2 border-slate-500/30 border-t-blue-400 rounded-full animate-spin" />
                Carregando…
              </div>
            ) : (
              <>
                <fieldset
                  disabled={readOnly}
                  className="min-w-0 border-0 p-0 m-0 space-y-6 disabled:opacity-95"
                >
                {types.length === 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-200">
                    Nenhum tipo ativo. Configure em Configurações → Atendimento.
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Tipo *
                  </label>
                  <select
                    value={companyTypeId}
                    onChange={(e) => setCompanyTypeId(e.target.value)}
                    disabled={!!attendanceId}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">— Selecione —</option>
                    {types.map((t) => (
                      <option key={t.company_type_id} value={t.company_type_id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Cliente *
                  </label>
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Buscar nome ou telefone…"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white mb-2 focus:outline-none focus:border-blue-500"
                  />
                  <select
                    value={clientId}
                    onChange={(e) => {
                      setClientId(e.target.value);
                      setAppointmentId(null);
                    }}
                    disabled={!!attendanceId}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">— Selecione —</option>
                    {(clientSearch.trim()
                      ? clients.filter(
                          (c) =>
                            (c.chatname ?? '').toLowerCase().includes(clientSearch.toLowerCase()) ||
                            (c.phone ?? '').includes(clientSearch.replace(/\D/g, ''))
                        )
                      : clients
                    ).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.chatname || c.phone || c.id} ({formatEntityShortId('client', c.id)})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedClient && fields.some((f) => f.field_type === 'section_client') && (
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Dados do cliente</p>
                    <p className="text-sm text-white">{selectedClient.chatname || '—'}</p>
                    <p className="text-xs text-slate-400">{selectedClient.phone || '—'}</p>
                  </div>
                )}

                {fields.some((f) => f.field_type === 'section_appointment') && (
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Agendamento vinculado
                      </p>
                      {attendanceId ? (
                        <button
                          type="button"
                          onClick={goAgenda}
                          className="text-xs font-bold text-blue-400 hover:text-blue-300"
                        >
                          Novo agendamento
                        </button>
                      ) : null}
                    </div>
                    {appointments.length === 0 && clientId ? (
                      <p className="text-sm text-slate-500">Nenhum agendamento neste período para o cliente.</p>
                    ) : (
                      <select
                        value={appointmentId ?? ''}
                        onChange={(e) => setAppointmentId(e.target.value || null)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white"
                      >
                        <option value="">— Sem agendamento —</option>
                        {appointments.map((a) => (
                          <option key={a.id} value={a.id}>
                            {formatEntityShortId('appointment', a.id)} —{' '}
                            {new Date(a.scheduled_at).toLocaleString('pt-BR')} — {a.service_name || 'Serviço'}
                          </option>
                        ))}
                      </select>
                    )}
                    {selectedAppointment && (
                      <div className="text-xs text-slate-400 space-y-1">
                        <p>Profissional: {selectedAppointment.professional_name || '—'}</p>
                        <p>Status: {selectedAppointment.status}</p>
                      </div>
                    )}
                  </div>
                )}

                {fields.some((f) => f.field_type === 'section_costs') && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Custos adicionais
                      </p>
                      <button
                        type="button"
                        onClick={addCostRow}
                        className="text-xs font-bold text-violet-400 hover:text-violet-300"
                      >
                        + linha
                      </button>
                    </div>
                    {costs.map((row, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={row.description}
                          onChange={(e) => handleCostChange(idx, { description: e.target.value })}
                          placeholder="Descrição"
                          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={row.value}
                          onChange={(e) => handleCostChange(idx, { value: parseFloat(e.target.value) || 0 })}
                          className="w-28 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                        />
                        <button
                          type="button"
                          onClick={() => removeCostRow(idx)}
                          className="p-2 text-slate-500 hover:text-red-400"
                        >
                          <span className="material-symbols-outlined text-base">remove</span>
                        </button>
                      </div>
                    ))}
                    <p className="text-sm text-slate-300">
                      Total custos adicionais:{' '}
                      <span className="font-bold text-white">{formatBRL(totalCosts)}</span>
                    </p>
                  </div>
                )}

                {fields
                  .filter(
                    (f) =>
                      ![
                        'section_client',
                        'section_appointment',
                        'section_costs',
                      ].includes(f.field_type)
                  )
                  .map((f) => renderDynamicField(f))}

                {(fields.some((f) => f.key === 'notes') || notes !== '' || attendanceId) && (
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Anotações
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1 w-full">
                    Status
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white"
                    >
                      <option value="open">Aberto</option>
                      <option value="in_progress">Em andamento</option>
                      <option value="completed">Concluído</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </label>
                </div>

                {/* Pontos vinculados ao atendimento */}
                <div className="border-t border-slate-800 pt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-400 fill-1 text-base">star</span>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Pontos deste atendimento
                    </p>
                  </div>

                  {pontosRows.length > 0 && (
                    <div className="space-y-1">
                      {pontosRows.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between gap-3 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`text-sm font-black ${p.points > 0 ? 'text-amber-400' : 'text-red-400'}`}
                            >
                              {p.points > 0 ? `+${p.points}` : p.points}
                            </span>
                            <span className="text-xs text-slate-400 truncate">
                              {p.description || 'Sem descrição'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 whitespace-nowrap">
                            {new Date(p.created_at).toLocaleString('pt-BR', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-[80px_1fr] gap-2 items-end">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Qtd
                      </label>
                      <input
                        type="number"
                        value={newPontoValue || ''}
                        onChange={(e) => setNewPontoValue(Number(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full h-10 bg-slate-800 border border-slate-700 rounded-xl px-3 text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Descrição (opcional)
                      </label>
                      <input
                        type="text"
                        value={newPontoDesc}
                        onChange={(e) => setNewPontoDesc(e.target.value)}
                        placeholder="Ex: Bônus por comparecimento"
                        className="w-full h-10 bg-slate-800 border border-slate-700 rounded-xl px-3 text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    O ponto será criado vinculado a este atendimento ao salvar. Use valor negativo para estorno.
                    {!clientId && ' Selecione o cliente antes.'}
                  </p>
                  {pontosError && (
                    <p className="text-xs text-red-400">{pontosError}</p>
                  )}
                </div>

                {!readOnly && attendanceId && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={goAgenda}
                      className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 text-sm font-semibold text-slate-200 hover:bg-slate-700"
                    >
                      Criar agendamento
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskOpen(true)}
                      disabled={!clientId}
                      className="px-4 py-2 rounded-xl bg-violet-600/30 border border-violet-500/40 text-sm font-semibold text-violet-200 hover:bg-violet-600/40 disabled:opacity-40"
                    >
                      Criar tarefa
                    </button>
                  </div>
                )}
                </fieldset>

                {attendanceId && (
                  <div className="border-t border-slate-800 pt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-violet-400 text-base">mic</span>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Transcrição (Assistente IA)
                      </p>
                    </div>

                    {!readOnly && (
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Vincular transcrição
                        </label>
                        <p className="text-[10px] text-slate-500 mb-2">
                          Somente transcrições deste cliente, ordenadas pela data (mais recentes primeiro).
                        </p>
                        {!clientId ? (
                          <p className="text-xs text-amber-400/90">
                            Aguarde o carregamento do cliente do atendimento para listar transcrições.
                          </p>
                        ) : (
                          <select
                            value={linkedTranscription?.id ?? ''}
                            onChange={(e) => handleTranscriptionLinkChange(e.target.value)}
                            disabled={transcriptionLinkSaving || !userId}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                          >
                            <option value="">— Sem transcrição vinculada —</option>
                            {transcriptionsForSelect.map((t) => (
                              <option key={t.id} value={t.id}>
                                {formatTranscriptionPickLabel(t, attendanceId)}
                              </option>
                            ))}
                          </select>
                        )}
                        {!userId && (
                          <p className="text-[10px] text-amber-400 mt-1">Sessão necessária para alterar o vínculo.</p>
                        )}
                        {transcriptionLinkSaving && (
                          <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                            <span className="size-3 border-2 border-slate-500/30 border-t-blue-400 rounded-full animate-spin" />
                            Atualizando vínculo…
                          </p>
                        )}
                        {transcriptionLinkError && (
                          <p className="text-xs text-red-400 mt-2">{transcriptionLinkError}</p>
                        )}
                      </div>
                    )}

                    {linkedTranscription ? (
                      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Data da transcrição</p>
                            <p className="text-white">
                              {new Date(linkedTranscription.created_at).toLocaleString('pt-BR', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Formulário</p>
                            <p className="text-slate-200">{linkedTranscription.form_name ?? '—'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Status</p>
                            <p className="text-slate-300 capitalize">{linkedTranscription.status}</p>
                          </div>
                        </div>
                        {linkedTranscription.transcription_text ? (
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Trecho transcrito</p>
                            <p className="text-xs text-slate-300 line-clamp-4 whitespace-pre-wrap">
                              {linkedTranscription.transcription_text}
                            </p>
                          </div>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => openLinkedTranscriptionInAssistant(linkedTranscription.id)}
                          className="inline-flex items-center gap-2 text-sm font-bold text-blue-400 hover:text-blue-300"
                        >
                          <span className="material-symbols-outlined text-base">open_in_new</span>
                          Abrir transcrição no Assistente IA
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Nenhuma transcrição vinculada a este atendimento.</p>
                    )}
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                {readOnly ? (
                  <div className="flex flex-wrap justify-end gap-2 pt-2">
                    {onRequestEdit && (
                      <button
                        type="button"
                        onClick={onRequestEdit}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                      >
                        Editar atendimento
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800"
                    >
                      Fechar
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving || !companyTypeId || !clientId}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold disabled:opacity-40"
                    >
                      {saving ? 'Salvando…' : 'Salvar'}
                    </button>
                  </div>
                )}
              </>
            )}
          </form>
        </div>
      </div>

      <TaskFormDialog
        open={taskOpen}
        companyId={companyId}
        statuses={taskStatuses}
        defaultClientId={clientId || undefined}
        onClose={() => setTaskOpen(false)}
        onSaved={() => {}}
      />
    </>
  );
};
