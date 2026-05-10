import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { KPICard } from '../components/dashboard/KPICard';
import { cn } from '../lib/utils';

const data = [
  { name: '06:00', oee: 78 },
  { name: '08:00', oee: 82 },
  { name: '10:00', oee: 85 },
  { name: '12:00', oee: 72 },
  { name: '14:00', oee: 88 },
  { name: '16:00', oee: 91 },
  { name: '18:00', oee: 89 },
];

const downtimeData = [
  { name: 'Mecânica', value: 45, color: '#EF4444' },
  { name: 'Elétrica', value: 30, color: '#F59E0B' },
  { name: 'Material', value: 15, color: '#3B82F6' },
  { name: 'Operação', value: 25, color: '#8B5CF6' },
  { name: 'Planejada', value: 60, color: '#22C55E' },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-bento-border pb-6 gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tighter text-gray-900">Runtime<span className="text-amafil-green">.Dashboard</span></h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] lg:text-[10px] mt-1">Serviço: amafil-production-cluster-01</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none bg-white px-4 lg:px-5 py-2.5 rounded-full border border-bento-border text-[10px] lg:text-xs font-bold text-gray-500 flex items-center gap-2 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-amafil-green shadow-sm"></span>
            OP: M01376-ACTIVE
          </div>
          <button className="flex-1 sm:flex-none bg-amafil-green text-white px-4 lg:px-6 py-2.5 rounded-full text-[10px] lg:text-xs font-black uppercase tracking-widest hover:bg-amafil-green/90 transition-all shadow-md">
            Exportar Dados
          </button>
        </div>
      </div>

      {/* KPI Section - Bento Grid Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          label="OEE Global" 
          value={84.2} 
          unit="%" 
          trend={2.4} 
          trendLabel="Índice de Performance" 
          status="success" 
        />
        <KPICard 
          label="Disponibilidade" 
          value={91.5} 
          unit="%" 
          trend={-1.2} 
          trendLabel="Taxa de Operação" 
          status="warning" 
        />
        <KPICard 
          label="Performance" 
          value={94.8} 
          unit="%" 
          trend={0.5} 
          trendLabel="Rendimento" 
          status="success" 
        />
        <KPICard 
          label="Qualidade" 
          value={98.2} 
          unit="%" 
          trend={0.1} 
          trendLabel="Taxa de Qualidade" 
          status="success" 
        />
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* OEE Trend Chart (Large Bento Box) */}
        <div className="card-mes col-span-12 lg:col-span-8 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Analíticos de Processo</h2>
              <p className="text-2xl font-bold tracking-tight text-gray-900">Eficiência de Produção</p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-black italic tracking-tighter text-amafil-green">12.4ms</span>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Latência Média</p>
            </div>
          </div>
          
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorOee" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00AA4D" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#00AA4D" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="name" 
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
                  itemStyle={{ color: '#00AA4D', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="oee" 
                  stroke="#00AA4D" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorOee)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Downtime analysis (Secondary Bento Box) */}
        <div className="card-mes col-span-12 lg:col-span-4 flex flex-col shadow-sm">
          <h2 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-6">Categorias de Erro</h2>
          <div className="flex-1 h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={downtimeData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                  width={70}
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748B', textAnchor: 'end' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={16}>
                  {downtimeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {downtimeData.map((item) => (
              <div key={item.name} className="flex justify-between items-center p-2.5 bg-gray-50 border border-bento-border rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{item.name}</span>
                </div>
                <span className="text-xs font-black text-gray-900">{item.value}m</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Terminal-style List (Large Bottom Bento) */}
      <div className="card-mes p-0 overflow-hidden shadow-sm">
        <div className="px-8 py-5 border-b border-bento-border bg-gray-50/80 flex justify-between items-center">
          <div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Em Execução</h3>
            <p className="text-sm font-bold text-gray-900">Status de Operação</p>
          </div>
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
          </div>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left">
            <thead className="bg-transparent text-[10px] uppercase text-gray-400 font-black tracking-widest">
              <tr>
                <th className="px-4 py-3">ID do Nó</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Processo</th>
                <th className="px-4 py-3">Rendimento</th>
                <th className="px-4 py-3">Ciclo de Trabalho</th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              {[
                { id: '30', name: 'AMAFL-30', status: 'NORMAL', op: 'M01376', yield: '12.4k/h', eff: 83.3 },
                { id: '32', name: 'AMAFL-32', status: 'INSTÁVEL', op: 'M01378', yield: '4.5k/h', eff: 30.0 },
                { id: '15', name: 'AMAFL-15', status: 'CRÍTICO', op: 'M01380', yield: '8.9k/h', eff: 74.2 },
                { id: '08', name: 'AMAFL-08', status: 'NORMAL', op: 'M01382', yield: '21.0k/h', eff: 105.0 },
              ].map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 font-bold">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center font-black text-gray-400 text-[10px] border border-bento-border shadow-sm">
                        {m.id}
                      </div>
                      <span className="font-sans font-bold text-gray-900">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn(
                      "badge-status border shadow-sm",
                      m.status === 'NORMAL' ? "bg-green-50 text-amafil-green border-amafil-green/20" : 
                      m.status === 'INSTÁVEL' ? "bg-amber-50 text-status-warning border-status-warning/20" :
                      "bg-red-50 text-status-danger border-status-danger/20"
                    )}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-400 font-bold">{m.op}-v1.2</td>
                  <td className="px-4 py-4 text-gray-900 font-black">{m.yield}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 w-24 bg-gray-100 h-2 rounded-full overflow-hidden border border-gray-200">
                        <div 
                          className={cn("h-full rounded-full", m.eff >= 85 ? "bg-amafil-green" : m.eff >= 70 ? "bg-status-warning" : "bg-status-danger")} 
                          style={{ width: `${Math.min(m.eff, 100)}%` }}
                        />
                      </div>
                      <span className={cn(
                        "font-sans font-black min-w-[40px]",
                        m.eff >= 85 ? "text-amafil-green" : m.eff >= 70 ? "text-status-warning" : "text-status-danger"
                      )}>
                        {m.eff}%
                      </span>
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
