import React, { useState, useEffect } from 'react';
import type {
  Appointment,
  CompanyService,
  Professional,
  ClientBasic,
  AvailableSlot,
} from '../../services/appointmentsService';
import * as appointmentsService from '../../services/appointmentsService';
import { EntityShortId } from '../EntityShortId';

interface Props {
  companyId:    string;
  appointment?: Appointment | null;
  defaultDate?: string;        // YYYY-MM-DD
  /** ISO local→UTC do clique na grade; pré-seleciona slot mais próximo após carregar slots. */
  defaultScheduledAt?: string;
  defaultProfessional?: string;
  onSave:  (id: string, isNew: boolean) => void;
  onClose: () => void;
}

const STATUS_OPTIONS = [
  { value: 'scheduled',    label: 'Agendado' },
  { value: 'confirmed',    label: 'Confirmado' },
  { value: 'in_progress',  label: 'Em Atendimento' },
  { value: 'completed',    label: 'Concluído' },
  { value: 'cancelled',    label: 'Cancelado' },
  { value: 'no_show',      label: 'Não Compareceu' },
];

export const AppointmentFormDialog: React.FC<Props> = ({
  companyId,
  appointment,
  defaultDate,
  defaultScheduledAt,
  defaultProfessional,
  onSave,
  onClose,
}) => {
  const isEditing = !!appointment;

  const [services,      setServices]      = useState<CompanyService[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [clients,       setClients]       = useState<ClientBasic[]>([]);
  const [slots,         setSlots]         = useState<AvailableSlot[]>([]);
  const [loadingSlots,  setLoadingSlots]  = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  // Form fields
  const [serviceId,      setServiceId]      = useState(appointment?.service_id || '');
  const [professionalId, setProfessionalId] = useState(appointment?.assigned_to || defaultProfessional || '');
  const [clientId,       setClientId]       = useState(appointment?.client_id || '');
  const [date,           setDate]           = useState(defaultDate || new Date().toISOString().slice(0, 10));
  const [selectedSlot,   setSelectedSlot]   = useState('');
  const [status,         setStatus]         = useState(appointment?.status || 'scheduled');
  const [notes,          setNotes]          = useState(appointment?.notes || '');
  const [clientSearch,   setClientSearch]   = useState(appointment?.client_name || '');
  const [showClientList, setShowClientList] = useState(false);

  // Campos de data/hora para edição
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');

  // Se editando, inicializar data/hora a partir de scheduled_at (hora local)
  useEffect(() => {
    if (appointment?.scheduled_at) {
      const dt = new Date(appointment.scheduled_at);
      const localDate = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      const localTime = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
      setEditDate(localDate);
      setEditTime(localTime);
      setSelectedSlot(appointment.scheduled_at);
      setDate(localDate);
    }
  }, [appointment]);

  useEffect(() => {
    Promise.all([
      appointmentsService.getServices(companyId),
      appointmentsService.getProfessionals(companyId),
    ]).then(([s, p]) => {
      setServices(s);
      setProfessionals(p);
    }).catch(console.error);
  }, [companyId]);

  // Buscar slots quando data ou serviço mudar (profissional opcional — fallback horários da empresa)
  useEffect(() => {
    if (!serviceId || !date || isEditing) return;
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot('');
    appointmentsService.getAvailableSlots({
      companyId, professionalId, serviceId, date
    }).then(s => setSlots(s)).catch(console.error).finally(() => setLoadingSlots(false));
  }, [serviceId, professionalId, date, companyId, isEditing]);

  // Pré-selecionar horário vindo da grade semanal (após slots carregarem)
  useEffect(() => {
    if (isEditing || !defaultScheduledAt || slots.length === 0) return;
    const pref = new Date(defaultScheduledAt);
    const dateStr = `${pref.getFullYear()}-${String(pref.getMonth() + 1).padStart(2, '0')}-${String(pref.getDate()).padStart(2, '0')}`;
    if (date !== dateStr) return;

    const target = pref.getTime();
    const tolerance = 60 * 1000;
    const exact = slots.find(s => Math.abs(new Date(s.start).getTime() - target) <= tolerance);
    if (exact) {
      setSelectedSlot(exact.start);
      return;
    }
    const future = slots.filter(s => new Date(s.start).getTime() >= target - tolerance);
    if (future.length) setSelectedSlot(future[0].start);
  }, [slots, defaultScheduledAt, isEditing, date]);

  // Autocomplete de clientes
  useEffect(() => {
    if (!clientSearch.trim() || clientId) return;
    const timer = setTimeout(() => {
      appointmentsService.searchClients(companyId, clientSearch)
        .then(setClients).catch(console.error);
    }, 300);
    return () => clearTimeout(timer);
  }, [clientSearch, companyId, clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId) { setError('Selecione um serviço'); return; }
    if (!isEditing && !selectedSlot) { setError('Selecione um horário'); return; }

    setSaving(true);
    setError(null);

    try {
      if (isEditing && appointment) {
        // Reconstrói scheduledAt a partir de editDate + editTime (hora local)
        let scheduledAt: string | undefined;
        if (editDate && editTime) {
          const [yr, mo, dy] = editDate.split('-').map(Number);
          const [hr, mn]     = editTime.split(':').map(Number);
          scheduledAt = new Date(yr, mo - 1, dy, hr, mn, 0, 0).toISOString();
        }
        await appointmentsService.updateAppointment({
          id:          appointment.id,
          companyId,
          serviceId:   serviceId    || undefined,
          scheduledAt: scheduledAt  || undefined,
          assignedTo:  professionalId || undefined,
          clientId:    clientId     || undefined,
          status:      status       || undefined,
          notes:       notes        || undefined,
        });
        // Sync Google Calendar
        if (status === 'cancelled') {
          await appointmentsService.syncCancelledAppointment(appointment.id);
        } else {
          await appointmentsService.syncUpdatedAppointment(appointment.id);
        }
        onSave(appointment.id, false);
      } else {
        const id = await appointmentsService.createAppointment({
          companyId,
          serviceId,
          scheduledAt: selectedSlot,
          assignedTo:  professionalId || undefined,
          clientId:    clientId       || undefined,
          notes:       notes          || undefined,
        });
        onSave(id, true);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar agendamento');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full h-10 bg-slate-900 border border-slate-700 rounded-xl px-3 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all';
  const labelCls = 'block text-xs font-bold text-slate-400 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-white">
              {isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}
            </h2>
            {isEditing && appointment ? (
              <p className="mt-1">
                <EntityShortId kind="appointment" id={appointment.id} className="text-slate-500" />
              </p>
            ) : null}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">{error}</div>
          )}

          {/* Serviço */}
          <div>
            <label className={labelCls}>Serviço *</label>
            <select value={serviceId} onChange={e => setServiceId(e.target.value)} className={inputCls} required>
              <option value="">Selecione um serviço</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes}min)</option>
              ))}
            </select>
          </div>

          {/* Profissional */}
          <div>
            <label className={labelCls}>Profissional</label>
            <select value={professionalId} onChange={e => setProfessionalId(e.target.value)} className={inputCls}>
              <option value="">Sem profissional atribuído</option>
              {professionals.map(p => (
                <option key={p.user_id} value={p.user_id}>{p.full_name}</option>
              ))}
            </select>
          </div>

          {/* Data */}
          {!isEditing && (
            <div>
              <label className={labelCls}>Data *</label>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={e => setDate(e.target.value)}
                className={inputCls}
                required
              />
            </div>
          )}

          {/* Slots de horário */}
          {!isEditing && (
            <div>
              <label className={labelCls}>Horário *</label>
              {loadingSlots ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm h-10">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                  Buscando horários disponíveis...
                </div>
              ) : slots.length === 0 ? (
                <p className="text-slate-500 text-sm h-10 flex items-center">
                  {serviceId && date
                    ? 'Nenhum horário disponível nesta data.'
                    : 'Selecione serviço e data para ver os horários.'}
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto">
                  {slots.map(slot => (
                    <button
                      key={slot.start}
                      type="button"
                      onClick={() => setSelectedSlot(slot.start)}
                      className={`h-9 rounded-lg text-sm font-bold transition-all ${
                        selectedSlot === slot.start
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Cliente */}
          <div className="relative">
            <label className={labelCls}>Cliente</label>
            <input
              type="text"
              value={clientSearch}
              onChange={e => { setClientSearch(e.target.value); setClientId(''); setShowClientList(true); }}
              onFocus={() => setShowClientList(true)}
              onBlur={() => setTimeout(() => setShowClientList(false), 200)}
              placeholder="Buscar cliente..."
              className={inputCls}
            />
            {showClientList && clients.length > 0 && !clientId && (
              <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                {clients.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                    onClick={() => {
                      setClientId(c.id);
                      setClientSearch(c.name);
                      setShowClientList(false);
                    }}
                  >
                    <span className="font-bold">{c.name}</span>
                    {c.phone && <span className="text-slate-400 ml-2">{c.phone}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Data e hora de início (só ao editar) */}
          {isEditing && (
            <div>
              <label className={labelCls}>Data e horário de início</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                  className={`${inputCls} flex-1`}
                />
                <input
                  type="time"
                  value={editTime}
                  onChange={e => setEditTime(e.target.value)}
                  className={`${inputCls} w-32`}
                />
              </div>
              {(() => {
                const svc = services.find(s => s.id === serviceId);
                return svc ? (
                  <p className="mt-1 text-[11px] text-slate-500">
                    Término calculado automaticamente — duração do serviço: {svc.duration_minutes} min
                  </p>
                ) : null;
              })()}
            </div>
          )}

          {/* Status (só ao editar) */}
          {isEditing && (
            <div>
              <label className={labelCls}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as any)} className={inputCls}>
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Confirmação do Cliente */}
          {isEditing && appointment && (
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
              <h3 className="text-sm font-bold text-slate-200 mb-2">Confirmação do cliente via IA</h3>
              <div className="text-sm text-slate-300 mb-3">
                Status: <strong className="text-white">
                  {appointment.confirmation_status === 'confirmed' ? '✅ Confirmado' : 
                   appointment.confirmation_status === 'declined' ? '❌ Cancelado' : 
                   appointment.confirmation_status === 'requested' ? '📨 Aguardando' : 
                   appointment.confirmation_status === 'no_response' ? '❔ Sem Resposta' : 
                   'Não solicitado'}
                </strong>
                {appointment.confirmation_responded_at && <span className="ml-1 text-xs text-slate-400">em {new Date(appointment.confirmation_responded_at).toLocaleString('pt-BR')}</span>}
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => {
                  alert("Funcionalidade 'Reenviar lembrete' será implementada no workflow."); 
                }} className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30 rounded-lg transition-colors">
                  Reenviar lembrete
                </button>
                <button type="button" onClick={() => {
                   setStatus('confirmed');
                }} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-600 rounded-lg transition-colors">
                  Marcar como confirmado manual
                </button>
              </div>
            </div>
          )}

          {/* Observações */}
          <div>
            <label className={labelCls}>Observações</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Observações sobre o atendimento..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 h-10 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 h-10 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 text-sm">
              {saving ? 'Salvando...' : isEditing ? 'Salvar' : 'Agendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
