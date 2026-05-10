import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useCompany } from './CompanyContext';

interface NotificationsContextType {
  unreadCount: number;
  resetUnread: () => void;
  setActiveChatPhone: (phone: string | null) => void;
}

const NotificationsContext = createContext<NotificationsContextType>({
  unreadCount: 0,
  resetUnread: () => {},
  setActiveChatPhone: () => {},
});

const normalize = (p: string) => p.replace(/\D/g, '');

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { currentCompany } = useCompany();
  const [unreadCount, setUnreadCount] = useState(0);
  const activeChatPhoneRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentCompany?.id) return;

    const channel = supabase
      .channel(`notifications:${currentCompany.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `company_id=eq.${currentCompany.id}`,
        },
        (payload) => {
          const incoming = payload.new as Record<string, any>;
          // Ignorar mensagens enviadas pelo bot/agente
          if (incoming.from_me === true) return;
          // Ignorar se for da conversa atualmente aberta
          const inPhone = normalize(incoming.phone ?? '');
          const activePhone = normalize(activeChatPhoneRef.current ?? '');
          if (inPhone && activePhone && inPhone === activePhone) return;
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentCompany?.id]);

  const resetUnread = () => setUnreadCount(0);

  const setActiveChatPhone = (phone: string | null) => {
    activeChatPhoneRef.current = phone;
  };

  return (
    <NotificationsContext.Provider value={{ unreadCount, resetUnread, setActiveChatPhone }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
