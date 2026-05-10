import React, { useState, useEffect } from 'react';
import * as globalAdminService from '../services/globalAdminService';
import type { GlobalAdminCompany, GlobalAdminUser, GlobalOwner } from '../services/globalAdminService';
import * as clientTypesService from '../services/clientTypesService';
import type { ClientType } from '../services/clientTypesService';
import * as companyUsersService from '../services/companyUsersService';
import type { CompanyUser, Role } from '../types';
import { GlobalAttendanceTypesTab } from '../components/GlobalAdmin/GlobalAttendanceTypesTab';

type Tab = 'companies' | 'admins' | 'global-owners' | 'client-types' | 'attendance-types';

interface CreateCompanyForm {
  company_name: string; company_slug: string; admin_email: string; admin_password: string;
  trade_name: string; cnpj: string; phone_primary: string;
  contact_email: string; city: string; state: string; admin_full_name: string; admin_phone: string;
}

interface CreateAdminUserForm {
  full_name: string; email: string; password: string; phone_primary: string; company_ids: string[];
}

interface CreateUserForm {
  email: string; password: string; company_id: string; role: 'operator' | 'user'; full_name: string; phone_primary: string;
}

interface EditCompanyForm {
  company_name: string; trade_name: string; cnpj: string;
  phone_primary: string; contact_email: string;
  city: string; state: string; is_active: boolean;
}

interface EditAdminForm {
  email: string; full_name: string; phone: string; role: 'admin' | 'operator' | 'user'; is_active: boolean;
}

const generateSlug = (name: string) =>
  name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const maskPhone = (v: string): string => {
  const d = v.replace(/\D/g, '').slice(0, 13);
  if (!d.length) return '';
  if (d.length <= 2)  return `+${d}`;
  if (d.length <= 4)  return `+${d.slice(0, 2)} (${d.slice(2)}`;
  if (d.length <= 8)  return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4)}`;
  if (d.length <= 12) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`;
  return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
};

const formatPhoneDisplay = (raw: string | null | undefined): string => {
  if (!raw) return '';
  const d = raw.replace(/\D/g, '');
  if (d.length === 12) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`;
  if (d.length === 13) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  return d;
};

const maskCNPJ = (v: string): string => {
  const d = v.replace(/\D/g, '').slice(0, 14);
  if (!d.length) return '';
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
};

const inputCls = 'w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all';
const labelCls = 'block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2';

// ─── Detail row helper ───────────────────────────────────────
const Detail: React.FC<{ label: string; value?: string | number | null; mono?: boolean; always?: boolean }> = ({ label, value, mono, always }) => (
  (value || always) ? (
    <div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
      <p className={`text-sm ${value ? 'text-white' : 'text-slate-600'} ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
    </div>
  ) : null
);

export const GlobalAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('companies');
  const [companies, setCompanies] = useState<GlobalAdminCompany[]>([]);
  const [adminUsers, setAdminUsers] = useState<GlobalAdminUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [adminSearch, setAdminSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ─── Modal: criar empresa ───
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateCompanyForm>({
    company_name: '', company_slug: '', admin_email: '', admin_password: '',
    trade_name: '', cnpj: '', phone_primary: '',
    contact_email: '', city: '', state: '', admin_full_name: '', admin_phone: ''
  });
  const [creating, setCreating] = useState(false);

  // ─── Modal: visualizar empresa ───
  const [viewingCompany, setViewingCompany] = useState<GlobalAdminCompany | null>(null);

  // ─── Modal: editar empresa (completo) ───
  const [editingCompany, setEditingCompany] = useState<GlobalAdminCompany | null>(null);
  const [editForm, setEditForm] = useState<EditCompanyForm>({
    company_name: '', trade_name: '', cnpj: '',
    phone_primary: '', contact_email: '',
    city: '', state: '', is_active: true,
  });
  const [saving, setSaving] = useState(false);

  // ─── Modal: confirmar desativação ───
  const [deactivatingCompany, setDeactivatingCompany] = useState<GlobalAdminCompany | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  // ─── Modal: visualizar admin ───
  const [viewingAdmin, setViewingAdmin] = useState<GlobalAdminUser | null>(null);

  // ─── Modal: editar admin ───
  const [editingAdmin, setEditingAdmin] = useState<GlobalAdminUser | null>(null);
  const [editAdminForm, setEditAdminForm] = useState<EditAdminForm>({
    email: '', full_name: '', phone: '', role: 'admin', is_active: true,
  });
  const [savingAdmin, setSavingAdmin] = useState(false);

  // ─── Modal: criar admin multi-empresa ───
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [adminUserForm, setAdminUserForm] = useState<CreateAdminUserForm>({
    full_name: '', email: '', password: '', phone_primary: '', company_ids: []
  });
  const [creatingAdminUser, setCreatingAdminUser] = useState(false);

  // ─── Aba: Tipos de Cliente ───
  const [ctCompanyId, setCtCompanyId] = useState('');
  const [ctTypes, setCtTypes] = useState<ClientType[]>([]);
  const [ctDraftLabels, setCtDraftLabels] = useState<Record<string, string>>({});
  const [ctNewValue, setCtNewValue] = useState('');
  const [ctNewLabel, setCtNewLabel] = useState('');
  const [ctLoading, setCtLoading] = useState(false);
  const [ctAdding, setCtAdding] = useState(false);
  const [ctSaving, setCtSaving] = useState(false);
  const [ctSaved, setCtSaved] = useState(false);
  const [ctError, setCtError] = useState<string | null>(null);
  const [ctDeleteConfirm, setCtDeleteConfirm] = useState<ClientType | null>(null);
  const [ctDeleting, setCtDeleting] = useState(false);

  // ─── Modal: Gerenciar Usuários da Empresa ───
  const [usersCompany, setUsersCompany] = useState<GlobalAdminCompany | null>(null);
  const [usersOfCompany, setUsersOfCompany] = useState<CompanyUser[]>([]);
  const [loadingCompanyUsers, setLoadingCompanyUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [addUserEmail, setAddUserEmail] = useState('');
  const [addUserRole, setAddUserRole] = useState<Role>('operator');
  const [addingUser, setAddingUser] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  // ─── Aba: Owners Globais ───
  const [globalOwners, setGlobalOwners] = useState<GlobalOwner[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [deactivatingOwnerId, setDeactivatingOwnerId] = useState<string | null>(null);
  const [confirmDeactivateOwner, setConfirmDeactivateOwner] = useState<GlobalOwner | null>(null);

  // ─── Modal: criar operador ───
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [userForm, setUserForm] = useState<CreateUserForm>({
    email: '', password: '', company_id: '', role: 'user', full_name: '', phone_primary: ''
  });
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => { fetchCompanies(); }, []);
  useEffect(() => { if (activeTab === 'admins') fetchAdminUsers(); }, [activeTab]);
  useEffect(() => { if (activeTab === 'global-owners') fetchGlobalOwners(); }, [activeTab]);

  // Carregar tipos da empresa selecionada na aba Tipos de Cliente
  const loadCtTypes = async (companyId: string) => {
    setCtLoading(true);
    setCtError(null);
    setCtNewValue('');
    setCtNewLabel('');
    setCtDraftLabels({});
    try {
      setCtTypes(await clientTypesService.getClientTypes(companyId));
    } catch (err: any) {
      setCtError(err.message || 'Erro ao carregar tipos de cliente');
    } finally {
      setCtLoading(false);
    }
  };

  useEffect(() => {
    if (!ctCompanyId) return;
    loadCtTypes(ctCompanyId);
  }, [ctCompanyId]);

  const handleAddClientType = async () => {
    const v = ctNewValue.trim();
    const l = ctNewLabel.trim();
    if (!v || !l) return;
    setCtAdding(true);
    setCtError(null);
    try {
      await clientTypesService.createClientType(ctCompanyId, v, l);
      setCtNewValue('');
      setCtNewLabel('');
      await loadCtTypes(ctCompanyId);
    } catch (err: any) {
      setCtError(err.message || 'Erro ao criar tipo');
    } finally {
      setCtAdding(false);
    }
  };

  const handleConfirmDeleteClientType = async () => {
    if (!ctDeleteConfirm) return;
    setCtDeleting(true);
    setCtError(null);
    try {
      await clientTypesService.deleteClientType(ctDeleteConfirm.id);
      setCtDeleteConfirm(null);
      await loadCtTypes(ctCompanyId);
    } catch (err: any) {
      setCtError(err.message || 'Erro ao excluir tipo');
    } finally {
      setCtDeleting(false);
    }
  };

  const handleSaveClientTypes = async () => {
    if (!ctCompanyId || Object.keys(ctDraftLabels).length === 0) return;
    setCtSaving(true);
    setCtError(null);
    try {
      await Promise.all(
        Object.entries(ctDraftLabels).map(([typeId, label]) =>
          clientTypesService.updateClientType(typeId, label as string)
        )
      );
      setCtDraftLabels({});
      setCtSaved(true);
      setTimeout(() => setCtSaved(false), 3000);
      await loadCtTypes(ctCompanyId);
    } catch (err: any) {
      setCtError(err.message || 'Erro ao salvar');
    } finally {
      setCtSaving(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      setLoading(true); setError(null);
      setCompanies(await globalAdminService.getAllCompanies());
    } catch (err: any) { setError(err.message || 'Erro ao carregar empresas'); }
    finally { setLoading(false); }
  };

  const fetchAdminUsers = async () => {
    try {
      setLoadingAdmins(true); setError(null);
      setAdminUsers(await globalAdminService.getAdminUsers());
    } catch { setAdminUsers([]); }
    finally { setLoadingAdmins(false); }
  };

  const fetchGlobalOwners = async () => {
    try {
      setLoadingOwners(true);
      setGlobalOwners(await globalAdminService.getGlobalOwners());
    } catch { setGlobalOwners([]); }
    finally { setLoadingOwners(false); }
  };

  const handleDeactivateGlobalOwner = async () => {
    if (!confirmDeactivateOwner) return;
    setDeactivatingOwnerId(confirmDeactivateOwner.user_id);
    try {
      await globalAdminService.deactivateGlobalOwner(confirmDeactivateOwner.user_id);
      setGlobalOwners(prev => prev.map(o =>
        o.user_id === confirmDeactivateOwner.user_id ? { ...o, is_active: false } : o
      ));
      setConfirmDeactivateOwner(null);
      showSuccess('Global Owner desativado com sucesso.');
    } catch (err: any) { setError(err.message || 'Erro ao desativar Global Owner'); }
    finally { setDeactivatingOwnerId(null); }
  };

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 4000); };

  // Criar empresa
  const handleCreateCompany = async () => {
    if (!createForm.company_name.trim() || !createForm.admin_email.trim() || !createForm.admin_password.trim()) return;
    try {
      setCreating(true); setError(null);
      await globalAdminService.createCompanyByAdmin({
        company_name: createForm.company_name,
        company_slug: createForm.company_slug || generateSlug(createForm.company_name),
        admin_email: createForm.admin_email, admin_password: createForm.admin_password,
        trade_name: createForm.trade_name || undefined, cnpj: createForm.cnpj || undefined,
        phone_primary: createForm.phone_primary.replace(/\D/g, '') || undefined,
        contact_email: createForm.contact_email || undefined, city: createForm.city || undefined,
        state: createForm.state || undefined, admin_full_name: createForm.admin_full_name || undefined,
        admin_phone: createForm.admin_phone.replace(/\D/g, '') || undefined,
      });
      setShowCreateModal(false);
      setCreateForm({ company_name: '', company_slug: '', admin_email: '', admin_password: '',
        trade_name: '', cnpj: '', phone_primary: '',
        contact_email: '', city: '', state: '', admin_full_name: '', admin_phone: '' });
      showSuccess('Empresa e administrador criados com sucesso!');
      await fetchCompanies();
    } catch (err: any) { setError(err.message || 'Erro ao criar empresa'); }
    finally { setCreating(false); }
  };

  // Abrir edição empresa
  const handleOpenEdit = (company: GlobalAdminCompany) => {
    setEditingCompany(company);
    setEditForm({
      company_name: company.company_name || '',
      trade_name: company.trade_name || '',
      cnpj: company.cnpj || '',
      phone_primary: maskPhone(company.phone_primary || ''),
      contact_email: company.contact_email || '',
      city: company.city || '',
      state: company.state || '',
      is_active: company.is_active ?? true,
    });
    setError(null);
  };

  // Salvar edição empresa
  const handleSaveEdit = async () => {
    if (!editingCompany || !editForm.company_name.trim()) return;
    try {
      setSaving(true); setError(null);
      await globalAdminService.globalAdminUpdateCompany(editingCompany.company_id, {
        name: editForm.company_name,
        trade_name: editForm.trade_name || undefined,
        cnpj: editForm.cnpj || undefined,
        phone_primary: editForm.phone_primary.replace(/\D/g, '') || undefined,
        contact_email: editForm.contact_email || undefined,
        city: editForm.city || undefined,
        state: editForm.state || undefined,
        is_active: editForm.is_active,
      });
      setCompanies(prev => prev.map(c =>
        c.company_id === editingCompany.company_id
          ? { ...c, ...editForm, company_name: editForm.company_name }
          : c
      ));
      setEditingCompany(null);
      showSuccess('Empresa atualizada com sucesso!');
    } catch (err: any) { setError(err.message || 'Erro ao salvar empresa'); }
    finally { setSaving(false); }
  };

  // Desativar empresa
  const handleDeactivate = async () => {
    if (!deactivatingCompany) return;
    try {
      setDeactivating(true); setError(null);
      await globalAdminService.globalAdminDeleteCompany(deactivatingCompany.company_id);
      setCompanies(prev => prev.map(c =>
        c.company_id === deactivatingCompany.company_id ? { ...c, is_active: false } : c
      ));
      setDeactivatingCompany(null);
      showSuccess('Empresa desativada com sucesso.');
    } catch (err: any) { setError(err.message || 'Erro ao desativar empresa'); }
    finally { setDeactivating(false); }
  };

  // Abrir edição admin
  const handleOpenEditAdmin = (user: GlobalAdminUser) => {
    setEditingAdmin(user);
    setEditAdminForm({
      email:     user.email    || '',
      full_name: user.full_name || '',
      phone:     maskPhone(user.phone || ''),
      role:      (user.role as EditAdminForm['role']) || 'admin',
      is_active: user.is_active ?? true,
    });
    setError(null);
  };

  // Salvar edição admin
  const handleSaveEditAdmin = async () => {
    if (!editingAdmin) return;
    try {
      setSavingAdmin(true); setError(null);
      await globalAdminService.globalAdminUpdateUser(editingAdmin.user_id, editingAdmin.company_id, {
        email:     editAdminForm.email     || undefined,
        full_name: editAdminForm.full_name || undefined,
        phone:     editAdminForm.phone.replace(/\D/g, '') || undefined,
        role:      editAdminForm.role,
        is_active: editAdminForm.is_active,
      });
      setAdminUsers(prev => prev.map(u =>
        u.user_id === editingAdmin.user_id && u.company_id === editingAdmin.company_id
          ? { ...u, email: editAdminForm.email || u.email, full_name: editAdminForm.full_name, phone: editAdminForm.phone, role: editAdminForm.role, is_active: editAdminForm.is_active }
          : u
      ));
      setEditingAdmin(null);
      showSuccess('Administrador atualizado com sucesso!');
    } catch (err: any) { setError(err.message || 'Erro ao salvar administrador'); }
    finally { setSavingAdmin(false); }
  };

  // Criar admin multi-empresa
  const handleCreateAdminUser = async () => {
    if (!adminUserForm.full_name.trim() || !adminUserForm.email.trim() || !adminUserForm.password.trim() || !adminUserForm.company_ids.length) return;
    try {
      setCreatingAdminUser(true); setError(null);
      const result = await globalAdminService.createAdminUser({
        full_name: adminUserForm.full_name, email: adminUserForm.email, password: adminUserForm.password,
        phone_primary: adminUserForm.phone_primary.replace(/\D/g, '') || undefined, company_ids: adminUserForm.company_ids,
      });
      setAdminUserForm({ full_name: '', email: '', password: '', phone_primary: '', company_ids: [] });
      setShowCreateAdminModal(false);
      showSuccess(`Administrador "${result.email}" criado e vinculado a ${result.companies_linked?.length} empresa(s)!`);
      if (activeTab === 'admins') await fetchAdminUsers();
    } catch (err: any) { setError(err.message || 'Erro ao criar administrador'); }
    finally { setCreatingAdminUser(false); }
  };

  // ─── Handlers: Gerenciar Usuários da Empresa ───
  const handleOpenUsersModal = async (company: GlobalAdminCompany) => {
    setUsersCompany(company);
    setUsersError(null);
    setAddUserEmail('');
    setAddUserRole('operator');
    setLoadingCompanyUsers(true);
    try {
      setUsersOfCompany(await companyUsersService.getCompanyUsers(company.company_id));
    } catch (err: any) {
      setUsersError(err.message || 'Erro ao carregar usuários');
    } finally {
      setLoadingCompanyUsers(false);
    }
  };

  const handleAddUserToCompany = async () => {
    if (!usersCompany || !addUserEmail.trim()) return;
    setAddingUser(true);
    setUsersError(null);
    try {
      await companyUsersService.createCompanyUser(usersCompany.company_id, addUserEmail.trim(), addUserRole);
      setAddUserEmail('');
      setUsersOfCompany(await companyUsersService.getCompanyUsers(usersCompany.company_id));
      setCompanies(prev => prev.map(c =>
        c.company_id === usersCompany.company_id ? { ...c, users_count: c.users_count + 1 } : c
      ));
    } catch (err: any) {
      setUsersError(err.message || 'Erro ao adicionar usuário');
    } finally {
      setAddingUser(false);
    }
  };

  const handleUpdateCompanyUserRole = async (companyUserId: string, role: Role) => {
    if (!usersCompany) return;
    setUpdatingUserId(companyUserId);
    setUsersError(null);
    try {
      await companyUsersService.updateCompanyUser(usersCompany.company_id, companyUserId, { role });
      setUsersOfCompany(prev => prev.map(u => u.id === companyUserId ? { ...u, role } : u));
    } catch (err: any) {
      setUsersError(err.message || 'Erro ao atualizar papel');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleToggleCompanyUserStatus = async (companyUserId: string, currentActive: boolean) => {
    if (!usersCompany) return;
    setUpdatingUserId(companyUserId);
    setUsersError(null);
    try {
      await companyUsersService.updateCompanyUser(usersCompany.company_id, companyUserId, { is_active: !currentActive });
      setUsersOfCompany(prev => prev.map(u => u.id === companyUserId ? { ...u, is_active: !currentActive } : u));
    } catch (err: any) {
      setUsersError(err.message || 'Erro ao alterar status');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRemoveCompanyUser = async (companyUserId: string) => {
    if (!usersCompany) return;
    setRemovingUserId(companyUserId);
    setUsersError(null);
    try {
      await companyUsersService.deleteCompanyUser(usersCompany.company_id, companyUserId);
      setUsersOfCompany(prev => prev.filter(u => u.id !== companyUserId));
      setCompanies(prev => prev.map(c =>
        c.company_id === usersCompany.company_id ? { ...c, users_count: Math.max(0, c.users_count - 1) } : c
      ));
    } catch (err: any) {
      setUsersError(err.message || 'Erro ao remover usuário');
    } finally {
      setRemovingUserId(null);
    }
  };

  // Criar operador
  const handleCreateUser = async () => {
    if (!userForm.email.trim() || !userForm.password.trim() || !userForm.company_id) return;
    try {
      setCreatingUser(true); setError(null);
      const result = await globalAdminService.createOperatorUser({
        email: userForm.email, password: userForm.password, company_id: userForm.company_id,
        role: userForm.role, full_name: userForm.full_name || undefined, phone_primary: userForm.phone_primary.replace(/\D/g, '') || undefined,
      });
      setUserForm({ email: '', password: '', company_id: '', role: 'user', full_name: '', phone_primary: '' });
      setShowCreateUserModal(false);
      showSuccess(`Usuário "${result.email}" criado na empresa "${result.company_name}"!`);
      if (activeTab === 'admins') await fetchAdminUsers();
    } catch (err: any) { setError(err.message || 'Erro ao criar operador'); }
    finally { setCreatingUser(false); }
  };

  const filteredCompanies = companies.filter(c =>
    (c.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.company_slug || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.owner_email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAdmins = adminUsers.filter(u =>
    (u.email || '').toLowerCase().includes(adminSearch.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(adminSearch.toLowerCase()) ||
    (u.company_name || '').toLowerCase().includes(adminSearch.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(adminSearch.toLowerCase())
  );

  const activeCount = companies.filter(c => c.is_active).length;
  const selectedCompany = companies.find(c => c.company_id === userForm.company_id);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="size-9 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-white text-lg">admin_panel_settings</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white">Administração Global</h2>
          </div>
          <p className="text-slate-400 ml-12">Gerencie todas as empresas e administradores da plataforma.</p>
        </div>
        {activeTab === 'companies' && (
          <button onClick={() => { setShowCreateModal(true); setError(null); }}
            className="flex items-center gap-2 h-11 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold transition-all shadow-lg shadow-violet-600/20">
            <span className="material-symbols-outlined text-lg">add_business</span>Nova Empresa
          </button>
        )}
        {activeTab === 'admins' && (
          <button onClick={() => { setShowCreateAdminModal(true); setError(null); }}
            className="flex items-center gap-2 h-11 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold transition-all shadow-lg shadow-blue-600/20">
            <span className="material-symbols-outlined text-lg">manage_accounts</span>Novo Admin
          </button>
        )}
      </div>

      {/* Feedback */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-red-400">error</span>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-emerald-400">check_circle</span>
          <p className="text-sm text-emerald-400">{successMsg}</p>
        </div>
      )}

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: 'business', color: 'violet', label: 'Total de Empresas', value: companies.length },
            { icon: 'check_circle', color: 'emerald', label: 'Ativas', value: activeCount },
            { icon: 'block', color: 'slate', label: 'Inativas', value: companies.length - activeCount },
          ].map(s => (
            <div key={s.label} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex items-center gap-4">
              <div className={`size-12 bg-${s.color}-500/10 rounded-xl flex items-center justify-center`}>
                <span className={`material-symbols-outlined text-${s.color}-400`}>{s.icon}</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 border border-slate-700 rounded-xl p-1 w-fit">
        {([
          { id: 'companies', icon: 'business', label: 'Empresas' },
          { id: 'admins', icon: 'manage_accounts', label: 'Administradores' },
          { id: 'global-owners', icon: 'shield_person', label: 'Owners Globais' },
          { id: 'client-types', icon: 'badge', label: 'Tipos de Cliente' },
          { id: 'attendance-types', icon: 'medical_services', label: 'Tipos de Atendimento' },
        ] as { id: Tab; icon: string; label: string }[]).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* ─── Tab: Empresas ─── */}
      {activeTab === 'companies' && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 bg-slate-900/20 border-b border-slate-700 flex items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full h-10 bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 text-sm text-white focus:ring-1 focus:ring-violet-500 outline-none"
                placeholder="Buscar por nome, slug ou e-mail..." />
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 text-lg">search</span>
            </div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 whitespace-nowrap">
              {filteredCompanies.length} EMPRESA{filteredCompanies.length !== 1 ? 'S' : ''}
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-20 flex justify-center">
                <div className="size-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/50 border-b border-slate-700 text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                    <th className="px-6 py-4">Empresa</th>
                    <th className="px-6 py-4">Administrador</th>
                    <th className="px-6 py-4">Localização</th>
                    <th className="px-6 py-4 text-center">Usuários</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4">Criada em</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredCompanies.map(company => (
                    <tr key={company.company_id} className={`hover:bg-slate-700/20 transition-colors ${!company.is_active ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">{company.company_name || '—'}</span>
                          <span className="text-xs text-slate-500 font-mono">{company.company_slug || '—'}</span>
                          {company.trade_name && <span className="text-xs text-slate-400 italic">{company.trade_name}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-300">{company.owner_email || '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-400">
                          {[company.city, company.state].filter(Boolean).join(' / ') || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900 text-slate-300 border border-slate-700">
                          <span className="material-symbols-outlined text-xs">group</span>
                          {company.users_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          company.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          <span className={`size-1.5 rounded-full ${company.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {company.is_active ? 'ATIVA' : 'INATIVA'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-400">
                          {new Date(company.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setViewingCompany(company)}
                            className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all" title="Visualizar detalhes">
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
                          <button onClick={() => handleOpenUsersModal(company)}
                            className="p-2 text-slate-500 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-all" title="Gerenciar usuários">
                            <span className="material-symbols-outlined text-lg">group</span>
                          </button>
                          <button onClick={() => handleOpenEdit(company)}
                            className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-all" title="Editar empresa">
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          {company.is_active && (
                            <button onClick={() => { setDeactivatingCompany(company); setError(null); }}
                              className="p-2 text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-all" title="Desativar empresa">
                              <span className="material-symbols-outlined text-lg">block</span>
                            </button>
                          )}
                          {!company.is_active && (
                            <button onClick={() => handleOpenEdit(company)}
                              className="p-2 text-slate-500 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-all" title="Reativar empresa">
                              <span className="material-symbols-outlined text-lg">check_circle</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCompanies.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <span className="material-symbols-outlined text-5xl text-slate-700 block mb-3">business_off</span>
                        <p className="text-slate-500">Nenhuma empresa encontrada.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ─── Tab: Administradores ─── */}
      {activeTab === 'admins' && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 bg-slate-900/20 border-b border-slate-700 flex items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <input value={adminSearch} onChange={e => setAdminSearch(e.target.value)}
                className="w-full h-10 bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 text-sm text-white focus:ring-1 focus:ring-violet-500 outline-none"
                placeholder="Buscar por e-mail, nome, empresa ou papel..." />
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 text-lg">search</span>
            </div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 whitespace-nowrap">
              {filteredAdmins.length} ADMIN{filteredAdmins.length !== 1 ? 'S' : ''}
            </div>
          </div>

          <div className="overflow-x-auto">
            {loadingAdmins ? (
              <div className="p-20 flex justify-center">
                <div className="size-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredAdmins.length === 0 ? (
              <div className="p-16 text-center">
                <span className="material-symbols-outlined text-5xl text-slate-700 block mb-3">manage_accounts</span>
                <p className="text-slate-500">Nenhum administrador encontrado.</p>
                <p className="text-xs text-slate-600 mt-1">Crie um novo administrador usando o botão acima.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/50 border-b border-slate-700 text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                    <th className="px-6 py-4">Usuário</th>
                    <th className="px-6 py-4">Nome</th>
                    <th className="px-6 py-4">Empresa</th>
                    <th className="px-6 py-4 text-center">Papel</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4">Criado em</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredAdmins.map(user => (
                    <tr key={`${user.user_id}-${user.company_id}`} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-violet-400 text-base">person</span>
                          </div>
                          <span className="text-sm text-white">{user.email || '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-300">{user.full_name || '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-300">{user.company_name || '—'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          user.role === 'admin' ? 'bg-violet-500/10 text-violet-400'
                          : user.role === 'operator' ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-slate-700/50 text-slate-300'
                        }`}>
                          {user.role === 'admin' ? 'ADMINISTRADOR' : user.role === 'operator' ? 'OPERADOR' : 'MEMBRO'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          user.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          <span className={`size-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {user.is_active ? 'ATIVO' : 'INATIVO'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-400">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setViewingAdmin(user)}
                            className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all" title="Ver detalhes">
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
                          <button onClick={() => handleOpenEditAdmin(user)}
                            className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-all" title="Editar administrador">
                            <span className="material-symbols-outlined text-lg">edit</span>
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
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: Visualizar Empresa
      ═══════════════════════════════════════════════════════ */}
      {viewingCompany && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-violet-400">business</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{viewingCompany.company_name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{viewingCompany.company_slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  viewingCompany.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  <span className={`size-1.5 rounded-full ${viewingCompany.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  {viewingCompany.is_active ? 'ATIVA' : 'INATIVA'}
                </span>
                <button onClick={() => setViewingCompany(null)} className="text-slate-400 hover:text-white transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Identificação */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-xs">badge</span>Identificação
                </p>
                <div className="grid grid-cols-2 gap-4 bg-slate-900/50 rounded-xl p-4">
                  <Detail label="Nome da Empresa" value={viewingCompany.company_name} always />
                  <Detail label="Nome Fantasia" value={viewingCompany.trade_name} always />
                  <Detail label="CNPJ" value={viewingCompany.cnpj} mono always />
                  <Detail label="Criada em" value={new Date(viewingCompany.created_at).toLocaleDateString('pt-BR')} always />
                  <Detail label="Usuários" value={`${viewingCompany.users_count} usuário(s)`} always />
                  <Detail label="Status" value={viewingCompany.is_active ? 'Ativa' : 'Inativa'} always />
                </div>
              </div>

              {/* Contato */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-xs">contact_phone</span>Contato
                </p>
                <div className="grid grid-cols-2 gap-4 bg-slate-900/50 rounded-xl p-4">
                  <Detail label="Administrador" value={viewingCompany.owner_email} always />
                  <Detail label="E-mail de Contato" value={viewingCompany.contact_email} always />
                  <Detail label="Telefone" value={formatPhoneDisplay(viewingCompany.phone_primary)} always />
                </div>
              </div>

              {/* Localização */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-xs">location_on</span>Localização
                </p>
                <div className="grid grid-cols-2 gap-4 bg-slate-900/50 rounded-xl p-4">
                  <Detail label="Cidade" value={viewingCompany.city} always />
                  <Detail label="Estado (UF)" value={viewingCompany.state} always />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setViewingCompany(null)}
                className="flex-1 h-11 rounded-xl border border-slate-700 text-slate-400 font-bold hover:bg-slate-700 transition-all">
                Fechar
              </button>
              <button onClick={() => { setViewingCompany(null); handleOpenEdit(viewingCompany); }}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">edit</span>Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: Editar Empresa (completo)
      ═══════════════════════════════════════════════════════ */}
      {editingCompany && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Editar Empresa</h3>
              <button onClick={() => { setEditingCompany(null); setError(null); }} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-5">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Identificação */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Identificação</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Nome da Empresa *</label>
                    <input type="text" value={editForm.company_name}
                      onChange={e => setEditForm(p => ({ ...p, company_name: e.target.value }))}
                      className={inputCls} placeholder="Nome da Empresa" />
                  </div>
                  <div>
                    <label className={labelCls}>Nome Fantasia</label>
                    <input type="text" value={editForm.trade_name}
                      onChange={e => setEditForm(p => ({ ...p, trade_name: e.target.value }))}
                      className={inputCls} placeholder="Nome Fantasia" />
                  </div>
                  <div>
                    <label className={labelCls}>CNPJ</label>
                    <input type="text" value={editForm.cnpj}
                      onChange={e => setEditForm(p => ({ ...p, cnpj: maskCNPJ(e.target.value) }))}
                      className={inputCls} placeholder="00.000.000/0001-00" maxLength={18} />
                  </div>
                </div>
              </div>

              {/* Contato */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Contato</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>E-mail de Contato</label>
                    <input type="email" value={editForm.contact_email}
                      onChange={e => setEditForm(p => ({ ...p, contact_email: e.target.value }))}
                      className={inputCls} placeholder="contato@empresa.com" />
                  </div>
                  <div>
                    <label className={labelCls}>Telefone</label>
                    <input type="tel" value={editForm.phone_primary}
                      onChange={e => setEditForm(p => ({ ...p, phone_primary: maskPhone(e.target.value) }))}
                      className={inputCls} placeholder="+55 (45) 8823-0654" maxLength={20} />
                  </div>
                </div>
              </div>

              {/* Localização */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Localização</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Cidade</label>
                    <input type="text" value={editForm.city}
                      onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))}
                      className={inputCls} placeholder="São Paulo" />
                  </div>
                  <div>
                    <label className={labelCls}>Estado (UF)</label>
                    <input type="text" value={editForm.state} maxLength={2}
                      onChange={e => setEditForm(p => ({ ...p, state: e.target.value.toUpperCase() }))}
                      className={inputCls} placeholder="SP" />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Status</p>
                <label className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-700 cursor-pointer hover:border-violet-500/30 transition-all">
                  <div>
                    <p className={`text-sm font-bold ${editForm.is_active ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {editForm.is_active ? 'Empresa Ativa' : 'Empresa Inativa'}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {editForm.is_active ? 'Usuários podem acessar a plataforma.' : 'Acesso bloqueado para todos os usuários.'}
                    </p>
                  </div>
                  <div onClick={() => setEditForm(p => ({ ...p, is_active: !p.is_active }))}
                    className={`w-12 h-6 rounded-full relative transition-all cursor-pointer ${editForm.is_active ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                    <div className={`absolute top-1 size-4 bg-white rounded-full transition-all shadow ${editForm.is_active ? 'left-7' : 'left-1'}`} />
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => { setEditingCompany(null); setError(null); }}
                className="flex-1 h-11 rounded-xl border border-slate-700 text-slate-400 font-bold hover:bg-slate-700 transition-all">
                Cancelar
              </button>
              <button onClick={handleSaveEdit} disabled={saving || !editForm.company_name.trim()}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Salvando...</> : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: Visualizar Administrador
      ═══════════════════════════════════════════════════════ */}
      {viewingAdmin && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-violet-400 text-xl">person</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{viewingAdmin.full_name || viewingAdmin.email}</h3>
                  <p className="text-xs text-slate-400">{viewingAdmin.email}</p>
                </div>
              </div>
              <button onClick={() => setViewingAdmin(null)} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-slate-900/50 rounded-xl p-4">
                <Detail label="Nome Completo" value={viewingAdmin.full_name} />
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">E-mail</p>
                  <p className="text-sm text-white break-all">{viewingAdmin.email || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Telefone</p>
                  <p className="text-sm text-white">{viewingAdmin.phone || '—'}</p>
                </div>
                <Detail label="Empresa" value={viewingAdmin.company_name} />
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Papel</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    viewingAdmin.role === 'admin' ? 'bg-violet-500/10 text-violet-400'
                    : viewingAdmin.role === 'operator' ? 'bg-blue-500/10 text-blue-400'
                    : 'bg-slate-700/50 text-slate-300'
                  }`}>
                    {viewingAdmin.role === 'admin' ? 'ADMINISTRADOR' : viewingAdmin.role === 'operator' ? 'OPERADOR' : 'MEMBRO'}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    viewingAdmin.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    <span className={`size-1.5 rounded-full ${viewingAdmin.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {viewingAdmin.is_active ? 'ATIVO' : 'INATIVO'}
                  </span>
                </div>
                <Detail label="Criado em" value={viewingAdmin.created_at ? new Date(viewingAdmin.created_at).toLocaleDateString('pt-BR') : undefined} />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setViewingAdmin(null)}
                className="flex-1 h-11 rounded-xl border border-slate-700 text-slate-400 font-bold hover:bg-slate-700 transition-all">
                Fechar
              </button>
              <button onClick={() => { setViewingAdmin(null); handleOpenEditAdmin(viewingAdmin); }}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-lg">edit</span>Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: Editar Administrador
      ═══════════════════════════════════════════════════════ */}
      {editingAdmin && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-violet-400">manage_accounts</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Editar Administrador</h3>
                  <p className="text-xs text-slate-500">{editingAdmin.email}</p>
                </div>
              </div>
              <button onClick={() => { setEditingAdmin(null); setError(null); }} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-5">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Perfil */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Perfil</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>E-mail</label>
                    <input type="email" value={editAdminForm.email}
                      onChange={e => setEditAdminForm(p => ({ ...p, email: e.target.value }))}
                      className={inputCls} placeholder="usuario@empresa.com" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Nome Completo</label>
                    <input type="text" value={editAdminForm.full_name}
                      onChange={e => setEditAdminForm(p => ({ ...p, full_name: e.target.value }))}
                      className={inputCls} placeholder="João Silva" />
                  </div>
                  <div>
                    <label className={labelCls}>Telefone</label>
                    <input type="tel" value={editAdminForm.phone}
                      onChange={e => setEditAdminForm(p => ({ ...p, phone: maskPhone(e.target.value) }))}
                      className={inputCls} placeholder="+55 (45) 8823-0654" maxLength={20} />
                  </div>
                  <div>
                    <label className={labelCls}>Papel</label>
                    <select value={editAdminForm.role}
                      onChange={e => setEditAdminForm(p => ({ ...p, role: e.target.value as EditAdminForm['role'] }))}
                      className={inputCls}>
                      <option value="admin">Administrador</option>
                      <option value="operator">Operador</option>
                      <option value="user">Membro</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Status</p>
                <label className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-700 cursor-pointer hover:border-violet-500/30 transition-all">
                  <div>
                    <p className={`text-sm font-bold ${editAdminForm.is_active ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {editAdminForm.is_active ? 'Usuário Ativo' : 'Usuário Inativo'}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {editAdminForm.is_active ? 'Acesso liberado à plataforma.' : 'Acesso bloqueado para este usuário.'}
                    </p>
                  </div>
                  <div onClick={() => setEditAdminForm(p => ({ ...p, is_active: !p.is_active }))}
                    className={`w-12 h-6 rounded-full relative transition-all cursor-pointer ${editAdminForm.is_active ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                    <div className={`absolute top-1 size-4 bg-white rounded-full transition-all shadow ${editAdminForm.is_active ? 'left-7' : 'left-1'}`} />
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => { setEditingAdmin(null); setError(null); }}
                className="flex-1 h-11 rounded-xl border border-slate-700 text-slate-400 font-bold hover:bg-slate-700 transition-all">
                Cancelar
              </button>
              <button onClick={handleSaveEditAdmin} disabled={savingAdmin}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {savingAdmin ? <><div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Salvando...</> : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: Gerenciar Usuários da Empresa
      ═══════════════════════════════════════════════════════ */}
      {usersCompany && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-400">group</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Usuários da Empresa</h3>
                  <p className="text-xs text-slate-500">{usersCompany.company_name}</p>
                </div>
              </div>
              <button onClick={() => { setUsersCompany(null); setUsersError(null); }} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {usersError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-5">
                <p className="text-sm text-red-400">{usersError}</p>
              </div>
            )}

            {/* Adicionar usuário */}
            <div className="mb-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Adicionar Usuário Existente</p>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={addUserEmail}
                  onChange={e => setAddUserEmail(e.target.value)}
                  placeholder="email@usuario.com"
                  className="flex-1 h-10 bg-slate-900 border border-slate-700 rounded-xl px-4 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  onKeyDown={e => e.key === 'Enter' && handleAddUserToCompany()}
                />
                <select
                  value={addUserRole}
                  onChange={e => setAddUserRole(e.target.value as Role)}
                  className="h-10 bg-slate-900 border border-slate-700 rounded-xl px-3 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="admin">Administrador</option>
                  <option value="operator">Operador</option>
                  <option value="user">Membro</option>
                </select>
                <button
                  onClick={handleAddUserToCompany}
                  disabled={addingUser || !addUserEmail.trim()}
                  className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  {addingUser
                    ? <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <span className="material-symbols-outlined text-base">person_add</span>
                  }
                  Adicionar
                </button>
              </div>
            </div>

            {/* Lista de usuários */}
            {loadingCompanyUsers ? (
              <div className="py-12 flex justify-center">
                <div className="size-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : usersOfCompany.length === 0 ? (
              <div className="py-12 text-center">
                <span className="material-symbols-outlined text-5xl text-slate-700 block mb-3">group_off</span>
                <p className="text-slate-500 text-sm">Nenhum usuário vinculado a esta empresa.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                  {usersOfCompany.length} usuário{usersOfCompany.length !== 1 ? 's' : ''} vinculado{usersOfCompany.length !== 1 ? 's' : ''}
                </p>
                {usersOfCompany.map(u => {
                  const isUpdating = updatingUserId === u.id;
                  const isRemoving = removingUserId === u.id;
                  return (
                    <div key={u.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${u.is_active ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-900/20 border-slate-800 opacity-60'}`}>
                      {/* Avatar */}
                      <div className="size-9 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-300 flex-shrink-0 select-none">
                        {(u.full_name || u.user_email || '?')[0].toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{u.full_name || u.user_email || '—'}</p>
                        <p className="text-xs text-slate-500 truncate">{u.user_email}</p>
                      </div>

                      {/* Role select */}
                      <select
                        value={u.role}
                        disabled={isUpdating || isRemoving}
                        onChange={e => handleUpdateCompanyUserRole(u.id, e.target.value as Role)}
                        className="h-8 bg-slate-800 border border-slate-700 rounded-lg px-2 text-xs text-white focus:ring-1 focus:ring-violet-500 outline-none disabled:opacity-50"
                      >
                        <option value="admin">Administrador</option>
                        <option value="operator">Operador</option>
                        <option value="user">Membro</option>
                      </select>

                      {/* Toggle ativo */}
                      <button
                        onClick={() => handleToggleCompanyUserStatus(u.id, u.is_active)}
                        disabled={isUpdating || isRemoving}
                        title={u.is_active ? 'Desativar acesso' : 'Reativar acesso'}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50 ${u.is_active ? 'bg-emerald-500/10 text-emerald-400 hover:bg-red-500/10 hover:text-red-400' : 'bg-red-500/10 text-red-400 hover:bg-emerald-500/10 hover:text-emerald-400'}`}
                      >
                        {isUpdating ? '...' : u.is_active ? 'ATIVO' : 'INATIVO'}
                      </button>

                      {/* Remover */}
                      <button
                        onClick={() => handleRemoveCompanyUser(u.id)}
                        disabled={isUpdating || isRemoving}
                        title="Remover da empresa"
                        className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isRemoving
                          ? <span className="size-4 border-2 border-slate-500/30 border-t-slate-400 rounded-full animate-spin block" />
                          : <span className="material-symbols-outlined text-base">person_remove</span>
                        }
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => { setUsersCompany(null); setUsersError(null); }}
                className="h-10 px-6 rounded-xl border border-slate-700 text-slate-400 font-bold hover:bg-slate-700 transition-all text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: Criar Empresa
      ═══════════════════════════════════════════════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Nova Empresa</h3>
              <button onClick={() => { setShowCreateModal(false); setError(null); }} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-5"><p className="text-sm text-red-400">{error}</p></div>}

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Nome da Empresa *</label>
                <input type="text" value={createForm.company_name}
                  onChange={e => { const n = e.target.value; setCreateForm(p => ({ ...p, company_name: n, company_slug: generateSlug(n) })); }}
                  placeholder="Minha Empresa LTDA" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Slug (URL) *</label>
                <input type="text" value={createForm.company_slug}
                  onChange={e => setCreateForm(p => ({ ...p, company_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                  placeholder="minha-empresa" className={`${inputCls} font-mono`} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Nome Fantasia</label>
                  <input type="text" value={createForm.trade_name} onChange={e => setCreateForm(p => ({ ...p, trade_name: e.target.value }))} placeholder="Opcional" className={inputCls} /></div>
                <div><label className={labelCls}>CNPJ</label>
                  <input type="text" value={createForm.cnpj} onChange={e => setCreateForm(p => ({ ...p, cnpj: maskCNPJ(e.target.value) }))} placeholder="00.000.000/0001-00" className={inputCls} maxLength={18} /></div>
                <div><label className={labelCls}>Cidade</label>
                  <input type="text" value={createForm.city} onChange={e => setCreateForm(p => ({ ...p, city: e.target.value }))} placeholder="São Paulo" className={inputCls} /></div>
                <div><label className={labelCls}>UF</label>
                  <input type="text" value={createForm.state} maxLength={2} onChange={e => setCreateForm(p => ({ ...p, state: e.target.value.toUpperCase() }))} placeholder="SP" className={inputCls} /></div>
                <div><label className={labelCls}>Telefone</label>
                  <input type="tel" value={createForm.phone_primary} onChange={e => setCreateForm(p => ({ ...p, phone_primary: maskPhone(e.target.value) }))} placeholder="+55 (45) 8823-0654" className={inputCls} maxLength={20} /></div>
                <div><label className={labelCls}>E-mail de Contato</label>
                  <input type="email" value={createForm.contact_email} onChange={e => setCreateForm(p => ({ ...p, contact_email: e.target.value }))} placeholder="contato@empresa.com" className={inputCls} /></div>
              </div>

              <div className="pt-2 border-t border-slate-700">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Administrador da Empresa</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className={labelCls}>Nome Completo</label>
                      <input type="text" value={createForm.admin_full_name} onChange={e => setCreateForm(p => ({ ...p, admin_full_name: e.target.value }))} placeholder="João Silva" className={inputCls} /></div>
                    <div><label className={labelCls}>Telefone</label>
                      <input type="tel" value={createForm.admin_phone} onChange={e => setCreateForm(p => ({ ...p, admin_phone: maskPhone(e.target.value) }))} placeholder="+55 (45) 8823-0654" className={inputCls} maxLength={20} /></div>
                  </div>
                  <div><label className={labelCls}>E-mail do Admin *</label>
                    <input type="email" value={createForm.admin_email} onChange={e => setCreateForm(p => ({ ...p, admin_email: e.target.value }))} placeholder="admin@empresa.com" className={inputCls} /></div>
                  <div><label className={labelCls}>Senha do Admin *</label>
                    <input type="password" value={createForm.admin_password} onChange={e => setCreateForm(p => ({ ...p, admin_password: e.target.value }))} placeholder="Mínimo 6 caracteres" className={inputCls} /></div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => { setShowCreateModal(false); setError(null); }}
                className="flex-1 h-11 rounded-xl border border-slate-700 text-slate-400 font-bold hover:bg-slate-700 transition-all">Cancelar</button>
              <button onClick={handleCreateCompany}
                disabled={creating || !createForm.company_name.trim() || !createForm.admin_email.trim() || !createForm.admin_password.trim()}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {creating ? <><div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Criando...</> : 'Criar Empresa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: Criar Administrador Multi-Empresa
      ═══════════════════════════════════════════════════════ */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Novo Administrador</h3>
              <button onClick={() => { setShowCreateAdminModal(false); setError(null); }} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-5"><p className="text-sm text-red-400">{error}</p></div>}
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Nome Completo *</label>
                <input type="text" value={adminUserForm.full_name} onChange={e => setAdminUserForm(p => ({ ...p, full_name: e.target.value }))}
                  placeholder="João Silva" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>E-mail *</label>
                  <input type="email" value={adminUserForm.email} onChange={e => setAdminUserForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="admin@empresa.com" className={inputCls} /></div>
                <div><label className={labelCls}>Senha *</label>
                  <input type="password" value={adminUserForm.password} onChange={e => setAdminUserForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Mín. 6 chars" className={inputCls} /></div>
              </div>
              <div>
                <label className={labelCls}>Telefone</label>
                <input type="tel" value={adminUserForm.phone_primary} onChange={e => setAdminUserForm(p => ({ ...p, phone_primary: maskPhone(e.target.value) }))}
                  placeholder="+55 (45) 8823-0654" className={inputCls} maxLength={20} />
              </div>
              <div>
                <label className={labelCls}>Empresas *</label>
                <div className="max-h-48 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl divide-y divide-slate-800">
                  {companies.filter(c => c.is_active).map(c => (
                    <label key={c.company_id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-800/50 transition-colors">
                      <input type="checkbox" checked={adminUserForm.company_ids.includes(c.company_id)}
                        onChange={e => {
                          if (e.target.checked) setAdminUserForm(p => ({ ...p, company_ids: [...p.company_ids, c.company_id] }));
                          else setAdminUserForm(p => ({ ...p, company_ids: p.company_ids.filter(id => id !== c.company_id) }));
                        }} className="accent-blue-500 size-4" />
                      <span className="text-sm text-white">{c.company_name}</span>
                      <span className="text-xs text-slate-500 font-mono ml-auto">{c.company_slug}</span>
                    </label>
                  ))}
                </div>
                {adminUserForm.company_ids.length > 0 && (
                  <p className="text-xs text-blue-400 mt-1">{adminUserForm.company_ids.length} empresa(s) selecionada(s)</p>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => { setShowCreateAdminModal(false); setError(null); }}
                className="flex-1 h-11 rounded-xl border border-slate-700 text-slate-400 font-bold hover:bg-slate-700 transition-all">Cancelar</button>
              <button onClick={handleCreateAdminUser}
                disabled={creatingAdminUser || !adminUserForm.full_name.trim() || !adminUserForm.email.trim() || !adminUserForm.password.trim() || !adminUserForm.company_ids.length}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {creatingAdminUser ? <><div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Criando...</> : <><span className="material-symbols-outlined">manage_accounts</span>Criar Administrador</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab: Owners Globais ─── */}
      {activeTab === 'global-owners' && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 bg-slate-900/20 border-b border-slate-700 flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-400">shield_person</span>
            <div>
              <p className="text-sm font-bold text-white">Owners Globais</p>
              <p className="text-xs text-slate-500">Usuários com acesso total ao sistema. Criação exclusivamente via SQL (DBA).</p>
            </div>
          </div>

          {loadingOwners ? (
            <div className="p-20 flex justify-center">
              <div className="size-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : globalOwners.length === 0 ? (
            <div className="p-12 flex flex-col items-center gap-3 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-600">shield_person</span>
              <p className="text-slate-500 text-sm">Nenhum Global Owner encontrado.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-700 text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                  <th className="px-6 py-4">Usuário</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Criado em</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {globalOwners.map(owner => (
                  <tr key={owner.user_id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {(owner.full_name || owner.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{owner.full_name || '—'}</p>
                          <p className="text-xs text-slate-400">{owner.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${owner.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                        <span className={`size-1.5 rounded-full ${owner.is_active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        {owner.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(owner.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {owner.is_active && (
                        <button
                          onClick={() => { setConfirmDeactivateOwner(owner); setError(null); }}
                          disabled={deactivatingOwnerId === owner.user_id}
                          title="Desativar Global Owner"
                          className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors disabled:opacity-40"
                        >
                          <span className="material-symbols-outlined text-lg">block</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="p-4 border-t border-slate-700/50 flex items-center gap-2 bg-amber-500/5">
            <span className="material-symbols-outlined text-amber-400/70 text-sm">info</span>
            <p className="text-xs text-slate-500">
              Para criar um novo Global Owner, use o script SQL em <span className="font-mono text-slate-400">supabase/scripts/create_global_owner.sql</span> via Supabase SQL Editor.
            </p>
          </div>
        </div>
      )}

      {/* ─── Tab: Tipos de Cliente ─── */}
      {activeTab === 'client-types' && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-400">badge</span>
              Tipos de Cliente por Empresa
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Gerencie os tipos de cliente disponíveis por empresa. O tipo padrão ("client") não pode ser excluído.
              Ao excluir um tipo em uso, os clientes associados voltam ao tipo padrão automaticamente.
            </p>
          </div>

          <div className="p-6 space-y-6 max-w-xl">
            {/* Seletor de empresa */}
            <div>
              <label className={labelCls}>Selecionar Empresa</label>
              <select
                value={ctCompanyId}
                onChange={e => { setCtCompanyId(e.target.value); setCtError(null); setCtSaved(false); }}
                className={inputCls}
              >
                <option value="">— Selecione uma empresa —</option>
                {companies.filter(c => c.is_active).map(c => (
                  <option key={c.company_id} value={c.company_id}>{c.company_name}</option>
                ))}
              </select>
            </div>

            {ctCompanyId && (
              <>
                {ctLoading ? (
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <div className="size-4 border-2 border-slate-500/30 border-t-slate-400 rounded-full animate-spin" />
                    Carregando tipos...
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Tipos configurados</p>

                    {ctTypes.map((ct) => {
                      const draftLabel = ctDraftLabels[ct.id];
                      const currentLabel = draftLabel !== undefined ? draftLabel : ct.label;
                      const isDirty = draftLabel !== undefined && draftLabel !== ct.label;
                      return (
                        <div key={ct.id} className="flex items-center gap-3 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3">
                          <span className="text-xs text-slate-500 font-mono w-24 shrink-0">{ct.value}</span>
                          <input
                            type="text"
                            value={currentLabel}
                            onChange={e => setCtDraftLabels(prev => ({ ...prev, [ct.id]: e.target.value }))}
                            placeholder="Rótulo de exibição"
                            className={`flex-1 h-9 bg-slate-800 border rounded-lg px-3 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${isDirty ? 'border-blue-500/60' : 'border-slate-600'}`}
                          />
                          {ct.is_default ? (
                            <span className="size-8 flex items-center justify-center" title="Tipo padrão — não pode ser excluído">
                              <span className="material-symbols-outlined text-base text-slate-600">lock</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => setCtDeleteConfirm(ct)}
                              className="size-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                              title="Excluir tipo"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {/* Adicionar novo tipo */}
                    <div className="border border-dashed border-slate-600 rounded-xl p-4 space-y-3">
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Novo tipo</p>
                      <div className="flex gap-2 flex-nowrap items-center">
                        <input
                          type="text"
                          value={ctNewValue}
                          onChange={e => setCtNewValue(e.target.value)}
                          placeholder="valor (ex: parceiro)"
                          className="min-w-0 flex-1 h-9 bg-slate-800 border border-slate-600 rounded-lg px-3 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                        />
                        <input
                          type="text"
                          value={ctNewLabel}
                          onChange={e => setCtNewLabel(e.target.value)}
                          placeholder="Rótulo (ex: Parceiro)"
                          className="min-w-0 flex-1 h-9 bg-slate-800 border border-slate-600 rounded-lg px-3 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button
                          onClick={handleAddClientType}
                          disabled={ctAdding || !ctNewValue.trim() || !ctNewLabel.trim()}
                          className="h-9 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all disabled:opacity-40 flex items-center gap-1 shrink-0 whitespace-nowrap"
                        >
                          {ctAdding ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-base">add</span>}
                          Adicionar
                        </button>
                      </div>
                    </div>

                    {ctError && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                        <p className="text-sm text-red-400">{ctError}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <div className={`flex items-center gap-2 text-emerald-400 text-sm font-bold transition-opacity duration-500 ${ctSaved ? 'opacity-100' : 'opacity-0'}`}>
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                        Salvo com sucesso!
                      </div>
                      <button
                        onClick={handleSaveClientTypes}
                        disabled={ctSaving || Object.keys(ctDraftLabels).length === 0}
                        className="h-10 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {ctSaving ? <><div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Salvando...</> : 'Salvar alterações'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {!ctCompanyId && (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                <span className="material-symbols-outlined text-4xl mb-3">corporate_fare</span>
                <p className="text-sm">Selecione uma empresa para gerenciar os tipos de cliente.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Tab: Tipos de Atendimento ─── */}
      {activeTab === 'attendance-types' && (
        <GlobalAttendanceTypesTab />
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: Confirmar exclusão de tipo de cliente
      ═══════════════════════════════════════════════════════ */}
      {ctDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="size-16 bg-red-500/10 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-red-400">delete_forever</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Excluir tipo de cliente?</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  O tipo <span className="text-white font-bold">"{ctDeleteConfirm.label}"</span> ({ctDeleteConfirm.value}) será removido permanentemente.
                </p>
                <p className="text-amber-400 text-sm mt-3">
                  Clientes que possuem este tipo serão automaticamente revertidos para o tipo padrão.
                </p>
              </div>
            </div>
            {ctError && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mt-4"><p className="text-sm text-red-400 text-center">{ctError}</p></div>}
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => { setCtDeleteConfirm(null); setCtError(null); }}
                className="flex-1 h-11 rounded-xl border border-slate-700 text-slate-400 font-bold hover:bg-slate-700 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteClientType}
                disabled={ctDeleting}
                className="flex-1 h-11 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-bold hover:bg-red-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {ctDeleting ? <><div className="size-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />Excluindo...</> : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MODAL: Confirmar Desativação
      ═══════════════════════════════════════════════════════ */}
      {/* ═══════════════════════════════════════════════════════
          MODAL: Confirmar Desativação de Global Owner
      ═══════════════════════════════════════════════════════ */}
      {confirmDeactivateOwner && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="size-16 bg-red-500/10 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-red-400">shield_person</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Desativar Global Owner?</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  O usuário <span className="text-white font-bold">"{confirmDeactivateOwner.full_name || confirmDeactivateOwner.email}"</span> perderá acesso global ao sistema.
                  Esta ação pode ser revertida apenas via SQL (DBA).
                </p>
              </div>
            </div>
            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mt-4"><p className="text-sm text-red-400 text-center">{error}</p></div>}
            <div className="flex gap-3 mt-8">
              <button onClick={() => { setConfirmDeactivateOwner(null); setError(null); }}
                className="flex-1 h-11 rounded-xl border border-slate-700 text-slate-400 font-bold hover:bg-slate-700 transition-all">Cancelar</button>
              <button onClick={handleDeactivateGlobalOwner} disabled={!!deactivatingOwnerId}
                className="flex-1 h-11 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-bold hover:bg-red-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {deactivatingOwnerId ? <><div className="size-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />Desativando...</> : 'Desativar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deactivatingCompany && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="size-16 bg-amber-500/10 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-amber-400">warning</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Desativar Empresa?</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  A empresa <span className="text-white font-bold">"{deactivatingCompany.company_name}"</span> será desativada.
                  Todos os usuários perderão acesso. Essa ação pode ser revertida editando a empresa.
                </p>
              </div>
            </div>
            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mt-4"><p className="text-sm text-red-400 text-center">{error}</p></div>}
            <div className="flex gap-3 mt-8">
              <button onClick={() => { setDeactivatingCompany(null); setError(null); }}
                className="flex-1 h-11 rounded-xl border border-slate-700 text-slate-400 font-bold hover:bg-slate-700 transition-all">Cancelar</button>
              <button onClick={handleDeactivate} disabled={deactivating}
                className="flex-1 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold hover:bg-amber-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {deactivating ? <><div className="size-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />Desativando...</> : 'Desativar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
