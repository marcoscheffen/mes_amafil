
import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useCompany } from './contexts/CompanyContext';
import { useGlobalAdmin } from './hooks/useGlobalAdmin';
import * as userProfileService from './services/userProfileService';
import * as globalAdminService from './services/globalAdminService';
import type { GlobalAdminCompany } from './services/globalAdminService';
import type { Company, Settings } from './types';
import * as settingsService from './services/settingsService';
import { applyDocumentFavicon } from './lib/documentFavicon';
import { CompanyProvider } from './contexts/CompanyContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { LoginPage } from './pages/LoginPage';
import { CompanySelectionPage } from './pages/CompanySelectionPage';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { AgentsPage } from './pages/AgentsPage';
import { ChatPage } from './pages/ChatPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { CustomersPage } from './pages/CustomersPage';
import { SettingsPage } from './pages/SettingsPage';
import { UsersPage } from './pages/UsersPage';
import { GlobalAdminPage } from './pages/GlobalAdminPage';
import { ProfilePage } from './pages/ProfilePage';
import { TasksPage } from './pages/TasksPage';
import { TaskStatusSettings } from './pages/TaskStatusSettings';
import { AgendaPage } from './pages/AgendaPage';
import { AgendaSettingsPage } from './pages/AgendaSettingsPage';
import { AttendancePage } from './pages/AttendancePage';
import { AttendanceSettingsPage } from './pages/AttendanceSettingsPage';
import { MessageLogPage } from './pages/MessageLogPage';
import { AssistanteIAPage } from './pages/AssistanteIAPage';
import { AdminClientInfoFormsPage } from './pages/AdminClientInfoFormsPage';

type View = 'dashboard' | 'agents' | 'chat' | 'knowledge' | 'customers' | 'settings' | 'users' | 'global-admin' | 'profile' | 'tasks' | 'tasks-settings' | 'agenda' | 'agenda-settings' | 'attendance' | 'attendance-settings' | 'message-log' | 'assistente-ia' | 'admin-client-info-forms';

// Mapeamento de rotas para views
const routeToView: Record<string, View> = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/agents': 'agents',
  '/chat': 'chat',
  '/message-log': 'message-log',
  '/assistente-ia': 'assistente-ia',
  '/knowledge': 'knowledge',
  '/customers': 'customers',
  '/tasks': 'tasks',
  '/tasks/settings': 'tasks-settings',
  '/agenda': 'agenda',
  '/agenda/settings': 'agenda-settings',
  '/atendimento': 'attendance',
  '/atendimento/settings': 'attendance-settings',
  '/settings': 'settings',
  '/users': 'users',
  '/global-admin': 'global-admin',
  '/admin/formularios': 'admin-client-info-forms',
  '/profile': 'profile'
};

const viewToRoute: Record<View, string> = {
  dashboard: '/dashboard',
  agents: '/agents',
  chat: '/chat',
  'message-log': '/message-log',
  'assistente-ia': '/assistente-ia',
  knowledge: '/knowledge',
  customers: '/customers',
  tasks: '/tasks',
  'tasks-settings': '/tasks/settings',
  agenda: '/agenda',
  'agenda-settings': '/agenda/settings',
  attendance: '/atendimento',
  'attendance-settings': '/atendimento/settings',
  settings: '/settings',
  users: '/users',
  'global-admin': '/global-admin',
  'admin-client-info-forms': '/admin/formularios',
  profile: '/profile'
};

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { currentCompany, loading: companyLoading, setCurrentCompany } = useCompany();
  const { isGlobalAdmin } = useGlobalAdmin(user ?? null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [userName, setUserName] = useState<string>('');
  const [chatOpenPhone, setChatOpenPhone] = useState<string | null>(null);
  const [customerOpenPhone, setCustomerOpenPhone] = useState<string | null>(null);
  const [customerOpenId, setCustomerOpenId] = useState<string | null>(null);
  const [appointmentOpenId, setAppointmentOpenId] = useState<string | null>(null);
  const [attendanceOpenId, setAttendanceOpenId] = useState<string | null>(null);
  const [assistFocusTranscriptionId, setAssistFocusTranscriptionId] = useState<string | null>(null);
  const [allCompanies, setAllCompanies] = useState<GlobalAdminCompany[]>([]);

  // Sincronizar URL com estado ao carregar
  useEffect(() => {
    const path   = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const view   = routeToView[path] || 'dashboard';
    setCurrentView(view);

    // Redirecionar após callback OAuth Google Calendar
    if (params.get('google_connected') === '1') {
      window.history.replaceState({}, '', window.location.pathname);
      // Navegar para settings para exibir status atualizado
      setCurrentView('settings');
      window.history.pushState({}, '', '/settings');
    } else if (params.get('google_error')) {
      const errCode = params.get('google_error');
      window.history.replaceState({}, '', window.location.pathname);
      console.error('[Google OAuth] Erro no callback:', errCode);
      setCurrentView('settings');
      window.history.pushState({}, '', '/settings');
    }
  }, []);

  // Carregar nome do usuário para exibir na sidebar
  useEffect(() => {
    if (!user) return;
    userProfileService.getUserProfile().then(profile => {
      if (profile?.full_name) setUserName(profile.full_name);
    }).catch(() => {});
  }, [user]);

  // Carregar todas as empresas para o global admin (usado no seletor do sidebar)
  useEffect(() => {
    if (!isGlobalAdmin) return;
    globalAdminService.getAllCompanies()
      .then(setAllCompanies)
      .catch(() => {});
  }, [isGlobalAdmin]);

  useEffect(() => {
    if (!user || !currentCompany) {
      applyDocumentFavicon(null);
      return;
    }
    let cancelled = false;
    settingsService
      .getSettings(currentCompany.id)
      .then((s) => {
        if (!cancelled) applyDocumentFavicon(s.favicon_url);
      })
      .catch(() => {
        if (!cancelled) applyDocumentFavicon(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user, currentCompany?.id]);

  useEffect(() => {
    if (!currentCompany) return;
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ companyId: string; settings: Settings }>;
      if (!ev.detail || ev.detail.companyId !== currentCompany.id) return;
      applyDocumentFavicon(ev.detail.settings.favicon_url);
    };
    window.addEventListener('company-settings-updated', handler as EventListener);
    return () => window.removeEventListener('company-settings-updated', handler as EventListener);
  }, [currentCompany?.id]);

  // Atualizar URL quando view muda (via menu)
  const handleViewChange = (view: View) => {
    setCurrentView(view);
    const route = viewToRoute[view] || '/dashboard';
    window.history.pushState({}, '', route);
  };

  // Troca de empresa via seletor do sidebar (global admin)
  const handleCompanyChange = async (companyId: string) => {
    if (!companyId) return;
    const found = allCompanies.find(c => c.company_id === companyId);
    if (!found) return;
    const company: Company = {
      id: found.company_id,
      name: found.company_name,
      slug: found.company_slug,
      is_active: found.is_active,
      created_at: found.created_at || '',
      updated_at: found.created_at || '',
    };
    await setCurrentCompany(company);
    handleViewChange('dashboard');
  };

  // Navegação programática via evento customizado (usado por componentes filhos, ex: ChatPage, GlobalSearch)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{
        view: View;
        phone?: string;
        transcriptionId?: string;
        clientId?: string;
        appointmentId?: string;
        attendanceId?: string;
      }>).detail;
      const view = detail?.view;
      if (view && viewToRoute[view]) {
        if (detail?.phone) {
          if (view === 'chat') setChatOpenPhone(detail.phone);
          if (view === 'customers') setCustomerOpenPhone(detail.phone);
        }
        if (detail?.clientId && view === 'customers') setCustomerOpenId(detail.clientId);
        if (detail?.appointmentId && view === 'agenda') setAppointmentOpenId(detail.appointmentId);
        if (detail?.attendanceId && view === 'attendance') setAttendanceOpenId(detail.attendanceId);
        if (detail?.transcriptionId && view === 'assistente-ia') {
          setAssistFocusTranscriptionId(detail.transcriptionId);
        }
        handleViewChange(view);
      }
    };
    window.addEventListener('aios:navigate', handler);
    return () => window.removeEventListener('aios:navigate', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = (email: string) => {
    // Login é gerenciado pelo useAuth hook
    // Esta função é chamada após login bem-sucedido
    console.log('Login realizado:', email);
  };

  // Mostrar loading enquanto verifica autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // Redirecionar para login se não autenticado
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Mostrar loading enquanto carrega companies
  if (companyLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-400">Carregando empresas...</p>
        </div>
      </div>
    );
  }

  // Usuário comum sem empresa → tela de seleção de empresa
  if (!currentCompany && !isGlobalAdmin) {
    return <CompanySelectionPage onSelect={setCurrentCompany} />;
  }

  const getViewTitle = (view: View): string => {
    const titles: Record<View, string> = {
      dashboard: 'Dashboard',
      agents: 'Agentes',
      chat: 'Conversas',
      'message-log': 'Log de mensagens',
      'assistente-ia': 'Assistente IA',
      knowledge: 'Base de Conhecimento',
      customers: 'Clientes',
      tasks: 'Tarefas',
      'tasks-settings': 'Etapas do Kanban',
      agenda: 'Agenda',
      'agenda-settings': 'Ajustes da Agenda',
      attendance: 'Atendimentos',
      'attendance-settings': 'Atendimento — Ajustes',
      settings: 'Configurações',
      users: 'Usuários',
      'global-admin': 'Administração Global',
      'admin-client-info-forms': 'Formulários de Coleta',
      profile: 'Meu Perfil'
    };
    return titles[view] || view;
  };

  const renderView = () => {
    // Global admin sem empresa selecionada: páginas de contexto de empresa não estão disponíveis
    const needsCompany: View[] = ['dashboard', 'agents', 'chat', 'message-log', 'assistente-ia', 'knowledge', 'customers', 'tasks', 'tasks-settings', 'agenda', 'agenda-settings', 'attendance', 'attendance-settings', 'settings', 'users'];
    if (!currentCompany && isGlobalAdmin && needsCompany.includes(currentView)) {
      return <GlobalAdminPage />;
    }

    switch (currentView) {
      case 'dashboard': return <DashboardPage />;
      case 'agents': return <AgentsPage />;
      case 'chat': return <ChatPage initialPhone={chatOpenPhone} onPhoneHandled={() => setChatOpenPhone(null)} />;
      case 'message-log': return <MessageLogPage />;
      case 'assistente-ia':
        return (
          <AssistanteIAPage
            focusTranscriptionId={assistFocusTranscriptionId}
            onTranscriptionFocusHandled={() => setAssistFocusTranscriptionId(null)}
          />
        );
      case 'knowledge': return <KnowledgeBasePage />;
      case 'customers': return (
        <CustomersPage
          initialPhone={customerOpenPhone}
          onPhoneHandled={() => setCustomerOpenPhone(null)}
          initialClientId={customerOpenId}
          onClientIdHandled={() => setCustomerOpenId(null)}
        />
      );
      case 'tasks': return <TasksPage />;
      case 'tasks-settings': return <TaskStatusSettings />;
      case 'agenda': return (
        <AgendaPage
          onOpenSettings={() => handleViewChange('agenda-settings')}
          initialAppointmentId={appointmentOpenId}
          onAppointmentIdHandled={() => setAppointmentOpenId(null)}
        />
      );
      case 'agenda-settings': return <AgendaSettingsPage />;
      case 'attendance': return (
        <AttendancePage
          onOpenSettings={() => handleViewChange('attendance-settings')}
          initialAttendanceId={attendanceOpenId}
          onAttendanceIdHandled={() => setAttendanceOpenId(null)}
        />
      );
      case 'attendance-settings': return <AttendanceSettingsPage />;
      case 'settings': return <SettingsPage />;
      case 'users': return <UsersPage />;
      case 'global-admin': return <GlobalAdminPage />;
      case 'admin-client-info-forms': return <AdminClientInfoFormsPage />;
      case 'profile': return <ProfilePage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-900 overflow-hidden font-sans">
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        companyName={currentCompany?.name || ''}
        companyId={currentCompany?.id}
        isGlobalAdmin={isGlobalAdmin}
        userEmail={user?.email || ''}
        userName={userName}
        allCompanies={allCompanies}
        currentCompanyId={currentCompany?.id}
        onCompanyChange={handleCompanyChange}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          viewTitle={getViewTitle(currentView)} 
          userName={user.email || 'User'}
          companyId={currentCompany?.id}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-900">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <CompanyProvider>
      <NotificationsProvider>
        <AppContent />
      </NotificationsProvider>
    </CompanyProvider>
  );
};

export default App;
