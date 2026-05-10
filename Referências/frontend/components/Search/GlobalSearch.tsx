import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { searchGlobal, SearchResult, SearchResultType } from '../../services/searchService';

const TYPE_CONFIG: Record<SearchResultType, { label: string; icon: string; color: string; view: string }> = {
  cliente:     { label: 'CL', icon: 'group',          color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',    view: 'customers'   },
  servico:     { label: 'SV', icon: 'spa',             color: 'bg-violet-500/20 text-violet-400 border border-violet-500/30', view: 'agenda-settings' },
  agendamento: { label: 'AG', icon: 'calendar_month',  color: 'bg-green-500/20 text-green-400 border border-green-500/30',  view: 'agenda'      },
  atendimento: { label: 'AT', icon: 'clinical_notes',  color: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',  view: 'attendance'  },
  transcricao: { label: 'TR', icon: 'transcribe',      color: 'bg-pink-500/20 text-pink-400 border border-pink-500/30',     view: 'assistente-ia' },
};

const NAVIGATE_PAYLOAD_KEY: Record<SearchResultType, string> = {
  cliente:     'clientId',
  servico:     'serviceId',
  agendamento: 'appointmentId',
  atendimento: 'attendanceId',
  transcricao: 'transcriptionId',
};

function groupByType(results: SearchResult[]): Record<SearchResultType, SearchResult[]> {
  const grouped: Record<string, SearchResult[]> = {};
  for (const r of results) {
    if (!grouped[r.type]) grouped[r.type] = [];
    grouped[r.type].push(r);
  }
  return grouped as Record<SearchResultType, SearchResult[]>;
}

export const GlobalSearch: React.FC = () => {
  const { currentCompany } = useCompany();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!currentCompany || q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const data = await searchGlobal(currentCompany.id, q);
      setResults(data);
      setOpen(true);
    } catch (e) {
      console.error('[GlobalSearch] search_global falhou:', e);
      setError(true);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }, [currentCompany]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, runSearch]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (result: SearchResult) => {
    const cfg = TYPE_CONFIG[result.type];
    const payloadKey = NAVIGATE_PAYLOAD_KEY[result.type];
    window.dispatchEvent(new CustomEvent('aios:navigate', {
      detail: {
        view: cfg.view,
        [payloadKey]: result.entity_id,
      },
    }));
    setQuery('');
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  const grouped = groupByType(results);
  const typeOrder: SearchResultType[] = ['cliente', 'agendamento', 'atendimento', 'transcricao', 'servico'];
  const activeTypes = typeOrder.filter(t => grouped[t]?.length > 0);

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 w-64 focus-within:border-blue-500 transition-all">
        {loading ? (
          <div className="size-4 border-2 border-blue-500/40 border-t-blue-500 rounded-full animate-spin flex-shrink-0" />
        ) : (
          <span className="material-symbols-outlined text-slate-500 text-[20px] flex-shrink-0">search</span>
        )}
        <input
          className="bg-transparent border-none text-sm text-white placeholder-slate-500 focus:ring-0 w-full ml-2 outline-none"
          placeholder="Buscar..."
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false); }}
            className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        )}
      </div>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in duration-150">
          {error && (
            <div className="p-4 text-sm text-red-400 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              Erro ao buscar — tente novamente
            </div>
          )}

          {!error && !loading && results.length === 0 && (
            <div className="p-6 text-center text-slate-500 text-sm">
              <span className="material-symbols-outlined text-2xl block mb-1">search_off</span>
              Nenhum resultado para «{query}»
            </div>
          )}

          {!error && activeTypes.map(type => {
            const cfg = TYPE_CONFIG[type];
            const items = grouped[type];
            return (
              <div key={type}>
                <div className="px-3 py-1.5 border-b border-slate-700/50">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {type === 'cliente' ? 'Clientes' : type === 'servico' ? 'Serviços' : type === 'agendamento' ? 'Agendamentos' : type === 'atendimento' ? 'Atendimentos' : 'Transcrições'}
                  </span>
                </div>
                {items.map(result => (
                  <button
                    key={result.entity_id}
                    onClick={() => handleSelect(result)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700/50 transition-colors text-left"
                  >
                    <span className={`inline-flex items-center justify-center w-8 h-6 rounded text-[10px] font-bold flex-shrink-0 ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{result.title || '—'}</p>
                      {result.subtitle && (
                        <p className="text-xs text-slate-500 truncate">{result.subtitle}</p>
                      )}
                    </div>
                    <span className="material-symbols-outlined text-slate-600 text-[16px] flex-shrink-0">
                      {cfg.icon}
                    </span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
