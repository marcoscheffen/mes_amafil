import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import * as clientsService from '../services/clientsService';
import * as messageLogService from '../services/messageLogService';
import type { Customer } from '../types';
import type { MessageLogRow, TokenUsageSummary, TokenUsageForMessage } from '../services/messageLogService';

type PeriodPreset = 'none' | '1d' | '7d' | '30d' | 'custom';

const PAGE_SIZE = 100;
const CONTENT_LIMIT = 120;

function rollingIsoMs(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function nowIso(): string {
  return new Date().toISOString();
}

function dateInputToStart(s: string): string {
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? rollingIsoMs(7) : d.toISOString();
}

function dateInputToEnd(s: string): string {
  const d = new Date(`${s}T23:59:59.999`);
  return Number.isNaN(d.getTime()) ? nowIso() : d.toISOString();
}

function clientLabel(c: Customer): string {
  const name = (c.ai_name || c.chatname || '').trim();
  return name ? `${name} · ${c.phone}` : c.phone;
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function DirectionBadge({ fromMe, wasSentByApi }: { fromMe: boolean; wasSentByApi: boolean }) {
  if (!fromMe) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400">
        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>arrow_downward</span>
        Recebido
      </span>
    );
  }
  if (wasSentByApi) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-violet-500/10 text-violet-400">
        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>smart_toy</span>
        IA
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400">
      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>person</span>
      Manual
    </span>
  );
}

type MessageRowProps = {
  row: MessageLogRow;
  tokens: TokenUsageForMessage | undefined;
  expanded: boolean;
  onToggle: () => void;
  contactName: string | null;
};

const MessageRow: React.FC<MessageRowProps> = ({ row, tokens, expanded, onToggle, contactName }) => {
  const content = row.content?.trim() ?? '';
  const needsTruncate = content.length > CONTENT_LIMIT;
  const displayContent = expanded || !needsTruncate ? content : `${content.slice(0, CONTENT_LIMIT)}…`;
  const displayContact = row.sender_name || contactName;

  return (
    <tr className="hover:bg-slate-700/30 transition-colors" key={row.id}>
      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap align-top">
        {formatWhen(row.created_at)}
      </td>
      <td className="px-4 py-3 align-top">
        <DirectionBadge fromMe={row.from_me} wasSentByApi={row.was_sent_by_api} />
      </td>
      <td className="px-4 py-3 text-sm text-slate-300 align-top max-w-[140px]">
        <span className="block truncate" title={displayContact ?? ''}>
          {displayContact ?? <span className="text-slate-600 italic">—</span>}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-slate-200 align-top max-w-xs">
        {content ? (
          <>
            <span className="whitespace-pre-wrap break-words leading-relaxed">{displayContent}</span>
            {needsTruncate && (
              <button
                type="button"
                onClick={onToggle}
                className="ml-1.5 text-blue-400 text-xs hover:underline"
              >
                {expanded ? 'ver menos' : 'ver mais'}
              </button>
            )}
          </>
        ) : (
          <span className="italic text-slate-500">
            {row.media_type ? `[${row.media_type}]` : '(sem texto)'}
          </span>
        )}
      </td>
      <td className="px-4 py-3 align-top">
        {(row.message_type || row.media_type) && (
          <span className="text-xs text-slate-500">{row.message_type ?? row.media_type}</span>
        )}
      </td>
      <td className="px-4 py-3 text-right align-top">
        {tokens ? (
          <div>
            <span className="text-sm font-mono font-semibold text-blue-400">
              {fmtTokens(tokens.total_tokens)}
            </span>
            <div className="text-[10px] text-slate-600 font-mono mt-0.5">
              {tokens.prompt_tokens}+{tokens.completion_tokens}
            </div>
          </div>
        ) : (
          <span className="text-slate-700 text-sm">—</span>
        )}
      </td>
    </tr>
  );
}

export const MessageLogPage: React.FC = () => {
  const { currentCompany } = useCompany();
  const [clients, setClients] = useState<Customer[]>([]);
  const [clientId, setClientId] = useState<string>('');
  const [preset, setPreset] = useState<PeriodPreset>('7d');
  const [customFrom, setCustomFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [customTo, setCustomTo] = useState(() => new Date().toISOString().slice(0, 10));

  const [rows, setRows] = useState<MessageLogRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [summary, setSummary] = useState<TokenUsageSummary | null>(null);
  const [tokenMap, setTokenMap] = useState<Map<string, TokenUsageForMessage>>(new Map());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { dateFrom, dateTo } = useMemo(() => {
    switch (preset) {
      case 'none':
        return { dateFrom: null as string | null, dateTo: null as string | null };
      case '1d':
        return { dateFrom: rollingIsoMs(1), dateTo: nowIso() };
      case '7d':
        return { dateFrom: rollingIsoMs(7), dateTo: nowIso() };
      case '30d':
        return { dateFrom: rollingIsoMs(30), dateTo: nowIso() };
      case 'custom':
        return { dateFrom: dateInputToStart(customFrom), dateTo: dateInputToEnd(customTo) };
      default:
        return { dateFrom: null, dateTo: null };
    }
  }, [preset, customFrom, customTo]);

  const clientFilter = clientId || null;

  useEffect(() => {
    if (!currentCompany) return;
    let cancelled = false;
    clientsService
      .getClients(currentCompany.id, { limit: 500 })
      .then((list) => { if (!cancelled) setClients(list); })
      .catch(() => { if (!cancelled) setClients([]); });
    return () => { cancelled = true; };
  }, [currentCompany?.id]);

  const fetchTokens = useCallback(
    async (newRows: MessageLogRow[], append: boolean) => {
      if (!currentCompany) return;
      const ids = newRows.map((r) => r.message_id).filter((id): id is string => !!id);
      if (ids.length === 0) return;
      const { data } = await messageLogService.getTokenUsageByMessages({
        companyId: currentCompany.id,
        messageIds: ids,
      });
      setTokenMap((prev) => {
        if (!append) return data;
        const merged = new Map(prev);
        data.forEach((v, k) => merged.set(k, v));
        return merged;
      });
    },
    [currentCompany?.id]
  );

  const load = useCallback(
    async (append: boolean) => {
      if (!currentCompany) return;
      const nextOffset = append ? offset : 0;
      setLoading(true);
      setError(null);
      try {
        const [logRes, tokRes] = await Promise.all([
          messageLogService.getMessageLog({
            companyId: currentCompany.id,
            clientId: clientFilter,
            dateFrom,
            dateTo,
            limit: PAGE_SIZE,
            offset: nextOffset,
          }),
          messageLogService.getTokenUsageSummary({
            companyId: currentCompany.id,
            clientId: clientFilter,
            dateFrom,
            dateTo,
          }),
        ]);

        if (logRes.error) setError(logRes.error);
        else if (tokRes.error) setError(tokRes.error);

        const newRows = logRes.rows;
        const tc = newRows[0]?.total_count ?? 0;
        setTotalCount(typeof tc === 'number' ? tc : Number(tc));

        if (append) {
          setRows((prev) => [...prev, ...newRows]);
        } else {
          setRows(newRows);
          setOffset(0);
          setExpandedRows(new Set());
          setTokenMap(new Map());
        }
        setSummary(tokRes.summary);
        await fetchTokens(newRows, append);
      } finally {
        setLoading(false);
      }
    },
    [currentCompany, clientFilter, dateFrom, dateTo, offset, fetchTokens]
  );

  useEffect(() => {
    if (!currentCompany) return;
    void load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- não recarregar ao mudar offset
  }, [currentCompany?.id, clientFilter, dateFrom, dateTo]);

  const hasMore = rows.length > 0 && rows.length < totalCount;

  const loadMore = async () => {
    if (!currentCompany || loading || !hasMore) return;
    const next = offset + PAGE_SIZE;
    setLoading(true);
    setError(null);
    try {
      const logRes = await messageLogService.getMessageLog({
        companyId: currentCompany.id,
        clientId: clientFilter,
        dateFrom,
        dateTo,
        limit: PAGE_SIZE,
        offset: next,
      });
      if (logRes.error) { setError(logRes.error); return; }
      setOffset(next);
      const newRows = logRes.rows;
      setRows((prev) => [...prev, ...newRows]);
      await fetchTokens(newRows, true);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clientMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of clients) {
      map.set(c.id, clientLabel(c));
    }
    return map;
  }, [clients]);

  if (!currentCompany) {
    return (
      <div className="p-8 text-slate-400 text-sm">Selecione uma empresa para ver o log.</div>
    );
  }

  const byModel = summary?.by_model?.filter(Boolean) ?? [];
  const inCount = rows.filter((r) => !r.from_me).length;
  const outCount = rows.filter((r) => r.from_me).length;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-500">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-end">
        <div className="flex flex-col gap-1 min-w-[200px] flex-1 sm:max-w-xs">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Cliente
          </label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900/80 text-slate-200 text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="">Todos os clientes</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {clientLabel(c)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Período
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ['none', 'Sem filtro'],
                ['1d', '1 dia'],
                ['7d', '7 dias'],
                ['30d', '30 dias'],
                ['custom', 'Custom'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setPreset(key)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  preset === key
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {preset === 'custom' && (
          <div className="flex gap-2 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-slate-500">De</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-900 text-slate-200 text-sm px-2 py-2"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-slate-500">Até</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-900 text-slate-200 text-sm px-2 py-2"
              />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => void load(false)}
          disabled={loading}
          className="sm:ml-auto px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-sm font-semibold border border-slate-600 hover:bg-slate-700 disabled:opacity-50"
        >
          Atualizar
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Total Tokens</p>
          <p className="text-xl font-mono font-bold text-blue-400">
            {fmtTokens(summary?.total_tokens ?? 0)}
          </p>
          <p className="text-[10px] text-slate-600 font-mono mt-0.5">
            {summary?.total_prompt_tokens ?? 0}p + {summary?.total_completion_tokens ?? 0}c
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Mensagens</p>
          <p className="text-xl font-mono font-bold text-white">{totalCount}</p>
          <p className="text-[10px] text-slate-600 mt-0.5">
            {inCount} recebidas · {outCount} enviadas
          </p>
        </div>
        {byModel.slice(0, 2).map((b) => (
          <div key={b.model} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p
              className="text-[10px] text-slate-500 uppercase font-bold mb-1 truncate"
              title={b.model}
            >
              {b.model.split('/').pop() ?? b.model}
            </p>
            <p className="text-xl font-mono font-bold text-violet-400">
              {fmtTokens(b.total_tokens)}
            </p>
            <p className="text-[10px] text-slate-600 mt-0.5">{b.count} execuções</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Tabela */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-slate-400">chat</span>
            Mensagens
          </h2>
          {totalCount > 0 && (
            <span className="text-xs text-slate-500">
              {rows.length} de {totalCount}
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-700 text-xs uppercase text-slate-500 font-bold">
                <th className="px-4 py-4 whitespace-nowrap">Data/Hora</th>
                <th className="px-4 py-4">Direção</th>
                <th className="px-4 py-4">Contato</th>
                <th className="px-4 py-4">Conteúdo</th>
                <th className="px-4 py-4">Tipo</th>
                <th className="px-4 py-4 text-right whitespace-nowrap">Tokens</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex justify-center">
                      <div className="size-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <span className="material-symbols-outlined text-4xl block mb-2">chat</span>
                    Nenhuma mensagem no período.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <MessageRow
                    row={row}
                    tokens={row.message_id ? tokenMap.get(row.message_id) : undefined}
                    expanded={expandedRows.has(row.id)}
                    onToggle={() => toggleRow(row.id)}
                    contactName={clientMap.get(row.client_id) ?? null}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => void loadMore()}
          disabled={loading}
          className="self-center px-6 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-sm font-semibold border border-slate-600 hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? 'Carregando…' : `Carregar mais (${totalCount - rows.length} restantes)`}
        </button>
      )}
    </div>
  );
};
