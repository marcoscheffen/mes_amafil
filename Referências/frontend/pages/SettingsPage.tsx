
import React, { useState, useEffect, useRef } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../hooks/useAuth';
import { useGlobalAdmin } from '../hooks/useGlobalAdmin';
import { Settings } from '../types';
import * as settingsService from '../services/settingsService';
import * as companyUsersService from '../services/companyUsersService';
import * as googleCalendarService from '../services/googleCalendarService';
import type { GoogleCalendarStatus, ProfessionalCalendarInfo } from '../services/googleCalendarService';
import { ACTIVE_URL } from '../lib/supabase';
import { WhatsappCredentialsTab } from '../components/Settings/WhatsappCredentialsTab';

const GOOGLE_OAUTH_REDIRECT_URI = `${ACTIVE_URL}/functions/v1/google-oauth-callback`;

export const SettingsPage: React.FC = () => {
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const { isGlobalAdmin } = useGlobalAdmin(user);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasChatwootToken, setHasChatwootToken] = useState(false);
  const [chatwootTokenInput, setChatwootTokenInput] = useState('');
  const [chatwootUrl, setChatwootUrl] = useState('');
  const [chatwootAccountId, setChatwootAccountId] = useState('');
  const fileInputRefDark = useRef<HTMLInputElement>(null);
  const fileInputRefLight = useRef<HTMLInputElement>(null);
  const fileInputRefFavicon = useRef<HTMLInputElement>(null);
  const [uploadingLogoDark, setUploadingLogoDark] = useState(false);
  const [uploadingLogoLight, setUploadingLogoLight] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  // Google Calendar
  const [googleStatus, setGoogleStatus] = useState<GoogleCalendarStatus>({ connected: false, google_email: null, expires_at: null, token_expired: false });
  const [googleProfessionals, setGoogleProfessionals] = useState<ProfessionalCalendarInfo[]>([]);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [hasGoogleCredentials, setHasGoogleCredentials] = useState(false);
  const [savingGoogleCredentials, setSavingGoogleCredentials] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [disconnectingGoogle, setDisconnectingGoogle] = useState(false);
  const [creatingCalendar, setCreatingCalendar] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  /** Feedback explícito após salvar OAuth + verificação no Cofre */
  const [googleCredentialsSaveSuccess, setGoogleCredentialsSaveSuccess] = useState(false);
  const googleSaveSuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearGoogleSaveSuccessTimer = () => {
    if (googleSaveSuccessTimerRef.current) {
      clearTimeout(googleSaveSuccessTimerRef.current);
      googleSaveSuccessTimerRef.current = null;
    }
  };

  useEffect(() => () => clearGoogleSaveSuccessTimer(), []);

  const notifySettingsUpdate = (updated: Settings) => {
    if (!currentCompany) return;
    window.dispatchEvent(
      new CustomEvent('company-settings-updated', {
        detail: {
          companyId: currentCompany.id,
          settings: updated
        }
      })
    );
  };

  // Carregar settings
  useEffect(() => {
    if (currentCompany) {
      loadSettings();
      if (user) {
        checkUserRole();
      }
    }
  }, [currentCompany, user, isGlobalAdmin]);

  useEffect(() => {
    if (currentCompany && isAdmin) {
      loadGoogleCalendar();
    }
  }, [currentCompany, isAdmin]);

  const loadGoogleCalendar = async () => {
    if (!currentCompany) return;
    setLoadingGoogle(true);
    setGoogleError(null);
    try {
      const [status, professionals, hasCreds] = await Promise.all([
        googleCalendarService.getGoogleCalendarStatus(currentCompany.id),
        googleCalendarService.getProfessionalsCalendarStatus(currentCompany.id),
        googleCalendarService.hasGoogleOAuthCredentials(currentCompany.id),
      ]);
      setGoogleStatus(status);
      setGoogleProfessionals(professionals);
      setHasGoogleCredentials(hasCreds);
    } catch (err: any) {
      setGoogleError(err.message || 'Erro ao carregar configurações Google Calendar');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleSaveGoogleCredentials = async () => {
    if (!currentCompany || !googleClientId.trim() || !googleClientSecret.trim()) return;
    setSavingGoogleCredentials(true);
    setGoogleError(null);
    setGoogleCredentialsSaveSuccess(false);
    clearGoogleSaveSuccessTimer();
    try {
      await googleCalendarService.setGoogleOAuthCredentials(
        currentCompany.id,
        googleClientId.trim(),
        googleClientSecret.trim()
      );
      const verified = await googleCalendarService.hasGoogleOAuthCredentials(currentCompany.id);
      setHasGoogleCredentials(verified);
      setGoogleClientId('');
      setGoogleClientSecret('');
      if (verified) {
        setGoogleCredentialsSaveSuccess(true);
        clearGoogleSaveSuccessTimer();
        googleSaveSuccessTimerRef.current = setTimeout(() => {
          setGoogleCredentialsSaveSuccess(false);
          googleSaveSuccessTimerRef.current = null;
        }, 12000);
      } else {
        setGoogleError(
          'As credenciais foram enviadas, mas não foi possível confirmar o registro no Cofre. Atualize a página ou tente salvar novamente.'
        );
      }
    } catch (err: any) {
      setGoogleError(err.message || 'Erro ao salvar credenciais Google');
    } finally {
      setSavingGoogleCredentials(false);
    }
  };

  const handleConnectGoogle = async () => {
    if (!currentCompany) return;
    setConnectingGoogle(true);
    setGoogleError(null);
    try {
      await googleCalendarService.startGoogleOAuthFlow(currentCompany.id);
    } catch (err: any) {
      setGoogleError(err.message || 'Erro ao iniciar autenticação Google');
      setConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!currentCompany) return;
    if (!window.confirm('Desconectar a conta Google? Novos agendamentos não serão sincronizados.')) return;
    setDisconnectingGoogle(true);
    setGoogleError(null);
    try {
      await googleCalendarService.disconnectGoogleCalendar(currentCompany.id);
      setGoogleStatus({ connected: false, google_email: null, expires_at: null, token_expired: false });
      setGoogleProfessionals(prev => prev.map(p => ({ ...p, has_calendar: false, google_calendar_id: null })));
    } catch (err: any) {
      setGoogleError(err.message || 'Erro ao desconectar conta Google');
    } finally {
      setDisconnectingGoogle(false);
    }
  };

  const handleCreateProfessionalCalendar = async (userId: string) => {
    if (!currentCompany) return;
    setCreatingCalendar(userId);
    setGoogleError(null);
    try {
      await googleCalendarService.createProfessionalCalendar(currentCompany.id, userId);
      await loadGoogleCalendar();
    } catch (err: any) {
      setGoogleError(err.message || 'Erro ao criar calendário do profissional');
    } finally {
      setCreatingCalendar(null);
    }
  };

  const checkUserRole = async () => {
    if (!currentCompany || !user) return;
    if (isGlobalAdmin) {
      setIsAdmin(true);
      return;
    }
    try {
      const users = await companyUsersService.getCompanyUsers(currentCompany.id);
      const currentUser = users.find(u => u.user_id === user.id);
      setIsAdmin(currentUser?.role === 'admin');
    } catch (err) {
      console.error('Erro ao verificar role do usuário:', err);
    }
  };

  const loadSettings = async () => {
    if (!currentCompany) return;

    try {
      setLoading(true);
      setError(null);
      const [data, tokenStatus] = await Promise.all([
        settingsService.getSettings(currentCompany.id),
        settingsService.hasChatwootToken(currentCompany.id)
      ]);
      setSettings(data);
      setHasChatwootToken(tokenStatus);
      setChatwootUrl(data.additional_settings?.chatwoot_url || '');
      setChatwootAccountId(data.additional_settings?.chatwoot_account_id || '');
    } catch (err: any) {
      console.error('Erro ao carregar settings:', err);
      setError(err.message || 'Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany || !settings) return;

    try {
      setSaving(true);
      setError(null);
      
      const updatedSettings = await settingsService.updateSettings(currentCompany.id, {
        display_name: settings.display_name || undefined,
        logo_url: settings.logo_url || undefined,
        additional_settings: {
          ...(settings.additional_settings || {}),
          chatwoot_url: chatwootUrl.trim().replace(/\/$/, '') || undefined,
          chatwoot_account_id: chatwootAccountId.trim() || undefined,
        }
      });

      // Update chatwoot token if provided
      if (chatwootTokenInput !== '') {
        await settingsService.setChatwootToken(currentCompany.id, chatwootTokenInput);
        setHasChatwootToken(true);
        setChatwootTokenInput('');
      }

      setSettings(updatedSettings);
      notifySettingsUpdate(updatedSettings);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      console.error('Erro ao salvar settings:', err);
      setError(err.message || 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    theme: 'dark' | 'light'
  ) => {
    const file = e.target.files?.[0];
    if (!file || !currentCompany || !settings) return;

    try {
      if (theme === 'dark') {
        setUploadingLogoDark(true);
      } else {
        setUploadingLogoLight(true);
      }
      setError(null);

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione um arquivo de imagem (PNG, JPG, etc.)');
        return;
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('O arquivo é muito grande. Tamanho máximo: 5MB');
        return;
      }

      // Upload do logo
      const uploadResult = await settingsService.uploadLogo(currentCompany.id, file, theme);

      // Atualizar settings com nova URL do logo
      const updateData: any = {};
      if (theme === 'dark') {
        updateData.logo_url_dark = uploadResult.url;
      } else {
        updateData.logo_url_light = uploadResult.url;
      }

      const updatedSettings = await settingsService.updateSettings(currentCompany.id, updateData);

      setSettings(updatedSettings);
      notifySettingsUpdate(updatedSettings);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      console.error('Erro ao fazer upload do logo:', err);
      // Só exibir erro se for realmente um erro de upload
      if (err.message) {
        setError(err.message);
      } else {
        setError('Erro ao fazer upload do logo. Verifique se o bucket "company-assets" foi criado no Supabase.');
      }
    } finally {
      if (theme === 'dark') {
        setUploadingLogoDark(false);
        if (fileInputRefDark.current) {
          fileInputRefDark.current.value = '';
        }
      } else {
        setUploadingLogoLight(false);
        if (fileInputRefLight.current) {
          fileInputRefLight.current.value = '';
        }
      }
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentCompany || !settings) return;

    try {
      setUploadingFavicon(true);
      setError(null);

      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione um arquivo de imagem (PNG, JPG, ICO, etc.)');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('O arquivo é muito grande. Tamanho máximo: 5MB');
        return;
      }

      const uploadResult = await settingsService.uploadFavicon(currentCompany.id, file);
      const updatedSettings = await settingsService.updateSettings(currentCompany.id, {
        favicon_url: uploadResult.url,
      });

      setSettings(updatedSettings);
      notifySettingsUpdate(updatedSettings);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      console.error('Erro ao fazer upload do favicon:', err);
      setError(err.message || 'Erro ao fazer upload do favicon.');
    } finally {
      setUploadingFavicon(false);
      if (fileInputRefFavicon.current) fileInputRefFavicon.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center text-slate-400">
        <p>Erro ao carregar configurações</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Configurações da Empresa</h2>
        <p className="text-slate-400">Gerencie as informações principais e personalização da sua organização.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-400">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
        <form onSubmit={handleSave} className="p-8 space-y-8">
          {/* Nome de Exibição e Logo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Nome do Agente</label>
                <input 
                  type="text" 
                  value={settings.display_name || ''} 
                  onChange={(e) => setSettings({ ...settings, display_name: e.target.value })}
                  placeholder={currentCompany?.name || 'Nome da empresa'}
                  className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-6">
              <label className="block text-sm font-bold text-slate-300 mb-2">Logos da Empresa</label>
              
              {/* Logo Tema Escuro */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400">Logo para Tema Escuro</label>
                <div className="flex items-center gap-6">
                  <input
                    type="file"
                    ref={fileInputRefDark}
                    onChange={(e) => handleLogoUpload(e, 'dark')}
                    accept="image/*"
                    className="hidden"
                  />
                  <div 
                    onClick={() => fileInputRefDark.current?.click()}
                    className="w-48 h-28 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500 group relative cursor-pointer overflow-hidden p-2"
                  >
                    {settings.logo_url_dark || settings.logo_url ? (
                      <img 
                        src={settings.logo_url_dark || settings.logo_url || ''} 
                        className="w-full h-full object-contain" 
                        alt="Logo Tema Escuro" 
                      />
                    ) : (
                      <span className="material-symbols-outlined text-4xl">image</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-white">
                        {uploadingLogoDark ? 'hourglass_empty' : 'upload'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                      Logo exibido quando o tema escuro estiver ativo. Recomendamos uma imagem clara/brilhante.
                    </p>
                    <button 
                      type="button"
                      onClick={() => fileInputRefDark.current?.click()}
                      disabled={uploadingLogoDark}
                      className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                    >
                      {uploadingLogoDark ? 'Enviando...' : 'Alterar Logo Escuro'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Logo Tema Claro */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400">Logo para Tema Claro</label>
                <div className="flex items-center gap-6">
                  <input
                    type="file"
                    ref={fileInputRefLight}
                    onChange={(e) => handleLogoUpload(e, 'light')}
                    accept="image/*"
                    className="hidden"
                  />
                  <div 
                    onClick={() => fileInputRefLight.current?.click()}
                    className="w-48 h-28 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500 group relative cursor-pointer overflow-hidden p-2"
                  >
                    {settings.logo_url_light || settings.logo_url ? (
                      <img 
                        src={settings.logo_url_light || settings.logo_url || ''} 
                        className="w-full h-full object-contain" 
                        alt="Logo Tema Claro" 
                      />
                    ) : (
                      <span className="material-symbols-outlined text-4xl">image</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-white">
                        {uploadingLogoLight ? 'hourglass_empty' : 'upload'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                      Logo exibido quando o tema claro estiver ativo. Recomendamos uma imagem escura/escura.
                    </p>
                    <button 
                      type="button"
                      onClick={() => fileInputRefLight.current?.click()}
                      disabled={uploadingLogoLight}
                      className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                    >
                      {uploadingLogoLight ? 'Enviando...' : 'Alterar Logo Claro'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Favicon */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400">Favicon</label>
                <div className="flex items-center gap-6">
                  <input
                    type="file"
                    ref={fileInputRefFavicon}
                    onChange={handleFaviconUpload}
                    accept="image/*,.ico"
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRefFavicon.current?.click()}
                    className="size-20 shrink-0 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500 group relative cursor-pointer overflow-hidden p-2"
                  >
                    {settings.favicon_url ? (
                      <img
                        src={settings.favicon_url}
                        className="w-full h-full object-contain"
                        alt="Favicon"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-3xl">image</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-white">
                        {uploadingFavicon ? 'hourglass_empty' : 'upload'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                      Ícone exibido na aba do navegador. Recomendamos imagem quadrada (PNG ou ICO), por exemplo 32×32 ou 64×64 pixels.
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRefFavicon.current?.click()}
                      disabled={uploadingFavicon}
                      className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                    >
                      {uploadingFavicon ? 'Enviando...' : 'Alterar Favicon'}
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 italic">
                💡 Recomendamos imagens de pelo menos 200px de altura nos formatos PNG ou JPG. Logos retangulares são aceitos e serão exibidos no topo da sidebar.
              </p>
            </div>
          </div>

          {/* Integração Chatwoot (Apenas para Admins e Global Owners) */}
          {(isAdmin || isGlobalAdmin) && (
            <div className="pt-8 border-t border-slate-700">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500">integration_instructions</span>
                Integrações
              </h3>
              <div className="max-w-md space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Chatwoot URL</label>
                  <input
                    type="url"
                    value={chatwootUrl}
                    onChange={(e) => setChatwootUrl(e.target.value)}
                    placeholder="https://chatwoot.suaempresa.com.br"
                    className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    URL base da sua instância Chatwoot (sem barra no final).
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Chatwoot Account ID</label>
                  <input
                    type="text"
                    value={chatwootAccountId}
                    onChange={(e) => setChatwootAccountId(e.target.value)}
                    placeholder="Ex: 9"
                    className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Encontrado em: <span className="text-slate-400">{chatwootUrl || 'https://chatwoot.exemplo.com'}/app/accounts/<strong>ID</strong>/profile/settings</span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Chatwoot Access Token</label>
                  <input
                    type="password"
                    value={chatwootTokenInput}
                    onChange={(e) => setChatwootTokenInput(e.target.value)}
                    placeholder={hasChatwootToken ? '******** (Token seguro no Cofre)' : 'Cole o Access Token do Chatwoot aqui'}
                    className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Encontrado em: Profile Settings → Access Token. Necessário para comunicação com o Chatwoot.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <div className={`flex items-center gap-2 text-emerald-400 font-bold transition-opacity duration-500 ${isSaved ? 'opacity-100' : 'opacity-0'}`}>
               <span className="material-symbols-outlined">check_circle</span>
               <span className="text-sm">Configurações salvas com sucesso!</span>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="h-12 px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>

      {/* Google Calendar — fora do form principal, apenas para admins */}
      {(isAdmin || isGlobalAdmin) && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl text-red-400">calendar_month</span>
              <div>
                <h3 className="text-xl font-bold text-white">Google Calendar</h3>
                <p className="text-sm text-slate-400">Sincronização bidirecional com os calendários dos profissionais.</p>
              </div>
            </div>

            {googleError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
                {googleError}
              </div>
            )}

            {/* Passo 1 — Credenciais OAuth (Client ID + Secret) */}
            <div className="border border-slate-700 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${hasGoogleCredentials ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-slate-300'}`}>
                  {hasGoogleCredentials ? '✓' : '1'}
                </span>
                <h4 className="font-bold text-slate-200">Credenciais do Google Cloud</h4>
                {hasGoogleCredentials && (
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Configurado</span>
                )}
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Crie um projeto no{' '}
                <span className="text-slate-300 font-mono">console.cloud.google.com</span>,
                ative a <strong className="text-slate-300">Google Calendar API</strong> e gere credenciais OAuth 2.0 (tipo: &quot;Aplicativo Web&quot;).
                Em <strong className="text-slate-300">URIs de redirecionamento autorizados</strong>, cadastre <strong className="text-amber-200/90">exatamente</strong> a URL abaixo (é o callback do Supabase, não a URL do painel AYVI).
              </p>

              <div className="rounded-xl bg-slate-900/80 border border-amber-500/25 px-3 py-2.5 space-y-1.5">
                <p className="text-[10px] font-bold text-amber-400/90 uppercase tracking-wide">URI de redirecionamento (copiar para o Google Cloud)</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-xs text-emerald-300/95 break-all flex-1 min-w-0">{GOOGLE_OAUTH_REDIRECT_URI}</code>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(GOOGLE_OAUTH_REDIRECT_URI);
                    }}
                    className="shrink-0 h-8 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold"
                  >
                    Copiar
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Origens JavaScript autorizadas (opcional): inclua o domínio do app (ex.: <span className="font-mono text-slate-400">https://one.ayvi.com.br</span>) se o Google solicitar.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Client ID</label>
                  <input
                    type="text"
                    value={googleClientId}
                    onChange={(e) => {
                      setGoogleClientId(e.target.value);
                      setGoogleCredentialsSaveSuccess(false);
                      clearGoogleSaveSuccessTimer();
                    }}
                    placeholder={hasGoogleCredentials ? '•••••••• (salvo no Cofre)' : '1234567890-abc...apps.googleusercontent.com'}
                    className="w-full h-10 bg-slate-900 border border-slate-700 rounded-xl px-3 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Client Secret</label>
                  <input
                    type="password"
                    value={googleClientSecret}
                    onChange={(e) => {
                      setGoogleClientSecret(e.target.value);
                      setGoogleCredentialsSaveSuccess(false);
                      clearGoogleSaveSuccessTimer();
                    }}
                    placeholder={hasGoogleCredentials ? '•••••••• (salvo no Cofre)' : 'GOCSPX-...'}
                    className="w-full h-10 bg-slate-900 border border-slate-700 rounded-xl px-3 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <button
                  type="button"
                  onClick={handleSaveGoogleCredentials}
                  disabled={savingGoogleCredentials || !googleClientId.trim() || !googleClientSecret.trim()}
                  className="h-9 px-5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  {savingGoogleCredentials ? 'Salvando...' : hasGoogleCredentials ? 'Atualizar Credenciais' : 'Salvar Credenciais'}
                </button>
                {googleCredentialsSaveSuccess && (
                  <div
                    role="status"
                    className="flex items-start gap-2 flex-1 min-w-0 bg-emerald-500/10 border border-emerald-500/35 rounded-xl px-3 py-2.5 text-sm animate-in fade-in duration-300"
                  >
                    <span className="material-symbols-outlined text-emerald-400 shrink-0 text-lg" aria-hidden>
                      verified
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-emerald-300">Credenciais salvas e verificadas</p>
                      <p className="text-xs text-emerald-400/90 mt-0.5 leading-snug">
                        Confirmado no Cofre (Client ID). Você já pode usar <strong className="text-emerald-300">Conectar com Google</strong> no passo 2.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Passo 2 — Conectar Conta Google */}
            <div className="border border-slate-700 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  googleStatus.connected && !googleStatus.token_expired
                    ? 'bg-emerald-500 text-white'
                    : googleStatus.connected && googleStatus.token_expired
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-600 text-slate-300'
                }`}>
                  {googleStatus.connected && !googleStatus.token_expired ? '✓' : googleStatus.connected && googleStatus.token_expired ? '!' : '2'}
                </span>
                <h4 className="font-bold text-slate-200">Conta Google da Empresa</h4>
              </div>

              {googleStatus.connected && !googleStatus.token_expired ? (
                <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-400">check_circle</span>
                    <div>
                      <p className="text-sm font-bold text-emerald-300">Conectado</p>
                      <p className="text-xs text-slate-400">{googleStatus.google_email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDisconnectGoogle}
                    disabled={disconnectingGoogle}
                    className="text-xs text-red-400 hover:text-red-300 font-bold transition-colors disabled:opacity-50"
                  >
                    {disconnectingGoogle ? 'Desconectando...' : 'Desconectar'}
                  </button>
                </div>
              ) : googleStatus.connected && googleStatus.token_expired ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
                    <span className="material-symbols-outlined text-amber-400 mt-0.5">warning</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-amber-300">Reconexão necessária</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        O token de acesso ao Google expirou e não pôde ser renovado automaticamente.
                        Isso ocorre quando o app Google está em modo de teste (tokens expiram em 7 dias).
                        Desconecte e reconecte para restaurar a sincronização.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDisconnectGoogle}
                      disabled={disconnectingGoogle}
                      className="text-xs text-red-400 hover:text-red-300 font-bold transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {disconnectingGoogle ? 'Desconectando...' : 'Desconectar'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleConnectGoogle}
                    disabled={connectingGoogle}
                    className="flex items-center gap-2 h-10 px-5 bg-white hover:bg-slate-100 text-slate-800 text-sm font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" className="flex-shrink-0">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {connectingGoogle ? 'Redirecionando...' : 'Reconectar com Google'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Conecte uma conta Google da empresa. O sistema criará sub-calendários dedicados para cada profissional.
                  </p>
                  <button
                    type="button"
                    onClick={handleConnectGoogle}
                    disabled={connectingGoogle || !hasGoogleCredentials}
                    title={!hasGoogleCredentials ? 'Configure as credenciais OAuth primeiro (Passo 1)' : undefined}
                    className="flex items-center gap-2 h-10 px-5 bg-white hover:bg-slate-100 text-slate-800 text-sm font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" className="flex-shrink-0">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {connectingGoogle ? 'Redirecionando...' : 'Conectar com Google'}
                  </button>
                  {!hasGoogleCredentials && (
                    <p className="text-xs text-amber-400">Configure as credenciais OAuth no Passo 1 antes de conectar.</p>
                  )}
                </div>
              )}
            </div>

            {/* Passo 3 — Calendários dos Profissionais */}
            {googleStatus.connected && (
              <div className="border border-slate-700 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-blue-600 text-white">3</span>
                  <h4 className="font-bold text-slate-200">Calendários dos Profissionais</h4>
                </div>

                {loadingGoogle ? (
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span>Carregando...</span>
                  </div>
                ) : googleProfessionals.length === 0 ? (
                  <p className="text-sm text-slate-400">Nenhum profissional encontrado na empresa.</p>
                ) : (
                  <div className="space-y-2">
                    {googleProfessionals.map((prof) => (
                      <div key={prof.user_id} className="flex items-center justify-between py-2.5 px-3 bg-slate-900 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-slate-400 text-lg">person</span>
                          <div>
                            <p className="text-sm font-bold text-slate-200">{prof.full_name || prof.user_email}</p>
                            {prof.has_calendar && (
                              <p className="text-xs text-slate-500 font-mono truncate max-w-xs">{prof.google_calendar_id}</p>
                            )}
                          </div>
                        </div>
                        {prof.has_calendar ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-400">
                            <span className="material-symbols-outlined text-sm">cloud_done</span>
                            Calendário criado
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCreateProfessionalCalendar(prof.user_id)}
                            disabled={creatingCalendar === prof.user_id}
                            className="text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors disabled:opacity-50"
                          >
                            {creatingCalendar === prof.user_id ? 'Criando...' : 'Criar Calendário'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Credenciais de WhatsApp Uazapi (apenas admins) */}
      {(isAdmin || isGlobalAdmin) && (
         <WhatsappCredentialsTab canManage={true} />
      )}

      {/* Espaço para evitar corte do último card */}
      <div className="h-4" />
    </div>
  );
};
