import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { AlertTriangle, Clock, Hammer, Zap, Package, User as UserIcon, CheckCircle2, XCircle, Search, Filter, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

interface DowntimeEvent {
  id: string;
  maquina: string;
  op: string;
  categoria: 'MECANICA' | 'ELETRICA' | 'MATERIAL' | 'OPERACIONAL' | 'PLANEJADA' | 'QUALIDADE';
  motivo: string;
  inicio: string;
  fim?: string;
  duracao: string;
  status: 'EM_ANDAMENTO' | 'RESOLVIDO' | 'AGUARDANDO_MANUTENCAO';
  tecnico?: string;
}

const downtimeEvents: DowntimeEvent[] = [
  {
    id: '1',
    maquina: '30',
    op: 'M01376',
    categoria: 'MECANICA',
    motivo: 'Quebra de correia transportadora',
    inicio: '08/05/2026 10:15',
    duracao: '45 min',
    status: 'EM_ANDAMENTO',
  },
  {
    id: '2',
    maquina: '15',
    op: 'M01390',
    categoria: 'MATERIAL',
    motivo: 'Falta de embalagem plástica 500g',
    inicio: '08/05/2026 09:30',
    fim: '08/05/2026 10:05',
    duracao: '35 min',
    status: 'RESOLVIDO',
    tecnico: 'Almoxarifado'
  },
  {
    id: '3',
    maquina: '08',
    op: 'M01402',
    categoria: 'ELETRICA',
    motivo: 'Sensor de posicionamento falhando',
    inicio: '08/05/2026 08:00',
    duracao: '2h 15m',
    status: 'AGUARDANDO_MANUTENCAO',
  },
  {
    id: '4',
    maquina: '32',
    op: 'M01385',
    categoria: 'OPERACIONAL',
    motivo: 'Setup e limpeza de linha',
    inicio: '08/05/2026 07:15',
    fim: '08/05/2026 07:45',
    duracao: '30 min',
    status: 'RESOLVIDO',
  }
];

const paretoData = [
  { category: 'Mecânica', minutes: 185, color: '#DC2626' },
  { category: 'Ajustes', minutes: 120, color: '#D97706' },
  { category: 'Material', minutes: 85, color: '#2B57A3' },
  { category: 'Troca OP', minutes: 45, color: '#7C3AED' },
  { category: 'Limpeza', minutes: 30, color: '#06B6D4' },
];

const timelineData = [
  { time: '06:00', efficiency: 95 },
  { time: '07:00', efficiency: 92 },
  { time: '08:00', efficiency: 65 }, // Queda por parada
  { time: '09:00', efficiency: 88 },
  { time: '10:00', efficiency: 42 }, // Queda crítica
  { time: '11:00', efficiency: 78 },
  { time: '12:00', efficiency: 84 },
];

export function DowntimeList() {
  const categoryStyles = {
    MECANICA: { icon: Hammer, color: 'text-downtime-mechanical', bg: 'bg-red-50', border: 'border-red-100' },
    ELETRICA: { icon: Zap, color: 'text-downtime-electrical', bg: 'bg-amber-50', border: 'border-amber-100' },
    MATERIAL: { icon: Package, color: 'text-downtime-material', bg: 'bg-blue-50', border: 'border-blue-100' },
    OPERACIONAL: { icon: UserIcon, color: 'text-downtime-operator', bg: 'bg-purple-50', border: 'border-purple-100' },
    PLANEJADA: { icon: CheckCircle2, color: 'text-downtime-planned', bg: 'bg-green-50', border: 'border-green-100' },
    QUALIDADE: { icon: AlertTriangle, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' },
  };

  const statusStyles = {
    EM_ANDAMENTO: "bg-red-50 text-status-danger border-status-danger/20 animate-pulse",
    RESOLVIDO: "bg-green-50 text-status-success border-status-success/20",
    AGUARDANDO_MANUTENCAO: "bg-amber-50 text-status-warning border-status-warning/20",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-bento-border pb-6 gap-4 sm:gap-0">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-gray-900">Runtime<span className="text-amafil-red">.Downtime</span></h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] mt-1 italic">Análise e Controle de Interrupções de Produção</p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none justify-center bg-white border-2 border-bento-border text-gray-600 px-4 sm:px-5 py-2.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
          <button className="flex-1 sm:flex-none justify-center bg-amafil-red text-white px-4 sm:px-6 py-2.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-amafil-red/90 transition-all shadow-[0_0_20px_rgba(236,27,35,0.2)] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">Registrar Parada</span>
            <span className="sm:hidden">Registrar</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Tempo Parado', value: '3h 48m', trend: '+12%', color: 'text-status-danger' },
          { label: 'Ocorrências', value: '08', trend: '-2', color: 'text-gray-900' },
          { label: 'MTTR Médio', value: '28 min', trend: '-5m', color: 'text-status-success' },
          { label: 'Disponibilidade', value: '91.5%', trend: '-0.8%', color: 'text-status-warning' },
        ].map((stat, i) => (
          <div key={i} className="card-mes p-4 sm:p-5 shadow-sm">
            <h4 className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">{stat.label}</h4>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline">
              <p className={cn("text-lg sm:text-2xl font-black italic", stat.color)}>{stat.value}</p>
              <span className="text-[8px] sm:text-[10px] font-bold text-gray-400">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Bento Grid */}
      <div className="grid grid-cols-12 gap-6">
        <div className="card-mes col-span-12 lg:col-span-7 p-6 flex flex-col shadow-sm">
           <div className="flex justify-between items-start mb-8">
             <div>
               <h2 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Impact Analysis</h2>
               <p className="text-xl font-bold tracking-tight text-gray-900">Eficiência x Paradas (Turno Atual)</p>
             </div>
             <div className="text-right">
               <span className="text-3xl font-black italic tracking-tighter text-status-success">84.2%</span>
               <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Global OEE</p>
             </div>
           </div>
           
           <div className="h-[250px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={timelineData}>
                 <defs>
                   <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                 <XAxis 
                   dataKey="time" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 'bold' }} 
                 />
                 <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 'bold' }} 
                   domain={[0, 100]}
                 />
                 <Tooltip 
                   contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                 />
                 <Area 
                   type="monotone" 
                   dataKey="efficiency" 
                   stroke="#2563EB" 
                   strokeWidth={4} 
                   fillOpacity={1} 
                   fill="url(#colorEff)" 
                 />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="card-mes col-span-12 lg:col-span-5 p-6 flex flex-col shadow-sm">
           <h2 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-6 font-bold">Top Causas de Parada (Pareto)</h2>
           <div className="flex-1 h-[250px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={paretoData} layout="vertical" margin={{ left: 10, right: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                 <XAxis type="number" hide />
                 <YAxis 
                   dataKey="category" 
                   type="category" 
                   axisLine={false} 
                   tickLine={false}
                   width={80}
                   tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748B', textAnchor: 'end' }}
                 />
                 <Tooltip 
                   contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}
                 />
                 <Bar dataKey="minutes" radius={[0, 8, 8, 0]} barSize={16}>
                   {paretoData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
           <div className="mt-4 grid grid-cols-2 gap-2">
             {paretoData.slice(0, 4).map((item) => (
               <div key={item.category} className="flex justify-between items-center p-2 bg-gray-50 border border-border-mes rounded-xl">
                 <span className="text-[10px] font-bold text-gray-500 uppercase">{item.category}</span>
                 <span className="text-xs font-black text-gray-900">{item.minutes}m</span>
               </div>
             ))}
           </div>
        </div>
      </div>

      {/* Main List */}
      <div className="card-mes p-0 overflow-hidden shadow-sm">
        <div className="px-4 sm:px-8 py-5 border-b border-bento-border bg-gray-50/80 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 sm:gap-6">
          <div className="relative w-full sm:max-w-xs md:max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              className="w-full bg-white border border-bento-border rounded-full py-2.5 pl-12 pr-4 text-xs font-bold text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-amafil-red/10 focus:border-amafil-red/50 outline-none transition-all shadow-inner"
            />
          </div>
          <div className="flex items-center gap-2.5 px-4 py-2 bg-white border border-bento-border rounded-full shadow-sm sm:shadow-none sm:bg-transparent sm:border-0 sm:px-0 sm:py-0">
             <div className="w-2.5 h-2.5 rounded-full bg-status-danger animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.4)]"></div>
             <span className="text-[9px] lg:text-[10px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Monitorando Alertas Ativos</span>
          </div>
        </div>

        <div className="overflow-x-auto p-4">
          <table className="w-full text-left">
            <thead className="bg-transparent text-[10px] uppercase text-gray-400 font-black tracking-widest">
              <tr>
                <th className="px-4 py-3">Evento / Categoria</th>
                <th className="px-4 py-3">Máquina</th>
                <th className="px-4 py-3">Início / Duração</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {downtimeEvents.map((event) => {
                const Category = categoryStyles[event.categoria];
                const Icon = Category.icon;
                
                return (
                  <tr key={event.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 group font-bold">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center border", Category.bg, Category.color, Category.border)}>
                          <Icon className="w-5 h-5 shadow-sm" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 leading-tight">{event.motivo}</p>
                          <p className={cn("text-[10px] font-black uppercase tracking-widest mt-1", Category.color)}>
                            {event.categoria} • OP: {event.op}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                       <div className="w-10 h-10 rounded-xl bg-white border border-bento-border flex items-center justify-center font-black text-gray-400 text-xs italic shadow-sm">
                         {event.maquina}
                       </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {event.inicio}
                        </span>
                        <span className="text-xs font-black text-amafil-red italic mt-1 bg-red-50 px-2 py-0.5 rounded w-fit uppercase tracking-tighter">
                          {event.duracao}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn("badge-status border shadow-sm whitespace-nowrap", statusStyles[event.status])}>
                        {event.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                           <UserIcon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-gray-600 truncate max-w-[120px]">{event.tecnico || 'Não atribuído'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button className="h-9 px-4 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all shadow-sm">
                        Ver Logs
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

