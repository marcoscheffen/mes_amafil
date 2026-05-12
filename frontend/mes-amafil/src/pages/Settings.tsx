import React, { useState, useEffect } from 'react';
import {
  Bell,
  Database,
  Monitor,
  Shield,
  Zap,
  Save,
  RefreshCw,
  Cpu,
  Globe,
  Server,
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
  type PersistedMessageChannel,
  CHANNEL_COLOR_PRESETS,
  CHANNEL_ICON_COMPONENTS,
  CHANNEL_ICON_KEYS,
  loadPersistedMessageChannels,
  savePersistedMessageChannels,
  subscribeMessageChannelsChanged,
  slugChannelId,
} from '../lib/message-channels';

export function Settings() {
  const [activeTab, setActiveTab] = useState<'geral' | 'producao' | 'notificacoes' | 'mensagens' | 'integracao'>('geral');
  const [messageChannels, setMessageChannels] = useState<PersistedMessageChannel[]>(() => loadPersistedMessageChannels());
  const [channelModal, setChannelModal] = useState<null | { mode: 'new' } | { mode: 'edit'; channel: PersistedMessageChannel }>(
    null
  );
  const [channelDraft, setChannelDraft] = useState<PersistedMessageChannel | null>(null);

  useEffect(() => subscribeMessageChannelsChanged(() => setMessageChannels(loadPersistedMessageChannels())), []);

  const openNewChannel = () => {
      setChannelModal({ mode: 'new' });
      setChannelDraft({
        id: '',
        label: '',
        description: '',
        iconKey: 'message-square',
        color: CHANNEL_COLOR_PRESETS[0].value,
      });
    };

  const openEditChannel = (channel: PersistedMessageChannel) => {
    setChannelModal({ mode: 'edit', channel });
    setChannelDraft({ ...channel });
  };

  const closeChannelModal = () => {
    setChannelModal(null);
    setChannelDraft(null);
  };

  const handleSaveChannel = () => {
    if (!channelDraft || !channelModal) return;
    if (!channelDraft.label.trim()) {
      alert('Informe o nome do canal.');
      return;
    }
    const next = [...messageChannels];
    if (channelModal.mode === 'new') {
      const ids = new Set(next.map((c) => c.id));
      const id = slugChannelId(channelDraft.label, ids);
      next.push({
        ...channelDraft,
        id,
        label: channelDraft.label.trim(),
        description: channelDraft.description.trim(),
      });
    } else {
      const idx = next.findIndex((c) => c.id === channelModal.channel.id);
      if (idx === -1) return;
      next[idx] = {
        ...channelDraft,
        id: channelModal.channel.id,
        label: channelDraft.label.trim(),
        description: channelDraft.description.trim(),
      };
    }
    savePersistedMessageChannels(next);
    setMessageChannels(next);
    closeChannelModal();
  };

  const handleDeleteChannel = (channel: PersistedMessageChannel) => {
    if (!confirm(`Excluir o canal "${channel.label}"?`)) return;
    const next = messageChannels.filter((c) => c.id !== channel.id);
    savePersistedMessageChannels(next);
    setMessageChannels(next);
  };

  const tabs = [
    { id: 'geral', label: 'Geral', icon: Monitor },
    { id: 'producao', label: 'Produção', icon: Zap },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
    { id: 'mensagens', label: 'Mensagens', icon: MessageSquare },
    { id: 'integracao', label: 'Sistema & API', icon: Database },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-bento-border pb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-gray-900 italic">Core<span className="text-amafil-blue">.Settings</span></h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">Configurações Base e Governança do Cluster AMAFIL-PC-01</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-gray-900 text-white px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-md flex items-center gap-2 group">
            <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Salvar Alterações
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="col-span-12 lg:col-span-3 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border",
                  activeTab === tab.id 
                    ? "bg-amafil-blue text-white border-amafil-blue shadow-lg shadow-amafil-blue/20" 
                    : "bg-white text-gray-500 border-transparent hover:bg-gray-50 hover:border-bento-border"
                )}
              >
                <Icon className={cn("w-5 h-5", activeTab === tab.id ? "text-white" : "text-gray-400")} />
                {tab.label}
              </button>
            );
          })}

          <div className="mt-8 p-6 bg-gray-50 rounded-3xl border border-dashed border-gray-300">
             <div className="flex items-center gap-2 mb-2">
               <Shield className="w-4 h-4 text-gray-400" />
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado de Segurança</span>
             </div>
             <p className="text-xs font-bold text-gray-900 leading-tight">Firewall Ativo • Criptografia TLS 1.3 Habilitada</p>
          </div>
        </div>

        {/* Content Area */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          {activeTab === 'geral' && (
            <div className="card-mes shadow-sm space-y-8">
               <section>
                 <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2 italic">Identificação da Unidade</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome do Cluster</label>
                     <input type="text" defaultValue="AMAFIL-PC-01" className="w-full bg-gray-50 border border-bento-border rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-amafil-blue/10 outline-none" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Unidade Física</label>
                     <input type="text" defaultValue="Cianorte - PR" className="w-full bg-gray-50 border border-bento-border rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-amafil-blue/10 outline-none" />
                   </div>
                 </div>
               </section>

               <section>
                 <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2 italic">Interface e Experiência</h3>
                 <div className="space-y-4">
                   <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-bento-border">
                     <div>
                       <p className="text-xs font-bold text-gray-900">Modo de Exibição de Alta Performance</p>
                       <p className="text-[10px] text-gray-500 font-bold uppercase">Reduz animações para hardware legado no chão de fábrica</p>
                     </div>
                     <div className="w-12 h-6 bg-amafil-green rounded-full relative">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                     </div>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-bento-border opacity-50 cursor-not-allowed">
                     <div>
                       <p className="text-xs font-bold text-gray-900">Modo Escuro (Dark Mode)</p>
                       <p className="text-[10px] text-gray-500 font-bold uppercase">Interface bloqueada em modo Light por diretriz visual</p>
                     </div>
                     <div className="w-12 h-6 bg-gray-300 rounded-full relative">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
                     </div>
                   </div>
                 </div>
               </section>
            </div>
          )}

          {activeTab === 'producao' && (
            <div className="card-mes shadow-sm space-y-8">
               <section>
                 <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2 italic">Metas e Thresholds de eficiência</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50/50 border border-status-success/20 rounded-2xl">
                       <label className="text-[10px] font-black text-status-success uppercase tracking-widest mb-2 block">Meta OEE Global</label>
                       <input type="text" defaultValue="85%" className="w-full bg-white border border-status-success/10 rounded-xl px-3 py-2 text-lg font-black text-gray-900 italic text-center outline-none" />
                    </div>
                    <div className="p-4 bg-amber-50/50 border border-status-warning/20 rounded-2xl">
                       <label className="text-[10px] font-black text-status-warning uppercase tracking-widest mb-2 block">Alerta Amarelo OEE</label>
                       <input type="text" defaultValue="70%" className="w-full bg-white border border-status-warning/10 rounded-xl px-3 py-2 text-lg font-black text-gray-900 italic text-center outline-none" />
                    </div>
                    <div className="p-4 bg-red-50/50 border border-status-danger/20 rounded-2xl">
                       <label className="text-[10px] font-black text-status-danger uppercase tracking-widest mb-2 block">Crítico OEE</label>
                       <input type="text" defaultValue="60%" className="w-full bg-white border border-status-danger/10 rounded-xl px-3 py-2 text-lg font-black text-gray-900 italic text-center outline-none" />
                    </div>
                 </div>
               </section>

               <section>
                 <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2 italic">Parâmetros de Telemetria</h3>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-bento-border">
                       <div>
                         <p className="text-xs font-bold text-gray-900 font-mono tracking-tighter">SENSORS_SAMPLING_RATE</p>
                         <p className="text-[10px] text-gray-500 font-bold uppercase">Intervalo de leitura dos CLPs em milisegundos</p>
                       </div>
                       <div className="flex items-center gap-3">
                         <span className="text-xs font-black text-gray-400">100ms</span>
                         <input type="range" min="50" max="1000" defaultValue="100" className="w-32 accent-amafil-blue" />
                         <span className="text-xs font-black text-gray-900">1000ms</span>
                       </div>
                    </div>
                 </div>
               </section>
            </div>
          )}

          {activeTab === 'notificacoes' && (
            <div className="card-mes shadow-sm space-y-6">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-2 italic">Canais de Alerta</h3>
              <div className="divide-y divide-gray-100">
                {[
                  { title: 'Push Desktop/Browser', desc: 'Alertas críticos em tempo real na tela', active: true },
                  { title: 'E-mail Corporativo', desc: 'Relatórios diários e alertas de parada prolongada', active: true },
                  { title: 'Telegram Manager Bot', desc: 'Notificações de indicadores para gerência', active: false },
                  { title: 'SMS de Emergência', desc: 'Apenas para falha total de cluster ou incêndio', active: false },
                ].map((item, i) => (
                  <div key={i} className="py-5 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", item.active ? "bg-blue-50 border-amafil-blue/20 text-amafil-blue" : "bg-gray-50 border-gray-200 text-gray-400")}>
                        <Bell className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{item.title}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">{item.desc}</p>
                      </div>
                    </div>
                    <button className={cn("w-12 h-6 rounded-full relative transition-all", item.active ? "bg-amafil-green" : "bg-gray-200")}>
                      <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", item.active ? "right-1" : "left-1")} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'mensagens' && (
            <div className="space-y-6">
              <div className="card-mes shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest italic flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-amafil-blue" />
                      Canais de comunicação
                    </h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight mt-2 max-w-xl">
                      Crie, edite ou exclua canais do módulo Mensagens. O canal <span className="text-gray-800">Geral — Fábrica</span> é
                      fixo e agrega todas as conversas.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openNewChannel}
                    className="shrink-0 flex items-center justify-center gap-2 rounded-full bg-amafil-blue text-white px-6 py-2.5 text-[10px] font-black uppercase tracking-widest shadow-md shadow-amafil-blue/20 hover:bg-amafil-blue/90 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Novo canal
                  </button>
                </div>

                <div className="divide-y divide-gray-100">
                  {messageChannels.length === 0 ? (
                    <p className="text-xs font-bold text-gray-400 py-8 text-center italic">Nenhum canal configurado.</p>
                  ) : (
                    messageChannels.map((ch) => {
                      const Icon = CHANNEL_ICON_COMPONENTS[ch.iconKey];
                      return (
                        <div key={ch.id} className="py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-current/10', ch.color)}>
                              <Icon className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-black text-gray-900 uppercase tracking-tight truncate">{ch.label}</p>
                              <p className="text-[10px] font-bold text-gray-400 truncate">
                                ID: <span className="font-mono text-gray-600">{ch.id}</span>
                              </p>
                              <p className="text-xs font-bold text-gray-500 mt-1 line-clamp-2">{ch.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:shrink-0">
                            <button
                              type="button"
                              onClick={() => openEditChannel(ch)}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl border border-bento-border bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-all"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteChannel(ch)}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-700 hover:bg-red-100 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Excluir
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {channelModal && channelDraft && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                    <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                      <h3 className="text-lg font-black text-gray-900 italic tracking-tight">
                        {channelModal.mode === 'new' ? 'Novo canal' : 'Editar canal'}
                      </h3>
                      <button
                        type="button"
                        onClick={closeChannelModal}
                        className="text-gray-400 hover:text-gray-700 font-black text-xl leading-none px-1"
                        aria-label="Fechar"
                      >
                        ×
                      </button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome do canal</label>
                        <input
                          type="text"
                          value={channelDraft.label}
                          onChange={(e) => setChannelDraft({ ...channelDraft, label: e.target.value })}
                          className="w-full bg-gray-50 border border-bento-border rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-amafil-blue/10"
                          placeholder="Ex.: TI"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição</label>
                        <textarea
                          value={channelDraft.description}
                          onChange={(e) => setChannelDraft({ ...channelDraft, description: e.target.value })}
                          className="w-full bg-gray-50 border border-bento-border rounded-xl px-4 py-2.5 text-sm font-bold min-h-[72px] resize-none outline-none focus:ring-2 focus:ring-amafil-blue/10"
                          placeholder="Aparece no cabeçalho do chat..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ícone</label>
                          <select
                            value={channelDraft.iconKey}
                            onChange={(e) =>
                              setChannelDraft({
                                ...channelDraft,
                                iconKey: e.target.value as PersistedMessageChannel['iconKey'],
                              })
                            }
                            className="w-full bg-gray-50 border border-bento-border rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-amafil-blue/10"
                          >
                            {CHANNEL_ICON_KEYS.map((key) => (
                              <option key={key} value={key}>
                                {key}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cor</label>
                          <select
                            value={channelDraft.color}
                            onChange={(e) => setChannelDraft({ ...channelDraft, color: e.target.value })}
                            className="w-full bg-gray-50 border border-bento-border rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-amafil-blue/10"
                          >
                            {CHANNEL_COLOR_PRESETS.map((p) => (
                              <option key={p.value} value={p.value}>
                                {p.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {channelModal.mode === 'edit' && (
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                          Identificador interno:{' '}
                          <span className="font-mono text-gray-700">{channelModal.channel.id}</span> (usado nas mensagens já
                          enviadas)
                        </p>
                      )}
                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={closeChannelModal}
                          className="flex-1 py-3 rounded-2xl bg-gray-50 text-gray-600 text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-transparent"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveChannel}
                          className="flex-1 py-3 rounded-2xl bg-amafil-blue text-white text-xs font-black uppercase tracking-widest shadow-md hover:bg-amafil-blue/90 transition-all"
                        >
                          Salvar canal
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'integracao' && (
            <div className="space-y-6">
              <div className="card-mes shadow-sm space-y-6">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest italic flex items-center gap-2">
                   <Server className="w-5 h-5 text-gray-400" />
                   Health Check do Sistema
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Latência DB', value: '14ms', status: 'Ótimo' },
                    { label: 'Tempo Atividade', value: '99.98%', status: 'Estável' },
                    { label: 'Uso de CPU', value: '12%', status: 'Baixo' },
                    { label: 'Memória', value: '4.2GB', status: 'Saudável' },
                  ].map((stat, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-bento-border text-center">
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                       <p className="text-xl font-black text-gray-900 italic tracking-tighter">{stat.value}</p>
                       <span className="text-[8px] font-black bg-green-100 text-status-success px-2 py-0.5 rounded-full uppercase mt-2 inline-block">{stat.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-mes shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest italic">Integração ERP/PLC</h3>
                  <button className="flex items-center gap-2 text-[10px] font-black text-amafil-blue uppercase tracking-widest hover:underline">
                    <RefreshCw className="w-3 h-3" />
                    Testar Conexão
                  </button>
                </div>
                <div className="space-y-4">
                   <div className="flex items-center gap-4 p-4 bg-gray-900 rounded-2xl border border-gray-800">
                      <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-amafil-green">
                         <Globe className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                         <p className="text-xs font-bold text-white mb-1">PROW-MES-API-GATEWAY</p>
                         <div className="flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">https://api.amafil.cloud/v2/mes-sync</span>
                         </div>
                      </div>
                      <button className="p-2 text-gray-500 hover:text-white">
                         <RefreshCw className="w-4 h-4" />
                      </button>
                   </div>

                   <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-bento-border">
                      <div className="w-10 h-10 rounded-xl bg-white border border-bento-border flex items-center justify-center text-gray-400">
                         <Cpu className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                         <p className="text-xs font-bold text-gray-900 mb-1">PLC_COLLECTOR_SERVICE</p>
                         <p className="text-[10px] font-bold text-gray-400 uppercase">Local IP: 192.168.10.25 (CIM Lincore)</p>
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase">Aguardando...</span>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
