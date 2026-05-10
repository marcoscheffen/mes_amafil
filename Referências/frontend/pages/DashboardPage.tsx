import React, { useState, useEffect } from 'react';
import { ContactAvatar } from '../components/ContactAvatar';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useCompany } from '../contexts/CompanyContext';
import { supabase } from '../lib/supabase';
import * as chatwootService from '../services/chatwootService';
import type { ChatwootConversation } from '../services/chatwootService';

interface DashboardMetrics {
  activeAgents: number;
  totalClients: number;
  totalArticles: number;
  conversationsToday: number;
  recentConversations: ChatwootConversation[];
  chartData: { name: string; conversations: number }[];
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

function buildChartData(conversations: ChatwootConversation[]): { name: string; conversations: number }[] {
  const now = new Date();
  const counts: Record<string, number> = {};

  // Inicializar últimos 7 dias com 0
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    counts[key] = 0;
  }

  // Contar mensagens por dia pela data da última mensagem
  conversations.forEach(c => {
    if (c.last_message_time) {
      let dateObj: Date;
      if (typeof c.last_message_time === 'number') {
        // Se for Unix timestamp do Chatwoot (em segundos ou ms)
        dateObj = new Date(c.last_message_time > 9999999999 ? c.last_message_time : c.last_message_time * 1000);
      } else {
        dateObj = new Date(c.last_message_time);
      }
      
      if (!isNaN(dateObj.getTime())) {
        const day = dateObj.toISOString().slice(0, 10);
        if (day in counts) {
          counts[day] += c.total_messages || 1;
        }
      }
    }
  });

  return Object.entries(counts).map(([date, value]) => ({
    name: WEEKDAYS[new Date(date + 'T12:00:00').getDay()],
    conversations: value,
  }));
}

export const DashboardPage: React.FC = () => {
  const { currentCompany } = useCompany();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeAgents: 0,
    totalClients: 0,
    totalArticles: 0,
    conversationsToday: 0,
    recentConversations: [],
    chartData: WEEKDAYS.map(name => ({ name, conversations: 0 })),
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentCompany) return;
    loadMetrics();
  }, [currentCompany]);

  const loadMetrics = async () => {
    if (!currentCompany) return;
    try {
      setLoading(true);

      // Usar get_dashboard_metrics para buscar contadores de uma vez
      const [metricsRes, conversations] = await Promise.all([
        supabase.rpc('get_dashboard_metrics', { p_company_id: currentCompany.id }),
        chatwootService.getConversations('all').catch(() => []),
      ]);

      const chartData = buildChartData(conversations);
      const m = metricsRes.data || {};
      
      setMetrics({
        activeAgents: m.agents_active ?? 0,
        totalClients: m.clients_total ?? 0,
        totalArticles: m.articles_total ?? 0,
        // Calculate today's volume directly from the generated chart data
        conversationsToday: chartData[chartData.length - 1].conversations,
        recentConversations: conversations.slice(0, 5),
        chartData,
      });
    } catch (err) {
      console.error('Erro ao carregar métricas:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString?: string | number) => {
    if (!dateString) return '—';
    const date = typeof dateString === 'number' ? new Date(dateString > 9999999999 ? dateString : dateString * 1000) : new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Agentes Ativos"
          value={loading ? '...' : String(metrics.activeAgents)}
          icon="smart_toy"
          color="blue"
          loading={loading}
          onClick={() => window.dispatchEvent(new CustomEvent('aios:navigate', { detail: { view: 'agents' } }))}
        />
        <MetricCard
          title="Conversas Hoje"
          value={loading ? '...' : String(metrics.conversationsToday)}
          icon="chat"
          color="violet"
          loading={loading}
          onClick={() => window.dispatchEvent(new CustomEvent('aios:navigate', { detail: { view: 'chat' } }))}
        />
        <MetricCard
          title="Clientes"
          value={loading ? '...' : String(metrics.totalClients)}
          icon="group"
          color="emerald"
          loading={loading}
          onClick={() => window.dispatchEvent(new CustomEvent('aios:navigate', { detail: { view: 'customers' } }))}
        />
        <MetricCard
          title="Artigos Ativos"
          value={loading ? '...' : String(metrics.totalArticles)}
          icon="menu_book"
          color="amber"
          loading={loading}
          onClick={() => window.dispatchEvent(new CustomEvent('aios:navigate', { detail: { view: 'knowledge' } }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Chart */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-white text-lg font-bold">Volume de Conversas</h3>
              <p className="text-slate-400 text-sm">Últimos 7 dias</p>
            </div>
            {!loading && (
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="material-symbols-outlined text-lg">trending_up</span>
                <span className="font-bold">{metrics.conversationsToday}</span>
                <span className="text-slate-500 text-xs font-normal">hoje</span>
              </div>
            )}
          </div>

          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="size-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.chartData}>
                  <defs>
                    <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="conversations" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorConv)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Conversations Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-white text-lg font-bold">Conversas Recentes</h3>
          <div className="flex items-center gap-2">
            {loading && <div className="size-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
            <span className="text-slate-500 text-sm">{metrics.recentConversations.length} conversas</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-700 text-xs uppercase text-slate-500 font-bold">
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Telefone</th>
                <th className="px-6 py-4 text-center">Mensagens</th>
                <th className="px-6 py-4">Última atividade</th>
                <th className="px-6 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="size-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : metrics.recentConversations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <span className="material-symbols-outlined text-4xl block mb-2">chat_bubble_outline</span>
                    Nenhuma conversa encontrada.
                  </td>
                </tr>
              ) : (
                metrics.recentConversations.map(conv => (
                  <tr key={conv.client_id} className="hover:bg-slate-700/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <ContactAvatar
                          photoUrl={conv.client_photo}
                          initial={(conv.client_name || '').trim().charAt(0).toUpperCase() || '?'}
                          className="size-9 !bg-slate-700 border border-slate-600"
                          initialClassName="text-sm font-bold"
                        />
                        <div>
                          <p className="text-white text-sm font-bold">{conv.client_name || 'Desconhecido'}</p>
                          <p className="text-slate-500 text-xs font-mono">{conv.client_chatlid || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-300 text-sm">{conv.client_phone || '—'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400">
                        <span className="material-symbols-outlined text-xs">chat</span>
                        {conv.total_messages || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{formatTime(conv.last_message_time)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('aios:navigate', { detail: { view: 'chat', phone: conv.client_phone } }))}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        title="Ver conversa"
                      >
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon, color, loading, onClick }: any) => (
  <div
    onClick={onClick}
    className={`bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl hover:border-blue-500/30 transition-all group ${onClick ? 'cursor-pointer hover:shadow-2xl hover:-translate-y-0.5' : ''}`}
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-xl bg-${color}-500/10 text-${color}-500 group-hover:scale-110 transition-transform`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      {onClick && (
        <span className="material-symbols-outlined text-base text-slate-600 group-hover:text-slate-400 transition-colors">arrow_forward</span>
      )}
    </div>
    <p className="text-slate-500 text-sm font-semibold">{title}</p>
    {loading ? (
      <div className="mt-2 h-9 w-16 bg-slate-700 rounded animate-pulse" />
    ) : (
      <p className="text-white text-3xl font-black mt-1">{value}</p>
    )}
  </div>
);

const QuickActionButton = ({ icon, title, desc, color }: any) => (
  <button className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-700/50 transition-all text-left group">
    <div className={`size-10 rounded-xl bg-${color}-500/10 text-${color}-500 flex items-center justify-center group-hover:bg-${color}-500 group-hover:text-white transition-all shadow-lg`}>
      <span className="material-symbols-outlined text-xl">{icon}</span>
    </div>
    <div>
      <p className="text-white text-sm font-bold">{title}</p>
      <p className="text-slate-500 text-xs font-medium">{desc}</p>
    </div>
  </button>
);
