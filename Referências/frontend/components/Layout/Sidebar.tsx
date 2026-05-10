
import React, { useEffect, useState } from 'react';
import type { Settings } from '../../types';
import * as settingsService from '../../services/settingsService';
import { DevEnvToggle } from '../DevEnvToggle';
import { useNotifications } from '../../contexts/NotificationsContext';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: any) => void;
  companyName: string;
  companyId?: string;
  isGlobalAdmin?: boolean;
  userEmail?: string;
  userName?: string;
  allCompanies?: { company_id: string; company_name: string; is_active: boolean }[];
  currentCompanyId?: string;
  onCompanyChange?: (companyId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, companyName, companyId, isGlobalAdmin = false, userEmail, userName, allCompanies = [], currentCompanyId, onCompanyChange }) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const { unreadCount } = useNotifications();

  const resolveLogoUrl = (companySettings: Settings | null): string | null => {
    if (!companySettings) return null;
    // Prefer logo that matches theme, with fallback to legacy logo_url.
    if (companySettings.theme === 'light') {
      return companySettings.logo_url_light || companySettings.logo_url_dark || companySettings.logo_url || null;
    }
    return companySettings.logo_url_dark || companySettings.logo_url_light || companySettings.logo_url || null;
  };

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      if (!companyId) {
        setLogoUrl(null);
        return;
      }

      try {
        const companySettings = await settingsService.getSettings(companyId);
        if (mounted) {
          setLogoUrl(resolveLogoUrl(companySettings));
        }
      } catch {
        if (mounted) {
          setLogoUrl(null);
        }
      }
    };

    loadSettings();

    const onSettingsUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ companyId: string; settings: Settings }>;
      if (!customEvent.detail || customEvent.detail.companyId !== companyId) return;
      setLogoUrl(resolveLogoUrl(customEvent.detail.settings));
    };

    window.addEventListener('company-settings-updated', onSettingsUpdated as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener('company-settings-updated', onSettingsUpdated as EventListener);
    };
  }, [companyId]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'agents', label: 'Agentes', icon: 'smart_toy' },
    { id: 'knowledge', label: 'Base de Conhecimento', icon: 'menu_book' },
    { id: 'customers', label: 'Clientes', icon: 'group' },
    { id: 'chat', label: 'Conversas', icon: 'chat' },
    { id: 'tasks', label: 'Tarefas', icon: 'task_alt' },
    { id: 'agenda', label: 'Agenda', icon: 'calendar_month' },
    { id: 'attendance', label: 'Atendimentos', icon: 'clinical_notes' },
    { id: 'assistente-ia', label: 'Assistente IA', icon: 'mic' },
  ];

  const isAgendaSection = (view: string) => view === 'agenda' || view === 'agenda-settings';
  const isAttendanceSection = (view: string) => view === 'attendance' || view === 'attendance-settings';

  const adminItems = [
    { id: 'settings', label: 'Configurações', icon: 'settings' },
    { id: 'users', label: 'Usuários', icon: 'manage_accounts' },
  ];

  return (
    <aside className="w-72 hidden md:flex flex-col border-r border-slate-800 bg-slate-950 h-full flex-shrink-0">
      <div className="p-6 flex items-center gap-3">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo da empresa"
            className="max-h-14 w-full object-contain object-left"
          />
        ) : (
          <>
            <div className="size-8 bg-gradient-to-br from-blue-500 to-violet-500 rounded-lg flex items-center justify-center text-white shadow-lg">
              <span className="material-symbols-outlined text-xl">token</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">AYVI</h1>
          </>
        )}
      </div>

      {isGlobalAdmin && allCompanies.length > 0 ? (
        <div className="px-4 pb-4">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 px-1">Empresa ativa</p>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none">business</span>
            <select
              value={currentCompanyId || ''}
              onChange={e => onCompanyChange?.(e.target.value)}
              className="w-full appearance-none bg-slate-800 border border-slate-700 text-white text-sm rounded-xl pl-8 pr-8 py-2 focus:outline-none focus:border-violet-500 cursor-pointer"
            >
              <option value="" disabled>Selecionar empresa...</option>
              {allCompanies.filter(c => c.is_active).map(c => (
                <option key={c.company_id} value={c.company_id}>{c.company_name}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none">expand_more</span>
          </div>
        </div>
      ) : (
        <div className="px-6 pb-4">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Agente</p>
          <p className="text-sm text-slate-300 font-medium truncate">{companyName}</p>
        </div>
      )}

      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active =
            item.id === 'agenda'
              ? isAgendaSection(currentView)
              : item.id === 'attendance'
                ? isAttendanceSection(currentView)
                : currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                onViewChange(item.id === 'agenda' ? 'agenda' : item.id === 'attendance' ? 'attendance' : item.id)
              }
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group ${
                active
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <span className={`material-symbols-outlined ${active ? 'fill-1' : ''}`}>{item.icon}</span>
              <span className="text-sm font-semibold flex-1 text-left">{item.label}</span>
              {item.id === 'chat' && unreadCount > 0 && (
                <span className="size-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          );
        })}

        <div className="my-6 border-t border-slate-800/50 mx-2" />

        {adminItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group ${
              currentView === item.id
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="text-sm font-semibold">{item.label}</span>
          </button>
        ))}

        {isGlobalAdmin && (
          <>
            <div className="my-4 mx-2">
              <div className="border-t border-violet-800/40" />
              <p className="text-[9px] font-black text-violet-500 uppercase tracking-[0.15em] mt-3 px-2">
                Administração Global
              </p>
            </div>
            <button
              onClick={() => onViewChange('global-admin')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group ${
                currentView === 'global-admin'
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                  : 'text-violet-400 hover:bg-violet-800/20 hover:text-violet-300'
              }`}
            >
              <span className="material-symbols-outlined">admin_panel_settings</span>
              <span className="text-sm font-semibold">Gestão de Empresas</span>
            </button>
            <button
              onClick={() => onViewChange('admin-client-info-forms')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group ${
                currentView === 'admin-client-info-forms'
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                  : 'text-violet-400 hover:bg-violet-800/20 hover:text-violet-300'
              }`}
            >
              <span className="material-symbols-outlined">dynamic_form</span>
              <span className="text-sm font-semibold">Formulários de Coleta</span>
            </button>
            <DevEnvToggle />
          </>
        )}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => onViewChange('profile')}
          className={`w-full flex items-center gap-3 p-2 rounded-xl border transition-all group ${
            currentView === 'profile'
              ? 'bg-violet-600/15 border-violet-500/40'
              : 'bg-slate-900/50 border-slate-800 hover:border-slate-600 hover:bg-slate-800/60'
          }`}
        >
          <div className="size-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 select-none">
            {userName
              ? userName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
              : (userEmail?.[0] || 'U').toUpperCase()
            }
          </div>
          <div className="flex flex-col min-w-0 flex-1 text-left">
            <p className="text-sm font-bold text-white truncate">{userName || 'Meu Perfil'}</p>
            <p className="text-xs text-slate-500 truncate">{userEmail || ''}</p>
          </div>
          <span className="material-symbols-outlined text-slate-600 group-hover:text-slate-400 text-base transition-colors">
            chevron_right
          </span>
        </button>
      </div>
    </aside>
  );
};
