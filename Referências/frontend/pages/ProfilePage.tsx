import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCompany } from '../contexts/CompanyContext';
import * as userProfileService from '../services/userProfileService';
import * as settingsService from '../services/settingsService';

const maskPhone = (v: string): string => {
  const d = v.replace(/\D/g, '').slice(0, 13);
  if (!d.length) return '';
  if (d.length <= 2)  return `+${d}`;
  if (d.length <= 4)  return `+${d.slice(0, 2)} (${d.slice(2)}`;
  if (d.length <= 8)  return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4)}`;
  if (d.length <= 12) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`;
  return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
};

const inputCls = 'w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all';
const labelCls = 'block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { currentCompany, companies, setCurrentCompany } = useCompany();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [switchingCompanyId, setSwitchingCompanyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Token individual Chatwoot
  const [agentToken, setAgentToken] = useState('');
  const [savingToken, setSavingToken] = useState(false);
  const [tokenFeedback, setTokenFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    userProfileService.getUserProfile().then(profile => {
      if (profile) {
        setFullName(profile.full_name || '');
        setPhone(maskPhone(profile.phone_primary || ''));
      }
    }).finally(() => setLoading(false));

    settingsService.hasAgentChatwootToken().then(setHasToken).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await userProfileService.updateUserProfile({
        full_name: fullName,
        phone_primary: phone.replace(/\D/g, '') || null,
      });
      setFeedback({ type: 'success', msg: 'Perfil atualizado com sucesso.' });
    } catch {
      setFeedback({ type: 'error', msg: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAgentToken = async () => {
    if (!agentToken.trim()) return;
    setSavingToken(true);
    setTokenFeedback(null);
    try {
      await settingsService.setAgentChatwootToken(agentToken.trim());
      setHasToken(true);
      setAgentToken('');
      setTokenFeedback({ type: 'success', msg: 'Token salvo com sucesso.' });
    } catch {
      setTokenFeedback({ type: 'error', msg: 'Erro ao salvar token. Tente novamente.' });
    } finally {
      setSavingToken(false);
    }
  };

  const handleSwitchCompany = async (company: typeof companies[0]) => {
    if (company.id === currentCompany?.id) return;
    setSwitchingCompanyId(company.id);
    try {
      await setCurrentCompany(company);
    } finally {
      setSwitchingCompanyId(null);
    }
  };

  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : (user?.email?.[0] || 'U').toUpperCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="size-8 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Avatar + nome */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 flex items-center gap-5">
        <div className="size-16 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 select-none">
          {initials}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{fullName || 'Sem nome'}</h2>
          <p className="text-sm text-slate-400">{user?.email}</p>
        </div>
      </div>

      {/* Informações da conta */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-5">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Informações da Conta</p>

        <div>
          <label className={labelCls}>E-mail</label>
          <div className="w-full h-11 bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 flex items-center text-slate-500 text-sm select-none">
            {user?.email}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Nome Completo</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Seu nome completo"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Telefone</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(maskPhone(e.target.value))}
              placeholder="+55 (45) 8823-0654"
              className={inputCls}
              maxLength={20}
            />
          </div>
        </div>

        {feedback && (
          <p className={`text-sm font-medium ${feedback.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {feedback.msg}
          </p>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-10 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center gap-2"
          >
            {saving && <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      {/* Token individual Chatwoot */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Integração Chatwoot</p>
          {hasToken && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Token configurado
            </span>
          )}
        </div>

        <div>
          <label className={labelCls}>Token pessoal de agente</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={agentToken}
              onChange={e => setAgentToken(e.target.value)}
              placeholder={hasToken ? '••••••••••••••••' : 'Cole seu token aqui'}
              className={`${inputCls} flex-1`}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveAgentToken(); }}
            />
            <button
              onClick={handleSaveAgentToken}
              disabled={savingToken || !agentToken.trim()}
              className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center gap-2 flex-shrink-0"
            >
              {savingToken && <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {savingToken ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            Usado para identificar suas respostas no Chatwoot. Encontre em:{' '}
            <span className="text-slate-400">Chatwoot → Perfil → Tokens de Acesso</span>
          </p>
        </div>

        {tokenFeedback && (
          <p className={`text-sm font-medium ${tokenFeedback.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
            {tokenFeedback.msg}
          </p>
        )}
      </div>

      {/* Trocar de empresa */}
      {companies.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Trocar de Empresa</p>
          <div className="space-y-2">
            {companies.map(company => {
              const isActive = company.id === currentCompany?.id;
              const isSwitching = switchingCompanyId === company.id;
              return (
                <button
                  key={company.id}
                  onClick={() => handleSwitchCompany(company)}
                  disabled={isActive || isSwitching}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                    isActive
                      ? 'bg-violet-600/15 border-violet-500/40 cursor-default'
                      : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-600 hover:bg-slate-900'
                  }`}
                >
                  <div className={`size-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    isActive ? 'bg-violet-500/20 text-violet-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {company.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                      {company.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{company.slug}</p>
                  </div>
                  {isActive && (
                    <span className="text-xs font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                      Ativa
                    </span>
                  )}
                  {isSwitching && (
                    <span className="size-4 border-2 border-slate-500/30 border-t-slate-400 rounded-full animate-spin flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
