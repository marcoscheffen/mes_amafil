import React, { useState, useEffect, useCallback } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import * as attendancesService from '../services/attendancesService';
import type { CompanyAttendanceType } from '../services/attendancesService';
import { formatSupabaseError } from '../lib/errors';

export const AttendanceSettingsPage: React.FC = () => {
  const { currentCompany } = useCompany();
  const [types, setTypes] = useState<CompanyAttendanceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!currentCompany) return;
    try {
      setLoading(true);
      setError(null);
      const list = await attendancesService.getCompanyAttendanceTypes(currentCompany.id);
      setTypes([...list].sort((a, b) => a.position - b.position));
    } catch (e: unknown) {
      setError(formatSupabaseError(e, 'Erro ao carregar tipos.'));
    } finally {
      setLoading(false);
    }
  }, [currentCompany]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (t: CompanyAttendanceType) => {
    if (!currentCompany) return;
    try {
      setBusyId(t.company_type_id);
      await attendancesService.toggleCompanyAttendanceType({
        companyId: currentCompany.id,
        companyTypeId: t.company_type_id,
        isActive: !t.is_active,
      });
      await load();
    } catch (e: unknown) {
      setError(formatSupabaseError(e, 'Erro ao atualizar.'));
    } finally {
      setBusyId(null);
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    if (!currentCompany) return;
    const next = [...types];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setTypes(next);
    try {
      setBusyId('reorder');
      await attendancesService.reorderCompanyAttendanceTypes(
        currentCompany.id,
        next.map((x) => x.company_type_id)
      );
      await load();
    } catch (e: unknown) {
      setError(formatSupabaseError(e, 'Erro ao reordenar.'));
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Atendimento — Ajustes</h1>
        <p className="text-sm text-slate-400 mt-1">
          Ative ou desative tipos liberados pela plataforma e defina a ordem no seletor ao criar um atendimento.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4 text-sm text-red-300">{error}</div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400">
            <div className="size-5 border-2 border-slate-500/30 border-t-blue-400 rounded-full animate-spin" />
            Carregando…
          </div>
        ) : types.length === 0 ? (
          <p className="text-slate-500 text-sm">Nenhum tipo vinculado à empresa.</p>
        ) : (
          <ul className="space-y-2">
            {types.map((t, idx) => (
              <li
                key={t.company_type_id}
                className="flex items-center gap-3 bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3"
              >
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    disabled={busyId !== null || idx === 0}
                    onClick={() => move(idx, -1)}
                    className="p-0.5 text-slate-500 hover:text-white disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined text-lg">keyboard_arrow_up</span>
                  </button>
                  <button
                    type="button"
                    disabled={busyId !== null || idx === types.length - 1}
                    onClick={() => move(idx, 1)}
                    className="p-0.5 text-slate-500 hover:text-white disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined text-lg">keyboard_arrow_down</span>
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{t.name}</p>
                  <p className="text-xs text-slate-500 font-mono truncate">{t.slug}</p>
                </div>
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => toggle(t)}
                  className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border border-slate-600 transition-colors ${
                    t.is_active ? 'bg-emerald-600/40 border-emerald-500/50' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block size-7 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                      t.is_active ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
