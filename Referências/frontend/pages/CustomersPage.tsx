
import React, { useState, useEffect } from 'react';
import { ContactAvatar } from '../components/ContactAvatar';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../hooks/useAuth';
import { useGlobalAdmin } from '../hooks/useGlobalAdmin';
import { Customer, SportItem, Ponto } from '../types';
import * as clientsService from '../services/clientsService';
import * as clientTypesService from '../services/clientTypesService';
import type { ClientType } from '../services/clientTypesService';
import * as companyUsersService from '../services/companyUsersService';
import * as pontosService from '../services/pontosService';
import * as attendancesService from '../services/attendancesService';
import type { AttendanceListItem } from '../services/attendancesService';
import { AttendanceFormDialog } from '../components/Attendance/AttendanceFormDialog';
import { EntityShortId } from '../components/EntityShortId';
import { ClientInfoAnswersCard, ClientInfoFormsTab } from '../components/Customers/ClientInfoFormsTab';

/** Normaliza esportes/interesses para exibição: usa ai_sports (objetos) ou parse de ai_interest (strings JSON). */
function getSportsDisplayItems(customer: Customer | null): SportItem[] {
  if (!customer) return [];
  if (Array.isArray(customer.ai_sports) && customer.ai_sports.length > 0) {
    return customer.ai_sports.map((item) =>
      typeof item === 'object' && item !== null && 'name' in item
        ? { name: (item as SportItem).name, type: (item as SportItem).type, courts: (item as SportItem).courts }
        : { name: String(item) }
    );
  }
  if (customer.ai_interest?.length) {
    return customer.ai_interest.map((s) => {
      try {
        const parsed = JSON.parse(s) as Record<string, unknown>;
        if (parsed && typeof parsed === 'object') {
          return {
            name: typeof parsed.name === 'string' ? parsed.name : undefined,
            type: typeof parsed.type === 'string' ? parsed.type : undefined,
            courts: typeof parsed.courts === 'number' ? parsed.courts : undefined,
          };
        }
      } catch {
        // não é JSON, exibe como nome único
      }
      return { name: s };
    });
  }
  return [];
}

const DEFAULT_CLIENT_TYPES: Pick<ClientType, 'value' | 'label'>[] = [
  { value: 'client', label: 'Cliente' },
  { value: 'admin', label: 'Admin' },
];

interface CustomersPageProps {
  initialPhone?: string | null;
  onPhoneHandled?: () => void;
  initialClientId?: string | null;
  onClientIdHandled?: () => void;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({ initialPhone, onPhoneHandled, initialClientId, onClientIdHandled }) => {
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const { isGlobalAdmin } = useGlobalAdmin(user ?? null);
  const [clientTypes, setClientTypes] = useState<Pick<ClientType, 'value' | 'label'>[]>(DEFAULT_CLIENT_TYPES);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // --- Tabs ---
  const [viewTab, setViewTab] = useState<'dados' | 'pontos' | 'atendimentos' | 'formularios'>('dados');

  // --- Pontos ---
  const [canManagePontos, setCanManagePontos] = useState(false);
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [pontosTotal, setPontosTotal] = useState(0);
  const [pontosLoading, setPontosLoading] = useState(false);
  const [pontosError, setPontosError] = useState<string | null>(null);
  const [showAddPonto, setShowAddPonto] = useState(false);
  const [addPontoValue, setAddPontoValue] = useState(1);
  const [addPontoDesc, setAddPontoDesc] = useState('');
  const [addPontoAttendanceId, setAddPontoAttendanceId] = useState<string>('');
  const [addPontoSaving, setAddPontoSaving] = useState(false);

  // --- Atendimentos do cliente ---
  const [clientAttendances, setClientAttendances] = useState<AttendanceListItem[]>([]);
  const [clientAttendancesLoading, setClientAttendancesLoading] = useState(false);
  const [clientAttendancesError, setClientAttendancesError] = useState<string | null>(null);
  const [clientAttFrom, setClientAttFrom] = useState<string>('');
  const [clientAttTo, setClientAttTo] = useState<string>('');
  const [attendanceFormOpen, setAttendanceFormOpen] = useState(false);
  const [editAttendanceId, setEditAttendanceId] = useState<string | null>(null);
  const [newCustomer, setNewCustomer] = useState({
    chatlid: '',
    phone: '',
    chatname: '',
    sendername: '',
    senderphoto: '',
    ai_name: '',
    ai_city: '',
    ai_state: '',
    ai_email: '',
    ai_client_type: '',
    ai_interest: [] as string[],
    ai_marketing: false,
    iaservice: true,
    isblock: false,
    user_type: 'client' as string
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIaActive, setFilterIaActive] = useState<boolean | undefined>(undefined);
  const [filterBlocked, setFilterBlocked] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const PAGE_SIZE = 50;

  // Carregar tipos de cliente da tabela client_types
  useEffect(() => {
    if (!currentCompany) return;
    clientTypesService.getClientTypes(currentCompany.id).then((types) => {
      if (types.length > 0) {
        setClientTypes(types);
      }
    }).catch(() => {});
  }, [currentCompany]);

  // Carregar clients quando a company ou filtros mudarem
  useEffect(() => {
    if (currentCompany) {
      loadCustomers(0);
    }
  }, [currentCompany, searchTerm, filterIaActive, filterBlocked]);

  // Abrir cliente automaticamente se initialPhone for passado
  useEffect(() => {
    if (!initialPhone || !currentCompany) return;

    clientsService.findClientByPhone(currentCompany.id, initialPhone).then(customer => {
      if (customer) {
        handleView(customer);
      } else {
        setNewCustomer(prev => ({ ...prev, phone: initialPhone }));
        setIsCreating(true);
      }
    }).finally(() => {
      setTimeout(() => { onPhoneHandled?.(); }, 100);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPhone, currentCompany]);

  // Abrir cliente diretamente pelo ID (vindo da busca global)
  useEffect(() => {
    if (!initialClientId || !currentCompany) return;
    clientsService.getClientById(initialClientId).then(customer => {
      if (customer) handleView(customer);
    }).finally(() => {
      setTimeout(() => { onClientIdHandled?.(); }, 100);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialClientId, currentCompany]);

  const loadCustomers = async (page = 0) => {
    if (!currentCompany) return;

    try {
      setLoading(true);
      setError(null);
      const result = await clientsService.getClientsWithMeta(currentCompany.id, {
        search: searchTerm || undefined,
        iaActive: filterIaActive,
        isBlocked: filterBlocked,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE
      });
      setCustomers(result.data);
      setTotalCustomers(result.total);
      setCurrentPage(page);
    } catch (err: any) {
      console.error('Erro ao carregar clients:', err);
      setError(err.message || 'Erro ao carregar clients');
    } finally {
      setLoading(false);
    }
  };

  // Verificar se o usuário logado pode gerenciar pontos (admin ou operator)
  useEffect(() => {
    if (isGlobalAdmin) { setCanManagePontos(true); return; }
    if (!currentCompany || !user) { setCanManagePontos(false); return; }
    companyUsersService.getCompanyUsers(currentCompany.id).then(users => {
      const me = users.find(u => u.user_id === user.id);
      setCanManagePontos(!!me && (me.role === 'admin' || me.role === 'operator'));
    }).catch(() => setCanManagePontos(false));
  }, [currentCompany, user, isGlobalAdmin]);

  const loadPontos = async (clientId: string) => {
    if (!currentCompany) return;
    setPontosLoading(true);
    setPontosError(null);
    try {
      const [list, total] = await Promise.all([
        pontosService.getPontos(currentCompany.id, clientId),
        pontosService.getPontosTotal(currentCompany.id, clientId),
      ]);
      setPontos(list);
      setPontosTotal(total);
    } catch (err: any) {
      setPontosError(err.message || 'Erro ao carregar pontos');
    } finally {
      setPontosLoading(false);
    }
  };

  const handleView = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsViewing(true);
    setViewTab('dados');
    setPontos([]);
    setPontosTotal(0);
    setShowAddPonto(false);
    setClientAttendances([]);
    setClientAttendancesError(null);
    setClientAttFrom('');
    setClientAttTo('');
    setAttendanceFormOpen(false);
    setEditAttendanceId(null);
    if (!currentCompany) return;
    try {
      const full = await clientsService.getClientById(customer.id);
      if (full) setSelectedCustomer(full);
    } catch {
      // mantém o customer da lista em caso de erro
    }
  };

  const loadClientAttendances = async (clientId: string) => {
    if (!currentCompany) return;
    setClientAttendancesLoading(true);
    setClientAttendancesError(null);
    try {
      const list = await attendancesService.getAttendances({
        companyId: currentCompany.id,
        clientId,
        dateFrom: clientAttFrom ? `${clientAttFrom}T00:00:00` : undefined,
        dateTo: clientAttTo ? `${clientAttTo}T23:59:59` : undefined,
      });
      setClientAttendances(list);
    } catch (err: any) {
      setClientAttendancesError(err?.message || 'Erro ao carregar atendimentos');
    } finally {
      setClientAttendancesLoading(false);
    }
  };

  useEffect(() => {
    if (viewTab === 'pontos' && selectedCustomer) {
      loadPontos(selectedCustomer.id);
    }
    if (viewTab === 'atendimentos' && selectedCustomer) {
      loadClientAttendances(selectedCustomer.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewTab, selectedCustomer?.id, clientAttFrom, clientAttTo]);

  const handleAddPonto = async () => {
    if (!currentCompany || !selectedCustomer) return;
    setAddPontoSaving(true);
    try {
      await pontosService.addPonto(
        currentCompany.id,
        selectedCustomer.id,
        addPontoValue,
        addPontoDesc || undefined,
        addPontoAttendanceId || null
      );
      setAddPontoValue(1);
      setAddPontoDesc('');
      setAddPontoAttendanceId('');
      setShowAddPonto(false);
      await loadPontos(selectedCustomer.id);
    } catch (err: any) {
      setPontosError(err.message || 'Erro ao adicionar ponto');
    } finally {
      setAddPontoSaving(false);
    }
  };

  useEffect(() => {
    if (showAddPonto && selectedCustomer && currentCompany && clientAttendances.length === 0) {
      attendancesService
        .getAttendances({ companyId: currentCompany.id, clientId: selectedCustomer.id })
        .then(setClientAttendances)
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAddPonto, selectedCustomer?.id, currentCompany?.id]);

  const handleDeletePonto = async (pontoId: string) => {
    if (!selectedCustomer) return;
    try {
      await pontosService.deletePonto(pontoId);
      await loadPontos(selectedCustomer.id);
    } catch (err: any) {
      setPontosError(err.message || 'Erro ao remover ponto');
    }
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer({ ...customer });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!selectedCustomer) return;

    try {
      setSaving(true);
      setError(null);
      const updated = await clientsService.updateClient(selectedCustomer.id, {
        user_type: selectedCustomer.user_type,
        sendername: selectedCustomer.sendername,
        ai_name: selectedCustomer.ai_name,
        ai_city: selectedCustomer.ai_city,
        ai_state: selectedCustomer.ai_state,
        ai_email: selectedCustomer.ai_email,
        ai_interest: selectedCustomer.ai_interest,
        ai_marketing: selectedCustomer.ai_marketing,
        ai_client_type: selectedCustomer.ai_client_type,
        ai_company: selectedCustomer.ai_company,
        ai_courts: selectedCustomer.ai_courts,
        ai_social: selectedCustomer.ai_social,
        iaservice: selectedCustomer.iaservice,
        isblock: selectedCustomer.isblock
      });
      
      setCustomers(customers.map(c => c.id === updated.id ? updated : c));
      setIsEditing(false);
      setSelectedCustomer(null);
    } catch (err: any) {
      console.error('Erro ao salvar client:', err);
      setError(err.message || 'Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  const addInterest = (interest: string) => {
    if (!interest.trim() || !selectedCustomer) return;
    if (selectedCustomer.ai_interest.includes(interest)) return;
    setSelectedCustomer({
      ...selectedCustomer,
      ai_interest: [...selectedCustomer.ai_interest, interest]
    });
  };

  const removeInterest = (interest: string) => {
    if (!selectedCustomer) return;
    setSelectedCustomer({
      ...selectedCustomer,
      ai_interest: selectedCustomer.ai_interest.filter(i => i !== interest)
    });
  };

  const handleCreate = () => {
    setNewCustomer({
      chatlid: '',
      phone: '',
      chatname: '',
      sendername: '',
      senderphoto: '',
      ai_name: '',
      ai_city: '',
      ai_state: '',
      ai_email: '',
      ai_client_type: '',
      ai_interest: [],
      ai_marketing: false,
      iaservice: true,
      isblock: false
    });
    setError(null);
    setIsCreating(true);
  };

  const handleCreateSave = async () => {
    if (!currentCompany) return;

    // Validações
    if (!newCustomer.phone || newCustomer.phone.trim() === '') {
      setError('O telefone (phone) é obrigatório e é a referência principal do cliente.');
      return;
    }

    // Validar formato do phone (apenas números, sem espaços ou caracteres especiais)
    const phoneRegex = /^[0-9]+$/;
    if (!phoneRegex.test(newCustomer.phone.replace(/\s/g, ''))) {
      setError('O telefone deve conter apenas números. Exemplo: 554599934556');
      return;
    }

    if (!newCustomer.chatlid || newCustomer.chatlid.trim() === '') {
      setError('O Chat ID (chatlid) é obrigatório.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const created = await clientsService.createClient(currentCompany.id, {
        user_type: newCustomer.user_type,
        chatlid: newCustomer.chatlid.trim(),
        phone: newCustomer.phone.replace(/\s/g, ''), // Remove espaços
        chatname: newCustomer.chatname.trim() || null,
        sendername: newCustomer.sendername.trim() || null,
        senderphoto: newCustomer.senderphoto.trim() || null,
        ai_name: newCustomer.ai_name.trim() || null,
        ai_city: newCustomer.ai_city.trim() || null,
        ai_state: newCustomer.ai_state.trim() || null,
        ai_email: newCustomer.ai_email.trim() || null,
        ai_client_type: newCustomer.ai_client_type.trim() || null,
        ai_interest: newCustomer.ai_interest.length > 0 ? newCustomer.ai_interest : null,
        ai_marketing: newCustomer.ai_marketing,
        iaservice: newCustomer.iaservice,
        isblock: newCustomer.isblock
      });

      setCustomers([created, ...customers]);
      setIsCreating(false);
      setNewCustomer({
        chatlid: '',
        phone: '',
        chatname: '',
        sendername: '',
        senderphoto: '',
        ai_name: '',
        ai_city: '',
        ai_state: '',
        ai_email: '',
        ai_client_type: '',
        ai_interest: [],
        ai_marketing: false,
        iaservice: true,
        isblock: false,
        user_type: 'client'
      });
    } catch (err: any) {
      console.error('Erro ao criar client:', err);
      setError(err.message || 'Erro ao criar cliente');
    } finally {
      setSaving(false);
    }
  };

  const addNewInterest = (interest: string) => {
    if (!interest.trim()) return;
    if (newCustomer.ai_interest.includes(interest)) return;
    setNewCustomer({
      ...newCustomer,
      ai_interest: [...newCustomer.ai_interest, interest]
    });
  };

  const removeNewInterest = (interest: string) => {
    setNewCustomer({
      ...newCustomer,
      ai_interest: newCustomer.ai_interest.filter(i => i !== interest)
    });
  };

  if (isCreating) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsCreating(false)} className="size-10 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h2 className="text-3xl font-bold text-white">Criar Cliente Manualmente</h2>
              <p className="text-slate-400 text-sm">⚠️ Use apenas em casos esporádicos. A criação normal é feita via n8n.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setIsCreating(false)} className="h-11 px-6 rounded-xl border border-slate-700 text-slate-400 font-bold hover:bg-slate-700 transition-all">Cancelar</button>
            <button 
              onClick={handleCreateSave} 
              disabled={saving}
              className="h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Criando...' : 'Criar Cliente'}
            </button>
          </div>
        </div>

        {/* Aviso sobre criação manual */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 space-y-3">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-400 text-2xl">warning</span>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-amber-400 mb-2">Atenção: Criação Manual</h3>
              <p className="text-sm text-amber-300/90 mb-3">
                A criação manual de clientes deve ser feita <strong>apenas em casos esporádicos</strong>. 
                O processo normal de criação é feito automaticamente via <strong>n8n</strong> quando um novo contato inicia uma conversa.
              </p>
              <div className="bg-amber-500/20 rounded-lg p-4 space-y-2">
                <p className="text-xs font-bold text-amber-300 uppercase mb-2">⚠️ Cuidados com o Formato dos Dados:</p>
                <ul className="text-xs text-amber-200/90 space-y-1 list-disc list-inside">
                  <li><strong>Phone:</strong> Deve ser único no sistema. Use apenas números, sem espaços, hífens ou parênteses. Exemplo: <code className="bg-amber-900/30 px-1 rounded">554599934556</code></li>
                  <li><strong>Chat ID:</strong> Formato específico do WhatsApp. Exemplo: <code className="bg-amber-900/30 px-1 rounded">554599934556@c.us</code></li>
                  <li><strong>Chat Name:</strong> Nome exibido no chat (pode ser diferente do nome real)</li>
                  <li><strong>Sender Name:</strong> Nome do remetente (se disponível)</li>
                  <li>Certifique-se de que o <strong>phone não existe</strong> antes de criar, pois é a referência principal e deve ser único.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Lateral: Informações Básicas */}
          <div className="space-y-6">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Informações Básicas</h3>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Tipo de Usuário</label>
                <select
                  value={newCustomer.user_type}
                  onChange={(e) => setNewCustomer({...newCustomer, user_type: e.target.value})}
                  className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {clientTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">
                  Telefone (Phone) <span className="text-red-400">*</span>
                </label>
                <input 
                  type="text" 
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value.replace(/\D/g, '')})}
                  className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="554599934556"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">Apenas números. Este campo é único e obrigatório.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">
                  Chat ID (Chatlid) <span className="text-red-400">*</span>
                </label>
                <input 
                  type="text" 
                  value={newCustomer.chatlid}
                  onChange={(e) => setNewCustomer({...newCustomer, chatlid: e.target.value})}
                  className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="554599934556@c.us"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">ID do chat no WhatsApp.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Nome no Chat</label>
                <input 
                  type="text" 
                  value={newCustomer.chatname}
                  onChange={(e) => setNewCustomer({...newCustomer, chatname: e.target.value})}
                  className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="Nome exibido no chat"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Nome do Remetente</label>
                <input 
                  type="text" 
                  value={newCustomer.sendername}
                  onChange={(e) => setNewCustomer({...newCustomer, sendername: e.target.value})}
                  className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="Nome do remetente"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">URL da Foto</label>
                <input 
                  type="url" 
                  value={newCustomer.senderphoto}
                  onChange={(e) => setNewCustomer({...newCustomer, senderphoto: e.target.value})}
                  className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-700">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-2">Status IA</label>
                  <button 
                    onClick={() => setNewCustomer({...newCustomer, iaservice: !newCustomer.iaservice})}
                    className={`w-full text-xs font-bold px-3 py-2 rounded-lg transition-all ${newCustomer.iaservice ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
                  >
                    {newCustomer.iaservice ? 'ATIVA' : 'OFF'}
                  </button>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase mb-2">Bloqueio</label>
                  <button 
                    onClick={() => setNewCustomer({...newCustomer, isblock: !newCustomer.isblock})}
                    className={`w-full text-xs font-bold px-3 py-2 rounded-lg transition-all ${newCustomer.isblock ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}
                  >
                    {newCustomer.isblock ? 'BLOQUEADO' : 'LIBERADO'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Central: Dados da IA */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-xl space-y-8">
              <div className="flex items-center gap-3 border-b border-slate-700 pb-4">
                <span className="material-symbols-outlined text-blue-500">psychology</span>
                <h3 className="text-xl font-bold text-white">Informações da IA (Opcional)</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Tipo de Cliente (IA)</label>
                  <input 
                    type="text" 
                    value={newCustomer.ai_client_type}
                    onChange={(e) => setNewCustomer({...newCustomer, ai_client_type: e.target.value})}
                    className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="Ex: Mensalista, Avulso"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Nome Identificado</label>
                  <input 
                    type="text" 
                    value={newCustomer.ai_name}
                    onChange={(e) => setNewCustomer({...newCustomer, ai_name: e.target.value})}
                    className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="Nome extraído pela IA"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">E-mail</label>
                  <input 
                    type="email" 
                    value={newCustomer.ai_email}
                    onChange={(e) => setNewCustomer({...newCustomer, ai_email: e.target.value})}
                    className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Cidade</label>
                  <input 
                    type="text" 
                    value={newCustomer.ai_city}
                    onChange={(e) => setNewCustomer({...newCustomer, ai_city: e.target.value})}
                    className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="Cidade"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Estado</label>
                  <input 
                    type="text" 
                    value={newCustomer.ai_state}
                    onChange={(e) => setNewCustomer({...newCustomer, ai_state: e.target.value.toUpperCase().slice(0, 2)})}
                    className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="PR"
                    maxLength={2}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Interesses / Tags</label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-900 rounded-xl border border-slate-700 mb-3 min-h-[50px]">
                  {newCustomer.ai_interest.map(interest => (
                    <span key={interest} className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                      {interest}
                      <button onClick={() => removeNewInterest(interest)} className="hover:text-red-300 transition-colors">
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    </span>
                  ))}
                  {newCustomer.ai_interest.length === 0 && <span className="text-slate-600 text-xs italic">Nenhum interesse adicionado.</span>}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    onKeyDown={(e) => { 
                      if(e.key === 'Enter') { 
                        addNewInterest((e.target as HTMLInputElement).value); 
                        (e.target as HTMLInputElement).value = ''; 
                      } 
                    }}
                    className="flex-1 h-10 bg-slate-900 border border-slate-700 rounded-lg px-4 text-white text-xs" 
                    placeholder="Adicionar interesse..." 
                  />
                  <button 
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      addNewInterest(input.value);
                      input.value = '';
                    }}
                    className="px-4 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold text-xs"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-700">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={newCustomer.ai_marketing} 
                    onChange={(e) => setNewCustomer({...newCustomer, ai_marketing: e.target.checked})}
                    className="size-5 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-800"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">Permissão de Marketing</span>
                    <span className="text-xs text-slate-500">Cliente autorizou envio de promoções.</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isViewing && selectedCustomer) {
    return (
      <>
      <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setIsViewing(false);
                setSelectedCustomer(null);
              }} 
              className="size-10 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h2 className="text-3xl font-bold text-white">Visualizar Cliente</h2>
              <p className="text-slate-400 text-sm">Informações completas do cliente</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('aios:navigate', { detail: { view: 'chat', phone: selectedCustomer.phone } }))}
              className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <span className="material-symbols-outlined text-lg">chat</span>
              Ver Conversa
            </button>
            <button
              onClick={() => {
                setIsViewing(false);
                setIsEditing(true);
              }}
              className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
              Editar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Lateral: Perfil e Status */}
          <div className="space-y-6">
            {/* Card de Perfil */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center">
              <ContactAvatar
                photoUrl={selectedCustomer.senderphoto}
                initial={
                  (selectedCustomer.chatname || selectedCustomer.ai_name || selectedCustomer.phone || '')
                    .trim()
                    .charAt(0)
                    .toUpperCase() || '?'
                }
                className="size-32 border-4 border-slate-700 mb-4 shadow-2xl"
                initialClassName="text-2xl font-bold"
              />
              <h3 className="text-2xl font-bold text-white mb-1">{selectedCustomer.chatname || 'Sem nome'}</h3>
              {selectedCustomer.sendername && (
                <p className="text-sm text-slate-400 mb-2">{selectedCustomer.sendername}</p>
              )}
              <p className="text-sm text-slate-500 font-mono">{selectedCustomer.phone}</p>
              <p className="mt-2">
                <EntityShortId kind="client" id={selectedCustomer.id} className="text-slate-400" />
              </p>

              <div className="w-full grid grid-cols-2 gap-3 mt-6">
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Tipo de Usuário</p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {(clientTypes.find(t => t.value === selectedCustomer.user_type)?.label || selectedCustomer.user_type).toUpperCase()}
                  </span>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Status IA</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                    selectedCustomer.iaservice 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    <span className={`size-1.5 rounded-full ${selectedCustomer.iaservice ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    {selectedCustomer.iaservice ? 'ATIVA' : 'DESLIGADA'}
                  </span>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Acesso</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                    selectedCustomer.isblock 
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {selectedCustomer.isblock ? 'BLOQUEADO' : 'LIBERADO'}
                  </span>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Marketing</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                    selectedCustomer.ai_marketing 
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                      : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                  }`}>
                    {selectedCustomer.ai_marketing ? 'PERMITIDO' : 'NEGADO'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card de Informações de Contato */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500 text-lg">contact_phone</span>
                Informações de Contato
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Telefone</label>
                  <p className="text-sm font-mono text-white bg-slate-900 p-2 rounded border border-slate-700">{selectedCustomer.phone}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Chat ID</label>
                  <p className="text-xs font-mono text-slate-400 truncate bg-slate-900 p-2 rounded border border-slate-700" title={selectedCustomer.chatlid}>
                    {selectedCustomer.chatlid}
                  </p>
                </div>
                {selectedCustomer.ai_email && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">E-mail</label>
                    <p className="text-sm text-white bg-slate-900 p-2 rounded border border-slate-700">{selectedCustomer.ai_email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Card de Metadados */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-500 text-lg">info</span>
                Metadados Técnicos
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ID (Supabase)</label>
                  <p className="text-xs text-slate-300 font-mono bg-slate-900 p-2 rounded border border-slate-700 w-fit max-w-full">
                    <EntityShortId kind="client" id={selectedCustomer.id} className="text-slate-300" />
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Criado em</label>
                  <p className="text-xs text-slate-400">{new Date(selectedCustomer.created_at).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Atualizado em</label>
                  <p className="text-xs text-slate-400">{new Date(selectedCustomer.updated_at).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Central: Dados Detalhados + Pontos */}
          <div className="lg:col-span-2 space-y-6">

            {/* Tab switcher */}
            <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-xl p-1 w-fit">
              <button
                onClick={() => setViewTab('dados')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  viewTab === 'dados'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">person</span>
                  Dados
                </span>
              </button>
              <button
                onClick={() => setViewTab('pontos')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  viewTab === 'pontos'
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">star</span>
                  Pontos
                  {pontosTotal > 0 && (
                    <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                      {pontosTotal}
                    </span>
                  )}
                </span>
              </button>
              <button
                onClick={() => setViewTab('atendimentos')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  viewTab === 'atendimentos'
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">clinical_notes</span>
                  Atendimentos
                  {clientAttendances.length > 0 && viewTab === 'atendimentos' && (
                    <span className="bg-violet-300 text-slate-900 text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                      {clientAttendances.length}
                    </span>
                  )}
                </span>
              </button>
              <button
                onClick={() => setViewTab('formularios')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  viewTab === 'formularios'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">dynamic_form</span>
                  Formulários
                </span>
              </button>
            </div>

            {/* ── ABA PONTOS ── */}
            {viewTab === 'pontos' && (
              <div className="space-y-6 animate-in fade-in duration-300">

                {/* Cartão fidelidade */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-xl space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-amber-400 fill-1">star</span>
                      <h3 className="text-xl font-bold text-white">Pontos do Cliente</h3>
                    </div>
                    <span className="px-3 py-1 bg-amber-400/20 border border-amber-400/40 text-amber-400 text-sm font-black rounded-full">
                      {pontosTotal} {pontosTotal === 1 ? 'ponto' : 'pontos'}
                    </span>
                  </div>

                  {pontosLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="size-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <>
                      {/* Grade de quadrados */}
                      <div className="grid grid-cols-10 gap-2">
                        {Array.from({ length: Math.max(10, Math.ceil((Math.max(pontosTotal, 0)) / 10) * 10) }).map((_, i) => {
                          const filled = i < Math.max(pontosTotal, 0);
                          return (
                            <div
                              key={i}
                              title={filled ? `Ponto ${i + 1}` : undefined}
                              className={`size-10 flex items-center justify-center rounded-xl border transition-all ${
                                filled
                                  ? 'bg-amber-400/20 border-amber-400 shadow-sm shadow-amber-400/20'
                                  : 'bg-slate-700/50 border-slate-600'
                              }`}
                            >
                              <span className={`material-symbols-outlined text-base ${filled ? 'text-amber-400 fill-1' : 'text-slate-600'}`}>
                                star
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {pontosError && (
                        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">{pontosError}</p>
                      )}

                      {/* Botão adicionar ponto */}
                      {canManagePontos && !showAddPonto && (
                        <button
                          onClick={() => { setShowAddPonto(true); setPontosError(null); }}
                          className="h-10 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
                        >
                          <span className="material-symbols-outlined text-base">add</span>
                          Adicionar ponto
                        </button>
                      )}

                      {/* Form de adição */}
                      {canManagePontos && showAddPonto && (
                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-4 animate-in fade-in duration-200">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Novo registro de ponto</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-widest">Quantidade</label>
                              <input
                                type="number"
                                value={addPontoValue}
                                onChange={e => setAddPontoValue(Number(e.target.value))}
                                className="w-full h-10 bg-slate-800 border border-slate-700 rounded-xl px-3 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                              />
                              <p className="text-[10px] text-slate-500 mt-1">Negativo para estorno</p>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-widest">Descrição (opcional)</label>
                              <input
                                type="text"
                                value={addPontoDesc}
                                onChange={e => setAddPontoDesc(e.target.value)}
                                placeholder="Ex: Compra #123"
                                className="w-full h-10 bg-slate-800 border border-slate-700 rounded-xl px-3 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-widest">
                              Vincular a atendimento (opcional)
                            </label>
                            <select
                              value={addPontoAttendanceId}
                              onChange={(e) => setAddPontoAttendanceId(e.target.value)}
                              className="w-full h-10 bg-slate-800 border border-slate-700 rounded-xl px-3 text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                            >
                              <option value="">— Sem vínculo —</option>
                              {clientAttendances.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {(a.attended_at || a.created_at
                                    ? new Date(a.attended_at || a.created_at).toLocaleDateString('pt-BR')
                                    : '—')} · {a.type_name}
                                </option>
                              ))}
                            </select>
                            {clientAttendances.length === 0 && (
                              <p className="text-[10px] text-slate-500 mt-1">
                                Nenhum atendimento disponível para vincular.
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setShowAddPonto(false); setAddPontoValue(1); setAddPontoDesc(''); setAddPontoAttendanceId(''); }}
                              className="h-9 px-4 rounded-xl border border-slate-700 text-slate-400 text-sm font-bold hover:bg-slate-700 transition-all"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleAddPonto}
                              disabled={addPontoSaving || addPontoValue === 0}
                              className="h-9 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                              {addPontoSaving && <div className="size-3 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />}
                              Confirmar
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Histórico */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
                  <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-400">history</span>
                      <span className="text-sm font-bold text-white">Histórico de pontos</span>
                      <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs font-bold rounded-full">{pontos.length}</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    {pontos.length === 0 ? (
                      <div className="py-10 text-center text-slate-500">
                        <span className="material-symbols-outlined text-4xl block mb-2">star_border</span>
                        Nenhum registro ainda.
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-900/50 text-xs uppercase text-slate-500 font-bold">
                            <th className="px-6 py-3">Data</th>
                            <th className="px-6 py-3">Operador</th>
                            <th className="px-6 py-3">Qtd</th>
                            <th className="px-6 py-3">Serviço</th>
                            <th className="px-6 py-3">Descrição</th>
                            {canManagePontos && <th className="px-6 py-3"></th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                          {pontos.map(p => (
                            <tr key={p.id} className="hover:bg-slate-700/30 transition-colors group">
                              <td className="px-6 py-3 text-xs text-slate-400 whitespace-nowrap">
                                {new Date(p.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                              </td>
                              <td className="px-6 py-3 text-sm text-slate-300">{p.inserted_by_name || '—'}</td>
                              <td className="px-6 py-3">
                                <span className={`text-sm font-black ${p.points > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                                  {p.points > 0 ? `+${p.points}` : p.points}
                                </span>
                              </td>
                              <td className="px-6 py-3 text-sm">
                                {p.attendance_id ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditAttendanceId(p.attendance_id!);
                                      setAttendanceFormOpen(true);
                                    }}
                                    title="Abrir atendimento vinculado"
                                    className="inline-flex items-center gap-1.5 text-violet-300 hover:text-violet-200 font-medium"
                                  >
                                    <span className="material-symbols-outlined text-sm">clinical_notes</span>
                                    <span className="truncate max-w-[16rem]">
                                      {p.attendance_type_name || 'Atendimento'}
                                      {p.attendance_attended_at && (
                                        <span className="text-slate-500 font-normal"> · {new Date(p.attendance_attended_at).toLocaleDateString('pt-BR')}</span>
                                      )}
                                    </span>
                                  </button>
                                ) : (
                                  <span className="text-slate-600">—</span>
                                )}
                              </td>
                              <td className="px-6 py-3 text-sm text-slate-400">{p.description || '—'}</td>
                              {canManagePontos && (
                                <td className="px-6 py-3">
                                  <button
                                    onClick={() => handleDeletePonto(p.id)}
                                    title="Remover registro"
                                    className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all"
                                  >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* ── ABA ATENDIMENTOS ── */}
            {viewTab === 'atendimentos' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
                  <div className="p-6 border-b border-slate-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-violet-400">clinical_notes</span>
                      <div>
                        <h3 className="text-xl font-bold text-white">Atendimentos do Cliente</h3>
                        <p className="text-xs text-slate-500">
                          {clientAttendances.length === 1
                            ? '1 atendimento'
                            : `${clientAttendances.length} atendimentos`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setEditAttendanceId(null);
                        setAttendanceFormOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold shadow-lg shadow-violet-600/20 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">add</span>
                      Novo atendimento
                    </button>
                  </div>

                  <div className="p-6 border-b border-slate-700 flex flex-col sm:flex-row sm:items-end gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                        Data inicial
                      </label>
                      <input
                        type="date"
                        value={clientAttFrom}
                        onChange={(e) => setClientAttFrom(e.target.value)}
                        className="w-full h-10 bg-slate-900 border border-slate-700 rounded-xl px-3 text-sm text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                        Data final
                      </label>
                      <input
                        type="date"
                        value={clientAttTo}
                        onChange={(e) => setClientAttTo(e.target.value)}
                        className="w-full h-10 bg-slate-900 border border-slate-700 rounded-xl px-3 text-sm text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                      />
                    </div>
                    {(clientAttFrom || clientAttTo) && (
                      <button
                        type="button"
                        onClick={() => {
                          setClientAttFrom('');
                          setClientAttTo('');
                        }}
                        className="h-10 px-4 rounded-xl border border-slate-700 text-slate-400 text-xs font-bold hover:bg-slate-700 transition-all flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                        Limpar
                      </button>
                    )}
                  </div>

                  {clientAttendancesError && (
                    <div className="m-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                      {clientAttendancesError}
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    {clientAttendancesLoading ? (
                      <div className="py-12 flex items-center justify-center">
                        <div className="size-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : clientAttendances.length === 0 ? (
                      <div className="py-12 text-center text-slate-500">
                        <span className="material-symbols-outlined text-4xl block mb-2">clinical_notes</span>
                        {clientAttFrom || clientAttTo
                          ? 'Nenhum atendimento neste período.'
                          : 'Nenhum atendimento registrado para este cliente.'}
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-900/50 text-xs uppercase text-slate-500 font-bold tracking-wider">
                            <th className="px-6 py-3 w-28">ID</th>
                            <th className="px-6 py-3">Data</th>
                            <th className="px-6 py-3">Tipo</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Anotações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                          {clientAttendances.map((a) => (
                            <tr
                              key={a.id}
                              onClick={() => {
                                setEditAttendanceId(a.id);
                                setAttendanceFormOpen(true);
                              }}
                              className="hover:bg-slate-700/30 transition-colors cursor-pointer group"
                            >
                              <td className="px-6 py-3 align-top">
                                <EntityShortId kind="attendance" id={a.id} className="text-slate-400" />
                              </td>
                              <td className="px-6 py-3 text-xs text-slate-300 whitespace-nowrap">
                                {a.attended_at || a.created_at
                                  ? new Date(a.attended_at || a.created_at).toLocaleString('pt-BR', {
                                      dateStyle: 'short',
                                      timeStyle: 'short',
                                    })
                                  : '—'}
                              </td>
                              <td className="px-6 py-3 text-sm text-white font-medium">{a.type_name}</td>
                              <td className="px-6 py-3">
                                <span className="inline-flex px-2 py-0.5 rounded-lg bg-slate-700/80 text-slate-200 text-xs font-bold">
                                  {({
                                    open: 'Aberto',
                                    in_progress: 'Em andamento',
                                    completed: 'Concluído',
                                    cancelled: 'Cancelado',
                                  } as Record<string, string>)[a.status] ?? a.status}
                                </span>
                              </td>
                              <td className="px-6 py-3 text-xs text-slate-400 max-w-md truncate">
                                {a.notes || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── ABA FORMULÁRIOS ── */}
            {viewTab === 'formularios' && currentCompany && (
              <ClientInfoFormsTab
                companyId={currentCompany.id}
              />
            )}

            {/* ── ABA DADOS ── */}
            {viewTab === 'dados' && (
            <div className="space-y-6 animate-in fade-in duration-300">

            {/* Card de Informações Básicas */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-xl space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-700 pb-4">
                <span className="material-symbols-outlined text-blue-500">person</span>
                <h3 className="text-xl font-bold text-white">Informações Básicas</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Nome no Chat</label>
                  <p className="text-sm text-white bg-slate-900 p-3 rounded-xl border border-slate-700">
                    {selectedCustomer.chatname || <span className="text-slate-500 italic">Não informado</span>}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Nome do Remetente</label>
                  <p className="text-sm text-white bg-slate-900 p-3 rounded-xl border border-slate-700">
                    {selectedCustomer.sendername || <span className="text-slate-500 italic">Não informado</span>}
                  </p>
                </div>
                {selectedCustomer.senderphoto && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">URL da Foto</label>
                    <p className="text-xs text-slate-400 font-mono bg-slate-900 p-3 rounded-xl border border-slate-700 break-all">
                      {selectedCustomer.senderphoto}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <ClientInfoAnswersCard clientId={selectedCustomer.id} />

            </div>
            )}

          </div>
        </div>
      </div>

      {currentCompany && (
        <AttendanceFormDialog
          open={attendanceFormOpen}
          companyId={currentCompany.id}
          clientId={selectedCustomer.id}
          attendanceId={editAttendanceId}
          onClose={() => {
            setAttendanceFormOpen(false);
            setEditAttendanceId(null);
          }}
          onSaved={() => {
            setAttendanceFormOpen(false);
            setEditAttendanceId(null);
            loadClientAttendances(selectedCustomer.id);
            loadPontos(selectedCustomer.id);
          }}
        />
      )}
      </>
    );
  }

  if (isEditing && selectedCustomer) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsEditing(false)} className="size-10 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h2 className="text-3xl font-bold text-white">Editar Perfil do Cliente</h2>
              <p className="text-slate-400 text-sm">Informações coletadas via IA e n8n.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setIsEditing(false)} className="h-11 px-6 rounded-xl border border-slate-700 text-slate-400 font-bold hover:bg-slate-700 transition-all">Cancelar</button>
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Lateral: Identidade no Chat */}
          <div className="space-y-6">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center">
              <ContactAvatar
                photoUrl={selectedCustomer.senderphoto}
                initial={
                  (selectedCustomer.chatname || selectedCustomer.ai_name || selectedCustomer.phone || '')
                    .trim()
                    .charAt(0)
                    .toUpperCase() || '?'
                }
                className="size-24 border-4 border-slate-700 mb-4 shadow-2xl"
                initialClassName="text-xl font-bold"
              />
              <h3 className="text-xl font-bold text-white">{selectedCustomer.chatname}</h3>
              <p className="text-sm text-slate-500 font-mono mt-1">{selectedCustomer.phone}</p>
              
              <div className="w-full grid grid-cols-2 gap-2 mt-6">
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Status IA</p>
                  <button 
                    onClick={() => setSelectedCustomer({...selectedCustomer, iaservice: !selectedCustomer.iaservice})}
                    className={`text-xs font-bold px-2 py-1 rounded w-full transition-all ${selectedCustomer.iaservice ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}
                  >
                    {selectedCustomer.iaservice ? 'LIGADA' : 'DESLIGADA'}
                  </button>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Acesso</p>
                  <button 
                    onClick={() => setSelectedCustomer({...selectedCustomer, isblock: !selectedCustomer.isblock})}
                    className={`text-xs font-bold px-2 py-1 rounded w-full transition-all ${selectedCustomer.isblock ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}
                  >
                    {selectedCustomer.isblock ? 'BLOQUEADO' : 'LIBERADO'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Informações Básicas Editáveis</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Tipo de Usuário</label>
                  <select
                    value={selectedCustomer.user_type}
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, user_type: e.target.value})}
                    className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {clientTypes.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">
                    Telefone (Phone)
                  </label>
                  <input
                    type="text"
                    value={selectedCustomer.phone}
                    readOnly
                    className="w-full h-11 bg-slate-900/50 border border-slate-700 rounded-xl px-4 text-slate-400 font-mono cursor-default outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Campo não editável.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">
                    Chat ID (Chatlid)
                  </label>
                  <input
                    type="text"
                    value={selectedCustomer.chatlid}
                    readOnly
                    className="w-full h-11 bg-slate-900/50 border border-slate-700 rounded-xl px-4 text-slate-400 font-mono text-sm cursor-default outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Campo não editável.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Nome no WhatsApp</label>
                  <input
                    type="text"
                    value={selectedCustomer.chatname || ''}
                    readOnly
                    className="w-full h-11 bg-slate-900/50 border border-slate-700 rounded-xl px-4 text-slate-400 cursor-default outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Campo não editável.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Nome de Exibição</label>
                  <input
                    type="text"
                    value={selectedCustomer.sendername || ''}
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, sendername: e.target.value})}
                    className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Nome de exibição"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">URL da Foto</label>
                  <input
                    type="url"
                    value={selectedCustomer.senderphoto || ''}
                    readOnly
                    className="w-full h-11 bg-slate-900/50 border border-slate-700 rounded-xl px-4 text-slate-400 text-sm cursor-default outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Campo não editável.</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Metadados Técnicos</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Criado em</label>
                  <p className="text-xs text-slate-400">{new Date(selectedCustomer.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Atualizado em</label>
                  <p className="text-xs text-slate-400">{new Date(selectedCustomer.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Central: Dados Coletados pela IA */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-xl space-y-8">
              <div className="flex items-center gap-3 border-b border-slate-700 pb-4">
                <span className="material-symbols-outlined text-blue-500">psychology</span>
                <h3 className="text-xl font-bold text-white">Informações Extraídas pela IA</h3>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Tipo de Cliente</label>
                  <input 
                    type="text" 
                    value={selectedCustomer.ai_client_type || ''} 
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, ai_client_type: e.target.value})}
                    className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Nome Identificado</label>
                  <input 
                    type="text" 
                    value={selectedCustomer.ai_name || ''} 
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, ai_name: e.target.value})}
                    className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">E-mail</label>
                  <input 
                    type="email" 
                    value={selectedCustomer.ai_email || ''} 
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, ai_email: e.target.value})}
                    className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Cidade</label>
                  <input 
                    type="text" 
                    value={selectedCustomer.ai_city || ''} 
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, ai_city: e.target.value})}
                    className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Estado</label>
                  <input 
                    type="text" 
                    value={selectedCustomer.ai_state || ''} 
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, ai_state: e.target.value})}
                    className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                    maxLength={2}
                  />
                </div>
                {selectedCustomer.user_type === 'company' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Nome da Arena</label>
                      <input 
                        type="text" 
                        value={selectedCustomer.ai_company || ''} 
                        onChange={(e) => setSelectedCustomer({...selectedCustomer, ai_company: e.target.value})}
                        className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Nº de Quadras</label>
                      <input 
                        type="number" 
                        min={0}
                        value={selectedCustomer.ai_courts ?? ''} 
                        onChange={(e) => setSelectedCustomer({...selectedCustomer, ai_courts: e.target.value === '' ? undefined : parseInt(e.target.value, 10)})}
                        className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Instagram / Redes sociais</label>
                      <input 
                        type="text" 
                        placeholder="Sem @"
                        value={selectedCustomer.ai_social || ''} 
                        onChange={(e) => setSelectedCustomer({...selectedCustomer, ai_social: e.target.value})}
                        className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                      />
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">
                  Esportes / Interesses
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-slate-900 rounded-xl border border-slate-700 mb-3 min-h-[50px]">
                  {selectedCustomer.ai_interest.map(interest => {
                    const display = (() => {
                      try {
                        const p = JSON.parse(interest) as Record<string, unknown>;
                        if (p && typeof p === 'object' && typeof p.name === 'string') {
                          const parts = [p.name];
                          if (typeof p.type === 'string' && p.type) parts.push(p.type);
                          if (typeof p.courts === 'number' && p.courts >= 0) parts.push(`${p.courts} quadras`);
                          return parts.join(' · ');
                        }
                      } catch {
                        // não é JSON
                      }
                      return interest;
                    })();
                    return (
                      <span key={interest} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                        {display}
                        <button onClick={() => removeInterest(interest)} className="hover:text-red-300 transition-colors">
                          <span className="material-symbols-outlined text-xs">close</span>
                        </button>
                      </span>
                    );
                  })}
                  {selectedCustomer.ai_interest.length === 0 && <span className="text-slate-600 text-xs italic">Nenhum esporte ou interesse mapeado.</span>}
                </div>
                <div className="flex gap-2">
                   <input 
                    id="new-interest"
                    type="text" 
                    onKeyDown={(e) => { if(e.key === 'Enter') { addInterest((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }}
                    className="flex-1 h-10 bg-slate-900 border border-slate-700 rounded-lg px-4 text-white text-xs" 
                    placeholder="Adicionar novo interesse..." 
                  />
                   <button 
                    onClick={() => {
                      const input = document.getElementById('new-interest') as HTMLInputElement;
                      addInterest(input.value);
                      input.value = '';
                    }}
                    className="px-4 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold text-xs"
                   >
                     Adicionar
                   </button>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-700">
                 <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedCustomer.ai_marketing} 
                      onChange={(e) => setSelectedCustomer({...selectedCustomer, ai_marketing: e.target.checked})}
                      className="size-5 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-800"
                    />
                    <div className="flex flex-col">
                       <span className="text-sm font-bold text-white">Permissão de Marketing</span>
                       <span className="text-xs text-slate-500">O cliente autorizou o envio de promoções e novidades via chat.</span>
                    </div>
                 </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredCustomers = customers; // Server-side filtering via get_clients RPC

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Meus Clientes</h2>
          <p className="text-slate-400">Gerencie perfis e monitore o comportamento da IA por cliente.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-600/20 group"
        >
          <span className="material-symbols-outlined text-lg group-hover:rotate-90 transition-transform">add_circle</span>
          Novo Cliente
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-700 bg-slate-900/20 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <input 
              className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 text-white text-sm focus:ring-1 focus:ring-blue-500 outline-none" 
              placeholder="Buscar por nome no chat ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-slate-500">search</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterIaActive === undefined ? '' : String(filterIaActive)}
              onChange={(e) => setFilterIaActive(e.target.value === '' ? undefined : e.target.value === 'true')}
              className="h-11 bg-slate-900 border border-slate-700 rounded-xl px-3 text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">IA: Todos</option>
              <option value="true">IA: Ativa</option>
              <option value="false">IA: Inativa</option>
            </select>
            <select
              value={filterBlocked === undefined ? '' : String(filterBlocked)}
              onChange={(e) => setFilterBlocked(e.target.value === '' ? undefined : e.target.value === 'true')}
              className="h-11 bg-slate-900 border border-slate-700 rounded-xl px-3 text-white text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Bloqueado: Todos</option>
              <option value="false">Não bloqueados</option>
              <option value="true">Bloqueados</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          {filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <span className="material-symbols-outlined text-6xl mb-4 block">people</span>
              <p className="text-lg font-bold mb-2">Nenhum cliente encontrado</p>
              <p className="text-sm">
                {searchTerm ? 'Tente buscar com outros termos' : 'Clientes aparecerão aqui quando forem criados'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-700 text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                  <th className="px-6 py-4 w-28">ID</th>
                  <th className="px-6 py-4">Cliente / Chat</th>
                  <th className="px-6 py-4">Telefone / Chat ID</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Informações IA</th>
                  <th className="px-6 py-4 text-center">Status IA</th>
                  <th className="px-6 py-4 text-center">Bloqueio</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-700/30 transition-colors group">
                  <td className="px-6 py-4 align-top">
                    <EntityShortId kind="client" id={customer.id} className="text-slate-400" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <ContactAvatar
                        photoUrl={customer.senderphoto}
                        initial={
                          (customer.chatname || customer.ai_name || customer.phone || '')
                            .trim()
                            .charAt(0)
                            .toUpperCase() || '?'
                        }
                        className="size-11 !bg-slate-700 border border-slate-600"
                        initialClassName="text-xs font-bold"
                      />
                      <div className="flex flex-col">
                        <span className="text-white text-sm font-bold">{customer.chatname || '-'}</span>
                        <span className="text-slate-500 text-[10px]">{customer.sendername || '-'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-300 text-xs font-mono">{customer.phone}</span>
                      <span className="text-slate-500 text-[10px] font-mono truncate max-w-[200px]" title={customer.chatlid}>{customer.chatlid}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-blue-500/10 text-blue-400 border-blue-500/20">
                      {(clientTypes.find(t => t.value === customer.user_type)?.label || customer.user_type).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                      {(() => {
                        const items = getSportsDisplayItems(customer);
                        return items.length > 0 ? (
                          items.map((item, idx) => (
                            <div
                              key={idx}
                              className="inline-flex items-center px-2 py-1.5 bg-slate-800 border border-slate-600 rounded-lg min-w-[80px]"
                            >
                              <span className="text-white font-semibold text-[10px] leading-tight">
                                {item.name || '—'}
                                {item.courts != null && item.courts >= 0 ? ` - ${item.courts}` : ''}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-slate-600 text-xs italic">—</span>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      customer.iaservice ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      <span className={`size-1.5 rounded-full ${customer.iaservice ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                      {customer.iaservice ? 'ATIVA' : 'OFF'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`material-symbols-outlined text-lg ${customer.isblock ? 'text-red-500 fill-1' : 'text-slate-700'}`}>
                      {customer.isblock ? 'block' : 'shield'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleView(customer)} 
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-all"
                        title="Visualizar"
                      >
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </button>
                      <button 
                        onClick={() => handleEdit(customer)} 
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                        title="Editar"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('aios:navigate', { detail: { view: 'chat', phone: customer.phone } }))}
                        className="p-2 text-slate-400 hover:text-green-400 hover:bg-slate-700 rounded-lg transition-all"
                        title="Ver Conversa"
                      >
                        <span className="material-symbols-outlined text-lg">chat</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

