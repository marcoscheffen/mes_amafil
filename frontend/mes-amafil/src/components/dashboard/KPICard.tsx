import { cn } from '../../lib/utils';
import { KPIProps } from '../../types';

export function KPICard({ label, value, unit, trend, trendLabel, status }: KPIProps) {
  const statusColors = {
    success: 'text-bento-accent',
    warning: 'text-status-warning',
    danger: 'text-status-danger',
    info: 'text-amafil-blue',
  };

  const badgeColors = {
    success: 'bg-bento-accent/10 text-bento-accent border-bento-accent/20',
    warning: 'bg-status-warning/10 text-status-warning border-status-warning/20',
    danger: 'bg-status-danger/10 text-status-danger border-status-danger/20',
    info: 'bg-amafil-blue/10 text-amafil-blue border-amafil-blue/20',
  };

  return (
    <div className="card-mes group hover:border-amafil-blue/30 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{label}</h2>
          <p className="text-gray-600 text-sm font-medium tracking-tight">Métricas</p>
        </div>
        <span className={cn("badge-status border shadow-sm", badgeColors[status])}>
          {status === 'success' ? 'NORMAL' : status === 'warning' ? 'INSTÁVEL' : status === 'danger' ? 'CRÍTICO' : 'INFO'}
        </span>
      </div>
      
      <div className="flex items-baseline gap-1 mt-2">
        <h3 className={cn("text-4xl font-black italic tracking-tighter", statusColors[status])}>{value}</h3>
        {unit && <span className="text-sm font-bold text-gray-400">{unit}</span>}
      </div>

      {(trend !== undefined || trendLabel) && (
        <div className="mt-6 flex items-center gap-2">
          {trend !== undefined && (
            <div className={cn("flex items-center text-xs font-black", trend >= 0 ? "text-status-success" : "text-status-danger")}>
              {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
            </div>
          )}
          {trendLabel && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}
