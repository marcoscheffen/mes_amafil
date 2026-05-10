
import React, { useEffect, useState } from 'react';
import { Company } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface CompanySelectionPageProps {
  onSelect: (company: Company) => void;
}

export const CompanySelectionPage: React.FC<CompanySelectionPageProps> = ({ onSelect }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const { signOut } = useAuth();


  const handleLogout = async () => {
    try {
      console.log('🔴 Iniciando logout...');
      await signOut();
      console.log('✅ Logout realizado, recarregando página...');
      // Limpar localStorage também
      localStorage.removeItem('current_company_id');
      // Aguardar um pouco antes de recarregar para garantir que o signOut terminou
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error);
      // Mesmo com erro, tentar limpar e redirecionar
      localStorage.removeItem('current_company_id');
      window.location.href = '/';
    }
  };

  useEffect(() => {
    const fetchCompanies = async () => {
      const { data, error } = await supabase.rpc('get_user_companies', {});
      // Fix: Check if data is an array before mapping to avoid errors if RPC returns boolean (e.g. from set_current_company)
      if (data && Array.isArray(data)) {
        // Mapeia o retorno do RPC para a interface Company
        const mapped = data.map((item: any) => ({
          id: item.company_id,
          name: item.company_name,
          slug: item.company_slug,
          is_active: item.is_active,
          created_at: item.created_at
        }));
        setCompanies(mapped);
      }
      setLoading(false);
    };
    fetchCompanies();
  }, []);

  const handleSelect = async (company: Company) => {
    await supabase.rpc('set_current_company', { p_company_id: company.id });
    onSelect(company);
  };

  const handleSlugChange = (value: string) => {
    const slug = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setCompanySlug(slug);
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreating(true);

    try {
      console.log('🔵 Criando nova empresa...', { companyName, companySlug });

      if (!companyName || !companySlug) {
        setError('Todos os campos são obrigatórios');
        setCreating(false);
        return;
      }

      if (!/^[a-z0-9-]+$/.test(companySlug)) {
        setError('O slug deve conter apenas letras minúsculas, números e hífens');
        setCreating(false);
        return;
      }

      // Chamar Edge Function register-company
      // Nota: Esta função cria usuário + empresa, mas como já estamos logados,
      // vamos criar apenas a empresa usando uma abordagem diferente
      // Por enquanto, vamos usar a mesma função mas adaptada
      
      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('👤 Usuário autenticado:', user.id);

      // Usar a Edge Function register-company adaptada
      // Nota: A Edge Function cria um novo usuário, mas podemos adaptar para usar o usuário atual
      // Alternativa: criar empresa via função RPC SECURITY DEFINER
      
      // Usar função RPC create_company_for_user (SECURITY DEFINER)
      // Esta função cria a empresa e vincula o usuário em uma única transação
      // Bypassa RLS para evitar recursão infinita
      const { data: rpcResult, error: rpcError } = await supabase.rpc('create_company_for_user', {
        p_company_name: companyName,
        p_company_slug: companySlug,
        p_user_id: user.id
      });

      if (rpcError) {
        console.error('❌ Erro ao criar empresa via RPC:', rpcError);
        
        // Se a função não existir, mostrar erro informativo
        if (rpcError.message?.includes('function') || rpcError.message?.includes('does not exist')) {
          throw new Error(
            'Função create_company_for_user não está disponível no banco de dados.\n\n' +
            'Para resolver:\n' +
            '1. Acesse o Supabase Dashboard\n' +
            '2. Vá em SQL Editor\n' +
            '3. Execute o arquivo: backend/supabase/create_company_for_user.sql\n\n' +
            'Ou use a tela de login para criar uma nova empresa com novo usuário.'
          );
        }
        
        throw rpcError;
      }

      if (!rpcResult || !rpcResult.success) {
        throw new Error(rpcResult?.message || 'Erro ao criar empresa');
      }

      console.log('✅ Empresa criada via RPC:', rpcResult);

      console.log('✅ Empresa criada com sucesso!');
      
      // Recarregar lista de empresas
      const { data: updatedData } = await supabase.rpc('get_user_companies', {});
      if (updatedData && Array.isArray(updatedData)) {
        const mapped = updatedData.map((item: any) => ({
          id: item.company_id,
          name: item.company_name,
          slug: item.company_slug,
          is_active: item.is_active,
          created_at: item.created_at
        }));
        setCompanies(mapped);
      }

      // Fechar modal e limpar campos
      setShowCreateModal(false);
      setCompanyName('');
      setCompanySlug('');
    } catch (err: any) {
      console.error('❌ Erro ao criar empresa:', err);
      setError(err.message || 'Erro ao criar empresa');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col p-8 items-center">
      <div className="w-full max-w-6xl space-y-12 py-12">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="size-16 bg-gradient-to-br from-blue-500 to-violet-500 rounded-2xl flex items-center justify-center text-white shadow-2xl mb-2">
            <span className="material-symbols-outlined text-4xl">smart_toy</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Selecione sua Empresa</h1>
          <p className="text-slate-400 text-lg max-w-xl">Bem-vindo de volta! Escolha qual ambiente você deseja gerenciar agora.</p>
          <button
            onClick={handleLogout}
            className="mt-4 px-4 py-2 text-sm font-bold text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all"
          >
            Fazer Logout (Teste)
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="size-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => handleSelect(company)}
                className="group flex flex-col bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all text-left"
              >
                <div className="h-32 w-full bg-slate-700 relative overflow-hidden">
                  <img 
                    src={`https://picsum.photos/seed/${company.id}/400/200`} 
                    className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-500" 
                    alt={company.name}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-800 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <div className="size-12 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center text-blue-500 shadow-xl group-hover:text-white group-hover:bg-blue-600 transition-colors">
                      <span className="material-symbols-outlined">business</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{company.name}</h3>
                    <p className="text-slate-500 text-sm mt-1">/{company.slug}</p>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20 uppercase">Acesso Autorizado</span>
                    <span className={`size-2 rounded-full ${company.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} title={company.is_active ? 'Ativa' : 'Inativa'} />
                  </div>
                  <div className="pt-4 mt-auto">
                    <div className="w-full h-10 rounded-lg bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 group-hover:bg-blue-600 transition-all">
                      <span>Acessar Ambiente</span>
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}

            <button 
              onClick={() => setShowCreateModal(true)}
              className="group flex flex-col items-center justify-center min-h-[360px] border-2 border-dashed border-slate-700 rounded-2xl hover:border-blue-500 hover:bg-slate-800/30 transition-all p-8 gap-4"
            >
              <div className="size-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
                <span className="material-symbols-outlined text-3xl">add</span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-white mb-2">Criar nova empresa</h3>
                <p className="text-sm text-slate-500">Registre uma nova organização e comece a automatizar com IA.</p>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Modal de Criação de Empresa */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Criar Nova Empresa</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setError(null);
                  setCompanyName('');
                  setCompanySlug('');
                }}
                className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Nome da Empresa</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={creating}
                  className="w-full h-12 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Ex: Minha Empresa"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Slug da Empresa</label>
                <input
                  type="text"
                  value={companySlug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  disabled={creating}
                  className="w-full h-12 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="minha-empresa"
                  required
                />
                <p className="text-xs text-slate-500">Apenas letras minúsculas, números e hífens</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setError(null);
                    setCompanyName('');
                    setCompanySlug('');
                  }}
                  disabled={creating}
                  className="flex-1 h-11 px-6 rounded-xl border border-slate-700 text-slate-400 font-bold hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Criando...</span>
                    </>
                  ) : (
                    <>
                      <span>Criar Empresa</span>
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
