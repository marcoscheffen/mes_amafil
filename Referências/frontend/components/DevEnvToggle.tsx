import React, { useState } from 'react';
import { getActiveEnv, setActiveEnv, type AyviEnv } from '../lib/supabase';

export const DevEnvToggle: React.FC = () => {
  const [current, setCurrent] = useState<AyviEnv>(getActiveEnv());
  const [confirming, setConfirming] = useState(false);
  const [pendingEnv, setPendingEnv] = useState<AyviEnv | null>(null);

  const handleSwitch = (env: AyviEnv) => {
    if (env === current) return;
    setPendingEnv(env);
    setConfirming(true);
  };

  const confirmSwitch = () => {
    if (!pendingEnv) return;
    setCurrent(pendingEnv);
    setConfirming(false);
    setActiveEnv(pendingEnv); // recarrega a página
  };

  const isProd = current === 'prod';

  return (
    <>
      <div className="mx-2 mt-3 mb-1">
        <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.15em] px-2 mb-2">
          Ambiente Supabase
        </p>

        <div className="flex rounded-lg overflow-hidden border border-slate-700 text-xs font-semibold">
          <button
            onClick={() => handleSwitch('prod')}
            className={`flex-1 py-1.5 transition-colors ${
              isProd
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            PROD
          </button>
          <button
            onClick={() => handleSwitch('dev')}
            className={`flex-1 py-1.5 transition-colors ${
              !isProd
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            DEV
          </button>
        </div>

        <p className="text-[9px] text-slate-500 text-center mt-1">
          {isProd
            ? 'tfkvgkkqpmafvczodnco'
            : 'jiwepyzvfzekftywwkxt'}
        </p>
      </div>

      {confirming && pendingEnv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-80 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-amber-400 text-2xl">warning</span>
              <h3 className="text-white font-bold text-base">Trocar ambiente?</h3>
            </div>
            <p className="text-slate-400 text-sm mb-1">
              Você está alternando para o banco{' '}
              <span className={`font-bold ${pendingEnv === 'dev' ? 'text-amber-400' : 'text-emerald-400'}`}>
                {pendingEnv.toUpperCase()}
              </span>.
            </p>
            <p className="text-slate-500 text-xs mb-5">
              A página será recarregada. Sessão atual será encerrada.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSwitch}
                className={`flex-1 py-2 rounded-lg text-white text-sm font-semibold transition-colors ${
                  pendingEnv === 'dev'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
