import { Filter, Search, ChevronLeft, ChevronRight, Clock, Box } from 'lucide-react';
import { cn } from '../lib/utils';

interface OP {
  id: string;
  numero: string;
  produto: string;
  qtdPlanejada: number;
  unidade: string;
  status: 'BLOQUEADA' | 'LIBERADA' | 'EXECUCAO' | 'PENDENTE' | 'FINALIZADA';
  emissao: string;
  maquina: string;
}

const ops: OP[] = [
  { id: '1', numero: 'M01376.01.001', produto: 'FECULA HIDRATADA AMAFIL CX 21*500 PL', qtdPlanejada: 1500, unidade: 'CX', status: 'EXECUCAO', emissao: '28/04/2026', maquina: '30' },
  { id: '2', numero: 'M01377.01.001', produto: 'AMIDO DE MILHO AMAFIL PCT 500G', qtdPlanejada: 2000, unidade: 'PCT', status: 'LIBERADA', emissao: '29/04/2026', maquina: '32' },
  { id: '3', numero: 'M01378.01.001', produto: 'POLVILHO DOCE AMAFIL SACO 1KG', qtdPlanejada: 1200, unidade: 'SC', status: 'BLOQUEADA', emissao: '27/04/2026', maquina: '15' },
  { id: '4', numero: 'M01379.01.001', produto: 'TAPIOCA GRANULADA AMAFIL PCT 500G', qtdPlanejada: 800, unidade: 'PCT', status: 'PENDENTE', emissao: '29/04/2026', maquina: '30' },
  { id: '5', numero: 'M01380.01.001', produto: 'FARINHA DE MANDIOCA AMAFIL SACO 50KG', qtdPlanejada: 300, unidade: 'SC', status: 'FINALIZADA', emissao: '25/04/2026', maquina: '08' },
];

export function OrderList() {
  const statusColors = {
    BLOQUEADA: "bg-red-100 text-red-700",
    LIBERADA: "bg-blue-100 text-blue-700",
    EXECUCAO: "bg-green-100 text-green-700",
    PENDENTE: "bg-amber-100 text-amber-700",
    FINALIZADA: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-bento-border pb-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tighter text-gray-900">Ordens de Produção</h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] lg:text-[10px] mt-1">Gestão e liberação de ordens importadas do Protheus (SIGAPCP)</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none justify-center items-center gap-2 bg-white border border-border-mes px-4 py-2.5 rounded-full text-[10px] lg:text-xs font-bold text-gray-600 uppercase tracking-widest hover:bg-gray-50 transition-colors shadow-sm">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros Avançados</span>
          </button>
          <button className="flex-1 sm:flex-none justify-center bg-amafil-blue text-white px-4 py-2.5 rounded-full text-[10px] lg:text-xs font-black uppercase tracking-widest hover:bg-amafil-blue/90 transition-colors shadow-md flex items-center gap-2">
            Sincronizar Protheus
          </button>
        </div>
      </div>

      <div className="card-mes">
        <div className="p-4 border-b border-border-mes flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Pesquisar OPs..." 
              className="w-full bg-white border border-border-mes rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-amafil-blue/20 transition-all shadow-sm"
            />
          </div>
          
          <div className="flex gap-4 items-center">
            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Total: <span className="text-gray-900 font-bold">124 OPs</span></span>
            <div className="flex items-center gap-1">
              <button className="p-1 px-2.5 bg-white border border-border-mes rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
              <span className="px-3 text-xs font-bold text-gray-900">1 / 12</span>
              <button className="p-1 px-2.5 bg-white border border-border-mes rounded text-gray-600 hover:bg-gray-50"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F9FAFB] text-[11px] uppercase text-gray-500 font-bold border-b border-border-mes">
              <tr>
                <th className="px-6 py-4">Número da OP</th>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4 text-center">Máquina</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Planejado</th>
                <th className="px-6 py-4">Emissão</th>
                <th className="px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ops.map((op) => (
                <tr key={op.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono font-bold text-gray-900 group-hover:text-amafil-blue transition-colors">
                      {op.numero}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900 truncate max-w-xs">{op.produto}</span>
                      <span className="text-[10px] text-gray-400 font-bold tracking-tight">CÓD: 10.206.219</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-600 border border-gray-200">
                      {op.maquina}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn("badge-status", statusColors[op.status])}>
                      {op.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-gray-900">{op.qtdPlanejada}</span>
                      <span className="text-[10px] text-gray-400 font-bold tracking-wide">{op.unidade}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      {op.emissao}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                       <button className={cn(
                         "h-8 px-3 text-[11px] font-bold rounded-md transition-colors shadow-sm",
                         op.status === 'BLOQUEADA' ? "bg-status-success text-white hover:bg-green-700" : 
                         op.status === 'LIBERADA' ? "bg-status-danger text-white hover:bg-red-700" :
                         "bg-gray-100 text-gray-400 cursor-not-allowed"
                       )}>
                         {op.status === 'BLOQUEADA' ? 'LIBERAR' : op.status === 'LIBERADA' ? 'BLOQUEAR' : 'GERENCIAR'}
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
