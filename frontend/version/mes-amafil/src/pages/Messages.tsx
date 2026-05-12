import React, { useState, useRef, useMemo, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Search, Send, Check, CheckCheck, MoreVertical, Image as ImageIcon, X, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import {
  CHANNEL_ICON_COMPONENTS,
  GENERAL_CHANNEL_ID,
  getGeneralChannelMeta,
  loadPersistedMessageChannels,
  subscribeMessageChannelsChanged,
} from '../lib/message-channels';

interface Message {
  id: string;
  sender: string;
  content?: string;
  image?: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  group?: string;
  isMe?: boolean;
}

const initialMessages: Message[] = [
  { id: '1', sender: 'Lucas - Manutenção', content: 'Iniciando verificação na empacotadora 04 conforme solicitado.', timestamp: '14:20', status: 'read', group: 'MNT' },
  { id: '2', sender: 'Supervisor - Roberto', content: 'Lote 086 LC liberado para envase.', timestamp: '14:25', status: 'read', group: 'PCP' },
  { id: '3', sender: 'Você', content: 'Ok Roberto, iniciando setup.', timestamp: '14:27', status: 'read', isMe: true },
  { id: '4', sender: 'Lucas - Manutenção', content: 'Peça trocada, máquina em teste por 5 minutos.', timestamp: '15:10', status: 'delivered', group: 'MNT' },
  { id: '5', sender: 'Sistema', content: 'ALERTA: Sensor de temperatura da Estufa 02 atingiu limite superior.', timestamp: '15:15', status: 'delivered', group: 'urgent' },
  { id: '6', sender: 'Roberto Supervisor', content: 'Favor priorizar a OP M01376 de polvilho doce.', timestamp: '15:20', status: 'read', group: 'PCP' },
  { id: '7', sender: 'Helpdesk - TI', content: 'Janela de manutenção do MES agendada para sábado 02h–04h.', timestamp: '15:22', status: 'read', group: 'TI' },
];

interface ConversationRow {
  id: string;
  label: string;
  description: string;
  color: string;
  icon: LucideIcon;
  count: number;
}

export function Messages() {
  const [activeGroup, setActiveGroup] = useState(GENERAL_CHANNEL_ID);
  const [persistedChannels, setPersistedChannels] = useState(loadPersistedMessageChannels);
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => subscribeMessageChannelsChanged(() => setPersistedChannels(loadPersistedMessageChannels())), []);

  const conversations: ConversationRow[] = useMemo(() => {
    const gen = getGeneralChannelMeta();
    return [
      {
        id: gen.id,
        label: gen.label,
        description: gen.description,
        color: gen.color,
        icon: CHANNEL_ICON_COMPONENTS[gen.iconKey],
        count: messages.length,
      },
      ...persistedChannels.map((c) => ({
        id: c.id,
        label: c.label,
        description: c.description,
        color: c.color,
        icon: CHANNEL_ICON_COMPONENTS[c.iconKey],
        count: messages.filter((m) => m.group === c.id).length,
      })),
    ];
  }, [persistedChannels, messages]);

  const activeConv = conversations.find((c) => c.id === activeGroup) ?? conversations[0];

  useEffect(() => {
    if (activeGroup !== GENERAL_CHANNEL_ID && !persistedChannels.some((c) => c.id === activeGroup)) {
      setActiveGroup(GENERAL_CHANNEL_ID);
    }
  }, [persistedChannels, activeGroup]);

  const handleGroupSelect = (id: string) => {
    setActiveGroup(id);
    setMobileView('chat');
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedImage) return;

    const msg: Message = {
      id: Date.now().toString(),
      sender: 'Você',
      content: newMessage,
      image: selectedImage || undefined,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      group: activeGroup !== GENERAL_CHANNEL_ID ? activeGroup : undefined,
      isMe: true
    };

    setMessages([...messages, msg]);
    setNewMessage('');
    setSelectedImage(null);
  };

  const filteredMessages = messages.filter((m) => {
    if (activeGroup === GENERAL_CHANNEL_ID) return true;
    return m.group === activeGroup || (m.isMe && !m.group);
  });

  const ChatHeaderIcon = activeConv.icon;

  return (
    <div className={cn(
      "h-[calc(100vh-120px)] lg:h-[calc(100vh-140px)] flex flex-col lg:flex-row lg:gap-6 overflow-hidden relative",
      mobileView === 'chat' && "-mx-4 sm:-mx-6 -mt-4 lg:mx-0 lg:mt-0 h-[calc(100vh-100px)] lg:h-[calc(100vh-140px)]"
    )}>
      {/* Sidebar: Conversations */}
      <div className={cn(
        "w-full lg:w-80 flex flex-col gap-4 transition-all duration-300 min-h-0",
        mobileView === 'chat' ? "hidden lg:flex" : "flex h-full min-h-0"
      )}>
        <div className="card-mes p-4 shrink-0 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar mensagens..." 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-amafil-blue/10 outline-none"
            />
          </div>
        </div>

        <div className="card-mes flex-1 flex flex-col min-h-0 p-0 shadow-sm overflow-hidden">
          <div className="shrink-0 px-3 pt-3 pb-2">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Canais de Comunicação</h3>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-1 px-2 pb-2">
            {conversations.map((conv) => {
              const ConvIcon = conv.icon;
              return (
              <button
                key={conv.id}
                onClick={() => handleGroupSelect(conv.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-2xl transition-all group",
                  activeGroup === conv.id 
                    ? "bg-amafil-blue text-white shadow-md shadow-amafil-blue/20" 
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0",
                  activeGroup === conv.id ? "bg-white/20 text-white" : conv.color
                )}>
                  <ConvIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className={cn("text-xs font-black uppercase tracking-tight", activeGroup === conv.id ? "text-white" : "text-gray-900")}>
                    {conv.label}
                  </p>
                  <p className={cn("text-[9px] font-bold truncate", activeGroup === conv.id ? "text-white/80" : "text-gray-400")}>
                    Última mensagem às 15:10
                  </p>
                </div>
                {conv.count > 0 && activeGroup !== conv.id && (
                  <span className="bg-amafil-red text-white text-[8px] font-black px-2 py-1 rounded-full shrink-0">{conv.count}</span>
                )}
              </button>
            );
            })}
          </div>

          <div className="shrink-0 px-3 pt-3 pb-2 border-t border-gray-100 bg-gray-50/40">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Operadores Ativos</h3>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-1 px-2 pb-3">
             {['Lucas Manutenção', 'Roberto Sup.', 'João Empacot.', 'Ana Lab.', 'Carlos Mnt.', 'Mariana Pcp.', 'Ricardo Mnt.', 'Fabiana QLD'].map(user => (
               <button key={user} className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-all group">
                 <div className="relative shrink-0">
                   <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                      <span className="text-[10px] font-black text-gray-400 uppercase">{user.split(' ')[0].charAt(0)}{user.split(' ')[1]?.charAt(0)}</span>
                   </div>
                   <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full group-hover:scale-110 transition-transform" />
                 </div>
                 <div className="flex-1 min-w-0 text-left">
                   <p className="text-[11px] font-bold text-gray-700 group-hover:text-amafil-blue truncate">{user}</p>
                   <p className="text-[9px] font-medium text-gray-400 uppercase tracking-tighter">Online agora</p>
                 </div>
               </button>
             ))}
          </div>
        </div>
      </div>

      {/* Main: Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col card-mes lg:p-4 p-0 relative overflow-hidden transition-all duration-300 rounded-none border-0 lg:rounded-bento lg:border shadow-none lg:shadow-sm h-full",
        mobileView === 'list' ? "hidden lg:flex" : "flex"
      )}>
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 lg:p-0 lg:pb-4 border-b border-gray-100 lg:mb-4 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setMobileView('list')}
               className="lg:hidden p-2 text-gray-400 hover:bg-gray-50 rounded-xl"
             >
               <ChevronLeft className="w-6 h-6" />
             </button>
             <div className={cn(
               "w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
               activeConv.color
             )}>
               <ChatHeaderIcon className="w-6 h-6" />
             </div>
             <div>
               <h2 className="text-lg lg:text-xl font-black text-gray-900 italic tracking-tighter leading-none mb-1">{activeConv.label}</h2>
               <div className="flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:inline">{activeConv.description}</span>
                 <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest sm:hidden">Online</span>
               </div>
             </div>
          </div>
          <button className="w-10 h-10 rounded-xl hover:bg-gray-50 flex items-center justify-center text-gray-400 transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto space-y-6 px-4 lg:px-2 pb-24 pt-4 lg:pt-0 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {filteredMessages.map((msg) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={msg.id} 
                className={cn(
                  "flex flex-col max-w-[70%]",
                  msg.isMe ? "ml-auto items-end" : "items-start"
                )}
              >
                {!msg.isMe && (
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-3 mb-1.5 flex items-center gap-2">
                    {msg.sender} 
                    {msg.group && <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[8px] border border-gray-200">[{msg.group}]</span>}
                  </span>
                )}
                
                <div className={cn(
                  "overflow-hidden shadow-sm transition-all hover:shadow-md",
                  msg.isMe 
                    ? "bg-amafil-blue text-white rounded-2xl rounded-tr-none" 
                    : "bg-white text-gray-800 rounded-2xl rounded-tl-none border border-gray-100"
                )}>
                  {msg.image && (
                    <img 
                      src={msg.image} 
                      alt="Imagem Anexada" 
                      className="w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                      referrerPolicy="no-referrer"
                    />
                  )}
                  {msg.content && (
                    <div className="px-5 py-3 text-[13px] font-bold tracking-tight leading-relaxed">
                      {msg.content}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1.5 px-1">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{msg.timestamp}</span>
                  {msg.isMe && (
                    <span className="text-amafil-blue">
                      {msg.status === 'read' ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Chat Input Area */}
        <div className="absolute bottom-0 lg:bottom-4 left-0 lg:left-4 right-0 lg:right-4 z-20 p-4 lg:p-0 bg-white lg:bg-transparent border-t lg:border-t-0 border-gray-100">
          <AnimatePresence>
            {selectedImage && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="relative w-20 h-20 lg:w-24 lg:h-24 rounded-2xl overflow-hidden border-2 border-amafil-blue shadow-lg mb-2 group"
              >
                <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-amafil-red transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-gray-50 lg:bg-white/90 lg:backdrop-blur-md p-1.5 lg:p-2 rounded-2xl lg:border border-gray-200 flex gap-2 shadow-xl shadow-gray-200/20 lg:shadow-gray-200/50">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-amafil-blue transition-all"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageSelect}
            />
            
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e)}
              placeholder={selectedImage ? "Legenda..." : "Mensagem..."}
              className="flex-1 bg-transparent lg:bg-gray-50 border-none rounded-xl px-2 lg:px-4 py-3 text-sm font-bold focus:ring-0 lg:focus:ring-2 lg:focus:ring-amafil-blue/10 placeholder:text-gray-400 outline-none"
            />
            
            <button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() && !selectedImage}
              className={cn(
                "w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center transition-all",
                (newMessage.trim() || selectedImage)
                  ? "bg-amafil-blue text-white shadow-lg shadow-amafil-blue/30 hover:scale-105 active:scale-95"
                  : "bg-gray-200 lg:bg-gray-100 text-gray-400 lg:text-gray-300 cursor-not-allowed"
              )}
            >
              <Send className="w-5 h-5 -rotate-45" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
