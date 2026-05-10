
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { GlobalSearch } from '../Search/GlobalSearch';

interface HeaderProps {
  viewTitle: string;
  userName: string;
  companyId?: string;
}

export const Header: React.FC<HeaderProps> = ({ viewTitle, companyId: _companyId }) => {
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
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <h2 className="text-white text-lg font-bold leading-tight">{viewTitle}</h2>
      </div>

      <div className="flex items-center gap-4">
        <GlobalSearch />

        <div className="flex items-center gap-2">
          <button 
            onClick={handleLogout}
            className="px-3 py-1.5 text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all"
            title="Fazer logout"
          >
            Sair
          </button>
          <button className="size-10 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-blue-500 transition-all relative">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-2.5 right-2.5 size-2 bg-red-500 rounded-full border border-slate-800"></span>
          </button>
          <button className="size-10 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-blue-500 transition-all">
            <span className="material-symbols-outlined text-[20px]">help</span>
          </button>
        </div>
      </div>
    </header>
  );
};
