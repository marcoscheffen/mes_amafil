import React, { useState, useEffect, useCallback } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../hooks/useAuth';
import { useGlobalAdmin } from '../hooks/useGlobalAdmin';
import * as companyUsersService from '../services/companyUsersService';
import * as appointmentsService from '../services/appointmentsService';
import type { CompanyService, Professional } from '../services/appointmentsService';
import * as agendaService from '../services/agendaService';
import type { BusinessHour } from '../services/agendaService';
import { DAY_NAMES } from '../services/agendaService';
import { FollowupSettingsTab } from '../components/Agenda/FollowupSettingsTab';

const inputCls =
  'w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all';
const labelCls = 'block text-xs font-bold text-slate-400 mb-1.5';

type TabId = 'services' | 'hours' | 'professional-hours' | 'followup';

export const AgendaSettingsPage: React.FC = () => {
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const { isGlobalAdmin } = useGlobalAdmin(user ?? null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('services');

  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingHours, setLoadingHours] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<CompanyService[]>([]);

  const [companyHours, setCompanyHours] = useState<BusinessHour[]>([]);
  const [hoursError, setHoursError] = useState<string | null>(null);
  const [savingHours, setSavingHours] = useState(false);
  const [hoursSaved, setHoursSaved] = useState(false);

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfId, setSelectedProfId] = useState('');
  const [profHours, setProfHours] = useState<BusinessHour[]>([]);
  const [loadingProfessionals, setLoadingProfessionals] = useState(true);
  const [loadingProfHours, setLoadingProfHours] = useState(false);
  const [savingProfHours, setSavingProfHours] = useState(false);
  const [profHoursError, setProfHoursError] = useState<string | null>(null);
  const [profHoursSaved, setProfHoursSaved] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyService | null>(null);
  const [formName, setFormName] = useState('');
  const [formDuration, setFormDuration] = useState(60);
  const [formColor, setFormColor] = useState('#3B82F6');
  const [formPrice, setFormPrice] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canManage = isAdmin || isGlobalAdmin;

  useEffect(() => {
    if (!currentCompany || !user) {
      setIsAdmin(false);
      setRoleLoading(false);
      return;
    }
    setRoleLoading(true);
    companyUsersService
      .getCompanyUsers(currentCompany.id)
      .then(users => {
        const me = users.find(u => u.user_id === user.id);
        setIsAdmin(me?.role === 'admin');
      })
      .catch(() => setIsAdmin(false))
      .finally(() => setRoleLoading(false));
  }, [currentCompany, user]);

  const loadServices = useCallback(async () => {
    if (!currentCompany || roleLoading) return;
    try {
      setLoadingServices(true);
      setError(null);
      const includeInactive = isAdmin || isGlobalAdmin;
      const list = await appointmentsService.getServices(currentCompany.id, { includeInactive });
      setServices(list);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar serviços');
    } finally {
      setLoadingServices(false);
    }
  }, [currentCompany, roleLoading, isAdmin, isGlobalAdmin]);

  const loadCompanyHours = useCallback(async () => {
    if (!currentCompany || roleLoading) return;
    try {
      setLoadingHours(true);
      setHoursError(null);
      const h = await agendaService.getCompanyBusinessHours(currentCompany.id);
      setCompanyHours(h);
    } catch (err: any) {
      setHoursError(err.message || 'Erro ao carregar horários da empresa');
    } finally {
      setLoadingHours(false);
    }
  }, [currentCompany, roleLoading]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    loadCompanyHours();
  }, [loadCompanyHours]);

  useEffect(() => {
    if (!currentCompany || roleLoading) return;
    setLoadingProfessionals(true);
    appointmentsService
      .getProfessionals(currentCompany.id)
      .then(list => {
        setProfessionals(list);
        if (list.length > 0) {
          setSelectedProfId(prev => prev || list[0].user_id);
        } else {
          setSelectedProfId('');
        }
      })
      .catch(err => setProfHoursError(err.message || 'Erro ao carregar profissionais'))
      .finally(() => setLoadingProfessionals(false));
  }, [currentCompany, roleLoading]);

  useEffect(() => {
    if (!currentCompany || !selectedProfId) {
      setProfHours([]);
      return;
    }
    setLoadingProfHours(true);
    setProfHoursError(null);
    agendaService
      .getProfessionalBusinessHours(currentCompany.id, selectedProfId)
      .then(setProfHours)
      .catch(err => setProfHoursError(err.message || 'Erro ao carregar horários do profissional'))
      .finally(() => setLoadingProfHours(false));
  }, [currentCompany, selectedProfId]);

  const updateProfHour = (day: number, field: keyof BusinessHour, value: boolean | string | null) => {
    setProfHours(prev =>
      prev.map(row => (row.day_of_week === day ? { ...row, [field]: value } : row))
    );
    setProfHoursSaved(false);
  };

  const handleSaveProfHours = async () => {
    if (!currentCompany || !selectedProfId) return;
    setSavingProfHours(true);
    setProfHoursError(null);
    try {
      await agendaService.saveProfessionalBusinessHours(currentCompany.id, selectedProfId, profHours);
      setProfHoursSaved(true);
      setTimeout(() => setProfHoursSaved(false), 2500);
    } catch (err: any) {
      setProfHoursError(err.message || 'Erro ao salvar horários do profissional');
    } finally {
      setSavingProfHours(false);
    }
  };

  const updateHour = (day: number, field: keyof BusinessHour, value: boolean | string | null) => {
    setCompanyHours(prev =>
      prev.map(row =>
        row.day_of_week === day ? { ...row, [field]: value } : row
      )
    );
    setHoursSaved(false);
  };

  const handleSaveHours = async () => {
    if (!currentCompany) return;
    setSavingHours(true);
    setHoursError(null);
    try {
      await agendaService.saveCompanyBusinessHours(currentCompany.id, companyHours);
      setHoursSaved(true);
      setTimeout(() => setHoursSaved(false), 2500);
      await loadCompanyHours();
    } catch (err: any) {
      setHoursError(err.message || 'Erro ao salvar horários');
    } finally {
      setSavingHours(false);
    }
  };

  const openNew = () => {
    setEditing(null);
    setFormName('');
    setFormDuration(60);
    setFormColor('#3B82F6');
    setFormPrice('');
    setFormActive(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (s: CompanyService) => {
    setEditing(s);
    setFormName(s.name);
    setFormDuration(s.duration_minutes);
    setFormColor(s.color || '#3B82F6');
    setFormPrice(s.price != null ? String(s.price) : '');
    setFormActive(s.is_active);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany) return;
    const name = formName.trim();
    if (!name) {
      setFormError('Informe o nome do serviço');
      return;
    }
    if (formDuration < 1) {
      setFormError('Duração deve ser pelo menos 1 minuto');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const priceNum = formPrice.trim() === '' ? null : parseFloat(formPrice.replace(',', '.'));
      if (formPrice.trim() !== '' && (priceNum === null || Number.isNaN(priceNum))) {
        setFormError('Preço inválido');
        setSaving(false);
        return;
      }
      await appointmentsService.upsertService({
        companyId: currentCompany.id,
        id:        editing?.id,
        name,
        duration:  formDuration,
        color:     formColor,
        price:     priceNum,
        isActive:  editing ? formActive : true,
      });
      setModalOpen(false);
      await loadServices();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (s: CompanyService) => {
    if (!currentCompany) return;
    if (!confirm(`Desativar o serviço "${s.name}"? Agendamentos existentes mantêm a referência.`)) return;
    try {
      await appointmentsService.upsertService({
        companyId: currentCompany.id,
        id: s.id,
        name: s.name,
        duration: s.duration_minutes,
        color: s.color,
        price: s.price ?? null,
        isActive: false,
      });
      await loadServices();
    } catch (err: any) {
      setError(err.message || 'Erro ao desativar');
    }
  };

  if (!currentCompany) return null;

  const tabBtn = (id: TabId, label: string) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`h-10 px-4 rounded-xl text-sm font-bold transition-all ${
        activeTab === id
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Ajustes da Agenda</h2>
        <p className="text-slate-400 text-sm mt-1">
          Serviços, horários da empresa e horários por profissional definem o que aparece em{' '}
          <span className="text-slate-300">Novo Agendamento</span> (duração dos slots e janelas do dia). Integração Google fica em{' '}
          <span className="text-slate-300">Configurações</span>.
        </p>
      </div>

      {error && activeTab === 'services' && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
      )}

      <div className="flex flex-wrap gap-2">
        {tabBtn('services', 'Serviços')}
        {tabBtn('hours', 'Horários da empresa')}
        {tabBtn('professional-hours', 'Horários do profissional')}
        {tabBtn('followup', 'Follow-up de Agendamentos')}
      </div>

      {activeTab === 'services' && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Serviços</h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Cada serviço define nome, duração e cor usados em novos agendamentos.
              </p>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={openNew}
                className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Novo serviço
              </button>
            )}
          </div>

          {!canManage && (
            <p className="text-amber-400/90 text-sm mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
              Apenas administradores da empresa podem criar ou editar serviços. Você pode visualizar o catálogo ativo abaixo.
            </p>
          )}

          {loadingServices || roleLoading ? (
            <div className="flex justify-center py-16">
              <div className="size-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-14 text-slate-500 border border-dashed border-slate-700 rounded-xl">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">design_services</span>
              <p className="text-sm">Nenhum serviço cadastrado.</p>
              {canManage && (
                <button
                  type="button"
                  onClick={openNew}
                  className="mt-4 text-blue-400 font-bold text-sm hover:text-blue-300"
                >
                  Cadastrar o primeiro serviço
                </button>
              )}
            </div>
          ) : (
            <ul className="space-y-2">
              {services.map(s => (
                <li
                  key={s.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-slate-600 transition-all"
                >
                  <div
                    className="w-3 h-12 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: s.color || '#3B82F6' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{s.name}</p>
                    <p className="text-xs text-slate-400">
                      {s.duration_minutes} min
                      {s.price != null && ` · R$ ${Number(s.price).toFixed(2)}`}
                      {!s.is_active && (
                        <span className="ml-2 text-red-400 font-bold">Inativo</span>
                      )}
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(s)}
                        className="h-9 px-3 rounded-xl border border-slate-600 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-all"
                      >
                        Editar
                      </button>
                      {s.is_active && (
                        <button
                          type="button"
                          onClick={() => handleDeactivate(s)}
                          className="h-9 px-3 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-all"
                        >
                          Desativar
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === 'hours' && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">Horários da empresa</h3>
            <p className="text-slate-500 text-xs mt-0.5">
              Janela padrão de atendimento por dia. Os horários disponíveis em &quot;Novo agendamento&quot; usam primeiro a agenda do
              profissional (em Configurações); se não houver, estes horários da empresa. Dia fechado = nenhum horário livre naquele dia.
            </p>
          </div>

          {!canManage && (
            <p className="text-amber-400/90 text-sm mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
              Apenas administradores podem alterar os horários base da empresa.
            </p>
          )}

          {hoursError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{hoursError}</div>
          )}

          {loadingHours || roleLoading ? (
            <div className="flex justify-center py-16">
              <div className="size-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {companyHours.map(h => (
                <div key={h.day_of_week} className="flex items-center gap-3 py-2 border-b border-slate-700/50">
                  <div className="w-28 flex items-center gap-2">
                    {canManage ? (
                      <button
                        type="button"
                        onClick={() => updateHour(h.day_of_week, 'is_open', !h.is_open)}
                        className={`w-8 h-5 rounded-full transition-all relative flex-shrink-0 ${h.is_open ? 'bg-violet-600' : 'bg-slate-700'}`}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${h.is_open ? 'left-3.5' : 'left-0.5'}`}
                        />
                      </button>
                    ) : (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                          h.is_open ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-500'
                        }`}
                      >
                        {h.is_open ? 'Aberto' : 'Fechado'}
                      </span>
                    )}
                    <span className={`text-xs font-bold w-10 ${h.is_open ? 'text-slate-200' : 'text-slate-500'}`}>
                      {DAY_NAMES[h.day_of_week].slice(0, 3)}
                    </span>
                  </div>

                  {h.is_open ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="time"
                        value={h.start_time}
                        disabled={!canManage}
                        onChange={e => updateHour(h.day_of_week, 'start_time', e.target.value)}
                        className="h-8 bg-slate-900 border border-slate-700 rounded-lg px-2 text-white text-xs focus:ring-1 focus:ring-violet-500 outline-none disabled:opacity-60"
                      />
                      <span className="text-slate-500 text-xs">→</span>
                      <input
                        type="time"
                        value={h.end_time}
                        disabled={!canManage}
                        onChange={e => updateHour(h.day_of_week, 'end_time', e.target.value)}
                        className="h-8 bg-slate-900 border border-slate-700 rounded-lg px-2 text-white text-xs focus:ring-1 focus:ring-violet-500 outline-none disabled:opacity-60"
                      />
                      <span className="text-slate-500 text-xs ml-2">Intervalo:</span>
                      <input
                        type="time"
                        value={h.break_start || ''}
                        disabled={!canManage}
                        onChange={e => updateHour(h.day_of_week, 'break_start', e.target.value || null)}
                        className="h-8 bg-slate-900 border border-slate-700 rounded-lg px-2 text-white text-xs focus:ring-1 focus:ring-violet-500 outline-none disabled:opacity-60"
                      />
                      <span className="text-slate-500 text-xs">→</span>
                      <input
                        type="time"
                        value={h.break_end || ''}
                        disabled={!canManage}
                        onChange={e => updateHour(h.day_of_week, 'break_end', e.target.value || null)}
                        className="h-8 bg-slate-900 border border-slate-700 rounded-lg px-2 text-white text-xs focus:ring-1 focus:ring-violet-500 outline-none disabled:opacity-60"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-slate-600 italic">Fechado</span>
                  )}
                </div>
              ))}

              {canManage && (
                <div className="flex items-center justify-between pt-4">
                  <div
                    className={`flex items-center gap-2 text-emerald-400 font-bold text-sm transition-opacity duration-500 ${
                      hoursSaved ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Horários salvos!
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveHours}
                    disabled={savingHours}
                    className="h-10 px-6 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 text-sm"
                  >
                    {savingHours ? 'Salvando...' : 'Salvar horários'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'professional-hours' && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">Horários por profissional</h3>
            <p className="text-slate-500 text-xs mt-0.5">
              Configure os dias e horários de atendimento de cada profissional. Quando definidos, eles têm prioridade sobre os horários
              da empresa em &quot;Novo agendamento&quot;.
            </p>
          </div>

          {!canManage && (
            <p className="text-amber-400/90 text-sm mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
              Apenas administradores podem alterar os horários por profissional.
            </p>
          )}

          {profHoursError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{profHoursError}</div>
          )}

          {loadingProfessionals || roleLoading ? (
            <div className="flex justify-center py-16">
              <div className="size-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : professionals.length === 0 ? (
            <div className="text-center py-14 text-slate-500 border border-dashed border-slate-700 rounded-xl">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">person_off</span>
              <p className="text-sm">Nenhum profissional encontrado nesta empresa.</p>
              <p className="text-xs text-slate-600 mt-1">Cadastre profissionais em Usuários para configurar horários individuais.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={selectedProfId}
                  onChange={e => setSelectedProfId(e.target.value)}
                  className="h-10 bg-slate-900 border border-slate-700 rounded-xl px-3 text-white text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                >
                  {professionals.map(p => (
                    <option key={p.user_id} value={p.user_id}>
                      {p.full_name || p.email || p.user_id}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-500">Selecione o profissional para editar os horários.</span>
              </div>

              {loadingProfHours ? (
                <div className="flex justify-center py-12">
                  <div className="size-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {profHours.map(h => (
                    <div key={h.day_of_week} className="flex items-center gap-3 py-2 border-b border-slate-700/50">
                      <div className="w-28 flex items-center gap-2">
                        {canManage ? (
                          <button
                            type="button"
                            onClick={() => updateProfHour(h.day_of_week, 'is_open', !h.is_open)}
                            className={`w-8 h-5 rounded-full transition-all relative flex-shrink-0 ${h.is_open ? 'bg-violet-600' : 'bg-slate-700'}`}
                          >
                            <span
                              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${h.is_open ? 'left-3.5' : 'left-0.5'}`}
                            />
                          </button>
                        ) : (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                              h.is_open ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-500'
                            }`}
                          >
                            {h.is_open ? 'Aberto' : 'Fechado'}
                          </span>
                        )}
                        <span className={`text-xs font-bold w-10 ${h.is_open ? 'text-slate-200' : 'text-slate-500'}`}>
                          {DAY_NAMES[h.day_of_week].slice(0, 3)}
                        </span>
                      </div>

                      {h.is_open ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            type="time"
                            value={h.start_time}
                            disabled={!canManage}
                            onChange={e => updateProfHour(h.day_of_week, 'start_time', e.target.value)}
                            className="h-8 bg-slate-900 border border-slate-700 rounded-lg px-2 text-white text-xs focus:ring-1 focus:ring-violet-500 outline-none disabled:opacity-60"
                          />
                          <span className="text-slate-500 text-xs">→</span>
                          <input
                            type="time"
                            value={h.end_time}
                            disabled={!canManage}
                            onChange={e => updateProfHour(h.day_of_week, 'end_time', e.target.value)}
                            className="h-8 bg-slate-900 border border-slate-700 rounded-lg px-2 text-white text-xs focus:ring-1 focus:ring-violet-500 outline-none disabled:opacity-60"
                          />
                          <span className="text-slate-500 text-xs ml-2">Intervalo:</span>
                          <input
                            type="time"
                            value={h.break_start || ''}
                            disabled={!canManage}
                            onChange={e => updateProfHour(h.day_of_week, 'break_start', e.target.value || null)}
                            className="h-8 bg-slate-900 border border-slate-700 rounded-lg px-2 text-white text-xs focus:ring-1 focus:ring-violet-500 outline-none disabled:opacity-60"
                          />
                          <span className="text-slate-500 text-xs">→</span>
                          <input
                            type="time"
                            value={h.break_end || ''}
                            disabled={!canManage}
                            onChange={e => updateProfHour(h.day_of_week, 'break_end', e.target.value || null)}
                            className="h-8 bg-slate-900 border border-slate-700 rounded-lg px-2 text-white text-xs focus:ring-1 focus:ring-violet-500 outline-none disabled:opacity-60"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600 italic">Fechado</span>
                      )}
                    </div>
                  ))}

                  {canManage && (
                    <div className="flex items-center justify-between pt-4">
                      <div
                        className={`flex items-center gap-2 text-emerald-400 font-bold text-sm transition-opacity duration-500 ${
                          profHoursSaved ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Horários salvos!
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveProfHours}
                        disabled={savingProfHours}
                        className="h-10 px-6 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 text-sm"
                      >
                        {savingProfHours ? 'Salvando...' : 'Salvar horários'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'followup' && (
         <FollowupSettingsTab canManage={canManage} />
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white">{editing ? 'Editar serviço' : 'Novo serviço'}</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{formError}</div>
              )}
              <div>
                <label className={labelCls}>Nome *</label>
                <input
                  className={inputCls}
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Ex.: Consulta inicial"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Duração (min) *</label>
                  <input
                    type="number"
                    min={1}
                    className={inputCls}
                    value={formDuration}
                    onChange={e => setFormDuration(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Cor</label>
                  <input
                    type="color"
                    className="w-full h-11 rounded-xl border border-slate-700 bg-slate-900 cursor-pointer"
                    value={formColor}
                    onChange={e => setFormColor(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Preço (opcional)</label>
                <input
                  className={inputCls}
                  value={formPrice}
                  onChange={e => setFormPrice(e.target.value)}
                  placeholder="0,00"
                  inputMode="decimal"
                />
              </div>
              {editing && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={e => setFormActive(e.target.checked)}
                    className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-300">Serviço ativo (aparece em novos agendamentos)</span>
                </label>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 h-11 rounded-xl border border-slate-700 text-slate-400 font-bold text-sm hover:bg-slate-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
