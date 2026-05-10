import { Play, Pause, Square, FileText, Wrench, Package, AlertCircle, Activity, Gauge, Clock, LayoutGrid, List, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { Machine } from '../types';

const machines: (Machine & { oee: number; availability: number; quality: number; prod: string })[] = [
  { id: '30', codigo: '30', nome: 'Empacotadora Stand-up 30', status: 'OPERANDO', lastOP: 'M01376', oee: 88.5, availability: 92, quality: 99.1, prod: '1,250 CX' },
  { id: '32', codigo: '32', nome: 'Empacotadora Stand-up 32', status: 'OPERANDO', lastOP: 'M01385', oee: 76.2, availability: 80, quality: 98.5, prod: '840 CX' },
  { id: '15', codigo: '15', nome: 'Ensacadeira Automática 15', status: 'PARADA', lastOP: 'M01390', oee: 0, availability: 0, quality: 100, prod: '0 SC' },
  { id: '08', codigo: '08', nome: 'Costuradeira de Sacaria 08', status: 'MANUTENCAO', lastOP: 'M01402', oee: 0, availability: 0, quality: 0, prod: '0 SC' },
  { id: '02', codigo: '02', nome: 'Coladeira de Papelão 02', status: 'OFFLINE', lastOP: '-', oee: 0, availability: 0, quality: 0, prod: '-' },
];

export function Production() {
  const [viewMode, setViewMode] = useState<'CARDS' | 'LIST'>('CARDS');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-bento-border pb-6 gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tighter text-gray-900">Live<span className="text-amafil-green">.Produção</span></h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] lg:text-[10px] mt-1">Monitoramento em Tempo Real - Chão de Fábrica</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none justify-center bg-white px-5 py-2.5 rounded-full border border-bento-border text-[10px] lg:text-xs font-bold text-gray-500 flex items-center gap-2 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-status-success animate-pulse shadow-sm"></span>
            Total: 05
          </div>
          
          <div className="relative flex-1 sm:flex-none">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full sm:w-auto justify-center bg-gray-900 text-white px-5 py-2.5 rounded-full text-[10px] lg:text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-md flex items-center gap-2"
            >
              {viewMode === 'CARDS' ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
              {viewMode === 'CARDS' ? 'Cards' : 'Lista'}
              <ChevronDown className="w-4 h-4 ml-1 opacity-50" />
            </button>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-bento-border rounded-2xl shadow-xl z-20 overflow-hidden py-1">
                  <button 
                    onClick={() => { setViewMode('CARDS'); setIsDropdownOpen(false); }}
                    className={cn(
                      "w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-colors",
                      viewMode === 'CARDS' ? "bg-gray-50 text-amafil-green" : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    Visualização Cards
                  </button>
                  <button 
                    onClick={() => { setViewMode('LIST'); setIsDropdownOpen(false); }}
                    className={cn(
                      "w-full px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-colors",
                      viewMode === 'LIST' ? "bg-gray-50 text-amafil-green" : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <List className="w-4 h-4" />
                    Visualização Lista
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Critical Alerts Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-mes bg-red-50 border-status-danger/20 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-status-danger flex items-center justify-center text-white shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-status-danger uppercase tracking-widest">Alerta Crítico</h4>
            <p className="text-sm font-bold text-gray-900 italic">Máquina 08 em manutenção mecânica excedida</p>
          </div>
        </div>
        <div className="card-mes bg-amber-50 border-status-warning/20 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-status-warning flex items-center justify-center text-white shrink-0">
             <Clock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-status-warning uppercase tracking-widest">Atenção</h4>
            <p className="text-sm font-bold text-gray-900 italic">Setup da OP M01390 atrasado em 15min</p>
          </div>
        </div>
        <div className="card-mes bg-blue-50 border-amafil-blue/20 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amafil-blue flex items-center justify-center text-white shrink-0">
             <Activity className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-amafil-blue uppercase tracking-widest">Informação</h4>
            <p className="text-sm font-bold text-gray-900 italic">Troca de turno prevista para as 13:45</p>
          </div>
        </div>
      </div>

      {/* Machine Grid/List */}
      {viewMode === 'CARDS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {machines.map((machine) => (
            <div key={machine.id} className="card-mes group hover:border-amafil-green/30 flex flex-col p-0 overflow-hidden relative">
              {/* Status Bar Top */}
              <div className={cn(
                "h-2 w-full",
                machine.status === 'OPERANDO' ? "bg-status-success" : 
                machine.status === 'PARADA' ? "bg-status-warning" :
                machine.status === 'MANUTENCAO' ? "bg-status-danger" : "bg-status-offline"
              )} />

              <div className="p-5 lg:p-6 flex flex-col h-full">
                {/* Machine Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0">ID do Nó: {machine.codigo}</span>
                      <span className={cn(
                        "badge-status border shadow-sm shrink-0",
                        machine.status === 'OPERANDO' ? "bg-green-50 text-status-success border-status-success/20" : 
                        machine.status === 'PARADA' ? "bg-amber-50 text-status-warning border-status-warning/20" :
                        machine.status === 'MANUTENCAO' ? "bg-red-50 text-status-danger border-status-danger/20" : "bg-gray-50 text-status-offline border-border-mes"
                      )}>
                        {machine.status}
                      </span>
                    </div>
                    <h3 className="text-lg lg:text-xl font-bold tracking-tight text-gray-900 italic truncate" title={machine.nome}>{machine.nome}</h3>
                  </div>
                  {machine.status === 'OPERANDO' && (
                    <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                      <Activity className="w-5 h-5 text-status-success animate-pulse" />
                    </div>
                  )}
                </div>

                {/* OP Badge - Terminal Style */}
                <div className="bg-gray-900 rounded-xl p-3 mb-6 flex justify-between items-center border border-gray-800 overflow-hidden shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-amafil-green shrink-0" />
                    <span className="text-[10px] font-mono font-bold text-gray-400 hidden sm:inline">OP_EXEC:</span>
                    <span className="text-[10px] font-mono font-black text-amafil-green tracking-widest truncate">{machine.lastOP}</span>
                  </div>
                  <span className="bg-gray-800 text-[8px] font-bold text-gray-500 uppercase px-1.5 py-0.5 rounded shrink-0">v1.2</span>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-8">
                  <div className="bg-gray-50 p-2.5 rounded-2xl border border-bento-border text-center overflow-hidden">
                    <p className="text-[8px] lg:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">OEE</p>
                    <p className={cn(
                      "text-base lg:text-lg font-black italic",
                      machine.oee >= 85 ? "text-status-success" : machine.oee >= 70 ? "text-status-warning" : "text-status-danger"
                    )}>{machine.oee}%</p>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-2xl border border-bento-border text-center overflow-hidden">
                    <p className="text-[8px] lg:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">Dispon.</p>
                    <p className="text-base lg:text-lg font-black text-gray-900 italic">{machine.availability}%</p>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-2xl border border-bento-border text-center overflow-hidden col-span-2 sm:col-span-1">
                    <p className="text-[8px] lg:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">Qualidade</p>
                    <p className="text-base lg:text-lg font-black text-amafil-blue italic">{machine.quality}%</p>
                  </div>
                </div>

                {/* Action Area */}
                <div className="mt-auto pt-6 border-t border-bento-border flex gap-3">
                  <button className="flex-1 h-12 flex items-center justify-center gap-2 bg-white border-2 border-bento-border text-gray-500 rounded-2xl hover:bg-gray-50 hover:text-gray-900 text-[10px] font-black uppercase tracking-widest transition-all">
                    <Wrench className="w-4 h-4" />
                    <span className="hidden sm:inline">Logs</span>
                  </button>
                  <button className={cn(
                    "flex-[1.5] h-12 flex items-center justify-center gap-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md group-hover:scale-[1.02]",
                    machine.status === 'OPERANDO' 
                      ? "bg-amafil-green text-white hover:bg-amafil-green/90 shadow-amafil-green/20" 
                      : "bg-gray-900 text-white hover:bg-gray-800 shadow-gray-900/20"
                  )}>
                    <Gauge className="w-4 h-4" />
                    Monitorar
                  </button>
                </div>
              </div>

              {/* Inactive Overlays */}
              {(machine.status === 'OFFLINE') && (
                <div className="absolute inset-x-0 bottom-0 top-2 bg-gray-50/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                  <div className="bg-white border-2 border-bento-border px-4 py-2 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest shadow-xl">
                    Node Desconectado
                  </div>
                </div>
              )}
              {(machine.status === 'MANUTENCAO') && (
                <div className="absolute inset-x-0 bottom-0 top-2 bg-red-50/20 backdrop-blur-[1px] flex items-center justify-center z-10 p-4">
                  <div className="bg-white border-2 border-status-danger/30 px-4 py-2 rounded-full text-[10px] font-black text-status-danger uppercase tracking-widest shadow-xl flex items-center gap-2 animate-bounce text-center">
                    <Wrench className="w-3.5 h-3.5" />
                    Ajuste Técnico
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add Machine - Bento Style */}
          <button className="card-mes border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-12 gap-4 text-gray-400 hover:text-amafil-green hover:border-amafil-green hover:bg-green-50/20 transition-all cursor-pointer group">
            <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center group-hover:bg-green-100 transition-all duration-300 group-hover:rotate-12">
              <Package className="w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="text-sm font-black uppercase tracking-widest mb-1">Provisionar Nó</p>
              <p className="text-xs font-bold text-gray-400">Adicionar nova linha</p>
            </div>
          </button>
        </div>
      ) : (
        <div className="card-mes p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-bento-border bg-gray-50/50">
                  <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Máquina</th>
                  <th className="py-4 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Status Lab</th>
                  <th className="py-4 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Eficiência OEE</th>
                  <th className="py-4 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Processo OP</th>
                  <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {machines.map((machine) => (
                  <tr key={machine.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-[10px] shrink-0 shadow-sm",
                          machine.status === 'OPERANDO' ? "bg-status-success" : 
                          machine.status === 'PARADA' ? "bg-status-warning" :
                          machine.status === 'MANUTENCAO' ? "bg-status-danger" : "bg-status-offline"
                        )}>
                          {machine.codigo}
                        </div>
                        <span className="font-bold text-gray-900 text-sm italic truncate max-w-[180px]" title={machine.nome}>{machine.nome}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={cn(
                        "badge-status border shadow-sm whitespace-nowrap px-3 py-1",
                        machine.status === 'OPERANDO' ? "bg-green-50 text-status-success border-status-success/20" : 
                        machine.status === 'PARADA' ? "bg-amber-50 text-status-warning border-status-warning/20" :
                        machine.status === 'MANUTENCAO' ? "bg-red-50 text-status-danger border-status-danger/20" : "bg-gray-50 text-status-offline border-border-mes"
                      )}>
                        {machine.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden shrink-0">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              machine.oee >= 85 ? "bg-status-success" : machine.oee >= 70 ? "bg-status-warning" : "bg-status-danger"
                            )} 
                            style={{ width: `${machine.oee}%` }}
                          />
                        </div>
                        <span className="text-xs font-black text-gray-700">{machine.oee}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-gray-300" />
                        <span className="text-xs font-mono font-bold text-gray-500">{machine.lastOP}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="p-2 text-gray-400 hover:text-amafil-green hover:bg-green-50 rounded-lg transition-all group-hover:scale-110">
                        <Gauge className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
