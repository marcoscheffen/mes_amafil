import { FileText, Wrench, Package, AlertCircle, Activity, Gauge, Clock, LayoutGrid, List, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { Machine } from '../types';

type ProductionMachine = Machine & {
  setor: string;
  linha: string;
  processo: string;
  equipamentoAuxiliar: string;
  oee: number;
  availability: number;
  quality: number;
  prod: string;
};

const machineCatalog: Array<Omit<ProductionMachine, 'oee' | 'availability' | 'quality' | 'prod' | 'lastOP'>> = [
  { id: 'EMP-01A', codigo: 'EMP-01A', nome: 'Empacotadora 01-A MG1000 Indumak', setor: 'Diversos', linha: 'L01', processo: 'Empacotamento Graos', equipamentoAuxiliar: 'Enfardadeira E01-A MK30', status: 'OPERANDO' },
  { id: 'EMP-01B', codigo: 'EMP-01B', nome: 'Empacotadora 01-B MG1000 Indumak', setor: 'Diversos', linha: 'L01', processo: 'Empacotamento Graos', equipamentoAuxiliar: '-', status: 'OPERANDO' },
  { id: 'EMP-02A', codigo: 'EMP-02A', nome: 'Empacotadora 02-A MG1000 Indumak', setor: 'Diversos', linha: 'L02', processo: 'Empacotamento Pipoca', equipamentoAuxiliar: 'Enfardadeira E02-A MK30', status: 'OPERANDO' },
  { id: 'EMP-09A', codigo: 'EMP-09A', nome: 'Empacotadora 09-A MG1000 Indumak', setor: 'Diversos', linha: 'L09', processo: 'Empacotamento Farofa', equipamentoAuxiliar: 'Enfardadeira E09-A SE2500', status: 'OPERANDO' },
  { id: 'EMP-09B', codigo: 'EMP-09B', nome: 'Empacotadora 09-B MG1000 Indumak', setor: 'Diversos', linha: 'L09', processo: 'Empacotamento Farofa', equipamentoAuxiliar: 'Enfardadeira E09-B SE2500', status: 'OPERANDO' },
  { id: 'EMP-10A', codigo: 'EMP-10A', nome: 'Empacotadora 10-A MG1000 Indumak', setor: 'Diversos', linha: 'L10', processo: 'Empacotamento Food Service', equipamentoAuxiliar: 'Empacotamento/paletizacao manual', status: 'OPERANDO' },
  { id: 'EMP-11A', codigo: 'EMP-11A', nome: 'Empacotadora 11-A MM-5000 Indumak', setor: 'Diversos', linha: 'L11', processo: 'Empacotamento Biju', equipamentoAuxiliar: 'Empacotamento/paletizacao manual', status: 'OPERANDO' },
  { id: 'EMP-12A', codigo: 'EMP-12A', nome: 'Empacotadora 12-A CB1000 Indumak', setor: 'Diversos', linha: 'L12', processo: 'Empacotamento Creme', equipamentoAuxiliar: 'Empacotamento/paletizacao manual', status: 'OPERANDO' },
  { id: 'EMP-14A', codigo: 'EMP-14A', nome: 'Empacotadora 14-A MG8000 Indumak', setor: 'Diversos', linha: 'L14', processo: 'Empacotamento Pao de Queijo', equipamentoAuxiliar: 'Enfardadeira E14-A SE5000', status: 'OPERANDO' },
  { id: 'EMP-14B', codigo: 'EMP-14B', nome: 'Empacotadora 14-B DG-4', setor: 'Diversos', linha: 'L14', processo: 'Empacotamento Pao de Queijo', equipamentoAuxiliar: 'Enfardadeira E14-B MK30', status: 'OPERANDO' },
  { id: 'EMP-14C', codigo: 'EMP-14C', nome: 'Empacotadora 14-C MG1000 Indumak', setor: 'Diversos', linha: 'L14', processo: 'Empacotamento Pao de Queijo', equipamentoAuxiliar: 'Enfardadeira E14-C MK30', status: 'OPERANDO' },
  { id: 'ENS-15-BICA1', codigo: 'ENS-15-B1', nome: 'Ensacadeira Bica Manual 01', setor: 'Diversos', linha: 'L15', processo: 'Empacotamento Amid Mais', equipamentoAuxiliar: 'Empacotamento/paletizacao manual', status: 'OPERANDO' },
  { id: 'ENS-15-BICA2', codigo: 'ENS-15-B2', nome: 'Ensacadeira Bica Manual 02', setor: 'Diversos', linha: 'L15', processo: 'Empacotamento Amid Mais', equipamentoAuxiliar: 'Empacotamento/paletizacao manual', status: 'OPERANDO' },
  { id: 'ENS-15-INSACK', codigo: 'ENS-15-I', nome: 'Ensacadeira Automatica Insack', setor: 'Diversos', linha: 'L15', processo: 'Empacotamento Amid Mais', equipamentoAuxiliar: 'Paletizacao manual', status: 'OPERANDO' },
  { id: 'ENS-15-KSP', codigo: 'ENS-15-K', nome: 'Ensacadeira Semi-Automatica KSP Indumak', setor: 'Diversos', linha: 'L15', processo: 'Empacotamento Amid Mais', equipamentoAuxiliar: 'Paletizacao manual', status: 'PARADA' },
  { id: 'ENS-15-HAVER', codigo: 'ENS-15-H', nome: 'Ensacadeira Automatica Haver', setor: 'Diversos', linha: 'L15', processo: 'Empacotamento Amid Mais', equipamentoAuxiliar: 'Paletizacao manual', status: 'OPERANDO' },
  { id: 'EMP-28A', codigo: 'EMP-28A', nome: 'Empacotadora 28-A SP-500 Systempack', setor: 'Diversos', linha: 'L28', processo: 'Empacotamento Bolo', equipamentoAuxiliar: 'Empacotamento/paletizacao manual', status: 'OPERANDO' },
  { id: 'COL-03A', codigo: 'COL-03A', nome: 'Coladeira-Seladora 03-A FE II Embrapac', setor: 'Farinha', linha: 'L03', processo: 'Farinha Pacote Papel', equipamentoAuxiliar: 'Dosador de balanca', status: 'MANUTENCAO' },
  { id: 'EMP-04A', codigo: 'EMP-04A', nome: 'Empacotadora 04-A CG1000 Indumak', setor: 'Farinha', linha: 'L04', processo: 'Farinha Branca Plastico', equipamentoAuxiliar: 'Enfardadeira E04-A MK30', status: 'OPERANDO' },
  { id: 'EMP-04B', codigo: 'EMP-04B', nome: 'Empacotadora 04-B CG1000 Indumak', setor: 'Farinha', linha: 'L04', processo: 'Farinha Branca Plastico', equipamentoAuxiliar: '-', status: 'OPERANDO' },
  { id: 'EMP-05A', codigo: 'EMP-05A', nome: 'Empacotadora 05-A MG1000 Indumak', setor: 'Farinha', linha: 'L05', processo: 'Farinha Amarela Plastico', equipamentoAuxiliar: 'Empacotamento/paletizacao manual', status: 'OPERANDO' },
  { id: 'COS-06A', codigo: 'COS-06A', nome: 'Costuradeira 06-A MF-3B Matisa', setor: 'Farinha', linha: 'L06', processo: 'Farinha Torrada Papel', equipamentoAuxiliar: 'Empacotamento/paletizacao manual', status: 'OPERANDO' },
  { id: 'COS-06B', codigo: 'COS-06B', nome: 'Costuradeira 06-B MF-3B Matisa', setor: 'Farinha', linha: 'L06', processo: 'Farinha Torrada Papel', equipamentoAuxiliar: 'Empacotamento/paletizacao manual', status: 'OPERANDO' },
  { id: 'EMP-07A', codigo: 'EMP-07A', nome: 'Empacotadora 07-A ERMD120 Indumak', setor: 'Farinha', linha: 'L07', processo: 'Farinha Torrada Plastico', equipamentoAuxiliar: 'Enfardadeira E07-A MK30', status: 'OPERANDO' },
  { id: 'EMP-07B', codigo: 'EMP-07B', nome: 'Empacotadora 07-B ERMD120 Indumak', setor: 'Farinha', linha: 'L07', processo: 'Farinha Torrada Plastico', equipamentoAuxiliar: '-', status: 'OPERANDO' },
  { id: 'EMP-07C', codigo: 'EMP-07C', nome: 'Empacotadora 07-C ERMD120 Indumak', setor: 'Farinha', linha: 'L07', processo: 'Farinha Torrada Plastico', equipamentoAuxiliar: 'Empacotamento/paletizacao manual', status: 'OPERANDO' },
  { id: 'EMP-29', codigo: 'EMP-29', nome: 'Empacotadora Semi-Automatica Forline 3000', setor: 'Farinha', linha: 'L29', processo: 'Farinha Extra E70', equipamentoAuxiliar: 'Empacotamento/paletizacao manual', status: 'OPERANDO' },
  { id: 'EMP-29A', codigo: 'EMP-29A', nome: 'Empacotadora Semi-Automatica 29-A MG8000', setor: 'Farinha', linha: 'L29', processo: 'Farinha Extra E70', equipamentoAuxiliar: 'Enfardadeira E29-A MK40', status: 'OPERANDO' },
  { id: 'EMP-29B', codigo: 'EMP-29B', nome: 'Empacotadora Semi-Automatica 29-B MG8000', setor: 'Farinha', linha: 'L29', processo: 'Farinha Extra E70', equipamentoAuxiliar: 'Enfardadeira E29-B MK40', status: 'OPERANDO' },
  { id: 'EMP-16A', codigo: 'EMP-16A', nome: 'Empacotadora 16-A FP1000 Indumak', setor: 'Polvilho', linha: 'L16', processo: 'Polvilho Azedo/Doce Plastico', equipamentoAuxiliar: 'Empacotamento/paletizacao manual', status: 'OPERANDO' },
  { id: 'EMP-17A', codigo: 'EMP-17A', nome: 'Empacotadora 17-A FP1000 Indumak', setor: 'Polvilho', linha: 'L17', processo: 'Polvilho Azedo/Doce Plastico', equipamentoAuxiliar: 'Enfardadeira E17-A MK30', status: 'OPERANDO' },
  { id: 'COL-18A', codigo: 'COL-18A', nome: 'Bica de Envase Coladeira 18-A', setor: 'Polvilho', linha: 'L18', processo: 'Polvilho Azedo/Doce Papel', equipamentoAuxiliar: 'Empacotamento/paletizacao manual', status: 'OPERANDO' },
  { id: 'COL-18B', codigo: 'COL-18B', nome: 'Bica de Envase Coladeira 18-B', setor: 'Polvilho', linha: 'L18', processo: 'Polvilho Azedo/Doce Papel', equipamentoAuxiliar: 'Empacotamento/paletizacao manual', status: 'OPERANDO' },
  { id: 'COL-18C', codigo: 'COL-18C', nome: 'Bica de Envase Coladeira 18-C', setor: 'Polvilho', linha: 'L18', processo: 'Polvilho Azedo/Doce Papel', equipamentoAuxiliar: 'Empacotamento/paletizacao manual', status: 'OPERANDO' },
  { id: 'EMP-18D', codigo: 'EMP-18D', nome: 'Empacotadora 18-D', setor: 'Polvilho', linha: 'L18', processo: 'Polvilho Azedo/Doce Papel', equipamentoAuxiliar: 'Empacotamento/paletizacao manual', status: 'OPERANDO' },
  { id: 'EMP-21A', codigo: 'EMP-21A', nome: 'Empacotadora 21-A MM250 Indumak', setor: 'Polvilho', linha: 'L21', processo: 'Polvilho Diversos Plastico', equipamentoAuxiliar: 'Enfardadeira E21-A MK40', status: 'OPERANDO' },
  { id: 'EMP-21B', codigo: 'EMP-21B', nome: 'Empacotadora 21-B MM250 Indumak', setor: 'Polvilho', linha: 'L21', processo: 'Polvilho Diversos Plastico', equipamentoAuxiliar: '-', status: 'OPERANDO' },
  { id: 'ENS-22B-BICA1', codigo: 'ENS-22B-B1', nome: 'Ensacadeira Bica Manual 22-B 01', setor: 'Polvilho', linha: 'L22', processo: 'Polvilho 25kg', equipamentoAuxiliar: 'Empacotamento/paletizacao manual', status: 'OPERANDO' },
  { id: 'ENS-22B-BICA2', codigo: 'ENS-22B-B2', nome: 'Ensacadeira Bica Manual 22-B 02', setor: 'Polvilho', linha: 'L22', processo: 'Polvilho 25kg', equipamentoAuxiliar: 'Empacotamento/paletizacao manual', status: 'OPERANDO' },
  { id: 'ENS-22A-KSP', codigo: 'ENS-22A-K', nome: 'Ensacadeira Semi-Automatica 22-A KSP', setor: 'Polvilho', linha: 'L22', processo: 'Polvilho 25kg', equipamentoAuxiliar: 'Paletizacao manual', status: 'OPERANDO' },
  { id: 'ENS-22A-BICA', codigo: 'ENS-22A-B', nome: 'Ensacadeira Bica Manual 22-A', setor: 'Polvilho', linha: 'L22', processo: 'Polvilho 25kg', equipamentoAuxiliar: 'Empacotamento/paletizacao manual', status: 'OPERANDO' },
  { id: 'EMP-33A', codigo: 'EMP-33A', nome: 'Empacotadora 33-A MR5000 Sautec', setor: 'Polvilho', linha: 'L33', processo: 'Polvilho Diversos Plastico', equipamentoAuxiliar: 'Empacotamento/paletizacao manual', status: 'OFFLINE' },
  { id: 'EMP-30A', codigo: 'EMP-30A', nome: 'Empacotadora 30-A MG1000 Indumak', setor: 'Massa Tapioca', linha: 'L30', processo: 'Massa Tapioca Plastico', equipamentoAuxiliar: 'Empacotamento/paletizacao manual', status: 'OPERANDO' },
];

const machines: ProductionMachine[] = machineCatalog.map((machine, index) => {
  const isRunning = machine.status === 'OPERANDO';
  const oee = isRunning ? Number((78 + ((index * 3) % 17)).toFixed(1)) : 0;
  const availability = isRunning ? Number((84 + ((index * 2) % 12)).toFixed(1)) : 0;
  const quality = isRunning ? Number((95 + ((index * 4) % 5) * 0.6).toFixed(1)) : 0;

  return {
    ...machine,
    lastOP: isRunning ? `M0${(1376 + index).toString().padStart(4, '0')}` : '-',
    oee,
    availability,
    quality,
    prod: isRunning ? `${(640 + index * 18).toLocaleString('pt-BR')} KG` : '0 KG',
  };
});

function getMachineNodeLabel(codigo: string): string {
  const match = codigo.match(/(\d+[A-Z]?)$/);
  return match ? match[1] : codigo;
}

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
            Total: {machines.length.toString().padStart(2, '0')}
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
            <p className="text-sm font-bold text-gray-900 italic">COL-03A em manutenção mecânica acima do tempo previsto</p>
          </div>
        </div>
        <div className="card-mes bg-amber-50 border-status-warning/20 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-status-warning flex items-center justify-center text-white shrink-0">
             <Clock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-status-warning uppercase tracking-widest">Atenção</h4>
            <p className="text-sm font-bold text-gray-900 italic">ENS-15-KSP parada aguardando setup da OP atual</p>
          </div>
        </div>
        <div className="card-mes bg-blue-50 border-amafil-blue/20 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amafil-blue flex items-center justify-center text-white shrink-0">
             <Activity className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-amafil-blue uppercase tracking-widest">Informação</h4>
            <p className="text-sm font-bold text-gray-900 italic">Base sincronizada com 43 maquinas mapeadas no fluxo geral</p>
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
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 truncate">
                      {machine.setor} / {machine.linha} - {machine.processo}
                    </p>
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
                  <th className="py-4 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Processo / Linha</th>
                  <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {machines.map((machine) => (
                  <tr key={machine.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-[11px] leading-none tracking-tight text-center shrink-0 shadow-sm",
                          machine.status === 'OPERANDO' ? "bg-status-success" : 
                          machine.status === 'PARADA' ? "bg-status-warning" :
                          machine.status === 'MANUTENCAO' ? "bg-status-danger" : "bg-status-offline"
                        )}>
                          {getMachineNodeLabel(machine.codigo)}
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
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-gray-700">{machine.processo} ({machine.linha})</span>
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-gray-300" />
                          <span className="text-xs font-mono font-bold text-gray-500">{machine.lastOP}</span>
                        </div>
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
