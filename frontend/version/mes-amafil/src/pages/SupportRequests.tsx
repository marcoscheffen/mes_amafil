import React, { useState } from 'react';
import { ClipboardList, MessageSquare, Wrench, Package, Clock, ShieldAlert, Search, Filter, Plus, CheckCircle2, ChevronRight, Terminal, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface SupportRequest {
  id: string;
  tipo: 'MANUTENCAO' | 'ALMOXARIFADO' | 'PCP' | 'QUALIDADE';
  titulo: string;
  maquina: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  status: 'ABERTO' | 'EM_ATENDIMENTO' | 'CONCLUIDO';
  solicitante: string;
  criadoEm: string;
  tempoDeEspera: string;
}

const requests: SupportRequest[] = [
  {
    id: 'REQ-1024',
    tipo: 'MANUTENCAO',
    titulo: 'Vazamento de ar comprimido - Mangueira 04',
    maquina: '30',
    prioridade: 'ALTA',
    status: 'EM_ATENDIMENTO',
    solicitante: 'João Silva',
    criadoEm: '08/05/2026 10:45',
    tempoDeEspera: '22 min'
  },
  {
    id: 'REQ-1023',
    tipo: 'ALMOXARIFADO',
    titulo: 'Solicitação de Fita Adesiva 48x100',
    maquina: '32',
    prioridade: 'MEDIA',
    status: 'ABERTO',
    solicitante: 'Maria Oliveira',
    criadoEm: '08/05/2026 10:55',
    tempoDeEspera: '12 min'
  },
  {
    id: 'REQ-1022',
    tipo: 'PCP',
    titulo: 'Dúvida no apontamento de refugo da OP M01376',
    maquina: '30',
    prioridade: 'BAIXA',
    status: 'CONCLUIDO',
    solicitante: 'Ricardo Nunes',
    criadoEm: '08/05/2026 09:20',
    tempoDeEspera: '45 min'
  },
  {
    id: 'REQ-1021',
    tipo: 'QUALIDADE',
    titulo: 'Amostra de teste de umidade aprovada',
    maquina: '15',
    prioridade: 'URGENTE',
    status: 'ABERTO',
    solicitante: 'Laboratório',
    criadoEm: '08/05/2026 11:02',
    tempoDeEspera: '5 min'
  }
];

export function SupportRequests() {
  const [activeForm, setActiveForm] = useState<null | 'MNT' | 'ALM' | 'PCP'>(null);

  const handleCloseForm = () => setActiveForm(null);

  const FormModal = ({ type, title, children }: { type: string, title: string, children: React.ReactNode }) => (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <span className="text-[10px] font-black text-amafil-blue uppercase tracking-widest">{type}</span>
            <h3 className="text-xl font-black text-gray-900 italic tracking-tighter">{title}</h3>
          </div>
          <button onClick={handleCloseForm} className="text-gray-400 hover:text-gray-600 font-black text-xl">×</button>
        </div>
        <div className="p-8 space-y-4">
          {children}
          <div className="pt-4 flex gap-3">
            <button onClick={handleCloseForm} className="flex-1 py-3 px-4 rounded-2xl bg-gray-50 text-gray-500 text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all">Cancelar</button>
            <button onClick={() => { alert('Solicitação enviada com sucesso!'); handleCloseForm(); }} className="flex-1 py-3 px-4 rounded-2xl bg-amafil-blue text-white text-xs font-black uppercase tracking-widest shadow-md hover:bg-amafil-blue/90 transition-all">Enviar Solicitação</button>
          </div>
        </div>
      </div>
    </div>
  );

  const typeConfig = {
    MANUTENCAO: { icon: Wrench, color: 'text-red-600', bg: 'bg-red-50', label: 'Manutenção' },
    ALMOXARIFADO: { icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Almoxarifado' },
    PCP: { icon: ClipboardList, color: 'text-purple-600', bg: 'bg-purple-50', label: 'PCP' },
    QUALIDADE: { icon: ShieldAlert, color: 'text-cyan-600', bg: 'bg-cyan-50', label: 'Qualidade' },
  };

  const priorityColors = {
    BAIXA: 'text-gray-500',
    MEDIA: 'text-blue-600',
    ALTA: 'text-amber-600',
    URGENTE: 'text-red-700 font-black italic underline'
  };

  const statusStyles = {
    ABERTO: "bg-red-50 text-status-danger border-status-danger/20 animate-pulse",
    EM_ATENDIMENTO: "bg-blue-50 text-blue-700 border-blue-200",
    CONCLUIDO: "bg-green-50 text-status-success border-status-success/20",
  };

  return (
    <div className="space-y-6">
      {/* Modals */}
      {activeForm === 'MNT' && (
        <FormModal type="Solicitação MNT" title="Chamar Manutenção">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Máquina / Equipamento</label>
              <input type="text" placeholder="Ex: Empacotadora 04" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Descrição do Defeito</label>
              <textarea placeholder="Relate o problema observado..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold h-24 resize-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Prioridade</label>
              <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold">
                <option>Média (Padrão)</option>
                <option>Alta (Parada de Máquina)</option>
                <option>Urgente (Risco de Segurança)</option>
              </select>
            </div>
          </div>
        </FormModal>
      )}

      {activeForm === 'ALM' && (
        <FormModal type="Solicitação ALM" title="Pedido Almoxarifado">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Item Solicitado</label>
              <input type="text" placeholder="Fita, Filme, EPI..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Quantidade / Medida</label>
              <input type="text" placeholder="Ex: 2 unidades" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Motivo</label>
              <input type="text" placeholder="Reposição de estoque" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold" />
            </div>
          </div>
        </FormModal>
      )}

      {activeForm === 'PCP' && (
        <FormModal type="Suporte PCP" title="Dúvida PCP / Apontamento">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Número da OP</label>
              <input type="text" placeholder="Ex: M01376" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Descreva sua Dúvida</label>
              <textarea placeholder="Dúvida sobre quantidade, refugo, lote..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold h-24 resize-none" />
            </div>
          </div>
        </FormModal>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end border-b border-bento-border pb-8 gap-6">
        <div className="max-w-2xl">
          <h1 className="text-3xl lg:text-4xl font-black tracking-tighter text-gray-900 font-sans italic">Runtime<span className="text-amafil-blue">.Solicitações</span></h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] lg:text-[10px] mt-1 italic">Interação Direta Chão de Fábrica x Apoio (PCP/MNT/ALM/QLD)</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <button className="flex-1 lg:flex-none justify-center bg-white border-2 border-bento-border text-gray-600 px-6 py-3 lg:py-2.5 rounded-full text-[10px] lg:text-xs font-bold uppercase tracking-widest shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
          <button className="flex-1 lg:flex-none justify-center bg-amafil-blue text-white px-8 py-3 lg:py-2.5 rounded-full text-[10px] lg:text-xs font-black uppercase tracking-widest hover:bg-amafil-blue/90 transition-all shadow-md flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nova Solicitação
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Pendentes de Início', value: '05', icon: Clock, color: 'text-red-600' },
          { label: 'Em Atendimento', value: '03', icon: Activity, color: 'text-blue-600' },
          { label: 'SLA Médio (Turno)', value: '18m', icon: Gauge, color: 'text-amafil-green' },
          { label: 'Finalizados Hoje', value: '42', icon: CheckCircle2, color: 'text-gray-500' },
        ].map((item, i) => (
          <div key={i} className="card-mes p-5 shadow-sm flex items-center justify-between">
            <div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.label}</h4>
              <p className={cn("text-3xl font-black italic leading-none", item.color)}>{item.value}</p>
            </div>
            <item.icon className="w-8 h-8 text-gray-100" />
          </div>
        ))}
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-12 gap-6">
        {/* Active Requests List */}
        <div className="card-mes col-span-12 lg:col-span-8 p-0 shadow-sm">
          <div className="px-4 sm:px-8 py-5 border-b border-bento-border flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50/50 gap-4">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Atendimento em Tempo Real</h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Pesquisar REQ ID..." 
                className="w-full bg-white border border-bento-border rounded-lg py-2 sm:py-1.5 pl-9 pr-4 text-xs focus:ring-2 focus:ring-amafil-blue/10 outline-none" 
              />
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {requests.map((req) => {
              const Config = typeConfig[req.tipo];
              const Icon = Config.icon;
              
              return (
                <div key={req.id} className="p-4 sm:p-6 hover:bg-gray-50/50 transition-colors group flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 relative">
                  {/* Status Indicator (Mobile Only) */}
                  <div className={cn("absolute left-0 top-0 bottom-0 w-1 sm:hidden rounded-r-full", 
                    req.status === 'ABERTO' ? "bg-status-danger" : 
                    req.status === 'EM_ATENDIMENTO' ? "bg-blue-500" : "bg-status-success"
                  )} />

                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className={cn("w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border", Config.bg, Config.color, "border-current/10")}>
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    
                    <div className="flex-1 min-w-0 sm:hidden">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{req.id}</span>
                        <span className={cn("text-[8px] font-bold uppercase py-0.5 px-2 rounded-full border shrink-0", statusStyles[req.status])}>
                          {req.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-amafil-blue transition-colors truncate italic leading-tight">{req.titulo}</h4>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 sm:block hidden">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{req.id} • Máquina {req.maquina}</span>
                      <span className={cn("text-[9px] font-bold uppercase py-0.5 px-2 rounded-full border", statusStyles[req.status])}>
                        {req.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-gray-900 group-hover:text-amafil-blue transition-colors truncate italic">{req.titulo}</h4>
                    <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-tight">Solicitante: <span className="text-gray-600">{req.solicitante}</span> • Prioridade: <span className={priorityColors[req.prioridade]}>{req.prioridade}</span></p>
                  </div>

                  {/* Mobile Details Area */}
                  <div className="sm:hidden grid grid-cols-2 gap-2 mt-1">
                    <div className="bg-gray-50/50 p-2 rounded-xl border border-bento-border/50">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Máquina</p>
                      <p className="text-[10px] font-bold text-gray-700">{req.maquina}</p>
                    </div>
                    <div className="bg-gray-50/50 p-2 rounded-xl border border-bento-border/50">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Prioridade</p>
                      <p className={cn("text-[10px] font-bold", priorityColors[req.prioridade])}>{req.prioridade}</p>
                    </div>
                    <div className="bg-gray-50/50 p-2 rounded-xl border border-bento-border/50">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Solicitante</p>
                      <p className="text-[10px] font-bold text-gray-700 truncate">{req.solicitante}</p>
                    </div>
                    <div className="bg-gray-50/50 p-2 rounded-xl border border-bento-border/50">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Espera</p>
                      <p className="text-[10px] font-black text-amafil-red italic">{req.tempoDeEspera}</p>
                    </div>
                  </div>
                  
                  <div className="flex sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-2 sm:gap-1 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-gray-100">
                    <div className="text-left sm:text-right sm:block hidden">
                      <p className="text-xs font-black text-amafil-red italic">{req.tempoDeEspera}</p>
                      <p className="text-[10px] font-bold text-gray-400 mt-1">{req.criadoEm.split(' ')[1]}</p>
                    </div>
                    <div className="sm:hidden text-left">
                       <span className="text-[10px] font-bold text-gray-400">Criado às {req.criadoEm.split(' ')[1]}</span>
                    </div>

                    <button className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-white group-hover:text-amafil-blue border border-transparent group-hover:border-bento-border transition-all shadow-sm">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Alerts / Tips */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="card-mes shadow-sm p-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Ações Rápidas</h3>
            <div className="space-y-3">
              <button 
                onClick={() => setActiveForm('MNT')}
                className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl flex items-center gap-3 px-4 transition-all text-xs font-bold border border-bento-border shadow-sm group"
              >
                <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-status-danger">
                  <Wrench className="w-4 h-4" />
                </div>
                Chamar Manutenção (MNT)
              </button>
              <button 
                onClick={() => setActiveForm('ALM')}
                className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl flex items-center gap-3 px-4 transition-all text-xs font-bold border border-bento-border shadow-sm group"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-amafil-blue">
                  <Package className="w-4 h-4" />
                </div>
                Pedido Almoxarifado (ALM)
              </button>
              <button 
                onClick={() => setActiveForm('PCP')}
                className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 rounded-2xl flex items-center gap-3 px-4 transition-all text-xs font-bold border border-bento-border shadow-sm group"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <ClipboardList className="w-4 h-4" />
                </div>
                Dúvida PCP / Apontamento
              </button>
            </div>
          </div>

          <div className="card-mes p-0 overflow-hidden shadow-sm border-amafil-blue/10 bg-white group hover:border-amafil-blue/30 transition-all">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amafil-blue" />
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Central de Mensagens</h3>
              </div>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amafil-blue opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amafil-blue"></span>
              </span>
            </div>
            
            <div className="p-4 space-y-1">
              <div className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-xl transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-900 uppercase">Alertas Críticos</p>
                    <p className="text-[9px] font-bold text-gray-400">1 alerta ativo no sistema</p>
                  </div>
                </div>
                <span className="bg-amafil-red text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">1</span>
              </div>

              <div className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-xl transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-amafil-blue flex items-center justify-center">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-900 uppercase">Geral - Fábrica</p>
                    <p className="text-[9px] font-bold text-gray-400">5 novas comunicações</p>
                  </div>
                </div>
                <span className="bg-amafil-blue text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">5</span>
              </div>

              <div className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-xl transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-900 uppercase">Suporte MNT</p>
                    <p className="text-[9px] font-bold text-gray-400">2 chamados pendentes</p>
                  </div>
                </div>
                <span className="bg-amafil-red text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">2</span>
              </div>
            </div>

            <button className="w-full p-4 text-[10px] font-black text-amafil-blue uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amafil-blue hover:text-white transition-all border-t border-gray-100 italic">
              Acessar Hub de Mensagens
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Re-using Gauge/Activity from Production or internal imports if needed
function Activity({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>; }
function Gauge({ className }: { className?: string }) { return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>; }
