
import { Agent, Company, Customer, ChatMessage, Article, FAQ, User, CompanyUser } from './types';

const MOCK_COMPANIES: Company[] = [
  { id: '1', name: 'TechFlow Solutions', slug: 'techflow', is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '2', name: 'Nexus AI Labs', slug: 'nexus', is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: '3', name: 'Starlight Ventures', slug: 'starlight', is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
];

const MOCK_COMPANY_USERS: CompanyUser[] = [
  { id: 'cu1', user_id: 'u1', company_id: '1', role: 'admin', is_active: true, created_at: '2025-01-01', updated_at: '2025-01-01', user_email: 'admin@nexus.ai', user_name: 'Admin Principal' },
  { id: 'cu2', user_id: 'u2', company_id: '1', role: 'admin', is_active: true, created_at: '2025-01-02', updated_at: '2025-01-02', user_email: 'julia@techflow.ai', user_name: 'Julia Castro' },
  { id: 'cu3', user_id: 'u3', company_id: '1', role: 'user', is_active: true, created_at: '2025-01-05', updated_at: '2025-01-05', user_email: 'ricardo@techflow.ai', user_name: 'Ricardo Mendes' },
  { id: 'cu4', user_id: 'u4', company_id: '1', role: 'user', is_active: false, created_at: '2025-01-10', updated_at: '2025-01-10', user_email: 'lucas@techflow.ai', user_name: 'Lucas Ferreira' },
];

export const supabase = {
  auth: {
    getUser: async () => ({ data: { user: { id: 'u1', email: 'admin@nexus.ai' } }, error: null }),
    signInWithPassword: async ({ email }: { email: string }) => ({ 
      data: { user: { id: 'u1', email, full_name: 'Admin User' } }, 
      error: null 
    }),
    signOut: async () => ({ error: null }),
  },
  from: (table: string) => ({
    select: (query: string = '*') => ({
      eq: (column: string, value: any) => ({
        data: table === 'company_users' ? MOCK_COMPANY_USERS.filter(cu => cu[column as keyof CompanyUser] === value) : [],
        error: null
      }),
      data: table === 'companies' ? MOCK_COMPANIES : [],
      error: null
    }),
  }),
  rpc: (fn: string, params: any) => {
    switch(fn) {
      case 'get_user_companies':
        // Simula o retorno do RPC get_user_companies
        return {
          data: MOCK_COMPANIES.map(c => ({
            company_id: c.id,
            company_name: c.name,
            company_slug: c.slug,
            role: 'owner',
            is_active: c.is_active,
            created_at: c.created_at
          })),
          error: null
        };
      case 'set_current_company':
        console.log(`✓ Contexto definido para company: ${params.p_company_id}`);
        return { data: true, error: null };
      default:
        return { data: [], error: null };
    }
  },
  channel: (name: string) => ({
    on: () => ({ subscribe: () => ({}) })
  })
};
