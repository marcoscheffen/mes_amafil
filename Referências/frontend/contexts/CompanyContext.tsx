import React, { createContext, useContext, useState, useEffect } from 'react';
import { Company } from '../types';
import { supabase } from '../lib/supabase';

interface CompanyContextType {
  currentCompany: Company | null;
  companies: Company[];
  loading: boolean;
  error: string | null;
  setCurrentCompany: (company: Company) => Promise<void>;
  refreshCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [currentCompany, setCurrentCompanyState] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar companies do usuário
  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError(null);

      // get_user_companies() não recebe parâmetros - usa auth.uid() internamente
      const { data, error: rpcError } = await supabase.rpc('get_user_companies');

      if (rpcError) throw rpcError;

      if (data && Array.isArray(data)) {
        const mappedCompanies: Company[] = data.map((item: any) => ({
          id: item.company_id,
          name: item.company_name,
          slug: item.company_slug,
          is_active: item.is_active,
          created_at: item.created_at,
          updated_at: item.created_at
        }));

        setCompanies(mappedCompanies);

        // Se não há company atual, verificar localStorage ou usar a primeira
        if (!currentCompany) {
          const savedCompanyId = localStorage.getItem('current_company_id');

          if (mappedCompanies.length > 0) {
            const companyToSelect = savedCompanyId
              ? mappedCompanies.find(c => c.id === savedCompanyId) || mappedCompanies[0]
              : mappedCompanies[0];

            // Definir company sem chamar setCurrentCompany para evitar loop
            setCurrentCompanyState(companyToSelect);
            localStorage.setItem('current_company_id', companyToSelect.id);
            localStorage.setItem('current_company_json', JSON.stringify(companyToSelect));

            // Definir no contexto do Supabase
            await supabase.rpc('set_current_company', {
              p_company_id: companyToSelect.id
            });
          } else if (savedCompanyId) {
            // Global admin: get_user_companies() retorna vazio, restaurar do JSON salvo
            const savedJson = localStorage.getItem('current_company_json');
            if (savedJson) {
              try {
                const savedCompany: Company = JSON.parse(savedJson);
                setCurrentCompanyState(savedCompany);
                await supabase.rpc('set_current_company', {
                  p_company_id: savedCompany.id
                });
              } catch {
                // JSON inválido: ignorar e deixar sem empresa selecionada
              }
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao carregar companies:', err);
    } finally {
      setLoading(false);
    }
  };

  // Definir company atual
  const setCurrentCompany = async (company: Company) => {
    try {
      setError(null);

      // Definir no contexto do Supabase
      const { error: rpcError } = await supabase.rpc('set_current_company', {
        p_company_id: company.id
      });

      if (rpcError) throw rpcError;

      // Salvar no localStorage para persistência (inclui JSON completo para global admins)
      localStorage.setItem('current_company_id', company.id);
      localStorage.setItem('current_company_json', JSON.stringify(company));

      setCurrentCompanyState(company);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao definir company:', err);
      throw err;
    }
  };


  // Carregar companies quando o componente monta
  useEffect(() => {
    loadCompanies();
  }, []);

  return (
    <CompanyContext.Provider
      value={{
        currentCompany,
        companies,
        loading,
        error,
        setCurrentCompany,
        refreshCompanies: loadCompanies
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}

