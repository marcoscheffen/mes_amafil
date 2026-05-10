
import React, { useState, useRef, useEffect } from 'react';
import { ContactAvatar } from '../components/ContactAvatar';
import { ChatMessage, Customer } from '../types';
import * as chatwootService from '../services/chatwootService';
import type { ChatwootConversation, ChatwootAgent, ConversationPriority } from '../services/chatwootService';
import { useCompany } from '../contexts/CompanyContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { supabase } from '../lib/supabase';
import { getUserProfile } from '../services/userProfileService';
import { useAuth } from '../hooks/useAuth';
import { findClientByPhone } from '../services/clientsService';
import * as tasksService from '../services/tasksService';
import type { Task } from '../types';

const normalizePhone = (p: string) => p.replace(/\D/g, '');

// Badge de status da conversa
const STATUS_CONFIG = {
  open:     { label: 'Aberta',    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  resolved: { label: 'Resolvida', color: 'bg-slate-500/20  text-slate-400  border-slate-500/30' },
  pending:  { label: 'Pendente',  color: 'bg-amber-500/20  text-amber-400  border-amber-500/30' },
  snoozed:  { label: 'Snoozed',   color: 'bg-blue-500/20   text-blue-400   border-blue-500/30' },
} as const;

const PRIORITY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  urgent: { label: 'Urgente',  color: 'text-red-400 bg-red-500/10 border-red-500/30',    icon: 'priority_high' },
  high:   { label: 'Alta',     color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', icon: 'arrow_upward' },
  medium: { label: 'Média',    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',   icon: 'remove' },
  low:    { label: 'Baixa',    color: 'text-slate-400 bg-slate-500/10 border-slate-500/30', icon: 'arrow_downward' },
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const CHANNEL_ICON: Record<string, string> = {
  'WhatsApp': 'phone_iphone',
  'Web Chat': 'computer',
  'Email':    'mail',
  'Facebook': 'thumb_up',
  'Instagram': 'photo_camera',
  'Telegram': 'send',
  'SMS':      'sms',
  'API':      'api',
};

interface ChatPageProps {
  initialPhone?: string | null;
  onPhoneHandled?: () => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ initialPhone, onPhoneHandled }) => {
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const { resetUnread, setActiveChatPhone } = useNotifications();
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [conversations, setConversations] = useState<ChatwootConversation[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<ChatwootConversation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [linkedCustomer, setLinkedCustomer] = useState<Customer | null>(null);
  const [lookingUpCustomer, setLookingUpCustomer] = useState(false);
  const [linkedTasks, setLinkedTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const discardRecordingOnStopRef = useRef(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Agentes e filtros avançados
  const [agents, setAgents] = useState<ChatwootAgent[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<'assigned' | 'unassigned' | 'all'>('all');
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [settingPriority, setSettingPriority] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [savingLabels, setSavingLabels] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [operatorName, setOperatorName] = useState<string>('');

  // Carregar agentes uma vez ao montar
  useEffect(() => {
    chatwootService.listAgents().then(setAgents).catch(() => {});
  }, []);

  // Carregar nome do operador logado para identificar mensagens manuais
  useEffect(() => {
    getUserProfile()
      .then(profile => {
        const name = profile?.full_name || user?.user_metadata?.full_name || user?.email || '';
        setOperatorName(name);
      })
      .catch(() => {
        const name = user?.user_metadata?.full_name || user?.email || '';
        setOperatorName(name);
      });
  }, [user]);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const close = () => { setShowAssignDropdown(false); setShowPriorityDropdown(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  // Encerrar gravação ao desmontar (sem enviar)
  useEffect(() => {
    return () => {
      discardRecordingOnStopRef.current = true;
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      const rec = mediaRecorderRef.current;
      if (rec && rec.state !== 'inactive') {
        rec.onstop = null;
        try {
          rec.stop();
        } catch {
          // ignore
        }
      }
      mediaRecorderRef.current = null;
      recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
      recordingStreamRef.current = null;
    };
  }, []);

  // Carregar lista de conversas
  useEffect(() => {
    setCurrentPage(1);
    loadConversations(1);
  }, [statusFilter, assigneeFilter]);

  // Carregar mensagens quando um chat é selecionado
  useEffect(() => {
    if (activeChatId) {
      loadMessages(activeChatId);
    } else {
      setChatMessages([]);
      setActiveConversation(null);
    }
  }, [activeChatId]);

  // Scroll automático quando novas mensagens chegam
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Resetar badge de não-lidas ao abrir a página de chat
  useEffect(() => {
    resetUnread();
    return () => setActiveChatPhone(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Informar ao contexto de notificações qual conversa está ativa (evita badge desnecessário)
  useEffect(() => {
    setActiveChatPhone(activeConversation?.client_phone ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation?.client_phone]);

  // Realtime: atualizar mensagens via Supabase Realtime quando há conversa ativa
  // Fallback: polling a cada 60s caso WebSocket caia
  useEffect(() => {
    if (!activeChatId || !activeConversation?.client_phone || !currentCompany?.id) return;

    const activePhone = normalizePhone(activeConversation.client_phone);

    const channel = supabase
      .channel(`chat:${activeChatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `company_id=eq.${currentCompany.id}`,
        },
        (payload) => {
          const inPhone = normalizePhone((payload.new as Record<string, any>)?.phone ?? '');
          if (inPhone === activePhone) {
            loadMessages(activeChatId, true);
          }
        }
      )
      .subscribe();

    // Fallback polling 15s (caso WebSocket indisponível)
    const fallback = setInterval(() => {
      loadMessages(activeChatId, true);
    }, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(fallback);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId, activeConversation?.client_phone, currentCompany?.id]);

  // Auto-selecionar conversa quando navegando da página de Clientes
  useEffect(() => {
    if (!initialPhone || loading || conversations.length === 0) return;
    const norm = initialPhone.replace(/\D/g, '');
    // Variante do 9º dígito brasileiro
    let variant: string | null = null;
    if (norm.startsWith('55')) {
      if (norm.length === 13) variant = norm.slice(0, 4) + norm.slice(5);
      else if (norm.length === 12) variant = norm.slice(0, 4) + '9' + norm.slice(4);
    }
    const found = conversations.find(c => {
      const cp = (c.client_phone ?? '').replace(/\D/g, '');
      return cp === norm || (variant !== null && cp === variant);
    });
    if (found) setActiveChatId(found.cw_id);
    onPhoneHandled?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPhone, loading, conversations]);

  // Vincular conversa ao cliente pelo telefone
  useEffect(() => {
    if (!activeConversation || !currentCompany?.id) {
      setLinkedCustomer(null);
      return;
    }
    const phone = activeConversation.client_phone;
    if (!phone) {
      setLinkedCustomer(null);
      return;
    }
    setLookingUpCustomer(true);
    setLinkedTasks([]);
    findClientByPhone(currentCompany.id, phone)
      .then(customer => {
        setLinkedCustomer(customer);
        if (customer && currentCompany) {
          setLoadingTasks(true);
          // Buscar tarefas do cliente
          tasksService.getTasks({ companyId: currentCompany.id, clientId: customer.id, includeTerminal: false })
            .then(tasks => {
              // Filtrar somente as que não são terminal_done ou terminal_cancel 
              // Se status_type vir da query, filtramos aqui:
              const pending = tasks.filter(t => t.status_type === 'active' || !t.status_type);
              setLinkedTasks(pending);
            })
            .catch(console.error)
            .finally(() => setLoadingTasks(false));
        }
      })
      .catch(() => setLinkedCustomer(null))
      .finally(() => setLookingUpCustomer(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation?.cw_id, currentCompany?.id]);

  const loadConversations = async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      let data: ChatwootConversation[];
      if (searchTerm.trim().length >= 3) {
        // Busca via API do Chatwoot
        data = await chatwootService.searchConversations(searchTerm.trim(), page);
      } else {
        data = await chatwootService.getConversations(
          statusFilter,
          page,
          assigneeFilter !== 'all' ? assigneeFilter : undefined,
        );
      }

      // Filtro client-side por searchTerm curto (< 3 chars)
      const filtered = searchTerm.trim().length > 0 && searchTerm.trim().length < 3
        ? data.filter(c =>
            c.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.client_phone.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : data;

      setConversations(filtered);
      setHasNextPage(filtered.length >= 25);

      // Selecionar primeira conversa automaticamente
      if (filtered.length > 0 && !activeChatId) {
        setActiveChatId(filtered[0].cw_id);
      }
    } catch (err: any) {
      console.error('Erro ao carregar conversas:', err);
      setError(err?.message || 'Erro ao carregar conversas do Chatwoot.');
    } finally {
      setLoading(false);
    }
  };

  // Recarregar conversas quando searchTerm mudar (debounce 400ms)
  useEffect(() => {
    const id = setTimeout(() => { setCurrentPage(1); loadConversations(1); }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const loadMessages = async (conversationId: number, silent = false) => {
    if (!conversationId) return;

    try {
      if (!silent) setLoadingMessages(true);
      setError(null);
      const messages = await chatwootService.getMessages(conversationId);
      setChatMessages(messages);

      // Atualizar activeConversation
      const conv = conversations.find(c => c.cw_id === conversationId)
        ?? await chatwootService.getConversation(conversationId);
      if (conv) setActiveConversation(conv);
    } catch (err: any) {
      console.error('Erro ao carregar mensagens:', err);
      if (!silent) {
        setError(err?.message || 'Erro ao carregar mensagens do Chatwoot.');
        setChatMessages([]);
      }
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (isIA: boolean = false) => {
    if (!inputText.trim() || !activeChatId || sending) return;

    try {
      setSending(true);
      setError(null);
      const content = !isIA && operatorName
        ? `[${operatorName}] ${inputText.trim()}`
        : inputText.trim();
      await chatwootService.sendMessage(activeChatId, content, isIA);
      setInputText('');
      // Recarregar mensagens para exibir a recém-enviada
      await loadMessages(activeChatId, true);
    } catch (err: any) {
      console.error('Erro ao enviar mensagem:', err);
      setError(err.message || 'Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!activeChatId) return;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(
        `Arquivo muito grande. Limite: 10MB (atual: ${(file.size / (1024 * 1024)).toFixed(1)}MB)`
      );
      return;
    }
    try {
      setSending(true);
      setError(null);
      await chatwootService.sendAttachment(activeChatId, file);
      await loadMessages(activeChatId, true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar arquivo';
      setError(message);
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    if (!activeChatId || sending || isRecording) return;
    discardRecordingOnStopRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
          ? 'audio/ogg;codecs=opus'
          : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        recordingStreamRef.current = null;
        if (discardRecordingOnStopRef.current) {
          return;
        }
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const ext = mimeType.includes('mp4')
          ? 'm4a'
          : mimeType.includes('ogg')
            ? 'ogg'
            : 'webm';
        const audioFile = new File([blob], `audio-${Date.now()}.${ext}`, { type: mimeType });
        await handleFileUpload(audioFile);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      setError('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
    }
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
    const rec = mediaRecorderRef.current;
    mediaRecorderRef.current = null;
    rec?.stop();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Resetar input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAssignAgent = async (agentId: number | null) => {
    if (!activeChatId) return;
    try {
      setAssigning(true);
      await chatwootService.assignConversation(activeChatId, agentId);
      setShowAssignDropdown(false);
      await loadMessages(activeChatId, true);
      // Atualiza o nome do agente na conversa ativa
      const updated = await chatwootService.getConversation(activeChatId);
      if (updated) setActiveConversation(updated);
    } catch (err: any) {
      setError(err.message || 'Erro ao atribuir agente');
    } finally {
      setAssigning(false);
    }
  };

  const handleSetPriority = async (priority: ConversationPriority) => {
    if (!activeChatId) return;
    try {
      setSettingPriority(true);
      await chatwootService.setConversationPriority(activeChatId, priority);
      setShowPriorityDropdown(false);
      const updated = await chatwootService.getConversation(activeChatId);
      if (updated) {
        setActiveConversation(updated);
        setConversations(prev => prev.map(c => c.cw_id === activeChatId ? { ...c, priority } : c));
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao definir prioridade');
    } finally {
      setSettingPriority(false);
    }
  };

  const handleAddLabel = async (label: string) => {
    if (!activeChatId || !activeConversation || !label.trim()) return;
    const current = activeConversation.labels ?? [];
    if (current.includes(label.trim())) return;
    const updated = [...current, label.trim()];
    try {
      setSavingLabels(true);
      await chatwootService.setConversationLabels(activeChatId, updated);
      setActiveConversation({ ...activeConversation, labels: updated });
      setConversations(prev => prev.map(c => c.cw_id === activeChatId ? { ...c, labels: updated } : c));
      setNewLabel('');
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar label');
    } finally {
      setSavingLabels(false);
    }
  };

  const handleRemoveLabel = async (label: string) => {
    if (!activeChatId || !activeConversation) return;
    const updated = (activeConversation.labels ?? []).filter(l => l !== label);
    try {
      setSavingLabels(true);
      await chatwootService.setConversationLabels(activeChatId, updated);
      setActiveConversation({ ...activeConversation, labels: updated });
      setConversations(prev => prev.map(c => c.cw_id === activeChatId ? { ...c, labels: updated } : c));
    } catch (err: any) {
      setError(err.message || 'Erro ao remover label');
    } finally {
      setSavingLabels(false);
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('pt-BR');
  };

  const renderMessageContent = (msg: ChatMessage) => {
    const messageType = msg.message_type || 'text';
    
    switch (messageType) {
      case 'audio':
        return (
          <div className="flex flex-col gap-2 min-w-[200px]">
            {msg.message_audio_url ? (
              <audio
                controls
                src={msg.message_audio_url}
                className="w-full max-w-xs h-10 rounded-xl"
                style={{ accentColor: 'white' }}
              >
                <source src={msg.message_audio_url} type={msg.message_audio_mime_type ?? 'audio/ogg'} />
              </audio>
            ) : (
              <div className="flex items-center gap-2 bg-black/10 p-2 rounded-xl">
                <span className="material-symbols-outlined text-white/50 text-lg">mic_off</span>
                <span className="text-[10px] text-white/50">Áudio indisponível</span>
              </div>
            )}
          </div>
        );
      case 'image':
        return (
          <div className="space-y-2">
            <div className="rounded-xl overflow-hidden border border-white/10 shadow-lg">
              <img src={msg.message_image_url} alt="Shared" className="max-w-full h-auto max-h-[300px] object-cover hover:scale-105 transition-transform cursor-pointer" />
            </div>
            {msg.message_texto_text && <p className="text-sm leading-relaxed">{msg.message_texto_text}</p>}
          </div>
        );
      case 'location':
        const mapUrl = `https://www.google.com/maps?q=${msg.message_location_latitude},${msg.message_location_longitude}`;
        return (
          <a href={mapUrl} target="_blank" rel="noreferrer" className="flex flex-col gap-2 hover:opacity-90 transition-opacity">
            <div className="h-32 bg-slate-900 rounded-xl overflow-hidden relative border border-white/5">
               <div className="absolute inset-0 flex items-center justify-center bg-blue-500/5">
                  <span className="material-symbols-outlined text-4xl text-blue-500">location_on</span>
               </div>
               <div className="absolute bottom-2 left-2 bg-slate-800/90 px-2 py-1 rounded text-[10px] text-white border border-slate-700">Ver no Google Maps</div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Lat: {msg.message_location_latitude} • Lon: {msg.message_location_longitude}</p>
          </a>
        );
      case 'document':
        return (
          <div className="flex items-center gap-3 p-3 bg-black/10 rounded-xl border border-white/5">
             <div className="size-10 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
                <span className="material-symbols-outlined">description</span>
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {msg.message_document_title || 'Documento'}
                </p>
                <p className="text-[10px] text-white/50">
                  {msg.message_document_mime_type || 'Arquivo'}
                </p>
             </div>
             {msg.message_document_document_url && (
               <a 
                 href={msg.message_document_document_url} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="text-white/50 hover:text-white transition-colors"
                 title="Baixar documento"
               >
                <span className="material-symbols-outlined">download</span>
               </a>
             )}
          </div>
        );
      case 'contact':
        return (
          <div className="flex items-center gap-3 p-3 bg-black/10 rounded-xl border border-white/5">
             <div className="size-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <span className="material-symbols-outlined">person</span>
             </div>
             <div className="flex-1">
                <p className="text-xs font-bold text-white">{msg.message_contact_display_name || 'Contato'}</p>
                <p className="text-[10px] text-white/50">Clique para salvar</p>
             </div>
          </div>
        );
      default:
        return <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message_texto_text}</p>;
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6 animate-in zoom-in-95 duration-500">
      {/* Sidebar de Chats */}
      <div className="w-80 flex-shrink-0 flex flex-col bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-700 bg-slate-900/20 space-y-3">
          {/* Busca + atalho discreto para log de mensagens (Supabase) */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <input
                className="w-full h-10 bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 text-xs text-white focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                placeholder="Buscar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 text-lg">search</span>
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-slate-500 hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>
            <button
              type="button"
              title="Log de mensagens"
              aria-label="Abrir log de mensagens"
              onClick={() =>
                window.dispatchEvent(new CustomEvent('aios:navigate', { detail: { view: 'message-log' } }))
              }
              className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/50 text-slate-500 hover:text-slate-300 hover:border-slate-600 hover:bg-slate-800/80 transition-colors"
            >
              <span className="material-symbols-outlined text-lg leading-none">history</span>
            </button>
          </div>
          {/* Filtro de status */}
          <div className="flex gap-1">
            {(['open','pending','resolved','all'] as const).map(s => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setActiveChatId(null); }}
                className={`flex-1 h-7 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 text-slate-500 hover:text-white border border-slate-700'
                }`}
              >
                {s === 'open' ? 'Abertos' : s === 'pending' ? 'Pend.' : s === 'resolved' ? 'Resol.' : 'Todos'}
              </button>
            ))}
          </div>
          {/* Filtro de atribuição */}
          <div className="flex gap-1">
            {(['all','assigned','unassigned'] as const).map(f => (
              <button
                key={f}
                onClick={() => { setAssigneeFilter(f); setActiveChatId(null); }}
                className={`flex-1 h-6 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                  assigneeFilter === f
                    ? 'bg-slate-600 text-white'
                    : 'bg-slate-900 text-slate-600 hover:text-slate-300 border border-slate-700'
                }`}
              >
                {f === 'all' ? 'Todos' : f === 'assigned' ? 'Atribuídos' : 'Livres'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <span className="material-symbols-outlined text-4xl mb-2 block">chat_bubble_outline</span>
              <p className="text-sm">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            conversations.map(conv => {
              const isActiveConv = activeChatId === conv.cw_id;
              const avatarInitial = (conv.client_name || '').trim().charAt(0).toUpperCase() || '?';

              return (
              <button
                key={conv.cw_id}
                onClick={() => setActiveChatId(conv.cw_id)}
                className={`w-full flex items-center gap-4 p-4 hover:bg-slate-700/50 border-l-4 transition-all relative ${isActiveConv ? 'bg-slate-700/80 border-blue-500' : 'border-transparent'}`}
              >
                <div className="relative shrink-0">
                  <ContactAvatar
                    photoUrl={conv.client_photo}
                    fallbackUrl={isActiveConv ? linkedCustomer?.senderphoto : undefined}
                    initial={avatarInitial}
                    className="size-11 shadow-md"
                    initialClassName="text-xs font-bold"
                  />
                  {conv.unread_count > 0 && (
                    <span className="absolute -top-1 -right-1 size-5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center z-10 pointer-events-none">
                      {conv.unread_count > 9 ? '9+' : conv.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-start mb-0.5">
                    <p className="text-sm font-bold text-white truncate">{conv.client_name}</p>
                    <span className="text-[10px] text-slate-500 font-bold">{formatTime(conv.last_message_time)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {conv.channel && (
                      <span className="material-symbols-outlined text-[12px] text-slate-600">
                        {CHANNEL_ICON[conv.channel] ?? 'chat'}
                      </span>
                    )}
                    <p className="text-xs text-slate-500 truncate flex-1">
                      {conv.last_message || 'Sem mensagens'}
                    </p>
                  </div>
                  {/* Indicador de vínculo com cliente (só para a conversa ativa) */}
                  {isActiveConv && (
                    <div className="mt-1">
                      {lookingUpCustomer ? (
                        <span className="text-[9px] text-slate-500">vinculando...</span>
                      ) : linkedCustomer ? (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          <span className="material-symbols-outlined text-[10px]">person</span>
                          {linkedCustomer.chatname || linkedCustomer.ai_name || linkedCustomer.phone}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          <span className="material-symbols-outlined text-[10px]">person_off</span>
                          Não vinculado
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            )})
          )}
        </div>
        {/* Paginação */}
        {(currentPage > 1 || hasNextPage) && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-slate-700 bg-slate-900/20">
            <button
              disabled={currentPage <= 1}
              onClick={() => { const p = currentPage - 1; setCurrentPage(p); loadConversations(p); }}
              className="flex items-center gap-1 h-7 px-2 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
              Ant.
            </button>
            <span className="text-[10px] font-bold text-slate-500">Pág. {currentPage}</span>
            <button
              disabled={!hasNextPage}
              onClick={() => { const p = currentPage + 1; setCurrentPage(p); loadConversations(p); }}
              className="flex items-center gap-1 h-7 px-2 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Próx.
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        )}
      </div>

      {/* Janela de Chat */}
      <div className="flex-1 flex flex-col bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl relative">
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm max-w-md">
            {error}
          </div>
        )}
        {/* Header do Chat */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-700 bg-slate-900/40">
          {activeConversation ? (
            <>
              <div className="flex items-center gap-3">
                <ContactAvatar
                  photoUrl={activeConversation.client_photo}
                  fallbackUrl={linkedCustomer?.senderphoto}
                  initial={(activeConversation.client_name || '').trim().charAt(0).toUpperCase() || '?'}
                  className="size-10"
                  initialClassName="text-sm font-bold"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">{activeConversation.client_name}</p>
                    {/* Badge de status */}
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${STATUS_CONFIG[activeConversation.status]?.color ?? STATUS_CONFIG.open.color}`}>
                      {STATUS_CONFIG[activeConversation.status]?.label ?? activeConversation.status}
                    </span>
                    {/* Badge do canal */}
                    {activeConversation.channel && (
                      <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-slate-700 text-[9px] font-bold text-slate-400 border border-slate-600">
                        <span className="material-symbols-outlined text-[11px]">{CHANNEL_ICON[activeConversation.channel] ?? 'chat'}</span>
                        {activeConversation.channel}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                    {activeConversation.client_phone || `Conversa #${activeConversation.cw_id}`}
                    {activeConversation.assignee_name && <span className="text-blue-400 ml-1">• {activeConversation.assignee_name}</span>}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-sm text-slate-500">Selecione uma conversa</p>
            </div>
          )}
          <div className="flex gap-2 relative">
            {/* Botão de Prioridade */}
            {activeConversation && (
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowPriorityDropdown(p => !p); setShowAssignDropdown(false); }}
                  disabled={settingPriority}
                  className={`h-9 px-3 flex items-center gap-1.5 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-wider ${
                    activeConversation.priority
                      ? PRIORITY_CONFIG[activeConversation.priority]?.color + ' border-current'
                      : 'bg-slate-700 text-slate-400 border-slate-600 hover:bg-slate-600'
                  }`}
                  title="Definir prioridade"
                >
                  <span className="material-symbols-outlined text-sm">
                    {activeConversation.priority ? PRIORITY_CONFIG[activeConversation.priority]?.icon : 'flag'}
                  </span>
                  <span className="hidden sm:inline">
                    {activeConversation.priority ? PRIORITY_CONFIG[activeConversation.priority]?.label : 'Prior.'}
                  </span>
                </button>
                {showPriorityDropdown && (
                  <div onClick={e => e.stopPropagation()} className="absolute right-0 top-11 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden w-44">
                    {([null, 'urgent', 'high', 'medium', 'low'] as ConversationPriority[]).map(p => (
                      <button
                        key={p ?? 'none'}
                        onClick={() => handleSetPriority(p)}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold hover:bg-slate-700 transition-colors ${
                          activeConversation.priority === p ? 'text-white bg-slate-700/60' : 'text-slate-300'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-sm ${p ? PRIORITY_CONFIG[p]?.color.split(' ')[0] : 'text-slate-500'}`}>
                          {p ? PRIORITY_CONFIG[p]?.icon : 'block'}
                        </span>
                        {p ? PRIORITY_CONFIG[p]?.label : 'Sem prioridade'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Botão de Atribuir Agente */}
            {activeConversation && (
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowAssignDropdown(p => !p); setShowPriorityDropdown(false); }}
                  disabled={assigning}
                  className="h-9 px-3 flex items-center gap-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-all border border-slate-600 text-[10px] font-bold text-slate-300 uppercase tracking-wider"
                  title="Atribuir agente"
                >
                  <span className="material-symbols-outlined text-sm">person_add</span>
                  <span className="hidden sm:inline max-w-[80px] truncate">
                    {activeConversation.assignee_name ?? 'Atribuir'}
                  </span>
                </button>
                {showAssignDropdown && (
                  <div onClick={e => e.stopPropagation()} className="absolute right-0 top-11 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden w-52 max-h-64 overflow-y-auto">
                    <button
                      onClick={() => handleAssignAgent(null)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">person_off</span>
                      Desatribuir
                    </button>
                    {agents.map(agent => (
                      <button
                        key={agent.id}
                        onClick={() => handleAssignAgent(agent.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold hover:bg-slate-700 transition-colors ${
                          activeConversation.assignee_id === agent.id ? 'text-blue-400 bg-slate-700/60' : 'text-slate-300'
                        }`}
                      >
                        <div className="size-6 rounded-full bg-slate-600 flex items-center justify-center text-[9px] font-black text-white shrink-0">
                          {agent.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate">{agent.name}</span>
                      </button>
                    ))}
                    {agents.length === 0 && (
                      <p className="text-xs text-slate-500 text-center py-4">Nenhum agente</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => activeChatId && loadMessages(activeChatId)}
              className="size-9 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 transition-all border border-slate-600"
              title="Atualizar mensagens"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
            </button>
          </div>
        </div>

        {/* Corpo das Mensagens */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900/10 scroll-smooth" ref={scrollRef}>
          {loadingMessages ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : chatMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500">
              <div className="text-center">
                <span className="material-symbols-outlined text-4xl mb-2 block">chat_bubble_outline</span>
                <p className="text-sm">Nenhuma mensagem ainda</p>
              </div>
            </div>
          ) : (
            chatMessages.map((msg) => {
              // Em nosso sistema, "fromme" refere-se à empresa (Admin/IA). 
              // O usuário pede "mensagens enviadas ... fromme: true" 
              // Logo isClient = !fromme 
              const isClient = !msg.fromme;
              
              // Determinar se é IA ou manual baseado no campo is_ia
              const isAI = msg.fromme && (msg.is_ia || msg.rec_type === 'ia');
              const isManual = msg.fromme && !isAI;

            return (
              <div key={msg.id} className={`flex items-end gap-2.5 ${isClient ? 'justify-start' : 'justify-end'}`}>
                {isClient && (
                  <ContactAvatar
                    photoUrl={activeConversation?.client_photo}
                    fallbackUrl={linkedCustomer?.senderphoto}
                    initial={(activeConversation?.client_name || '').trim().charAt(0).toUpperCase() || '?'}
                    className="size-7 mb-1 border-white/10 !bg-slate-700"
                    initialClassName="text-[10px] font-bold"
                  />
                )}
                
                <div className={`flex flex-col gap-1 max-w-[70%] ${isClient ? 'items-start' : 'items-end'}`}>
                  {/* Bubble */}
                  <div className={`p-4 rounded-2xl shadow-lg relative group ${
                    isClient ? 'bg-slate-700 text-white rounded-bl-none' : 
                    isAI ? 'bg-violet-600 text-white rounded-br-none' : 
                    'bg-blue-600 text-white rounded-br-none'
                  }`}>
                    {renderMessageContent(msg)}
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-1.5 px-1.5">
                    {isAI && <span className="material-symbols-outlined text-[14px] text-violet-400 fill-1">auto_awesome</span>}
                    {isManual && <span className="material-symbols-outlined text-[14px] text-blue-400">person</span>}
                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
                      {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      {isAI ? ' • IA' : isManual ? ' • MANUAL' : ''}
                    </span>
                  </div>
                </div>

                {!isClient && (
                  <div className={`size-7 rounded-lg flex items-center justify-center shrink-0 mb-1 text-white shadow-xl ${isAI ? 'bg-violet-600' : 'bg-blue-600'}`}>
                    <span className="material-symbols-outlined text-sm">{isAI ? 'auto_awesome' : 'person'}</span>
                  </div>
                )}
              </div>
            );
          })
          )}
        </div>

        {/* Input da Mensagem */}
        <div className="p-4 bg-slate-900/80 border-t border-slate-700 backdrop-blur-md">
          <div className="flex items-end gap-3 bg-slate-800 p-2 rounded-2xl border border-slate-700 focus-within:border-blue-500/50 transition-all shadow-inner">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!activeChatId || sending || isRecording}
              className="p-2 text-slate-500 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Anexar arquivo"
            >
              <span className="material-symbols-outlined">attach_file</span>
            </button>
            <textarea
              className="flex-1 bg-transparent border-none text-white placeholder-slate-600 focus:ring-0 resize-none py-2 max-h-32 text-sm leading-relaxed disabled:opacity-40"
              placeholder="Responder via Chatwoot... (Enter = enviar)"
              rows={1}
              value={inputText}
              disabled={isRecording}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(false); // Mensagem manual
                }
              }}
            />
            {isRecording && (
              <span className="text-xs text-red-400 font-mono tabular-nums shrink-0 self-center animate-pulse">
                {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:
                {String(recordingSeconds % 60).padStart(2, '0')}
              </span>
            )}
            <div className="flex gap-1 items-center">
              {isRecording ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="p-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all shadow-lg shadow-red-600/20 animate-pulse"
                  title="Parar e enviar áudio"
                >
                  <span className="material-symbols-outlined text-sm">stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={sending || !activeChatId}
                  className="p-2 text-slate-500 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Gravar áudio"
                >
                  <span className="material-symbols-outlined">mic</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSendMessage(false)}
                disabled={sending || !inputText.trim() || !activeChatId || isRecording}
                className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Enviar manual"
              >
                <span className="material-symbols-outlined text-sm fill-1">
                  {sending ? 'hourglass_empty' : 'send'}
                </span>
              </button>
            </div>
          </div>
          <div className="flex justify-center mt-3">
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[12px]">hub</span>
                Chatwoot · tempo real
             </p>
          </div>
        </div>
      </div>

      {/* Painel Lateral de Detalhes (Opcional/Contextual) */}
      <div className="w-80 hidden xl:flex flex-col gap-6">
         <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest border-b border-slate-700 pb-3">Sobre o Cliente</h3>

            {!activeConversation ? (
              <p className="text-xs text-slate-500 text-center py-4">Selecione uma conversa</p>
            ) : lookingUpCustomer ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
              </div>
            ) : linkedCustomer ? (
              <div className="space-y-4">
                {/* Avatar + nome */}
                <div className="flex items-center gap-3">
                  <ContactAvatar
                    photoUrl={activeConversation?.client_photo}
                    fallbackUrl={linkedCustomer.senderphoto}
                    initial={(linkedCustomer.chatname || linkedCustomer.ai_name || linkedCustomer.phone || '').trim().charAt(0).toUpperCase() || '?'}
                    className="size-10 shrink-0"
                    initialClassName="text-sm font-bold"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{linkedCustomer.chatname || linkedCustomer.ai_name || 'Sem nome'}</p>
                    <p className="text-[10px] text-slate-500">{linkedCustomer.phone}</p>
                  </div>
                </div>

                {/* Dados IA */}
                {(linkedCustomer.ai_city || linkedCustomer.ai_state) && (
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Localização</p>
                    <p className="text-xs text-white">{[linkedCustomer.ai_city, linkedCustomer.ai_state].filter(Boolean).join(', ')}</p>
                  </div>
                )}

                {linkedCustomer.ai_email && (
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">E-mail</p>
                    <p className="text-xs text-white truncate">{linkedCustomer.ai_email}</p>
                  </div>
                )}

                {linkedCustomer.ai_interest?.length > 0 && (
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Interesses</p>
                    <div className="flex flex-wrap gap-1">
                      {linkedCustomer.ai_interest.map(i => (
                        <span key={i} className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[9px] font-bold border border-blue-500/20">{i}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-1 pt-1">
                  {linkedCustomer.iaservice && (
                    <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 text-[9px] font-bold border border-yellow-500/20">IA Ativa</span>
                  )}
                  {linkedCustomer.isblock && (
                    <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[9px] font-bold border border-red-500/20">Bloqueado</span>
                  )}
                </div>

                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('aios:navigate', { detail: { view: 'customers', phone: linkedCustomer.phone } }))}
                  className="w-full h-10 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:border-blue-500 transition-all"
                >
                  Ver Perfil Completo
                </button>
              </div>
            ) : (
              /* Não vinculado */
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3 py-4 px-2 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                  <span className="material-symbols-outlined text-3xl text-amber-400">person_off</span>
                  <div className="text-center">
                    <p className="text-xs font-bold text-amber-400">Não vinculado a cliente</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {activeConversation.client_phone
                        ? `Nenhum cliente com o número ${activeConversation.client_phone}`
                        : 'Sem número de telefone'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('aios:navigate', { detail: { view: 'customers', phone: activeConversation.client_phone } }))}
                  className="w-full h-10 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white transition-all shadow-lg shadow-blue-600/20"
                >
                  Criar Cliente
                </button>
              </div>
            )}
         </div>

         {/* Labels da conversa */}
         {activeConversation && (
           <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-xl space-y-3">
             <h3 className="text-xs font-bold text-white uppercase tracking-widest border-b border-slate-700 pb-2">Labels</h3>
             <div className="flex flex-wrap gap-1.5">
               {(activeConversation.labels ?? []).map(label => (
                 <span key={label} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/20">
                   {label}
                   <button
                     onClick={() => handleRemoveLabel(label)}
                     disabled={savingLabels}
                     className="hover:text-red-400 transition-colors disabled:opacity-50"
                   >
                     <span className="material-symbols-outlined text-[11px]">close</span>
                   </button>
                 </span>
               ))}
               {(activeConversation.labels ?? []).length === 0 && (
                 <p className="text-[10px] text-slate-500">Nenhum label</p>
               )}
             </div>
             <div className="flex gap-1">
               <input
                 className="flex-1 h-7 bg-slate-900 border border-slate-700 rounded-lg px-2 text-[11px] text-white placeholder-slate-600 focus:ring-1 focus:ring-indigo-500 outline-none"
                 placeholder="Novo label..."
                 value={newLabel}
                 onChange={e => setNewLabel(e.target.value)}
                 onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddLabel(newLabel); } }}
               />
               <button
                 onClick={() => handleAddLabel(newLabel)}
                 disabled={savingLabels || !newLabel.trim()}
                 className="h-7 px-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition-all disabled:opacity-40"
               >
                 <span className="material-symbols-outlined text-sm">add</span>
               </button>
             </div>
           </div>
         )}

         <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Tarefas Pendentes</h3>
              {linkedTasks.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold">
                  {linkedTasks.length}
                </span>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {!activeConversation ? (
                <p className="text-xs text-slate-500 text-center py-4">Selecione uma conversa</p>
              ) : loadingTasks ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
                </div>
              ) : !linkedCustomer ? (
                <p className="text-xs text-slate-500 text-center py-4">Cliente não vinculado</p>
              ) : linkedTasks.length === 0 ? (
                <div className="text-center py-6 bg-slate-900/50 rounded-xl border border-slate-700/50">
                  <span className="material-symbols-outlined text-2xl text-slate-600 mb-2 block">task_alt</span>
                  <p className="text-xs text-slate-500">Nenhuma tarefa pendente</p>
                </div>
              ) : (
                linkedTasks.map(task => (
                  <div key={task.id} className="bg-slate-900 border border-slate-700 rounded-xl p-3 hover:border-blue-500/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                       <p className="text-xs font-bold text-white line-clamp-2">{task.title}</p>
                       <span className={`shrink-0 size-2 rounded-full mt-1 ${
                         task.priority === 'urgent' ? 'bg-red-500' : 
                         task.priority === 'high' ? 'bg-amber-500' :
                         task.priority === 'medium' ? 'bg-blue-500' : 'bg-slate-500'
                       }`} title={`Prioridade: ${task.priority}`} />
                    </div>
                    {task.description && (
                       <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{task.description}</p>
                    )}
                    {task.due_date && (
                       <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400">
                          <span className="material-symbols-outlined text-[12px]">schedule</span>
                          {new Date(task.due_date).toLocaleDateString('pt-BR')}
                       </div>
                    )}
                  </div>
                ))
              )}
            </div>
            
            {linkedCustomer && (
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('aios:navigate', { detail: { view: 'tasks' } }))}
                className="w-full h-10 mt-auto shrink-0 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:border-blue-500 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                Gerenciar Tarefas
              </button>
            )}
         </div>
      </div>
    </div>
  );
};
