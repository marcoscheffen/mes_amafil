import React, { useState, useEffect, useMemo } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { followupService } from '../../services/followupService';
import { TemplatePreviewModal } from './TemplatePreviewModal';
import type { FollowupSettings } from '../../types';

interface Props {
  canManage: boolean;
}

const DEFAULT_TEMPLATE =
  'Olá {cliente}! Lembrando do seu compromisso de {servico} em {data} às {hora} com {profissional}. Você confirma sua presença? Responda SIM para confirmar ou NÃO para cancelar.';

const PLACEHOLDERS = [
  '{cliente}',
  '{servico}',
  '{data}',
  '{hora}',
  '{profissional}',
  '{empresa}',
  '{duracao}',
  '{horas_antes}',
];

const TIMEZONES: { value: string; label: string }[] = [
  { value: 'America/Sao_Paulo', label: 'Brasília (BRT, UTC-3)' },
  { value: 'America/Bahia', label: 'Salvador (BRT, UTC-3)' },
  { value: 'America/Fortaleza', label: 'Fortaleza (BRT, UTC-3)' },
  { value: 'America/Recife', label: 'Recife (BRT, UTC-3)' },
  { value: 'America/Belem', label: 'Belém (BRT, UTC-3)' },
  { value: 'America/Manaus', label: 'Manaus (AMT, UTC-4)' },
  { value: 'America/Cuiaba', label: 'Cuiabá (AMT, UTC-4)' },
  { value: 'America/Campo_Grande', label: 'Campo Grande (AMT, UTC-4)' },
  { value: 'America/Porto_Velho', label: 'Porto Velho (AMT, UTC-4)' },
  { value: 'America/Boa_Vista', label: 'Boa Vista (AMT, UTC-4)' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (ACT, UTC-5)' },
  { value: 'America/Noronha', label: 'Fernando de Noronha (UTC-2)' },
  { value: 'UTC', label: 'UTC' },
];

export const FollowupSettingsTab: React.FC<Props> = ({ canManage }) => {
  const { currentCompany } = useCompany();
  const [settings, setSettings] = useState<FollowupSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!currentCompany) return;
    setLoading(true);
    followupService.getSettings(currentCompany.id)
      .then(setSettings)
      .catch(err => {
        if (err.message?.includes('not found') || err.code === 'PGRST116') {
          setSettings({
            id: '', company_id: currentCompany.id,
            enabled: false, advance_hours_list: [24, 2],
            timezone: 'America/Sao_Paulo', template_message: DEFAULT_TEMPLATE,
            auto_confirm_on_reply: true, cancel_appointment_on_decline: true,
            send_only_business_hours: true, max_retry_attempts: 3,
            response_match_tolerance_seconds: 60,
            created_at: '', updated_at: ''
          });
        } else {
          setError('Erro ao carregar configurações de followup');
        }
      })
      .finally(() => setLoading(false));
  }, [currentCompany]);

  const validationError = useMemo<string | null>(() => {
    if (!settings) return null;
    const tpl = settings.template_message?.trim() || '';
    if (tpl.length === 0) return 'A mensagem do lembrete não pode ficar vazia.';
    if (!tpl.includes('{cliente}')) return 'A mensagem deve conter o placeholder {cliente}.';
    if (!tpl.includes('{data}') && !tpl.includes('{hora}')) return 'A mensagem deve conter {data} e/ou {hora}.';
    if (settings.advance_hours_list.length === 0) return 'Defina pelo menos uma antecedência (em horas).';
    if (settings.advance_hours_list.some(h => h < 1 || h > 168)) return 'Cada antecedência deve estar entre 1 e 168 horas.';
    return null;
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany || !settings) return;
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await followupService.upsertSettings({
        companyId: currentCompany.id,
        enabled: settings.enabled,
        advanceHoursList: settings.advance_hours_list,
        timezone: settings.timezone,
        templateMessage: settings.template_message.trim(),
        autoConfirmOnReply: settings.auto_confirm_on_reply,
        cancelAppointmentOnDecline: settings.cancel_appointment_on_decline,
        sendOnlyBusinessHours: settings.send_only_business_hours,
        maxRetryAttempts: settings.max_retry_attempts,
        responseMatchToleranceSeconds: settings.response_match_tolerance_seconds
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const insertPlaceholder = (ph: string) => {
    if (!settings || !canManage) return;
    setSettings({ ...settings, template_message: (settings.template_message || '') + ph });
  };

  const restoreDefault = () => {
    if (!settings || !canManage) return;
    setSettings({ ...settings, template_message: DEFAULT_TEMPLATE });
  };

  if (loading) return <div className="text-slate-400 p-4">Carregando...</div>;
  if (!settings) return null;

  return (
    <>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white">Confirmação de Agendamentos (Follow-up)</h3>
          <p className="text-slate-500 text-xs mt-1">Configuração de envio automático de lembretes via WhatsApp utilizando o Agente IA.</p>
        </div>

        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}

        <form onSubmit={handleSave} className="space-y-5">

          <label className="flex items-center gap-2 cursor-pointer bg-slate-900 border border-slate-700 p-4 rounded-xl">
            <input type="checkbox" disabled={!canManage} checked={settings.enabled} onChange={e => setSettings({ ...settings, enabled: e.target.checked })} className="size-4 rounded border-slate-600 text-blue-600 bg-slate-800" />
            <div>
              <span className="text-sm font-bold text-slate-200 block">Ativar Lembretes e Solicitação de Confirmação</span>
              <span className="text-xs text-slate-400 block">O agente enviará os lembretes nos horários configurados.</span>
            </div>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">Antecedências (horas)</label>
              <input type="text" disabled={!canManage} value={settings.advance_hours_list.join(', ')} onChange={e => {
                const arr = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                setSettings({ ...settings, advance_hours_list: arr });
              }} className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white text-sm" placeholder="24, 2" />
              <p className="text-[10px] text-slate-500 mt-1">Separado por vírgula. Ex.: <code>24, 2</code> envia 24h e 2h antes. Cada valor entre 1 e 168.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">Fuso horário</label>
              <select disabled={!canManage} value={settings.timezone} onChange={e => setSettings({ ...settings, timezone: e.target.value })} className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-3 text-white text-sm">
                {TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">Usado para formatar {'{data}'} e {'{hora}'} e para o filtro de horário comercial.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">Tolerância de match da resposta (s)</label>
              <input type="number" min={10} max={600} disabled={!canManage} value={settings.response_match_tolerance_seconds} onChange={e => setSettings({ ...settings, response_match_tolerance_seconds: parseInt(e.target.value) || 60 })} className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white text-sm" />
              <p className="text-[10px] text-slate-500 mt-1">Janela (10–600s) para considerar que a última mensagem do bot foi o lembrete enviado.</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-400">Mensagem do lembrete</label>
              {canManage && (
                <button type="button" onClick={restoreDefault} className="text-[10px] text-blue-400 hover:text-blue-300 underline">
                  Restaurar padrão
                </button>
              )}
            </div>
            <textarea
              disabled={!canManage}
              value={settings.template_message || ''}
              onChange={e => setSettings({ ...settings, template_message: e.target.value })}
              rows={4}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-mono resize-y"
              placeholder={DEFAULT_TEMPLATE}
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-[10px] text-slate-500 mr-1 self-center">Inserir:</span>
              {PLACEHOLDERS.map(ph => (
                <button
                  key={ph}
                  type="button"
                  disabled={!canManage}
                  onClick={() => insertPlaceholder(ph)}
                  className="px-2 py-0.5 bg-slate-900 border border-slate-700 hover:border-blue-500 rounded text-[10px] font-mono text-slate-300 hover:text-blue-300 disabled:opacity-50"
                >
                  {ph}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              <code>{'{horas_antes}'}</code> é substituído pela antecedência do lembrete sendo enviado (útil para diferenciar 24h vs 2h).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" disabled={!canManage} checked={settings.send_only_business_hours} onChange={e => setSettings({ ...settings, send_only_business_hours: e.target.checked })} className="rounded border-slate-600 text-blue-600" />
              <span className="text-sm text-slate-300">Enviar apenas em horário comercial</span>
            </label>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">Tentativas em caso de erro</label>
              <input type="number" min={0} max={10} disabled={!canManage} value={settings.max_retry_attempts} onChange={e => setSettings({ ...settings, max_retry_attempts: parseInt(e.target.value) || 0 })} className="w-full h-10 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white text-sm" />
              <p className="text-[10px] text-slate-500 mt-1">Número máximo de re-envios após falha do uazapi (0–10). Backoff: 5min, 30min, 2h.</p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" disabled={!canManage} checked={settings.auto_confirm_on_reply} onChange={e => setSettings({ ...settings, auto_confirm_on_reply: e.target.checked })} className="rounded border-slate-600 text-blue-600" />
              <span className="text-sm text-slate-300">Marcar como confirmado automaticamente quando o cliente responder "sim"</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" disabled={!canManage} checked={settings.cancel_appointment_on_decline} onChange={e => setSettings({ ...settings, cancel_appointment_on_decline: e.target.checked })} className="rounded border-slate-600 text-blue-600" />
              <span className="text-sm text-slate-300">Cancelar agendamento se o cliente recusar</span>
            </label>
          </div>

          {validationError && !error && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs">
              {validationError}
            </div>
          )}

          <div className="pt-4 flex items-center justify-between border-t border-slate-700 gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setPreviewOpen(true)} className="h-10 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-xl text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-base">visibility</span>
                Pré-visualizar
              </button>
              <div className={`flex items-center gap-2 text-emerald-400 font-bold text-sm transition-opacity ${saved ? 'opacity-100' : 'opacity-0'}`}>
                <span className="material-symbols-outlined">check_circle</span> Salvo!
              </div>
            </div>
            {canManage && (
              <button type="submit" disabled={saving || !!validationError} className="h-10 px-6 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 text-sm">
                {saving ? 'Salvando...' : 'Salvar configurações'}
              </button>
            )}
          </div>
        </form>
      </div>

      {previewOpen && currentCompany && (
        <TemplatePreviewModal
          companyId={currentCompany.id}
          template={settings.template_message || DEFAULT_TEMPLATE}
          timezone={settings.timezone}
          advanceHoursList={settings.advance_hours_list}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
};
