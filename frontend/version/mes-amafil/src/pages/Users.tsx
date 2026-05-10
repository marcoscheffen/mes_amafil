import { User as UserIcon, Shield, Key, Mail, Phone, MoreVertical, Plus, Search, Filter, ShieldCheck, UserPlus, Trash2, Edit2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface UserMember {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  nivel: 'MASTER' | 'GERENTE' | 'COORDENADOR' | 'OPERADOR';
  status: 'ATIVO' | 'SUSPENSO' | 'PENDENTE';
  ultimoAcesso: string;
}

const users: UserMember[] = [
  {
    id: '1',
    nome: 'Marcos Cheffen',
    email: 'marcos@amafil.com.br',
    cargo: 'Engenheiro de Produção',
    nivel: 'MASTER',
    status: 'ATIVO',
    ultimoAcesso: 'Hoje, 10:45'
  },
  {
    id: '2',
    nome: 'Ricardo Nunes',
    email: 'ricardo.p@amafil.com.br',
    cargo: 'Gerente PCP',
    nivel: 'GERENTE',
    status: 'ATIVO',
    ultimoAcesso: 'Ontem, 16:30'
  },
  {
    id: '3',
    nome: 'Ana Paula Souza',
    email: 'ana.s@amafil.com.br',
    cargo: 'Coordenadora de Qualidade',
    nivel: 'COORDENADOR',
    status: 'ATIVO',
    ultimoAcesso: '08/05/2026, 08:15'
  },
  {
    id: '4',
    nome: 'João Silva',
    email: 'joao.s@amafil.com.br',
    cargo: 'Operador de Máquina Senior',
    nivel: 'OPERADOR',
    status: 'SUSPENSO',
    ultimoAcesso: '05/05/2026, 14:00'
  },
  {
    id: '5',
    nome: 'Juliana Mendes',
    email: 'juliana.m@amafil.com.br',
    cargo: 'Analista de Sistemas Jr',
    nivel: 'OPERADOR',
    status: 'PENDENTE',
    ultimoAcesso: '-'
  }
];

export function Users() {
  const roleStyles = {
    MASTER: "bg-gray-900 text-white border-gray-900",
    GERENTE: "bg-blue-50 text-amafil-blue border-amafil-blue/20",
    COORDENADOR: "bg-purple-50 text-purple-600 border-purple-600/20",
    OPERADOR: "bg-gray-50 text-gray-500 border-gray-200",
  };

  const statusStyles = {
    ATIVO: "bg-green-50 text-status-success border-status-success/20",
    SUSPENSO: "bg-red-50 text-status-danger border-status-danger/20",
    PENDENTE: "bg-amber-50 text-status-warning border-status-warning/20",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-bento-border pb-6 gap-4 sm:gap-0">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-gray-900 italic">Access<span className="text-amafil-blue">.Control</span></h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">Gestão de Identidades e Níveis de Permissão do Cluster</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button className="bg-white border-2 border-bento-border text-gray-600 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto">
            <ShieldCheck className="w-4 h-4" />
            Auditoria
          </button>
          <button className="bg-gray-900 text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-md flex items-center justify-center gap-2 w-full sm:w-auto">
            <UserPlus className="w-4 h-4" />
            Convidar Usuário
          </button>
        </div>
      </div>

      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Contas', value: '154', icon: UserIcon, color: 'text-gray-900' },
          { label: 'Sessões Ativas', value: '42', icon: Key, color: 'text-amafil-green' },
          { label: 'Solicit. Acesso', value: '03', icon: Mail, color: 'text-amafil-blue' },
          { label: 'Alertas Seguran.', value: '0', icon: Shield, color: 'text-gray-300' },
        ].map((item, i) => (
          <div key={i} className="card-mes p-5 shadow-sm flex items-center justify-between">
            <div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.label}</h4>
              <p className={cn("text-3xl font-black italic", item.color)}>{item.value}</p>
            </div>
            <item.icon className="w-8 h-8 text-gray-100" />
          </div>
        ))}
      </div>

      {/* Users List Box */}
      <div className="card-mes p-0 overflow-hidden shadow-sm">
        <div className="px-8 py-5 border-b border-bento-border bg-gray-50/50 flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome, e-mail ou cargo..." 
              className="w-full bg-white border border-bento-border rounded-full py-2.5 pl-12 pr-4 text-xs font-bold text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-amafil-blue/10 outline-none" 
            />
          </div>
          <button className="p-2.5 text-gray-400 hover:bg-white hover:text-gray-900 rounded-xl transition-all">
            <Filter className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-[10px] uppercase text-gray-400 font-black tracking-widest border-b border-gray-100">
              <tr>
                <th className="px-8 py-4">Usuário</th>
                <th className="px-8 py-4">Nível de Acesso</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Último Acesso</th>
                <th className="px-8 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 font-black border border-bento-border group-hover:border-amafil-blue/30 transition-all">
                        {user.nome.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 italic tracking-tight">{user.nome}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={cn("text-[9px] font-black px-2.5 py-1 rounded-lg border shadow-sm", roleStyles[user.nivel])}>
                      {user.nivel}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className={cn("badge-status border shadow-sm", statusStyles[user.status])}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-xs font-bold text-gray-500 italic">
                    {user.ultimoAcesso}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button className="p-2 text-gray-400 hover:text-amafil-blue hover:bg-white rounded-lg transition-all border border-transparent hover:border-bento-border">
                         <Edit2 className="w-4 h-4" />
                       </button>
                       <button className="p-2 text-gray-400 hover:text-status-danger hover:bg-white rounded-lg transition-all border border-transparent hover:border-bento-border">
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-gray-50/50 border-t border-bento-border flex justify-between items-center">
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Exibindo 5 de 154 usuários</p>
           <div className="flex gap-1">
             {[1, 2, 3].map(n => (
               <button key={n} className={cn("w-8 h-8 rounded-lg text-[10px] font-black transition-all", n === 1 ? "bg-gray-900 text-white" : "bg-white border border-bento-border text-gray-400 hover:border-amafil-blue hover:text-amafil-blue")}>
                 {n}
               </button>
             ))}
           </div>
        </div>
      </div>

      {/* Role Definitions - Visual Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-mes bg-white border-2 border-bento-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-amafil-blue" />
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Definição de Privilégios</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-gray-900 mt-1.5 shrink-0" />
              <div>
                <p className="text-xs font-black text-gray-900 italic">MASTER</p>
                <p className="text-[10px] font-bold text-gray-500">Acesso total ao sistema, configurações de cluster e gestão de usuários.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-amafil-blue mt-1.5 shrink-0" />
              <div>
                <p className="text-xs font-black text-gray-900 italic">GERENTE / COORDENADOR</p>
                <p className="text-[10px] font-bold text-gray-500">Gestão de OPs, aprovação de relatórios e monitoramento total de linhas.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5 shrink-0" />
              <div>
                <p className="text-xs font-black text-gray-900 italic">OPERADOR</p>
                <p className="text-[10px] font-bold text-gray-500">Apontamento de produção, abertura de REQs e monitoramento de máquina local.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card-mes bg-amafil-blue/5 border-amafil-blue/20 p-6 flex flex-col justify-between">
           <div>
             <h3 className="text-xs font-black text-amafil-blue uppercase tracking-widest mb-2 italic">Segurança de Rede</h3>
             <p className="text-sm font-bold text-gray-600">Este cluster está operando sob política de <span className="text-gray-900 font-black">Zero Trust</span>. Todo acesso externo requer MFA via Amafil ID.</p>
           </div>
           <button className="mt-6 w-full h-12 bg-white border-2 border-amafil-blue/20 text-amafil-blue text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-amafil-blue hover:text-white transition-all shadow-sm">
             Ver Logs de Segurança
           </button>
        </div>
      </div>
    </div>
  );
}
