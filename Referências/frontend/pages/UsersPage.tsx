import React, { useState, useEffect } from 'react';
import { CompanyUser, Role } from '../types';
import { useCompany } from '../contexts/CompanyContext';
import * as companyUsersService from '../services/companyUsersService';
import * as globalAdminService from '../services/globalAdminService';

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

export const UsersPage: React.FC = () => {
  const { currentCompany } = useCompany();
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para Edição
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CompanyUser | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Estados para Criação
  const [isCreating, setIsCreating] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('operator');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (currentCompany) {
      fetchUsers();
    }
  }, [currentCompany]);

  const fetchUsers = async () => {
    if (!currentCompany) return;
    
    try {
      setLoading(true);
      setError(null);
      const users = await companyUsersService.getCompanyUsers(currentCompany.id);
      setCompanyUsers(users);
    } catch (err: any) {
      console.error('Erro ao buscar usuários:', err);
      setError(err.message || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: CompanyUser) => {
    setSelectedUser({ ...user });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!selectedUser || !currentCompany) return;

    try {
      setSaving(true);
      setError(null);
      
      const updated = await companyUsersService.updateCompanyUser(
        currentCompany.id,
        selectedUser.id,
        {
          role: selectedUser.role,
          is_active: selectedUser.is_active
        }
      );

      setCompanyUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      setIsEditing(false);
      setSelectedUser(null);
    } catch (err: any) {
      console.error('Erro ao salvar usuário:', err);
      setError(err.message || 'Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: CompanyUser) => {
    if (!currentCompany) return;
    
    if (!confirm(`Tem certeza que deseja remover o acesso de ${user.user_name || user.user_email}?`)) {
      return;
    }

    try {
      setError(null);
      await companyUsersService.deleteCompanyUser(currentCompany.id, user.id);
      setCompanyUsers(prev => prev.filter(u => u.id !== user.id));
    } catch (err: any) {
      console.error('Erro ao deletar usuário:', err);
      setError(err.message || 'Erro ao remover usuário');
    }
  };

  const handleCreate = async () => {
    if (!currentCompany || !newUserEmail.trim()) return;

    try {
      setCreating(true);
      setError(null);

      if (newUserPassword.trim()) {
        // Criar novo usuário via Edge Function (cria auth user + profile + vínculo)
        await globalAdminService.createOperatorUser({
          email: newUserEmail.trim(),
          password: newUserPassword.trim(),
          company_id: currentCompany.id,
          role: newUserRole,
          full_name: newUserFullName.trim() || undefined,
          phone_primary: newUserPhone.replace(/\D/g, '') || undefined,
        });
      } else {
        // Vincular usuário existente pelo e-mail
        await companyUsersService.createCompanyUser(
          currentCompany.id,
          newUserEmail.trim(),
          newUserRole,
          true
        );
      }

      await fetchUsers();
      setIsCreating(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserFullName('');
      setNewUserPhone('');
      setNewUserRole('operator');
    } catch (err: any) {
      console.error('Erro ao criar usuário:', err);
      setError(err.message || 'Erro ao adicionar usuário');
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = companyUsers.filter(u => 
    u.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'admin': return 'ADMINISTRADOR';
      case 'operator': return 'OPERADOR';
      case 'user': return 'MEMBRO';
      default: return role;
    }
  };

  const getRoleDescription = (role: Role) => {
    switch(role) {
      case 'admin': return 'Acesso total à empresa: gerencia usuários, agentes e base de conhecimento.';
      case 'operator': return 'Pode operar agentes e atender conversas. Acesso limitado a configurações.';
      case 'user': return 'Acesso limitado a conversas e visualização de dados.';
    }
  };

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Selecione uma empresa para gerenciar usuários.</p>
      </div>
    );
  }

  if (isEditing && selectedUser) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsEditing(false)} 
              className="size-10 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-blue-500 transition-all shadow-lg"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h2 className="text-3xl font-bold text-white">Editar Usuário</h2>
              <p className="text-slate-400 text-sm">Ajuste as permissões e o status de acesso de {selectedUser.user_name || selectedUser.user_email}.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsEditing(false)} 
              className="h-11 px-6 rounded-xl border border-slate-700 text-slate-400 font-bold hover:bg-slate-700 transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="h-11 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col items-center text-center">
              <div className="size-24 rounded-full bg-slate-900 border-4 border-slate-700 mb-4 overflow-hidden shadow-2xl">
                <img src={`https://picsum.photos/seed/${selectedUser.id}/200`} className="w-full h-full object-cover" alt={selectedUser.user_name} />
              </div>
              <h3 className="text-xl font-bold text-white leading-tight">{selectedUser.user_name || selectedUser.user_email}</h3>
              <p className="text-sm text-slate-500 mt-1">{selectedUser.user_email}</p>
              
              <div className="w-full mt-6 pt-6 border-t border-slate-700">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Status do Acesso</p>
                <label className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-700 cursor-pointer hover:border-blue-500/30 transition-all group">
                  <span className={`text-xs font-bold ${selectedUser.is_active ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {selectedUser.is_active ? 'ACESSO ATIVO' : 'ACESSO SUSPENSO'}
                  </span>
                  <div 
                    onClick={() => setSelectedUser({...selectedUser, is_active: !selectedUser.is_active})}
                    className={`w-10 h-5 rounded-full relative transition-all ${selectedUser.is_active ? 'bg-emerald-500' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 size-3 bg-white rounded-full transition-all ${selectedUser.is_active ? 'left-6' : 'left-1'}`} />
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
               <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                 <span className="material-symbols-outlined text-sm text-blue-400">info</span>
                 Metadados
               </h3>
               <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">ID Interno</span>
                    <span className="text-slate-300 font-mono">{selectedUser.id.split('-')[0]}...</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Membro desde</span>
                    <span className="text-slate-300">{new Date(selectedUser.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-xl space-y-8">
              <section className="space-y-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-500">manage_accounts</span>
                  Informações do Usuário
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome Completo</label>
                    <input 
                      type="text" 
                      value={selectedUser.user_name || ''}
                      disabled
                      className="w-full h-11 bg-slate-900/50 border border-slate-700 rounded-xl px-4 text-slate-500 cursor-not-allowed outline-none"
                    />
                    <p className="text-xs text-slate-600">Nome gerenciado pelo Supabase Auth</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">E-mail</label>
                    <input 
                      type="email" 
                      value={selectedUser.user_email || ''}
                      disabled
                      className="w-full h-11 bg-slate-900/50 border border-slate-700 rounded-xl px-4 text-slate-500 cursor-not-allowed outline-none"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-6 pt-6 border-t border-slate-700">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-violet-500">verified_user</span>
                  Nível de Acesso (Role)
                </h3>
                
                <div className="grid grid-cols-1 gap-3">
                  {(['admin', 'operator', 'user'] as Role[]).map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        if (selectedUser.role === 'admin' && role !== 'admin') {
                          alert('Não é possível rebaixar o Administrador da Empresa por aqui. Contate o Owner Geral.');
                          return;
                        }
                        setSelectedUser({...selectedUser, role});
                      }}
                      disabled={selectedUser.role === 'admin' && role !== 'admin'}
                      className={`flex items-start gap-4 p-4 rounded-xl border transition-all text-left group ${
                        selectedUser.role === role
                          ? 'bg-blue-600/10 border-blue-500'
                          : 'bg-slate-900 border-slate-700 hover:border-slate-500'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className={`size-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${
                        selectedUser.role === role ? 'border-blue-500 bg-blue-500' : 'border-slate-700 bg-slate-800'
                      }`}>
                        {selectedUser.role === role && <div className="size-2 bg-white rounded-full" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-bold uppercase tracking-wider ${selectedUser.role === role ? 'text-blue-400' : 'text-white'}`}>
                            {getRoleLabel(role)}
                          </span>
                          {role === 'admin' && <span className="text-[9px] bg-violet-500 text-white px-1.5 py-0.5 rounded font-black">CRÍTICO</span>}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{getRoleDescription(role)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 flex items-start gap-4">
               <span className="material-symbols-outlined text-amber-500">warning</span>
               <div>
                  <p className="text-sm font-bold text-amber-500">Atenção ao alterar permissões</p>
                  <p className="text-xs text-amber-200/60 leading-relaxed mt-1">
                    Alterar a role de um usuário impacta imediatamente o que ele pode ver e fazer na plataforma. 
                    Certifique-se de que o usuário tem as competências necessárias para o novo nível de acesso.
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Equipe e Permissões</h2>
          <p className="text-slate-400">Gerencie quem tem acesso a este ambiente e defina níveis de controle.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-600/20"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          Convidar Usuário
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Modal de Criação */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Convidar Usuário</h3>
              <button 
                onClick={() => {
                  setIsCreating(false);
                  setNewUserEmail('');
                  setNewUserRole('operator');
                  setError(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Nome Completo</label>
                <input type="text" value={newUserFullName} onChange={(e) => setNewUserFullName(e.target.value)}
                  placeholder="João Silva" className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">E-mail *</label>
                  <input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="usuario@exemplo.com" className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Telefone</label>
                  <input type="tel" value={newUserPhone} onChange={(e) => setNewUserPhone(maskPhone(e.target.value))}
                    placeholder="+55 (45) 8823-0654" maxLength={20} className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Senha (deixe em branco para vincular usuário existente)</label>
                <input type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Mín. 6 chars para criar novo usuário" className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                <p className="text-xs text-slate-500 mt-1">
                  {newUserPassword ? 'Será criado um novo usuário no sistema.' : 'Vinculará um usuário já existente pelo e-mail.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Nível de Acesso</label>
                <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as Role)}
                  className="w-full h-11 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                  <option value="user">Membro</option>
                  <option value="operator">Operador</option>
                  <option value="admin">Administrador</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">{getRoleDescription(newUserRole)}</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setIsCreating(false); setNewUserEmail(''); setNewUserPassword(''); setNewUserFullName(''); setNewUserPhone(''); setNewUserRole('user'); setError(null); }}
                  className="flex-1 h-11 rounded-xl border border-slate-700 text-slate-400 font-bold hover:bg-slate-700 transition-all">
                  Cancelar
                </button>
                <button onClick={handleCreate} disabled={creating || !newUserEmail.trim()}
                  className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-50">
                  {creating ? 'Adicionando...' : 'Adicionar Usuário'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 bg-slate-900/20 border-b border-slate-700 flex items-center justify-between">
           <div className="relative w-full max-w-sm">
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" 
                placeholder="Buscar por nome ou email..." 
              />
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 text-lg">search</span>
           </div>
           <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
              TOTAL: {filteredUsers.length} USUÁRIOS
           </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-20 flex justify-center"><div className="size-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-700 text-[10px] uppercase text-slate-500 font-bold tracking-widest">
                  <th className="px-8 py-5">Usuário</th>
                  <th className="px-8 py-5">Cargo (Role)</th>
                  <th className="px-8 py-5 text-center">Status</th>
                  <th className="px-8 py-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredUsers.map((cu) => (
                  <tr key={cu.id} className={`hover:bg-slate-700/30 transition-colors group ${!cu.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-full bg-slate-700 bg-cover bg-center border border-slate-600" style={{ backgroundImage: `url('https://picsum.photos/seed/${cu.id}/100')` }} />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">{cu.full_name || cu.user_name || cu.user_email}</span>
                          <span className="text-xs text-slate-500">{cu.user_email}</span>
                          {cu.phone_primary && <span className="text-xs text-slate-600">{formatPhoneDisplay(cu.phone_primary)}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${
                        cu.role === 'admin' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' :
                        cu.role === 'operator' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-900 text-slate-500 border-slate-700'
                      }`}>
                        {getRoleLabel(cu.role)}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${cu.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        <span className={`size-1.5 rounded-full ${cu.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {cu.is_active ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                         <button 
                          onClick={() => handleEdit(cu)}
                          className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                         >
                            <span className="material-symbols-outlined text-lg">edit</span>
                         </button>
                         <button
                            onClick={() => handleDelete(cu)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all disabled:opacity-30"
                            disabled={cu.role === 'admin'}
                            title={cu.role === 'admin' ? 'Não é possível excluir o Administrador da Empresa' : 'Excluir acesso'}
                          >
                           <span className="material-symbols-outlined text-lg">delete</span>
                         </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center text-slate-500 italic">Nenhum usuário encontrado para esta busca.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
