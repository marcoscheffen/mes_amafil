import React, { useState, useEffect, useCallback } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { AppointmentFormDialog } from '../components/Agenda/AppointmentFormDialog';
import { WeekTimeGrid } from '../components/Agenda/WeekTimeGrid';
import * as appointmentsService from '../services/appointmentsService';
import * as agendaService from '../services/agendaService';
import { getGoogleCalendarStatus } from '../services/googleCalendarService';
import type { Appointment, Professional } from '../services/appointmentsService';
import type { BusinessHour } from '../services/agendaService';
import { EntityShortId } from '../components/EntityShortId';

// ─── Helpers de data ───────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function toDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfWeek(d: Date): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  r.setHours(0, 0, 0, 0);
  return r;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

// ─── Status badge ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  scheduled:   { label: 'Agendado',      cls: 'bg-blue-500/20 text-blue-300' },
  confirmed:   { label: 'Confirmado',    cls: 'bg-emerald-500/20 text-emerald-300' },
  in_progress: { label: 'Em Atendimento',cls: 'bg-amber-500/20 text-amber-300' },
  completed:   { label: 'Concluído',     cls: 'bg-slate-500/20 text-slate-400' },
  cancelled:   { label: 'Cancelado',     cls: 'bg-red-500/20 text-red-400' },
  no_show:     { label: 'Não Compareceu',cls: 'bg-violet-500/20 text-violet-400' },
};

const SYNC_CONFIG: Record<string, { icon: string; cls: string; title: string }> = {
  synced:        { icon: 'cloud_done',   cls: 'text-emerald-400', title: 'Sincronizado com Google Calendar' },
  pending:       { icon: 'sync',        cls: 'text-amber-400 animate-spin', title: 'Sincronizando...' },
  error:         { icon: 'cloud_off',   cls: 'text-red-400',     title: 'Falha na sincronização' },
  not_connected: { icon: 'cloud_off',   cls: 'text-slate-500',    title: 'Google Calendar não conectado — clique em Sincronizar para retentar' },
};

// ─── Componente principal ──────────────────────────────────────────────────────

type ViewMode = 'week' | 'list';

interface AgendaPageProps {
  onOpenSettings?: () => void;
  initialAppointmentId?: string | null;
  onAppointmentIdHandled?: () => void;
}

export const AgendaPage: React.FC<AgendaPageProps> = ({ onOpenSettings, initialAppointmentId, onAppointmentIdHandled }) => {
  const { currentCompany } = useCompany();

  const [viewMode,       setViewMode]       = useState<ViewMode>('week');
  const [appointments,   setAppointments]   = useState<Appointment[]>([]);
  const [professionals,  setProfessionals]  = useState<Professional[]>([]);
  const [businessHours,  setBusinessHours]  = useState<BusinessHour[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);

  const [weekStart,      setWeekStart]      = useState<Date>(() => startOfWeek(new Date()));
  const [filterProf,     setFilterProf]     = useState('');
  const [filterStatus,   setFilterStatus]   = useState('');

  const [formOpen,       setFormOpen]       = useState(false);
  const [editingAppt,    setEditingAppt]    = useState<Appointment | null>(null);
  const [defaultDate,         setDefaultDate]         = useState<string | undefined>();
  const [defaultScheduledAt,  setDefaultScheduledAt] = useState<string | undefined>();
  const [detailAppt,     setDetailAppt]     = useState<Appointment | null>(null);
  const [syncing,        setSyncing]        = useState(false);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dateFrom = toDateInput(weekStart);
  const dateTo   = toDateInput(weekDays[6]);

  const load = useCallback(async () => {
    if (!currentCompany) return;
    try {
      setLoading(true);
      setError(null);
      const hoursPromise = filterProf
        ? agendaService.getProfessionalBusinessHours(currentCompany.id, filterProf)
        : agendaService.getCompanyBusinessHours(currentCompany.id);

      const [appts, profs, hours] = await Promise.all([
        appointmentsService.getAppointments({
          companyId: currentCompany.id,
          dateFrom,
          dateTo,
          professionalId: filterProf  || undefined,
          status:         filterStatus || undefined,
        }),
        appointmentsService.getProfessionals(currentCompany.id),
        hoursPromise,
      ]);
      setAppointments(appts);
      setProfessionals(profs);
      setBusinessHours(hours);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  }, [currentCompany, dateFrom, dateTo, filterProf, filterStatus]);

  useEffect(() => { load(); }, [load]);

  // Abrir agendamento diretamente pelo ID (vindo da busca global)
  useEffect(() => {
    if (!initialAppointmentId || !currentCompany) return;
    appointmentsService.getAppointmentById(currentCompany.id, initialAppointmentId).then(appt => {
      if (appt) setDetailAppt(appt);
    }).finally(() => {
      setTimeout(() => { onAppointmentIdHandled?.(); }, 100);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAppointmentId, currentCompany]);

  const handleSaved = (id: string, isNew: boolean) => {
    setFormOpen(false);
    setEditingAppt(null);
    setDetailAppt(null);
    setDefaultScheduledAt(undefined);
    setDefaultDate(undefined);
    load();
    // Dispara sync imediatamente após salvar — fire-and-forget, sem bloquear a UI
    if (isNew) {
      appointmentsService.syncNewAppointment(id).catch(() => {});
    } else {
      appointmentsService.syncUpdatedAppointment(id).catch(() => {});
    }
  };

  const openNewAppointment = () => {
    setEditingAppt(null);
    setDefaultDate(undefined);
    setDefaultScheduledAt(undefined);
    setFormOpen(true);
  };

  const handleSync = async () => {
    if (!currentCompany || syncing) return;
    setSyncing(true);
    try {
      // 0. Verifica se o token Google está válido antes de disparar N requisições
      const gcalStatus = await getGoogleCalendarStatus(currentCompany.id);
      if (gcalStatus.connected && gcalStatus.token_expired) {
        setError('Token Google Calendar expirado. Reconecte em Configurações → Google Calendar.');
        return;
      }

      // 1. Busca TODOS os agendamentos não sincronizados da empresa (não apenas a view atual)
      //    Inclui: pending, not_connected (token indisponível na criação) e error
      const unsynced = await appointmentsService.getUnsyncedAppointments(currentCompany.id);
      await Promise.all(unsynced.map(a => appointmentsService.syncNewAppointment(a.id)));

      // 2. Reconcilia com Google Calendar: captura deleções e importações perdidas
      await appointmentsService.syncGoogleEvents({
        companyId: currentCompany.id,
        dateFrom:  dateFrom,
        dateTo:    dateTo,
      });

      await load();
    } catch (err: any) {
      setError(err.message || 'Erro ao sincronizar');
    } finally {
      setSyncing(false);
    }
  };

  const handleCancel = async (appt: Appointment) => {
    if (!currentCompany) return;
    if (!confirm(`Cancelar agendamento de ${appt.client_name || 'cliente'}?`)) return;
    try {
      await appointmentsService.cancelAppointment(appt.id, currentCompany.id);
      await appointmentsService.syncCancelledAppointment(appt.id);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReschedule = async (appt: Appointment, newScheduledAt: string) => {
    if (!currentCompany) return;
    try {
      await appointmentsService.updateAppointment({
        id:          appt.id,
        companyId:   currentCompany.id,
        scheduledAt: newScheduledAt,
      });
      await appointmentsService.syncUpdatedAppointment(appt.id);
      load();
    } catch (err: any) {
      setError(err.message || 'Erro ao reagendar');
    }
  };

  if (!currentCompany) return null;

  // ─── Renderização ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Barra superior: ações (título vem do Header do app) */}
      <div className="flex items-center justify-end gap-2 flex-shrink-0 flex-wrap">
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-2 h-10 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold rounded-xl transition-all text-sm"
          >
            <span className="material-symbols-outlined text-lg">tune</span>
            Ajustes
          </button>
        )}
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 h-10 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold rounded-xl transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          title="Sincronizar agendamentos pendentes com o Google Calendar"
        >
          <span className={`material-symbols-outlined text-lg${syncing ? ' animate-spin' : ''}`}>sync</span>
          {syncing ? 'Sincronizando...' : 'Sincronizar'}
        </button>
        <button
          type="button"
          onClick={openNewAppointment}
          className="flex items-center gap-2 h-10 px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all text-sm"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Novo Agendamento
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm flex-shrink-0">
          {error}
        </div>
      )}

      {/* Controles */}
      <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
        {/* Navegação de semana */}
        <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl p-1">
          <button
            onClick={() => setWeekStart(d => addDays(d, -7))}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
          >
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <span className="text-sm font-bold text-slate-200 px-2 min-w-[150px] text-center">
            {weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} –{' '}
            {weekDays[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          <button
            onClick={() => setWeekStart(d => addDays(d, 7))}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
          >
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="h-8 px-3 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
          >
            Hoje
          </button>
        </div>

        {/* Filtro profissional */}
        <select
          value={filterProf}
          onChange={e => setFilterProf(e.target.value)}
          className="h-9 bg-slate-800 border border-slate-700 rounded-xl px-3 text-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Todos os profissionais</option>
          {professionals.map(p => <option key={p.user_id} value={p.user_id}>{p.full_name}</option>)}
        </select>

        {/* Filtro status */}
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="h-9 bg-slate-800 border border-slate-700 rounded-xl px-3 text-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
        </select>

        {/* Toggle view */}
        <div className="ml-auto flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl p-1">
          {(['week', 'list'] as ViewMode[]).map(m => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`h-7 px-3 rounded-lg text-xs font-bold transition-all ${
                viewMode === m ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {m === 'week' ? 'Semana' : 'Lista'}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : viewMode === 'week' ? (
        <WeekTimeGrid
          weekDays={weekDays}
          appointments={appointments}
          businessHours={businessHours}
          isSameDay={isSameDay}
          onSlotClick={(day, scheduledAtIso) => {
            setEditingAppt(null);
            setDefaultDate(toDateInput(day));
            setDefaultScheduledAt(scheduledAtIso);
            setFormOpen(true);
          }}
          onAppointmentClick={appt => setDetailAppt(appt)}
          onAppointmentReschedule={handleReschedule}
        />
      ) : (
        /* ── VISÃO LISTA ── */
        <div className="flex-1 overflow-y-auto">
          {appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 gap-2">
              <span className="material-symbols-outlined text-4xl">calendar_today</span>
              <p>Nenhum agendamento neste período.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {appointments.map(appt => (
                <div
                  key={appt.id}
                  onClick={() => setDetailAppt(appt)}
                  className="bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all"
                >
                  <div
                    className="w-1 self-stretch rounded-full flex-shrink-0"
                    style={{ backgroundColor: appt.service_color || '#3B82F6' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {appt.service_name || 'Serviço'}{appt.client_name ? ` — ${appt.client_name}` : ''}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDate(appt.scheduled_at)}
                      {appt.professional_name && ` · ${appt.professional_name}`}
                    </p>
                    <EntityShortId kind="appointment" id={appt.id} className="text-slate-500 mt-1 inline-block" />
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {SYNC_CONFIG[appt.sync_status]?.icon && (
                      <span
                        className={`material-symbols-outlined text-sm ${SYNC_CONFIG[appt.sync_status].cls}`}
                        title={SYNC_CONFIG[appt.sync_status].title}
                      >
                        {SYNC_CONFIG[appt.sync_status].icon}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${STATUS_CONFIG[appt.status]?.cls || ''}`}>
                      {STATUS_CONFIG[appt.status]?.label || appt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Detalhes do agendamento */}
      {detailAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h3 className="font-bold text-white">Detalhes do Agendamento</h3>
              <button onClick={() => setDetailAppt(null)} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Identificador</p>
              <p className="text-sm text-slate-200 font-mono w-fit">
                <EntityShortId kind="appointment" id={detailAppt.id} className="text-slate-300" />
              </p>
              {detailAppt.is_external ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400">event</span>
                    <span className="font-bold text-white truncate">{detailAppt.notes || '(sem título)'}</span>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold bg-slate-700 text-slate-400">Google</span>
                  </div>
                  <div className="text-sm text-slate-300 space-y-1.5">
                    <p><span className="text-slate-500">Data:</span> {formatDate(detailAppt.scheduled_at)}</p>
                    {detailAppt.ends_at && <p><span className="text-slate-500">Término:</span> {new Date(detailAppt.ends_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>}
                    {detailAppt.professional_name && <p><span className="text-slate-500">Profissional:</span> {detailAppt.professional_name}</p>}
                    <p className="text-xs text-slate-500 italic">Evento criado no Google Calendar. Edite diretamente no Google.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: detailAppt.service_color || '#3B82F6' }} />
                    <span className="font-bold text-white">{detailAppt.service_name}</span>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-bold ${STATUS_CONFIG[detailAppt.status]?.cls}`}>
                      {STATUS_CONFIG[detailAppt.status]?.label}
                    </span>
                  </div>
                  <div className="text-sm text-slate-300 space-y-1.5">
                    <p><span className="text-slate-500">Data:</span> {formatDate(detailAppt.scheduled_at)}</p>
                    {detailAppt.ends_at && <p><span className="text-slate-500">Término:</span> {new Date(detailAppt.ends_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>}
                    {detailAppt.professional_name && <p><span className="text-slate-500">Profissional:</span> {detailAppt.professional_name}</p>}
                    {detailAppt.client_name && <p><span className="text-slate-500">Cliente:</span> {detailAppt.client_name}</p>}
                    {detailAppt.notes && <p><span className="text-slate-500">Obs:</span> {detailAppt.notes}</p>}
                    {SYNC_CONFIG[detailAppt.sync_status]?.icon && (
                      <p className="flex items-center gap-1">
                        <span className="text-slate-500">Google:</span>
                        <span className={`material-symbols-outlined text-sm ${SYNC_CONFIG[detailAppt.sync_status]?.cls}`}>
                          {SYNC_CONFIG[detailAppt.sync_status]?.icon}
                        </span>
                        <span>{SYNC_CONFIG[detailAppt.sync_status]?.title}</span>
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2 p-5 pt-0">
              {detailAppt.is_external ? (
                <button onClick={() => setDetailAppt(null)} className="flex-1 h-9 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-sm transition-all">
                  Fechar
                </button>
              ) : !['cancelled','completed','no_show'].includes(detailAppt.status) ? (
                <>
                  <button
                    onClick={() => {
                      setDefaultScheduledAt(undefined);
                      setEditingAppt(detailAppt);
                      setDetailAppt(null);
                      setFormOpen(true);
                    }}
                    className="flex-1 h-9 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-sm transition-all"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleCancel(detailAppt)}
                    className="flex-1 h-9 bg-red-600/20 hover:bg-red-600/40 text-red-400 font-bold rounded-xl text-sm transition-all"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button onClick={() => setDetailAppt(null)} className="flex-1 h-9 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-sm transition-all">
                  Fechar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Formulário */}
      {formOpen && (
        <AppointmentFormDialog
          companyId={currentCompany.id}
          appointment={editingAppt}
          defaultDate={defaultDate}
          defaultScheduledAt={defaultScheduledAt}
          defaultProfessional={filterProf || undefined}
          onSave={handleSaved}
          onClose={() => {
            setFormOpen(false);
            setEditingAppt(null);
            setDefaultScheduledAt(undefined);
            setDefaultDate(undefined);
          }}
        />
      )}
    </div>
  );
};
